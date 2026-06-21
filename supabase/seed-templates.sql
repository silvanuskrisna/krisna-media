-- Seed templates admin_templates
-- Jalankan di Supabase SQL Editor setelah migration 20260615_admin_templates.sql
-- ============================================================
-- trigger_event:
--   booking_confirm  → muncul saat status PENDING
--   payment_reminder → muncul saat status CONFIRMED
--   after_event      → muncul saat CONFIRMED / COMPLETED
--   ask_testimonial  → muncul saat COMPLETED
--   cancellation     → muncul saat CANCELLED
--   NULL             → manual (gak auto muncul)

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

-- Template manual (gak auto muncul, tapi bisa dipilih dari "Template Lainnya")
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

🔊 Basic (indoor kecil) — Rp 1.500.000/paket
   Includes: 2 speaker aktif, mixer 8ch, 2 wireless mic

🔊 Medium (indoor medium) — Rp 3.000.000/paket
   Includes: 4 speaker aktif, mixer 16ch, 4 wireless mic, monitor

🔊 Large (indoor besar) — Rp 5.000.000/paket
   Includes: 6 speaker aktif, mixer 24ch, 6 wireless mic, subwoofer

Tanggal tersedia untuk bulan ini bisa cek di krisnamedia.id atau bilang aja mau booking yang mana, kita atur!$$, 10),

('Tanya Harga — Lighting', 'general', NULL,
$$Halo Kak {{nama}}! Untuk lighting, ini paket kami:

💡 Basic — Rp 1.000.000/paket
   Includes: 4 PAR LED, controller, stand, smoke machine

💡 Medium — Rp 2.500.000/paket
   Includes: 8 PAR LED, 2 moving head, controller, smoke, strobo

💡 Large — Rp 4.500.000/paket
   Includes: 16 PAR LED, 4 moving head, truss system, laser

Ada tanggal yang cocok? Cek ketersediaan di krisnamedia.id!$$, 11),

('Tanya Harga — Studio Musik', 'studio', NULL,
$$Halo Kak {{nama}}! Untuk studio musik:

🎵 Per Jam — Rp 75.000
🎵 Paket 3 Jam — Rp 200.000 (paling laku! ✅)
🎵 Paket 5 Jam — Rp 300.000

🎉 Happy Hour: (info diskon jam tertentu)

Add-on gear: mic, headphone, kabel, efek, dll.

Lokasi studio: (alamat studio)
Bisa cek ketersediaan di krisnamedia.id atau tanya aja langsung!$$, 12),

('Tanya Harga — Senar Gitar', 'general', NULL,
$$Halo Kak {{nama}}! Untuk senar gitar:

🎸 Akustik — Rp 50.000/set
🎸 Elektrik — Rp 65.000/set
🎸 Bass (4 string) — Rp 120.000/set

Original, semua merk ternama. Bisa ambil langsung di workshop atau kita kirim.$$, 13),

('Reschedule Jadwal', 'booking', NULL,
$$Halo Kak {{nama}}, untuk perubahan jadwal dari {{tanggal}} tidak masalah kok.

Silakan pilih tanggal baru:
• (tgl1)
• (tgl2)
• (tgl3)

Kalau ada biaya perubahan (jika < H-3) akan kami infokan.

Konfirm aja tanggal mana yang cocok!$$, 14),

('Pengambilan / Pengembalian Alat', 'general', NULL,
$$⏰ PENGAMBILAN
Halo Kak {{nama}}! Alat untuk {{tanggal}} udah siap diambil.
Lokasi: (alamat workshop)
Jam: (jam operasional)

Jangan lupa bawa identitas ya!

🔄 PENGEMBALIAN
Untuk pengembalian, mohon dikembalikan paling lambat (jam) di (lokasi).
Kalau ada kerusakan/kehilangan akan kami infokan. Makasih!$$, 15),

('Follow-up (No Response)', 'general', NULL,
$$Halo Kak {{nama}}! Numpang nanya lagi 😊

Masih tertarik sama layanan Krisna Media? Atau ada yang mau ditanyain?

Kalau ada perubahan rencana juga gapapa, kasih kabar aja ya!$$, 16),

('Tanya Kursus Musik (KMC)', 'kmc', NULL,
$$Halo Kak {{nama}}! Tertarik kursus musik? 🎹

Krisna Music Course buka untuk:
🎸 Gitar  |  🎹 Piano  |  🥁 Drum

Level: Pemula — Mahir
Usia: Anak-anak, Remaja, Dewasa

Info lengkap & pendaftaran: {{link_booking}}

Atau tanya aja langsung, kita bantu!$$, 17)

ON CONFLICT (id) DO NOTHING;