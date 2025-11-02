-- Create table for message reactions
CREATE TABLE IF NOT EXISTS public.room_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.room_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('approve', 'reject')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.room_message_reactions ENABLE ROW LEVEL SECURITY;

-- Room members can view reactions
CREATE POLICY "Room members can view reactions"
ON public.room_message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_messages rm
    JOIN public.room_members rmem ON rmem.room_id = rm.room_id
    WHERE rm.id = room_message_reactions.message_id
    AND rmem.user_id = auth.uid()
  )
);

-- Room members can add reactions
CREATE POLICY "Room members can add reactions"
ON public.room_message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.room_messages rm
    JOIN public.room_members rmem ON rmem.room_id = rm.room_id
    WHERE rm.id = room_message_reactions.message_id
    AND rmem.user_id = auth.uid()
  )
);

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
ON public.room_message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_room_message_reactions_message_id ON public.room_message_reactions(message_id);
CREATE INDEX idx_room_message_reactions_user_id ON public.room_message_reactions(user_id);

-- Enable realtime
ALTER TABLE public.room_message_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_message_reactions;