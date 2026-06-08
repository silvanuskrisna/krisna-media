-- ============================================
-- Fix: Formalize kmc_schedules table + RLS
-- Tabel ini dibuat manual di dashboard, sekarang
-- resmi masuk migration chain.
-- ============================================

-- 1. Buat tabel (IF NOT EXISTS karena sudah ada)
CREATE TABLE IF NOT EXISTS kmc_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS (idempotent — skip if already enabled)
ALTER TABLE kmc_schedules ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (DROP + CREATE untuk idempotent)

-- Admin: full CRUD
DROP POLICY IF EXISTS "Admin CRUD kmc_schedules" ON kmc_schedules;
CREATE POLICY "Admin CRUD kmc_schedules" ON kmc_schedules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Member: SELECT only (melihat slot tersedia/terisi)
DROP POLICY IF EXISTS "Members view kmc_schedules" ON kmc_schedules;
CREATE POLICY "Members view kmc_schedules" ON kmc_schedules
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );
