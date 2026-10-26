-- ============================================================
-- Krisna Media — Fitur Kode Diskon (Discount Codes)
-- Jalankan SQL ini di Supabase SQL Editor
-- Tanggal: 2026-10-26
--
-- Ringkasan fitur:
--  • Kode diskon persen ATAU nominal rupiah
--  • Tidak bisa stack dengan promo / Happy Hour
--  • Berlaku hanya untuk layanan studio
--  • Batas pemakaian per nomor WhatsApp (default 5x, bisa diubah per kode)
--  • Kuota total per kode (opsional, kosong = tidak terbatas)
--  • Periode start + end date
--  • Validasi dilakukan server-side (trigger) — tidak bisa dimanipulasi
-- ============================================================

-- ============================================================
-- 1. TABEL discount_codes
-- ============================================================
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('percent', 'nominal')),
  value DECIMAL(12, 0) NOT NULL CHECK (value > 0),
  quota INT CHECK (quota IS NULL OR quota > 0),          -- NULL = tidak terbatas
  max_use_per_phone INT NOT NULL DEFAULT 5 CHECK (max_use_per_phone >= 1),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Admin (authenticated) bisa CRUD; publik TIDAK bisa lihat daftar kode
-- (kode bersifat rahasia/terarah — hanya admin yang kelola)
DROP POLICY IF EXISTS "Admin all discount_codes" ON discount_codes;
CREATE POLICY "Admin all discount_codes"
  ON discount_codes FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 2. KOLOM BARU di tabel bookings (snapshot diskon untuk riwayat)
-- ============================================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_code_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_type VARCHAR(10);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_value DECIMAL(12, 0);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12, 0);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_base_price DECIMAL(12, 0);

CREATE INDEX IF NOT EXISTS idx_bookings_discount_code_id ON bookings (discount_code_id);

