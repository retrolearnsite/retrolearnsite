-- Add SELECT policy to allow room members to read notes shared to their room
DO $$
BEGIN
  CREATE POLICY "Members can view notes shared to their room"
  ON public.notes
  FOR SELECT
  USING (
    is_shared_note = true
    AND shared_from_room_id IS NOT NULL
    AND public.is_member_of_room(shared_from_room_id)
  );
EXCEPTION
  WHEN duplicate_object THEN
    -- Policy already exists, do nothing
    NULL;
END
$$;

-- Trigger function to copy shared notes into personal libraries for private rooms
CREATE OR REPLACE FUNCTION public.copy_shared_note_to_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  room_is_public boolean;
BEGIN
  SELECT wr.is_public INTO room_is_public
  FROM public.work_rooms wr
  WHERE wr.id = NEW.room_id;

  IF room_is_public IS NULL THEN
    RETURN NEW;
  END IF;

  IF room_is_public = false THEN
    INSERT INTO public.notes (
      user_id,
      title,
      original_content,
      summary,
      key_points,
      generated_qa,
      generated_flashcards,
      is_shared_note,
      shared_from_user_id,
      shared_from_room_id,
      original_note_id,
      processing_status
    )
    SELECT
      m.user_id,
      n.title,
      n.original_content,
      n.summary,
      n.key_points,
      n.generated_qa,
      n.generated_flashcards,
      false,
      NEW.shared_by_user_id,
      NEW.room_id,
      NEW.note_id,
      n.processing_status
    FROM public.room_members m
    JOIN public.notes n ON n.id = NEW.note_id
    LEFT JOIN public.notes existing
      ON existing.user_id = m.user_id
     AND existing.original_note_id = NEW.note_id
    WHERE m.room_id = NEW.room_id
      AND m.user_id <> NEW.shared_by_user_id
      AND existing.id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_copy_shared_note_to_members ON public.room_shared_notes;
CREATE TRIGGER trg_copy_shared_note_to_members
AFTER INSERT ON public.room_shared_notes
FOR EACH ROW
EXECUTE FUNCTION public.copy_shared_note_to_members();