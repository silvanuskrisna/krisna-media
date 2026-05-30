-- ============================================
-- Krisna Media - Gallery Migration
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================

-- 1. Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('studio', 'sound', 'lighting', 'event', 'other')),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS for storage bucket
-- Allow public read
DROP POLICY IF EXISTS "Public can view gallery images" ON storage.objects;
CREATE POLICY "Public can view gallery images" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

-- Allow authenticated users (admin) to upload
DROP POLICY IF EXISTS "Authenticated users can upload gallery images" ON storage.objects;
CREATE POLICY "Authenticated users can upload gallery images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'gallery'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete
DROP POLICY IF EXISTS "Authenticated users can delete gallery images" ON storage.objects;
CREATE POLICY "Authenticated users can delete gallery images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'gallery'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Authenticated users can update gallery images" ON storage.objects;
CREATE POLICY "Authenticated users can update gallery images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'gallery'
    AND auth.role() = 'authenticated'
  );

-- 4. RLS for gallery table
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Public can only see active items
DROP POLICY IF EXISTS "Anyone can view active gallery" ON gallery;
CREATE POLICY "Anyone can view active gallery" ON gallery
  FOR SELECT USING (is_active = true);

-- Admin (authenticated) can do everything
DROP POLICY IF EXISTS "Admin can manage gallery" ON gallery;
CREATE POLICY "Admin can manage gallery" ON gallery
  FOR ALL USING (
    auth.role() = 'authenticated'
  );

-- 5. Seed data - 6 studio photos (placeholder paths, will update after upload)
-- INSERT INTO gallery (title, description, image_url, category, sort_order) VALUES
-- ('Studio Musik - Foto 1', 'Ruang studio utama', '', 'studio', 1),
-- ('Studio Musik - Foto 2', 'Area recording', '', 'studio', 2),
-- ('Studio Musik - Foto 3', 'Peralatan studio', '', 'studio', 3),
-- ('Studio Musik - Foto 4', 'Suasana studio', '', 'studio', 4),
-- ('Studio Musik - Foto 5', 'Detail peralatan', '', 'studio', 5),
-- ('Studio Musik - Foto 6', 'Tampak luar studio', '', 'studio', 6);
