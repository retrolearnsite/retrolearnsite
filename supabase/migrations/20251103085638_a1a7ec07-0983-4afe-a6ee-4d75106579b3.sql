-- Add file_name and file_url columns to room_messages table
ALTER TABLE public.room_messages 
ADD COLUMN file_name text,
ADD COLUMN file_url text;