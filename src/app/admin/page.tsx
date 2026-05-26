'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Package, Calendar, MessageSquare, Users, TrendingUp, TriangleAlert, ExternalLink } from 'lucide-react'
import { formatDate, formatPrice, statusColors } from '@/lib/utils'
import type { Booking } from '@/lib/types'

interface Stats {
  totalProducts: number
  totalBookings: number
  pendingBookings: number
  confirmedBookings: number
  completedBookings: number
  cancelledBookings: number
  totalTestimonials: number
  totalMembers: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalTestimonials: 0,
    totalMembers: 0,
  })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, bookingsRes, testimonialsRes, membersRes] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5),
          supabase.from('testimonials').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'member'),
        ])

        const { count: totalProducts } = productsRes
        const { data: bookings, count: totalBookings } = bookingsRes
        const { count: totalTestimonials } = testimonialsRes
        const { count: totalMembers } = membersRes

        // Get status counts from all bookings
        const { data: allStatuses } = await supabase
          .from('bookings')
          .select('status')

        const pendingCount = allStatuses?.filter(b => b.status === 'pending').length ?? 0
        const confirmedCount = allStatuses?.filter(b => b.status === 'confirmed').length ?? 0
        const completedCount = allStatuses?.filter(b => b.status === 'completed').length ?? 0
        const cancelledCount = allStatuses?.filter(b => b.status === 'cancelled').length ?? 0

        setStats({
          totalProducts: totalProducts ?? 0,
          totalBookings: totalBookings ?? 0,
          pendingBookings: pendingCount,
          confirmedBookings: confirmedCount,
          completedBookings: completedCount,
          cancelledBookings: cancelledCount,
          totalTestimonials: totalTestimonials ?? 0,
          totalMembers: totalMembers ?? 0,
        })
        setRecentBookings(bookings ?? [])
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground animate-pulse">Memuat data...</div>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Produk',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Total Pesanan',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Pesanan Pending',
      value: stats.pendingBookings,
      icon: TriangleAlert,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    {
      label: 'Pesanan Selesai',
      value: stats.completedBookings,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Total Testimoni',
      value: stats.totalTestimonials,
      icon: MessageSquare,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Total Member',
      value: stats.totalMembers,
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Ringkasan data Krisna Media</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`glass rounded-xl p-5 hover-card animate-fade-in delay-${(i + 1) * 100}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${card.bg}`}>
                  <Icon size={20} className={card.color} />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{card.label}</div>
            </div>
          )
        })}
      </div>

      {/* Recent Bookings */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Pesanan Terbaru</h2>

        {recentBookings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar size={40} className="mx-auto mb-3 opacity-40" />
            <p>Belum ada pesanan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Pelanggan</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Produk</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tanggal</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Total <ExternalLink size={12} className="inline opacity-40" /></th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                    className="border-b border-border/50 hover:bg-card/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 text-foreground group-hover:text-accent transition-colors">{booking.customer_name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{booking.product_name || '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{formatDate(booking.booking_date)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                        {booking.status === 'pending' && 'Pending'}
                        {booking.status === 'confirmed' && 'Dikonfirmasi'}
                        {booking.status === 'completed' && 'Selesai'}
                        {booking.status === 'cancelled' && 'Dibatalkan'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-foreground font-medium">
                      {booking.total_price ? formatPrice(booking.total_price) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {recentBookings.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Menampilkan {recentBookings.length} pesanan terbaru
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
