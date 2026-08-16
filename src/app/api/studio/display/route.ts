import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/** Convert "HH:MM" to minutes since midnight */
function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const now = new Date()
    // WITA (UTC+8) — Banjarmasin timezone
    const wita = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    const dateStr = `${wita.getUTCFullYear()}-${String(wita.getUTCMonth() + 1).padStart(2, '0')}-${String(wita.getUTCDate()).padStart(2, '0')}`
    const nowMin = wita.getUTCHours() * 60 + wita.getUTCMinutes()

    const { data, error } = await supabase
      .from('bookings')
      .select('id, customer_name, product_name, start_time, end_time, booking_date, total_price')
      .eq('booking_date', dateStr)
      .eq('status', 'confirmed')
      .order('start_time', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ status: 'empty', booking: null, nextBooking: null, remaining: 0 })
    }

    let active = null
    let next = null

    for (const b of data) {
      if (!b.start_time || !b.end_time) continue
      const startMin = toMinutes(b.start_time)
      const endMin = toMinutes(b.end_time)
      // Handle bookings that cross midnight (e.g. 21:00 - 00:00)
      // If end <= start, treat end as "next day" by adding 24h
      const effectiveEnd = endMin <= startMin ? endMin + 1440 : endMin
      // Also adjust nowMin if we're in a midnight-cross scenario
      const adjustedNow = nowMin < startMin ? nowMin + 1440 : nowMin

      if (startMin <= adjustedNow && adjustedNow < effectiveEnd) {
        active = b
        break
      }
    }

    if (!active) {
      for (const b of data) {
        if (!b.start_time) continue
        if (toMinutes(b.start_time) > nowMin) {
          next = b
          break
        }
      }
    }

    let remaining = 0
    if (active?.end_time) {
      const endMin = toMinutes(active.end_time)
      const startMin = toMinutes(active.start_time)
      let endAdjusted = endMin
      if (endMin <= startMin) endAdjusted += 1440
      let nowAdjusted = nowMin
      if (nowMin < startMin) nowAdjusted += 1440
      remaining = Math.max(0, (endAdjusted - nowAdjusted) * 60)
    }

    return NextResponse.json({
      status: active ? 'active' : next ? 'waiting' : 'empty',
      booking: active,
      nextBooking: next,
      remaining
    })
  } catch (err) {
    console.error('Display API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}