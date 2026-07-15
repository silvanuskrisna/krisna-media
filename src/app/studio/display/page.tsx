'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface ActiveBooking {
  id: string
  customer_name: string
  product_name: string | null
  start_time: string
  end_time: string
  booking_date: string
  total_price: number | null
}

function getCurrentTimeHHMM() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function getTodayDate() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function parseHHMM(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return { h, m }
}

function remainingSeconds(endHM: string) {
  const now = new Date()
  const { h, m } = parseHHMM(endHM)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0)
  const diff = Math.floor((end.getTime() - now.getTime()) / 1000)
  return Math.max(0, diff)
}

function secondsToDisplay(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatPrice(price: number | null) {
  if (!price) return ''
  return 'Rp' + price.toLocaleString('id-ID')
}

export default function StudioDisplay() {
  const [booking, setBooking] = useState<ActiveBooking | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [nextBooking, setNextBooking] = useState<ActiveBooking | null>(null)
  const [status, setStatus] = useState<'loading' | 'active' | 'waiting' | 'empty'>('loading')
  const [error, setError] = useState<string | null>(null)

  // Fetch active booking
  const fetchBooking = useCallback(async () => {
    try {
      const today = getTodayDate()
      const now = getCurrentTimeHHMM()

      // Fetch all confirmed bookings for today
      const { data, error } = await supabase
        .from('bookings')
        .select('id, customer_name, product_name, start_time, end_time, booking_date, total_price')
        .eq('booking_date', today)
        .eq('status', 'confirmed')
        .order('start_time', { ascending: true })

      if (error) throw error
      if (!data || data.length === 0) {
        // No bookings today — show X-Studio logo/screen
        setBooking(null)
        setNextBooking(null)
        setStatus('empty')
        return
      }

      // Find active booking: start_time <= now < end_time
      let active: ActiveBooking | null = null
      let next: ActiveBooking | null = null

      for (const b of data) {
        if (!b.start_time || !b.end_time) continue
        if (b.start_time <= now && now < b.end_time) {
          active = b
          break
        }
      }

      // If no active booking, find the next upcoming one
      if (!active) {
        for (const b of data) {
          if (!b.start_time) continue
          if (b.start_time > now) {
            next = b
            break
          }
        }
      }

      setBooking(active)
      setNextBooking(next)
      setStatus(active ? 'active' : next ? 'waiting' : 'empty')
    } catch (err) {
      console.error('Display fetch error:', err)
      setError('Gagal mengambil data booking')
    }
  }, [])

  // Initial fetch + countdown logic
  useEffect(() => {
    fetchBooking()

    // Refresh booking list every 30 seconds
    const interval = setInterval(fetchBooking, 30000)

    // Countdown tick every second
    const tick = setInterval(() => {
      if (booking && booking.end_time) {
        setRemaining(remainingSeconds(booking.end_time))
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(tick)
    }
  }, [fetchBooking, booking])

  // Update remaining when booking changes
  useEffect(() => {
    if (booking && booking.end_time) {
      setRemaining(remainingSeconds(booking.end_time))
    }
  }, [booking])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-zinc-600 text-4xl font-light animate-pulse">Memuat...</div>
      </div>
    )
  }

  // Empty state — no bookings today
  if (status === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="text-6xl font-bold text-zinc-800 mb-2">X-STUDIO</div>
          <div className="text-2xl text-zinc-700">Tidak ada jadwal hari ini</div>
        </div>
      </div>
    )
  }

  // Waiting — next booking
  if (status === 'waiting' && nextBooking) {
    const startHM = nextBooking.start_time || '00:00'
    const { h, m } = parseHHMM(startHM)
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0)
    const diffSec = Math.max(0, Math.floor((startDate.getTime() - now.getTime()) / 1000))
    const countdown = secondsToDisplay(diffSec)

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <div className="text-2xl text-zinc-500 mb-4">— Booking Berikutnya —</div>
        <div className="text-8xl font-bold mb-8">{nextBooking.customer_name}</div>
        <div className="text-3xl text-zinc-400 mb-4">
          {nextBooking.product_name || 'Studio'}
        </div>
        <div className="text-2xl text-zinc-500 mb-8">
          {startHM} — {nextBooking.end_time || '—'}
        </div>
        <div className="text-6xl font-mono text-amber-400">{countdown}</div>
        <div className="text-xl text-zinc-600 mt-2">sampai dimulai</div>
      </div>
    )
  }

  // Active booking
  if (!booking) return null

  const displayTime = secondsToDisplay(remaining)
  const isOvertime = remaining <= 0

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      {/* Header */}
      <div className="text-2xl text-zinc-500 mb-3">— Sedang Berlangsung —</div>

      {/* Customer Name */}
      <div className="text-8xl font-bold mb-4 tracking-tight">
        {booking.customer_name}
      </div>

      {/* Package & Time */}
      <div className="text-3xl text-zinc-400 mb-8">
        {booking.product_name || 'Studio'} &middot;{' '}
        {booking.start_time?.slice(0, 5)} — {booking.end_time?.slice(0, 5)}
      </div>

      {/* Countdown */}
      <div className={`text-[10rem] font-mono font-bold leading-none mb-4 ${
        isOvertime ? 'text-red-500' : remaining < 300 ? 'text-amber-400 animate-pulse' : 'text-white'
      }`}>
        {displayTime}
      </div>

      {/* Label */}
      <div className="text-2xl text-zinc-500">
        {isOvertime ? 'WAKTU HABIS' : 'Sisa Waktu'}
      </div>

      {/* Price */}
      {booking.total_price && (
        <div className="mt-10 text-xl text-zinc-600">
          {formatPrice(booking.total_price)}
        </div>
      )}
    </div>
  )
}