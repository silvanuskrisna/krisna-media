-- Storage bucket untuk bukti pembayaran transfer
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: hapus dulu kalo udah ada (biar aman dijalanin ulang)
DROP POLICY IF EXISTS "Public upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Public read payment proofs" ON storage.objects;

-- RLS: semua orang bisa upload (pelanggan yang baru booking)
CREATE POLICY "Public upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

-- RLS: semua orang bisa lihat (admin & pelanggan)
CREATE POLICY "Public read payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');
