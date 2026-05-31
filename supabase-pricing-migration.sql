-- Krisna Media - Pricing Migration v2
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. PRODUCT: Tambah Paket 3 Jam
-- ============================================================
INSERT INTO products (name, slug, category, description, price, price_unit, is_active, sort_order)
SELECT 'Rental Studio (Paket 3 Jam)', 'rental-studio-paket-3', 'studio', 'Paket sewa studio 3 jam. Pas buat sesi rekaman atau latihan yang lebih panjang.', 200000, 'paket', true, 5
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'rental-studio-paket-3');

-- Update jika sudah ada
UPDATE products SET price = 200000, is_active = true, name = 'Rental Studio (Paket 3 Jam)' WHERE slug = 'rental-studio-paket-3';

-- ============================================================
-- 2. BOOKINGS: Tambah kolom promo, payment proof, method
-- ============================================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promo_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promo_name VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_proof TEXT;

-- ============================================================
-- 3. PROMOS: Table
-- ============================================================
CREATE TABLE IF NOT EXISTS promos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_per_2hour DECIMAL(12, 0) NOT NULL,
  quota INT NOT NULL DEFAULT 0,
  used INT NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE promos ENABLE ROW LEVEL SECURITY;

-- Public bisa lihat promo yang aktif dan masih punya kuota
CREATE POLICY "Public read active promos"
  ON promos FOR SELECT
  USING (is_active = true AND used < quota);

-- Admin bisa CRUD
CREATE POLICY "Admin all promos"
  ON promos FOR ALL
  USING (auth.role() = 'authenticated');

-- Public bisa update promo (increment used count)
CREATE POLICY "Public update promo used"
  ON promos FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. FUNCTION: increment_promo_used
-- ============================================================
CREATE OR REPLACE FUNCTION increment_promo_used(promo_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE promos SET used = used + 1 WHERE id = promo_id;
END;
$$;

-- ============================================================
-- 5. STORAGE: payment-proofs bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
SELECT 'payment-proofs', 'payment-proofs', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'payment-proofs');

-- Public upload policy for payment-proofs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Upload payment-proofs') THEN
    CREATE POLICY "Public Upload payment-proofs"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'payment-proofs'
        AND (storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg' OR storage.extension(name) = 'png')
        AND octet_length(content) < 5242880
      );
  END IF;
END $$;

-- Public read policy for payment-proofs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Read payment-proofs') THEN
    CREATE POLICY "Public Read payment-proofs"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'payment-proofs');
  END IF;
END $$;

-- ============================================================
-- 6. RLS: izinkan public insert/update booking untuk auth flow
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Public update own booking') THEN
    CREATE POLICY "Public update own booking"
      ON bookings FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 7. PROFILES: pastikan role CHECK constraint valid
-- ============================================================
-- Hanya tambah constraint jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name ILIKE '%profiles_role_check%'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('admin', 'member'));
  END IF;
END $$;

-- Trigger untuk otomatis set role = 'member' untuk user baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'member')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;
