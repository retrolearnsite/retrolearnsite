-- Ensure RLS is enabled and create policies for existing table
ALTER TABLE public.user_guide_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_guide_progress' AND policyname = 'Users can view their own guide progress'
  ) THEN
    CREATE POLICY "Users can view their own guide progress"
    ON public.user_guide_progress
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_guide_progress' AND policyname = 'Users can upsert their own guide progress'
  ) THEN
    CREATE POLICY "Users can upsert their own guide progress"
    ON public.user_guide_progress
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_guide_progress' AND policyname = 'Users can update their own guide progress'
  ) THEN
    CREATE POLICY "Users can update their own guide progress"
    ON public.user_guide_progress
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_guide_progress' AND policyname = 'Users can delete their own guide progress'
  ) THEN
    CREATE POLICY "Users can delete their own guide progress"
    ON public.user_guide_progress
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create index if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'user_guide_progress' AND indexname = 'idx_user_guide_progress_user_id'
  ) THEN
    CREATE INDEX idx_user_guide_progress_user_id ON public.user_guide_progress(user_id);
  END IF;
END $$;
