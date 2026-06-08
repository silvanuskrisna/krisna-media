-- ============================================
-- FIX: Add missing INSERT policies for members
-- ============================================

-- 1. Enrollments: allow members to insert (for their own students)
CREATE POLICY "Members insert own enrollments" ON enrollments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.member_id = auth.uid())
  );

-- 2. Lesson schedules: allow members to insert (for their own enrollments)
CREATE POLICY "Members insert own schedules" ON lesson_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE e.id = enrollment_id AND s.member_id = auth.uid()
    )
  );

-- 3. Members: allow update own profile (also owns the row)
--    (Already exists: "Members update own" - good)

-- 4. Students: allow members to insert own children
--    (Already exists: "Members insert own students" - good)
