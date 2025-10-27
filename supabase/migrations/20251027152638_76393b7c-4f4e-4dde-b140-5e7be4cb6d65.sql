-- Cleanup conflicting trigger and function introduced earlier (avoid duplicate copies)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_copy_shared_note_to_members'
  ) THEN
    DROP TRIGGER trg_copy_shared_note_to_members ON public.room_shared_notes;
  END IF;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'copy_shared_note_to_members' AND pg_function_is_visible(oid);
  IF FOUND THEN
    DROP FUNCTION public.copy_shared_note_to_members();
  END IF;
END $$;

-- Ensure realtime works reliably for these tables
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.notes REPLICA IDENTITY FULL';
  EXECUTE 'ALTER TABLE public.room_shared_notes REPLICA IDENTITY FULL';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notes';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.room_shared_notes';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update the secure RPC to match product rules:
-- - Always record share in room_shared_notes
-- - Only copy to members'' libraries if room is private
-- - Mark the original note as shared to the room so members can read it via RLS
CREATE OR REPLACE FUNCTION public.share_note_to_room(p_room_id uuid, p_note_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer := 0;
  room_is_public boolean;
BEGIN
  -- Ensure caller is a member of the room
  IF NOT public.is_member_of_room(p_room_id) THEN
    RAISE EXCEPTION 'not a member of room';
  END IF;

  -- Determine if room is public or private
  SELECT is_public INTO room_is_public FROM public.work_rooms WHERE id = p_room_id;

  -- Record the sharing event (for activity stream / realtime)
  INSERT INTO public.room_shared_notes (room_id, note_id, shared_by_user_id)
  VALUES (p_room_id, p_note_id, auth.uid());

  -- Mark the original note as shared for room visibility via RLS
  UPDATE public.notes
  SET is_shared_note = true,
      shared_from_user_id = auth.uid(),
      shared_from_room_id = p_room_id,
      updated_at = now()
  WHERE id = p_note_id AND user_id = auth.uid();

  -- Only copy to members' personal libraries when the room is PRIVATE
  IF room_is_public = false THEN
    INSERT INTO public.notes (
      user_id,
      original_content,
      title,
      processing_status,
      key_points,
      summary,
      generated_qa,
      generated_flashcards,
      is_shared_note,
      shared_from_user_id,
      shared_from_room_id,
      original_note_id
    )
    SELECT
      rm.user_id,
      n.original_content,
      n.title,
      n.processing_status,
      n.key_points,
      n.summary,
      n.generated_qa,
      n.generated_flashcards,
      true,
      auth.uid(),
      p_room_id,
      p_note_id
    FROM public.room_members rm
    JOIN public.notes n ON n.id = p_note_id AND n.user_id = auth.uid()
    WHERE rm.room_id = p_room_id
      AND rm.user_id <> auth.uid();

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
  END IF;

  RETURN inserted_count;
END;
$$;
