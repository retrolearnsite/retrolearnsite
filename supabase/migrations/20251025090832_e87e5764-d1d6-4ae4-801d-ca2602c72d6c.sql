-- Add public room features to work_rooms
ALTER TABLE public.work_rooms
ADD COLUMN is_public boolean NOT NULL DEFAULT false,
ADD COLUMN subject_tags text[] DEFAULT '{}',
ADD COLUMN member_count integer NOT NULL DEFAULT 0;

-- Create index for searching public rooms
CREATE INDEX idx_work_rooms_public ON public.work_rooms(is_public) WHERE is_public = true;
CREATE INDEX idx_work_rooms_tags ON public.work_rooms USING GIN(subject_tags);

-- Create room_resources table for pinned messages/resources
CREATE TABLE public.room_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.work_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  resource_type text NOT NULL, -- 'note', 'link', 'message'
  title text NOT NULL,
  content text,
  url text,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.room_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can view resources"
ON public.room_resources FOR SELECT
USING (public.is_member_of_room(room_id));

CREATE POLICY "Room members can create resources"
ON public.room_resources FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.is_member_of_room(room_id));

CREATE POLICY "Resource creators can update their resources"
ON public.room_resources FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Resource creators can delete their resources"
ON public.room_resources FOR DELETE
USING (auth.uid() = user_id);

-- Create user_gamification table for XP and badges
CREATE TABLE public.user_gamification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  badges jsonb NOT NULL DEFAULT '[]',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all gamification data"
ON public.user_gamification FOR SELECT
USING (true);

CREATE POLICY "Users can create their own gamification record"
ON public.user_gamification FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification record"
ON public.user_gamification FOR UPDATE
USING (auth.uid() = user_id);

-- Create room_xp_activity table to track XP earned in rooms
CREATE TABLE public.room_xp_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.work_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  activity_type text NOT NULL, -- 'message', 'note_shared', 'quiz_completed', 'resource_added'
  xp_earned integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.room_xp_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can view XP activity"
ON public.room_xp_activity FOR SELECT
USING (public.is_member_of_room(room_id));

CREATE POLICY "System can insert XP activity"
ON public.room_xp_activity FOR INSERT
WITH CHECK (true);

-- Create room_mini_quizzes table
CREATE TABLE public.room_mini_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.work_rooms(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL,
  title text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.room_mini_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can view mini quizzes"
ON public.room_mini_quizzes FOR SELECT
USING (public.is_member_of_room(room_id));

CREATE POLICY "Room members can create mini quizzes"
ON public.room_mini_quizzes FOR INSERT
WITH CHECK (auth.uid() = creator_id AND public.is_member_of_room(room_id));

CREATE POLICY "Quiz creators can update their quizzes"
ON public.room_mini_quizzes FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Quiz creators can delete their quizzes"
ON public.room_mini_quizzes FOR DELETE
USING (auth.uid() = creator_id);

-- Create room_quiz_attempts table
CREATE TABLE public.room_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.room_mini_quizzes(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.work_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '{}',
  completed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.room_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz attempts"
ON public.room_quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Room members can create quiz attempts"
ON public.room_quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.is_member_of_room(room_id));

-- Create ai_study_buddy_chats table
CREATE TABLE public.ai_study_buddy_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.work_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  response text NOT NULL,
  context_type text, -- 'summary', 'question', 'explanation'
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_study_buddy_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can view AI chats"
ON public.ai_study_buddy_chats FOR SELECT
USING (public.is_member_of_room(room_id));

CREATE POLICY "Room members can create AI chats"
ON public.ai_study_buddy_chats FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.is_member_of_room(room_id));

-- Create feedback table
CREATE TABLE public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feedback_type text NOT NULL, -- 'bug', 'feature', 'improvement', 'other'
  title text NOT NULL,
  description text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create feedback"
ON public.user_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
ON public.user_feedback FOR SELECT
USING (auth.uid() = user_id);

-- Add avatar_url to profiles if not exists (for room avatars)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Create function to update member count
CREATE OR REPLACE FUNCTION public.update_room_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE work_rooms
    SET member_count = member_count + 1
    WHERE id = NEW.room_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE work_rooms
    SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.room_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger to auto-update member count
CREATE TRIGGER update_room_member_count_trigger
AFTER INSERT OR DELETE ON public.room_members
FOR EACH ROW
EXECUTE FUNCTION public.update_room_member_count();

-- Initialize member counts for existing rooms
UPDATE public.work_rooms
SET member_count = (
  SELECT COUNT(*) 
  FROM public.room_members 
  WHERE room_members.room_id = work_rooms.id
);

-- Create function to award XP
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_xp integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_total integer;
  v_new_level integer;
BEGIN
  -- Insert or update gamification record
  INSERT INTO user_gamification (user_id, total_xp)
  VALUES (p_user_id, p_xp)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_xp = user_gamification.total_xp + p_xp,
    updated_at = now()
  RETURNING total_xp INTO v_new_total;
  
  -- Calculate new level (100 XP per level)
  v_new_level := FLOOR(v_new_total / 100.0) + 1;
  
  UPDATE user_gamification
  SET level = v_new_level
  WHERE user_id = p_user_id;
END;
$$;

-- Create function to award badge
CREATE OR REPLACE FUNCTION public.award_badge(p_user_id uuid, p_badge_id text, p_badge_name text, p_badge_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badges jsonb;
BEGIN
  -- Get current badges
  SELECT badges INTO v_badges
  FROM user_gamification
  WHERE user_id = p_user_id;
  
  -- Check if badge already exists
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_badges) AS badge
    WHERE badge->>'id' = p_badge_id
  ) THEN
    -- Add new badge
    v_badges := v_badges || jsonb_build_object(
      'id', p_badge_id,
      'name', p_badge_name,
      'description', p_badge_description,
      'earned_at', now()
    );
    
    UPDATE user_gamification
    SET badges = v_badges,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE room_resources;
ALTER PUBLICATION supabase_realtime ADD TABLE room_xp_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_study_buddy_chats;

-- Add realtime to existing room_messages if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'room_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;
  END IF;
END $$;