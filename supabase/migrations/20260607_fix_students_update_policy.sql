-- ============================================
-- Fix: Add missing UPDATE policy for students
-- Member sudah bisa INSERT & SELECT siswa sendiri,
-- tapi belum bisa UPDATE (edit umur di register page)
-- ============================================

CREATE POLICY "Members update own students" ON students
  FOR UPDATE USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());
