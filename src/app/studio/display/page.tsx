'use client'

import { useEffect, useState, useRef } from 'react'

const THANKS_DURATION_MS = 3 * 60 * 1000 // 3 menit

interface ActiveBooking {
  id: string
  customer_name: string
  product_name: string | null
  start_time: string
  end_time: string
  booking_date: string
  total_price: number | null
}

interface DisplayData {
  status: 'loading' | 'active' | 'waiting' | 'empty'
  booking: ActiveBooking | null
  nextBooking: ActiveBooking | null
  remaining: number
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

/** Convert "HH:MM" to minutes since midnight */
function toMinutes(t: string) {
  const [h, m] = (t || '00:00').split(':').map(Number)
  return h * 60 + m
}

/** Calculate remaining seconds for active booking (handles midnight wrap) */
function calcRemaining(booking: ActiveBooking): number {
  const now = new Date()
  const wita = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const nowSec = wita.getUTCHours() * 3600 + wita.getUTCMinutes() * 60 + wita.getUTCSeconds()
  const startSec = toMinutes(booking.start_time || '00:00') * 60
  const endSec = toMinutes(booking.end_time || '00:00') * 60
  let endAdj = endSec
  if (endAdj <= startSec) endAdj += 86400 // next day in seconds
  let nowAdj = nowSec
  if (nowAdj < startSec) nowAdj += 86400
  return Math.max(0, endAdj - nowAdj)
}

function secondsToStart(startTime: string) {
  const now = new Date()
  const wita = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const startSec = toMinutes(startTime) * 60
  const nowSec = wita.getUTCHours() * 3600 + wita.getUTCMinutes() * 60 + wita.getUTCSeconds()
  if (nowSec >= startSec) return 0
  return startSec - nowSec
}

export default function StudioDisplay() {
  const [data, setData] = useState<DisplayData>({
    status: 'loading',
    booking: null,
    nextBooking: null,
    remaining: 0
  })
  const [phase, setPhase] = useState<'countdown' | 'thanks'>('countdown')
  const [thanksName, setThanksName] = useState('')
  const thanksStartRef = useRef<number | null>(null)
  const lastActiveRef = useRef<ActiveBooking | null>(null)
  const fetchRef = useRef<Promise<void> | null>(null)

  // Fetch from API
  const fetchDisplay = useRef(async () => {
    if (fetchRef.current) return
    fetchRef.current = (async () => {
      try {
        const res = await fetch('/api/studio/display')
        if (!res.ok) throw new Error('API error')
        const json: DisplayData = await res.json()
        setData(json)
      } catch (err) {
        console.error('Display fetch error:', err)
      }
    })()
    await fetchRef.current
    fetchRef.current = null
  }).current

  // Initial fetch
  useEffect(() => {
    fetchDisplay()
    const interval = setInterval(fetchDisplay, 15000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tick every second: countdown render + transitions + thanks phase logic
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1)

      // ───── THANKS PHASE ─────
      if (phase === 'thanks') {
        const start = thanksStartRef.current
        const now = Date.now()

        // Auto-end after 3 minutes
        if (start && now - start >= THANKS_DURATION_MS) {
          setPhase('countdown')
          fetchDisplay()
          return
        }

        // Skip if next booking starts within 3 minutes
        if (data.status === 'waiting' && data.nextBooking?.start_time) {
          const diffSec = secondsToStart(data.nextBooking.start_time)
          if (diffSec <= 180) {
            setPhase('countdown')
            fetchDisplay()
            return
          }
        }

        // Skip if a different booking is already active
        if (
          data.status === 'active' &&
          data.booking &&
          data.booking.id !== lastActiveRef.current?.id
        ) {
          setPhase('countdown')
          fetchDisplay()
          return
        }

        return
      }

      // ───── COUNTDOWN PHASE ─────
      // If waiting, check if we need to transition to active
      if (data.status === 'waiting' && data.nextBooking?.start_time) {
        const diffSec = secondsToStart(data.nextBooking.start_time)
        if (diffSec <= 0) {
          fetchDisplay()
        }
      }

      // If active, update lastActiveRef and check for session end
      if (data.status === 'active' && data.booking) {
        lastActiveRef.current = data.booking

        // Trigger thanks when countdown hits zero
        if (calcRemaining(data.booking) <= 0) {
          setPhase('thanks')
          setThanksName(data.booking.customer_name)
          thanksStartRef.current = Date.now()
        }
        return
      }

      // Not active anymore — if the last active booking has truly ended,
      // trigger the thanks phase (covers midnight-wrap + end-time pass)
      if (lastActiveRef.current && calcRemaining(lastActiveRef.current) <= 0) {
        const b = lastActiveRef.current
        setPhase('thanks')
        setThanksName(b.customer_name)
        thanksStartRef.current = Date.now()
      }
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.status, data.nextBooking, data.booking, phase])

  const { status, booking, nextBooking } = data

  // ───── THANKS SCREEN ─────
  if (phase === 'thanks') {
    return (
      <div className="flex flex-col items-center justify-center fixed inset-0 z-50 bg-black text-white text-center px-6">
        <div className="text-2xl text-zinc-500 mb-6">— Sesi Selesai —</div>
        <div className="text-6xl md:text-7xl font-bold tracking-tight mb-8">
          Sesi Sudah Selesai
        </div>
        <div className="text-4xl md:text-5xl font-semibold text-green-400 mb-6">
          Terima Kasih Kak {thanksName} 👋
        </div>
        <div className="text-2xl text-zinc-400">
          Sampai Jumpa Lagi di Sesi Berikutnya
        </div>
      </div>
    )
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center fixed inset-0 z-50 bg-black">
        <div className="text-zinc-600 text-4xl font-light animate-pulse">Memuat...</div>
      </div>
    )
  }

  // Empty state
  if (status === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center fixed inset-0 z-50 bg-black">
        <div className="text-center">
          <div className="text-6xl font-bold text-zinc-800 mb-2">X-STUDIO</div>
          <div className="text-2xl text-zinc-700">Belum ada booking hari ini</div>
        </div>
      </div>
    )
  }

  // Waiting — next booking
  if (status === 'waiting' && nextBooking) {
    const diffSec = secondsToStart(nextBooking.start_time || '00:00')
    const countdown = secondsToDisplay(diffSec)

    return (
      <div className="flex flex-col items-center justify-center fixed inset-0 z-50 bg-black text-white">
        <div className="text-2xl text-zinc-500 mb-4">— Booking Berikutnya —</div>
        <div className="text-8xl font-bold mb-8">{nextBooking.customer_name}</div>
        <div className="text-3xl text-zinc-400 mb-4">
          {nextBooking.product_name || 'Studio'}
        </div>
        <div className="text-2xl text-zinc-500 mb-8">
          {nextBooking.start_time?.slice(0, 5)} — {nextBooking.end_time?.slice(0, 5)}
        </div>
        <div className={`text-6xl font-mono ${diffSec <= 0 ? 'text-green-500 animate-pulse' : 'text-amber-400'}`}>
          {diffSec <= 0 ? 'SEGARA MULAI...' : countdown}
        </div>
        <div className="text-xl text-zinc-600 mt-2">
          {diffSec <= 0 ? 'Memuat sesi...' : 'sampai dimulai'}
        </div>
      </div>
    )
  }

  // Active booking
  if (!booking) return null

  // Calculate remaining directly from booking times (smooth, no jumps)
  const remaining = calcRemaining(booking)
  const displayTime = secondsToDisplay(remaining)
  const isOvertime = remaining <= 0

  return (
    <div className="flex flex-col items-center justify-center fixed inset-0 z-50 bg-black text-white">
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