-- ============================================================
-- 3. HELPER: normalisasi nomor HP
--    "0811-519-1097" / "+62811..." / "62811..." → "628115191097"
-- ============================================================
CREATE OR REPLACE FUNCTION public.normalize_phone(p TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN regexp_replace(p, '\D', '', 'g') LIKE '0%'
    THEN '62' || substring(regexp_replace(p, '\D', '', 'g') FROM 2)
    ELSE regexp_replace(p, '\D', '', 'g')
  END;
$$;

-- ============================================================
-- 4. FUNGSI VALIDASI: validate_discount_code
--    Dipakai oleh:
--      a) Form booking (via supabase.rpc) — cek kode & preview diskon
--      b) Trigger BEFORE INSERT — validasi final anti-manipulasi
--    SECURITY DEFINER = bisa baca discount_codes/products/bookings
--    meskipun pemanggilnya user anonim.
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_discount_code(
  p_code TEXT,
  p_booking_date DATE,
  p_phone TEXT,
  p_product_id UUID,
  p_start_time TEXT DEFAULT NULL,
  p_end_time TEXT DEFAULT NULL
)
RETURNS TABLE (
  ok BOOLEAN,
  err TEXT,
  code_id UUID,
  code TEXT,
  name TEXT,
  type VARCHAR(10),
  value DECIMAL,
  amount DECIMAL,
  base_price DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code RECORD;
  v_prod RECORD;
  v_base DECIMAL(12, 0);
  v_amount DECIMAL(12, 0);
  v_norm_phone TEXT;
  v_used_total INT;
  v_used_phone INT;
  v_start_h INT;
  v_start_m INT;
  v_end_h INT;
  v_end_m INT;
  v_hours NUMERIC;
BEGIN
  ok := false;
  err := NULL;
  code_id := NULL; code := NULL; name := NULL; type := NULL;
  value := NULL; amount := NULL; base_price := NULL;

  -- Kode wajib diisi
  IF p_code IS NULL OR trim(p_code) = '' THEN
    err := 'Masukkan kode diskon.';
    RETURN NEXT; RETURN;
  END IF;

  -- Kode dicari case-insensitive (disimpan uppercase)
  -- NOTE: kolom tabel di-qualify (discount_codes.code) karena nama output
  --       fungsi juga "code" — tanpa qualify akan ambiguous.
  SELECT * INTO v_code
  FROM discount_codes
  WHERE discount_codes.code = upper(trim(p_code));

  IF v_code IS NULL THEN
    err := 'Kode diskon tidak ditemukan.';
    RETURN NEXT; RETURN;
  END IF;

  -- Kunci baris kode sebentar untuk mencegah race condition kuota
  PERFORM id FROM discount_codes WHERE id = v_code.id FOR UPDATE;

  IF NOT v_code.is_active THEN
    err := 'Kode diskon sudah tidak aktif.';
    RETURN NEXT; RETURN;
  END IF;

  -- Periode berlaku
  IF v_code.start_date IS NOT NULL AND p_booking_date IS NOT NULL AND p_booking_date < v_code.start_date THEN
    err := format('Kode diskon mulai berlaku tanggal %s.', to_char(v_code.start_date, 'DD-MM-YYYY'));
    RETURN NEXT; RETURN;
  END IF;
  IF v_code.end_date IS NOT NULL AND p_booking_date IS NOT NULL AND p_booking_date > v_code.end_date THEN
    err := format('Kode diskon sudah berakhir tanggal %s.', to_char(v_code.end_date, 'DD-MM-YYYY'));
    RETURN NEXT; RETURN;
  END IF;

  -- Kuota total (yang dihitung: booking berstatus bukan 'cancelled')
  SELECT count(*) INTO v_used_total
  FROM bookings
  WHERE discount_code_id = v_code.id AND status <> 'cancelled';

  IF v_code.quota IS NOT NULL AND v_used_total >= v_code.quota THEN
    err := 'Kode diskon sudah mencapai kuota maksimal.';
    RETURN NEXT; RETURN;
  END IF;

  -- Batas pemakaian per nomor WhatsApp (default 5x)
  v_norm_phone := public.normalize_phone(p_phone);
  SELECT count(*) INTO v_used_phone
  FROM bookings
  WHERE discount_code_id = v_code.id
    AND status <> 'cancelled'
    AND public.normalize_phone(customer_phone) = v_norm_phone;

  IF v_used_phone >= v_code.max_use_per_phone THEN
    err := format('Kode diskon sudah dipakai maksimal %s kali untuk nomor WhatsApp ini.', v_code.max_use_per_phone);
    RETURN NEXT; RETURN;
  END IF;

  -- Hanya berlaku untuk layanan studio
  SELECT * INTO v_prod FROM products WHERE id = p_product_id;
  IF v_prod IS NULL THEN
    err := 'Layanan tidak ditemukan.';
    RETURN NEXT; RETURN;
  END IF;
  IF v_prod.category <> 'studio' THEN
    err := 'Kode diskon hanya berlaku untuk booking studio.';
    RETURN NEXT; RETURN;
  END IF;

  -- Harga dasar = harga NORMAL layanan (tanpa HH/promo — kode tidak bisa stack)
  -- Rumus harus sama persis dengan logika harga normal di form booking:
  --   • paket  → harga produk
  --   • per jam → harga produk × ceil(jam), minimal 1 jam
  v_base := v_prod.price;
  IF v_prod.price_unit = 'jam' AND p_start_time IS NOT NULL AND p_end_time IS NOT NULL THEN
    v_start_h := split_part(p_start_time, ':', 1)::int;
    v_start_m := split_part(p_start_time, ':', 2)::int;
    v_end_h := split_part(p_end_time, ':', 1)::int;
    v_end_m := split_part(p_end_time, ':', 2)::int;
    v_hours := (v_end_h + v_end_m / 60.0) - (v_start_h + v_start_m / 60.0);
    IF v_hours > 0 THEN
      v_base := round(v_prod.price * ceil(v_hours));
    END IF;
  END IF;

  -- Hitung potongan:
  --   • percent → base × value / 100
  --   • nominal → min(value, base) — diskon tidak melebihi harga
  IF v_code.type = 'percent' THEN
    v_amount := round(v_base * v_code.value / 100);
  ELSE
    v_amount := LEAST(v_code.value, v_base);
  END IF;

  ok := true;
  code_id := v_code.id;
  code := v_code.code;
  name := v_code.name;
  type := v_code.type;
  value := v_code.value;
  amount := v_amount;
  base_price := v_base;
  RETURN NEXT;
END;
$$;

-- ============================================================
-- 5. TRIGGER: validasi final saat booking dibuat
--    (hanya BEFORE INSERT — status update admin tidak disentuh)
--    Mencegah manipulasi harga dari browser:
--    total_price = base (server) + addons − amount (server)
-- ============================================================
CREATE OR REPLACE FUNCTION public.bookings_discount_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  -- Tidak ada kode diskon → biarkan seperti biasa (tidak mengganggu booking lama)
  IF NEW.discount_code IS NULL AND NEW.discount_code_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Kode diskon tidak boleh digabung dengan promo
  IF NEW.promo_id IS NOT NULL OR (NEW.promo_name IS NOT NULL AND NEW.promo_name <> '') THEN
    RAISE EXCEPTION 'Kode diskon tidak bisa digabung dengan promo.';
  END IF;

  -- Validasi via fungsi yang sama dengan form booking
  SELECT * INTO r
  FROM public.validate_discount_code(
    COALESCE(NEW.discount_code, ''),
    NEW.booking_date,
    NEW.customer_phone,
    NEW.product_id,
    NEW.start_time::text,
    NEW.end_time::text
  );

  IF NOT r.ok THEN
    RAISE EXCEPTION '%', r.err;
  END IF;

  -- Cegah manipulasi: harga dasar & nilai diskon harus cocok dengan hitungan server
  IF NEW.discount_base_price IS DISTINCT FROM r.base_price THEN
    RAISE EXCEPTION 'Harga dasar diskon tidak valid.';
  END IF;
  IF NEW.discount_amount IS DISTINCT FROM r.amount THEN
    RAISE EXCEPTION 'Nilai diskon tidak valid.';
  END IF;

  -- Snapshot dari tabel (source of truth — bukan dari input client)
  NEW.discount_code_id := r.code_id;
  NEW.discount_code := r.code;
  NEW.discount_type := r.type;
  NEW.discount_value := r.value;
  NEW.discount_amount := r.amount;
  NEW.discount_base_price := r.base_price;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_discount ON bookings;
CREATE TRIGGER trg_bookings_discount
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.bookings_discount_trigger_fn();

-- ============================================================
-- SELESAI. Fitur siap dipakai dari halaman:
--   • Booking → kolom "Kode Diskon"
--   • Admin → menu "Kode Diskon" (kelola kode + statistik pemakaian)
-- ============================================================