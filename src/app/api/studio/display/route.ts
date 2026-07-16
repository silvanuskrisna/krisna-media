import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const nowHHMM = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`

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
      if (b.start_time <= nowHHMM && nowHHMM < b.end_time) {
        active = b
        break
      }
    }

    if (!active) {
      for (const b of data) {
        if (!b.start_time) continue
        if (b.start_time > nowHHMM) {
          next = b
          break
        }
      }
    }

    let remaining = 0
    if (active?.end_time) {
      const now = new Date()
      const [h, m] = active.end_time.split(':').map(Number)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0)
      remaining = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
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