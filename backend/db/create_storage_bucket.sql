-- Create 'problems' bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('problems', 'problems', true) 
ON CONFLICT (id) DO NOTHING;

-- Remove existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "User Update" ON storage.objects;
DROP POLICY IF EXISTS "User Delete" ON storage.objects;

-- 1. Allow public read access (SELECT)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'problems' );

-- 2. Allow public write access (INSERT)
-- Necessary because backend uses ANON key for uploads
CREATE POLICY "Public Insert" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'problems' );

-- 3. Allow update/delete (Optional, for future use)
-- We relax this to public for now since backend manages auth
CREATE POLICY "Public Update" 
ON storage.objects FOR UPDATE
USING ( bucket_id = 'problems' );

CREATE POLICY "Public Delete" 
ON storage.objects FOR DELETE
USING ( bucket_id = 'problems' );
