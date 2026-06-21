-- Add trigger_event to admin_templates (if not exist)
ALTER TABLE admin_templates ADD COLUMN IF NOT EXISTS trigger_event VARCHAR(50);

-- Re-seed: hapus data lama, insert ulang (biar trigger_event-nya keisi)
-- Kalo ada template custom yang udah dibuat, skip这一步!
TRUNCATE admin_templates RESTART IDENTITY CASCADE;

INSERT INTO admin_templates (name, category, trigger_event, content, sort_order) VALUES
('Konfirmasi Booking', 'booking', 'booking_confirm',
$$Halo Kak {{nama}}! Terima kasih udah booking di Krisna Media 🎉

Ini detail pesanan kamu:
📅 Tanggal: {{tanggal}}
⏰ Jam: {{jam_mulai}} - {{jam_selesai}}
🔊 Layanan: {{paket}}
📍 Lokasi: {{lokasi}}

Booking kamu sudah kami terima. Kami akan segera hubungi kamu untuk konfirmasi lebih lanjut ya!$$, 1),

('Booking Dikonfirmasi (DP)', 'booking', 'payment_reminder',
$$Halo Kak {{nama}}! Konfirmasi dari kami ✅

Booking kamu untuk:
📅 {{tanggal}}
🔊 {{paket}}

Sudah kami setujui! Untuk mengamankan jadwal, mohon transfer DP sebesar {{dp}} ke:
🏦 BCA — 1234567890 — a.n. Krisna Media
Paling lambat: {{batas_waktu}}

Konfirmasi setelah transfer ya!$$, 2),

('After Event — Terima Kasih', 'general', 'after_event',
$$Halo Kak {{nama}}! Terima kasih banyak udah pakai Krisna Media untuk {{tanggal}}! 🙌

Semua alat beres? Acaranya lancar? Kami tunggu feedbacknya ya!

Kalau ada kendala sound/lighting/studio, jangan sungkan lapor. Sampai ketemu di acara berikutnya! 🔥$$, 3),

('Minta Testimonial', 'general', 'ask_testimonial',
$$Halo Kak {{nama}}! Gimana layanan Krisna Media buat {{paket}} kemarin? Puas? 😊

Kalau berkenan, boleh minta testimonialnya? Tulis aja di sini, nanti kami tampilkan di website 🙏

Atau kalau ada kritik/saran, kita terbuka banget!$$, 4),

('Info Pembatalan', 'booking', 'cancellation',
$$Halo Kak {{nama}}, dengan berat hati kami konfirmasi pembatalan untuk {{tanggal}} ya.

Untuk pembayaran yang sudah diterima:
✅ (Jika refundable) — Refund (persen)%, maks (waktu) kerja
❌ (Jika non-refundable) — Sesuai kebijakan pembatalan

Maaf dan terima kasih. Kalau lain waktu butuh lagi, jangan ragu!$$, 5),

('Booking Baru Masuk (Info)', 'booking', NULL,
$$Halo Kak {{nama}}! Terima kasih udah booking di Krisna Media 🎉

Ini detail pesanan kamu:
📅 Tanggal: {{tanggal}}
⏰ Jam: {{jam_mulai}} - {{jam_selesai}}
🔊 Layanan: {{paket}}
📍 Lokasi: {{lokasi}}

Kami akan segera hubungi kamu untuk konfirmasi lebih lanjut. Stay tuned ya!$$, 6),

('Konfirmasi Booking (DP Diterima)', 'booking', NULL,
$$Halo Kak {{nama}}! Konfirmasi dari kami ✅

DP sebesar {{dp}} sudah kami terima untuk booking:
📅 {{tanggal}}
🔊 {{paket}}

Booking kamu sudah CONFIRMED! 🎉

Sisa pembayaran: {{sisa}}
Paling lambat: H-1 / hari H (sesuai kesepakatan)

Transfer ke:
🏦 BCA — 1234567890 — a.n. Krisna Media

Ada yang mau ditanyakan? Feel free to chat ya!$$, 7),

('Reminder Pelunasan', 'payment', NULL,
$$Halo Kak {{nama}}! Ini remind dari kami 😊

📌 Booking kamu: {{tanggal}} — {{paket}}
💰 Sisa pembayaran: {{sisa}}

Mohon dilunasi sebelum {{batas_waktu}}. Transfer ke:
🏦 BCA — 1234567890 — a.n. Krisna Media

Konfirmasi setelah transfer ya!$$, 8),

('Pelunasan Diterima', 'payment', NULL,
$$Halo Kak {{nama}}! Pelunasan {{total}} sudah kami terima ✅

Semua beres untuk {{tanggal}}! Tim kami siap sedia 🎶
Sampai ketemu di {{lokasi}} / silakan ambil alat di workshop ya! 🙌$$, 9),

('Tanya Harga — Sound System', 'general', NULL,
$$Halo Kak {{nama}}! Terima kasih udah menghubungi Krisna Media 😊

Untuk sound system, berikut paket kami:
🔊 Basic — Rp 1.500.000/paket | 🔊 Medium — Rp 3.000.000/paket | 🔊 Large — Rp 5.000.000/paket$$, 10),

('Tanya Harga — Lighting', 'general', NULL,
$$Halo Kak {{nama}}! Untuk lighting, ini paket kami:
💡 Basic — Rp 1.000.000/paket | 💡 Medium — Rp 2.500.000/paket | 💡 Large — Rp 4.500.000/paket$$, 11),

('Tanya Harga — Studio Musik', 'studio', NULL,
$$Halo Kak {{nama}}! Untuk studio musik:
🎵 Per Jam — Rp 75.000 | 🎵 Paket 3 Jam — Rp 200.000 | 🎵 Paket 5 Jam — Rp 300.000$$, 12),

('Reschedule Jadwal', 'booking', NULL,
$$Halo Kak {{nama}}, untuk perubahan jadwal dari {{tanggal}} tidak masalah kok. Silakan pilih tanggal baru dan konfirm ya!$$, 13),

('Follow-up (No Response)', 'general', NULL,
$$Halo Kak {{nama}}! Numpang nanya lagi 😊 Masih tertarik sama layanan Krisna Media? Atau ada yang mau ditanyain?$$, 14),

('Tanya Kursus Musik (KMC)', 'kmc', NULL,
$$Halo Kak {{nama}}! Tertarik kursus musik? 🎹 Krisna Music Course buka: 🎸 Gitar | 🎹 Piano | 🥁 Drum$$, 15);