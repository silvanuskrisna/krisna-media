-- KMC New Schema
-- Migrasi: members (orang tua) → students (anak) → enrollments (pendaftaran per instrument)
-- Invoice per member per bulan

-- ============================================
-- 1. MEMBERS (extends auth.users)
-- ============================================
CREATE TABLE members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  referral_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. STUDENTS (anak-anak)
-- ============================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INT,
  whatsapp TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_member ON students(member_id);

-- ============================================
-- 3. ENROLLMENTS (pendaftaran per instrument)
-- ============================================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  instrument TEXT NOT NULL CHECK (instrument IN ('Gitar', 'Piano', 'Drum')),
  age_group TEXT CHECK (age_group IN ('kids', 'teen', 'adult')),
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cuti', 'inactive')),
  tuition_fee NUMERIC(10,2),
  sessions_per_month INT NOT NULL DEFAULT 4,
  start_date DATE,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- ============================================
-- 4. LESSON_SCHEDULES (jadwal per enrollment)
-- ============================================
CREATE TABLE lesson_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lesson_schedules_enrollment ON lesson_schedules(enrollment_id);

-- ============================================
-- 5. INVOICES (tagihan per member per bulan)
-- ============================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  period TEXT NOT NULL,  -- '2026-06', '2026-07', etc.
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_member ON invoices(member_id);
CREATE INDEX idx_invoices_period ON invoices(period);
CREATE UNIQUE INDEX idx_invoices_member_period ON invoices(member_id, period);

-- ============================================
-- 6. INVOICE_ITEMS (detail per enrollment)
-- ============================================
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id),
  student_name TEXT NOT NULL,
  instrument TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ============================================
-- 7. AUTO-UPDATE updated_at TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_members_updated_at
  BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_enrollments_updated_at
  BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================
-- 8. RLS POLICIES
-- ============================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Members: own profile only, admin can see all
CREATE POLICY "Members view own" ON members
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin view all members" ON members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );
CREATE POLICY "Members insert own" ON members
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Members update own" ON members
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin CRUD members" ON members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Students: view own children, admin all
CREATE POLICY "Members view own students" ON students
  FOR SELECT USING (
    member_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );
CREATE POLICY "Members insert own students" ON students
  FOR INSERT WITH CHECK (member_id = auth.uid());
CREATE POLICY "Admin CRUD students" ON students
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Enrollments: view own, admin all
CREATE POLICY "Members view own enrollments" ON enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.member_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );
CREATE POLICY "Admin CRUD enrollments" ON enrollments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Lesson schedules: view own, admin all
CREATE POLICY "Members view own schedules" ON lesson_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE e.id = enrollment_id AND s.member_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );
CREATE POLICY "Admin CRUD schedules" ON lesson_schedules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Invoices: view own, admin all
CREATE POLICY "Members view own invoices" ON invoices
  FOR SELECT USING (
    member_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );
CREATE POLICY "Admin CRUD invoices" ON invoices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Invoice items: view own, admin all
CREATE POLICY "Members view own invoice items" ON invoice_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND i.member_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );
CREATE POLICY "Admin CRUD invoice items" ON invoice_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- ============================================
-- 9. BONUS: get_next_invoice_number FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION generate_invoice_number(p_member_id UUID, p_period TEXT)
RETURNS TEXT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM invoices
  WHERE member_id = p_member_id AND period = p_period;
  
  RETURN 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(v_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
