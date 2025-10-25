-- Add display_name column to profiles table if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.display_name IS 'User-chosen display name for the platform';