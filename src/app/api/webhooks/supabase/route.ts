import { NextRequest, NextResponse } from 'next/server'

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

interface SupabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: Record<string, unknown>
  old_record: Record<string, unknown> | null
}

function formatBooking(record: Record<string, unknown>): string {
  return [
    '📦 **Booking Baru!**',
    `**Nama:** ${record.customer_name || '-'}`,
    `**WA:** ${record.customer_phone || '-'}`,
    `**Layanan:** ${record.product_name || '-'}`,
    `**Tanggal:** ${record.booking_date || '-'}`,
    `**Jam:** ${record.start_time || '-'}${record.end_time ? ` - ${record.end_time}` : ''}`,
    `**Harga:** Rp ${Number(record.total_price || 0).toLocaleString('id-ID')}`,
    `**Status:** ${record.status || 'Pending'}`,
    record.notes ? `**Catatan:** ${record.notes}` : '',
    '',
    `🔗 https://krisnamedia.id/admin/bookings/${record.id}`,
  ].filter(Boolean).join('\n')
}

function formatMember(record: Record<string, unknown>): string {
  return [
    '👤 **Member Baru Terdaftar!**',
    `**Nama:** ${record.full_name || '-'}`,
    record.phone ? `**Telp:** ${record.phone}` : '',
    record.whatsapp ? `**WA:** ${record.whatsapp}` : '',
    record.referral_source ? `**Tahu dari:** ${record.referral_source}` : '',
    '',
    `🔗 https://krisnamedia.id/admin/members`,
  ].filter(Boolean).join('\n')
}

function formatMessage(payload: SupabaseWebhookPayload): string | null {
  if (payload.type !== 'INSERT') return null

  const { table, record } = payload

  switch (table) {
    case 'bookings':
      return formatBooking(record)
    case 'members':
      return formatMember(record)
    default:
      return null
  }
}

export async function POST(request: NextRequest) {
  if (!DISCORD_WEBHOOK_URL) {
    console.error('DISCORD_WEBHOOK_URL not configured')
    return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 500 })
  }

  let payload: SupabaseWebhookPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const message = formatMessage(payload)
  if (!message) {
    // Not an event we care about — silently ok
    return NextResponse.json({ ok: true, skipped: true })
  }

  const discordPayload = {
    content: message,
    allowed_mentions: { parse: [] },
  }

  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discordPayload),
  })

  if (!res.ok) {
    console.error(`Discord webhook failed: ${res.status} ${await res.text()}`)
    return NextResponse.json({ error: 'Discord webhook failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}

// Allow GET for health check
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Supabase webhook receiver ready',
    configured: !!DISCORD_WEBHOOK_URL,
  })
}
