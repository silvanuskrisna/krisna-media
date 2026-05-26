'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, ChevronRight, Search, Package } from 'lucide-react'
import { formatDate, formatPrice, statusColors } from '@/lib/utils'
import type { Booking } from '@/lib/types'

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      const userEmail = session?.user?.email

      if (!userEmail) {
        setLoading(false)
        return
      }

      setEmail(userEmail)

      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_email', userEmail)
        .order('created_at', { ascending: false })

      setBookings(data ?? [])
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center text-muted-foreground animate-pulse">Memuat...</div>
        </div>
      </div>
    )
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="glass rounded-xl p-12">
            <Search size={48} className="mx-auto mb-4 opacity-40 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Login untuk melihat pesanan</h2>
            <p className="text-muted-foreground mb-6">Silakan login dengan email yang digunakan saat booking.</p>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-6 py-3 rounded-lg transition-all"
            >
              Masuk / Daftar
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Pesanan Saya</h1>
          <p className="text-muted-foreground mt-1">
            {bookings.length > 0
              ? `${bookings.length} pesanan ditemukan`
              : 'Belum ada pesanan'}
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Package size={48} className="mx-auto mb-4 opacity-40 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">Belum ada pesanan</h3>
            <p className="text-muted-foreground mb-6">
              Anda belum melakukan pemesanan dengan email {email}
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-6 py-3 rounded-lg transition-all"
            >
              Booking Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/booking-confirmation/${booking.id}`}
                className="glass rounded-xl p-6 flex items-center justify-between hover:border-accent/20 transition-all group"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">
                      {booking.product_name || 'Pemesanan'}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                      {booking.status === 'pending' && 'Pending'}
                      {booking.status === 'confirmed' && 'Dikonfirmasi'}
                      {booking.status === 'completed' && 'Selesai'}
                      {booking.status === 'cancelled' && 'Dibatalkan'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {formatDate(booking.booking_date)}
                    </span>
                    {booking.start_time && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {booking.start_time}
                        {booking.end_time && ` - ${booking.end_time}`}
                      </span>
                    )}
                    {booking.total_price != null && (
                      <span className="font-medium text-foreground">
                        {formatPrice(booking.total_price)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
