import type { Booking } from '@/lib/types'
import { formatPrice } from './utils'

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
 * {{status}}        → status booking (pending/confirmed/dll)
 */
export function renderTemplate(template: string, booking: Booking): string {
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

  // {{dp}} dan {{sisa}} — ga ada di DB, fallback
  rendered = rendered.replaceAll('{{dp}}', '(isi nominal DP)')
  rendered = rendered.replaceAll('{{sisa}}', '(isi sisa pembayaran)')
  rendered = rendered.replaceAll('{{batas_waktu}}', '(isi batas waktu)')
  rendered = rendered.replaceAll('{{link_booking}}', 'https://krisnamedia.id/booking')

  return rendered
}

function extractLocation(notes: string | null): string {
  if (!notes) return '(lokasi)'
  // Coba cari kata kunci lokasi di notes
  const lower = notes.toLowerCase()
  const keywords = ['lokasi', 'alamat', 'tempat', 'di ', 'gedung']
  for (const kw of keywords) {
    const idx = lower.indexOf(kw)
    if (idx >= 0) {
      // Ambil substring dari kata kunci sampai akhir kalimat
      const snippet = notes.slice(idx, idx + 60).split(/[.\n]/)[0].trim()
      if (snippet.length > 3) return snippet
    }
  }
  return notes.slice(0, 50) || '(lokasi)'
}
