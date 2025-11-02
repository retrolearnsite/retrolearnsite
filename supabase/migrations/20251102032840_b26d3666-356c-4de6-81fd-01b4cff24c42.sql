-- Create storage bucket for room files if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-files', 
  'room-files', 
  true,
  10485760, -- 10MB limit
  NULL -- Allow all mime types
)
ON CONFLICT (id) DO NOTHING;