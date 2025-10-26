-- Add reactions table for room messages
CREATE TABLE IF NOT EXISTS public.room_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.room_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL, -- 'thumb', 'tick', 'cross'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction_type)
);

ALTER TABLE public.room_message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view reactions on messages in their rooms"
ON public.room_message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_messages rm
    JOIN public.room_members rms ON rm.room_id = rms.room_id
    WHERE rm.id = room_message_reactions.message_id
      AND rms.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add reactions to messages in their rooms"
ON public.room_message_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.room_messages rm
    JOIN public.room_members rms ON rm.room_id = rms.room_id
    WHERE rm.id = room_message_reactions.message_id
      AND rms.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove their own reactions"
ON public.room_message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_room_message_reactions_message_id ON public.room_message_reactions(message_id);
CREATE INDEX idx_room_message_reactions_user_id ON public.room_message_reactions(user_id);

