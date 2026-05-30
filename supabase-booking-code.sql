-- Tambah kolom booking_code untuk ID pendek di WhatsApp
-- Format: KM-XXXXXX (6 karakter alfanumerik uppercase)

ALTER TABLE bookings ADD COLUMN booking_code VARCHAR(20);

-- Generate booking_code untuk data existing
UPDATE bookings 
SET booking_code = 'KM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
WHERE booking_code IS NULL;

-- Pastikan unique dan not null ke depannya
ALTER TABLE bookings ALTER COLUMN booking_code SET NOT NULL;
ALTER TABLE bookings ADD CONSTRAINT bookings_booking_code_unique UNIQUE (booking_code);
