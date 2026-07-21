'use client'

import { useEffect, useState, useRef } from 'react'

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

function countdownToStart(startTime: string) {
  const now = new Date()
  const [h, m] = startTime.split(':').map(Number)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0)
  return Math.max(0, Math.floor((start.getTime() - now.getTime()) / 1000))
}

export default function StudioDisplay() {
  const [data, setData] = useState<DisplayData>({
    status: 'loading',
    booking: null,
    nextBooking: null,
    remaining: 0
  })
  const [tick, setTick] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const fetchRef = useRef<(() => void) | null>(null)

  // Fetch from API every 30 seconds
  useEffect(() => {
    async function fetchDisplay() {
      try {
        const res = await fetch('/api/studio/display')
        if (!res.ok) throw new Error('API error')
        const json: DisplayData = await res.json()
        setData(json)
        setElapsed(0)  // Reset elapsed timer after fresh fetch
      } catch (err) {
        console.error('Display fetch error:', err)
        setData({ status: 'empty', booking: null, nextBooking: null, remaining: 0 })
      }
    }

    fetchDisplay()
    fetchRef.current = fetchDisplay
    const interval = setInterval(fetchDisplay, 30000)
    return () => clearInterval(interval)
  }, [])

  // Tick every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1)
      setElapsed(e => e + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-refresh when waiting countdown hits 0
  useEffect(() => {
    if (data.status === 'waiting' && data.nextBooking?.start_time) {
      const diffSec = countdownToStart(data.nextBooking.start_time)
      if (diffSec <= 0 && fetchRef.current) {
        fetchRef.current()
      }
    }
  }, [tick, data.status, data.nextBooking])

  const { status, booking, nextBooking } = data

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-zinc-600 text-4xl font-light animate-pulse">Memuat...</div>
      </div>
    )
  }

  // Empty state
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
    const diffSec = countdownToStart(nextBooking.start_time || '00:00')
    const countdown = secondsToDisplay(diffSec)

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white" key={tick}>
        <div className="text-2xl text-zinc-500 mb-4">— Booking Berikutnya —</div>
        <div className="text-8xl font-bold mb-8">{nextBooking.customer_name}</div>
        <div className="text-3xl text-zinc-400 mb-4">
          {nextBooking.product_name || 'Studio'}
        </div>
        <div className="text-2xl text-zinc-500 mb-8">
          {nextBooking.start_time?.slice(0, 5)} — {nextBooking.end_time?.slice(0, 5)}
        </div>
        <div className="text-6xl font-mono text-amber-400">{countdown}</div>
        <div className="text-xl text-zinc-600 mt-2">sampai dimulai</div>
      </div>
    )
  }

  // Active booking
  if (!booking) return null

  const remaining = Math.max(0, data.remaining - elapsed)
  const displayTime = secondsToDisplay(remaining)
  const isOvertime = remaining <= 0

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white" key={tick}>
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