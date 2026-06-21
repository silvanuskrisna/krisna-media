import type { Booking } from '@/lib/types'
import { formatPrice } from './utils'

export interface RenderSettings {
  bank_name?: string
  bank_account?: string
  bank_holder?: string
}

/**
 * Variabel yang didukung di template:
 * {{nama}}          → customer_name
 * {{tanggal}}       → booking_date (terformat)
 * {{paket}}         → product_name
 * {{jam_mulai}}     → start_time
 * {{jam_selesai}}   → end_time
 * {{lokasi}}        → dari notes (jika ada)
 * {{total}}         → total_price (terformat)
 * {{kode_booking}}  → booking_code
 * {{no_wa}}         → customer_phone
 * {{status}}        → status booking
 * {{rekening}}      → info bank dari pengaturan (ex: "BCA — 1234567890 — a.n. Krisna Media")
 * {{bank_nama}}     → nama bank saja
 * {{bank_no}}       → no rekening saja
 * {{bank_an}}       → atas nama saja
 * {{dp}}            → (manual)
 * {{sisa}}          → (manual)
 * {{batas_waktu}}   → (manual)
 * {{link_booking}}  → https://krisnamedia.id/booking
 */
export function renderTemplate(
  template: string,
  booking: Booking,
  settings?: RenderSettings
): string {
  const bankLine = settings?.bank_name && settings?.bank_account && settings?.bank_holder
    ? `${settings.bank_name} — ${settings.bank_account} — a.n. ${settings.bank_holder}`
    : '(isi rekening di Pengaturan)'

  const variables: Record<string, string> = {
    '{{nama}}': booking.customer_name,
    '{{tanggal}}': booking.booking_date
      ? new Date(booking.booking_date).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '-',
    '{{paket}}': booking.product_name || '-',
    '{{jam_mulai}}': booking.start_time || '-',
    '{{jam_selesai}}': booking.end_time || '-',
    '{{total}}': booking.total_price ? formatPrice(booking.total_price) : '-',
    '{{kode_booking}}': booking.booking_code || booking.id?.slice(0, 8) || '-',
    '{{no_wa}}': booking.customer_phone || '-',
    '{{status}}': booking.status || '-',
    '{{rekening}}': bankLine,
    '{{bank_nama}}': settings?.bank_name || '(bank)',
    '{{bank_no}}': settings?.bank_account || '(no rekening)',
    '{{bank_an}}': settings?.bank_holder || '(a.n.)',
  }

  let rendered = template
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replaceAll(key, value)
  }

  // {{lokasi}} — ambil dari notes jika mengandung keyword lokasi
  if (template.includes('{{lokasi}}')) {
    const lokasi = extractLocation(booking.notes)
    rendered = rendered.replaceAll('{{lokasi}}', lokasi)
  }

  // Manual fallback
  rendered = rendered.replaceAll('{{dp}}', '(isi nominal DP)')
  rendered = rendered.replaceAll('{{sisa}}', '(isi sisa pembayaran)')
  rendered = rendered.replaceAll('{{batas_waktu}}', '(isi batas waktu)')
  rendered = rendered.replaceAll('{{link_booking}}', 'https://krisnamedia.id/booking')

  return rendered
}

function extractLocation(notes: string | null): string {
  if (!notes) return '(lokasi)'
  const lower = notes.toLowerCase()
  const keywords = ['lokasi', 'alamat', 'tempat', 'di ', 'gedung']
  for (const kw of keywords) {
    const idx = lower.indexOf(kw)
    if (idx >= 0) {
      const snippet = notes.slice(idx, idx + 60).split(/[.\n]/)[0].trim()
      if (snippet.length > 3) return snippet
    }
  }
  return notes.slice(0, 50) || '(lokasi)'
}