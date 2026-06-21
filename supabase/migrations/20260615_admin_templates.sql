-- Admin Reply Templates
-- Untuk menyimpan template balasan WhatsApp yang bisa dipilih dari halaman booking detail
-- Variabel yang didukung: {{nama}}, {{tanggal}}, {{paket}}, {{jam_mulai}}, {{jam_selesai}},
-- {{lokasi}}, {{total}}, {{dp}}, {{sisa}}, {{kode_booking}}, {{no_wa}}

-- ============================================
-- 1. TABEL admin_templates
-- ============================================
CREATE TABLE IF NOT EXISTS admin_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_templates_category ON admin_templates(category);
CREATE INDEX IF NOT EXISTS idx_admin_templates_sort ON admin_templates(sort_order);

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE admin_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read templates"
  ON admin_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert templates"
  ON admin_templates FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin update templates"
  ON admin_templates FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin delete templates"
  ON admin_templates FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- 3. TRIGGER: updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_admin_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_admin_templates_updated_at ON admin_templates;
CREATE TRIGGER trigger_admin_templates_updated_at
  BEFORE UPDATE ON admin_templates
  FOR EACH ROW EXECUTE FUNCTION update_admin_templates_updated_at();