'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, Check, X, MessageCircle, Search, ExternalLink } from 'lucide-react'
import { formatDate, formatPrice, getWhatsAppUrl } from '@/lib/utils'
import type { Booking } from '@/lib/types'

const statusTabs = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
] as const

const statusBadge: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
  confirmed: { label: 'Dikonfirmasi', color: 'bg-blue-500/20 text-blue-400' },
  completed: { label: 'Selesai', color: 'bg-green-500/20 text-green-400' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-500/20 text-red-400' },
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; action: string; label: string } | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  async function fetchBookings() {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookings(data ?? [])
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(id: string, status: Booking['status']) {
    setActionLoading(id)
    setConfirmDialog(null)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      await fetchBookings()
    } catch (err) {
      console.error('Failed to update booking:', err)
      alert('Gagal mengupdate status pesanan')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredBookings = bookings.filter((b) => {
    if (filter !== 'all' && b.status !== filter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        b.customer_name.toLowerCase().includes(q) ||
        b.customer_phone.includes(q) ||
        (b.product_name?.toLowerCase() ?? '').includes(q)
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground animate-pulse">Memuat data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pesanan</h1>
        <p className="text-muted-foreground mt-1">Kelola pesanan pelanggan</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Status tabs */}
        <div className="flex gap-1 bg-card rounded-lg p-1 border border-border flex-wrap">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari pesanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors"
          />
        </div>
      </div>

      {/* Empty state */}
      {filteredBookings.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <Calendar size={48} className="mx-auto mb-4 opacity-40 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            {searchQuery ? 'Pesanan tidak ditemukan' : 'Belum ada pesanan'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'Coba kata kunci lain' : 'Belum ada pesanan masuk'}
          </p>
        </div>
      )}

      {/* Bookings List */}
      {filteredBookings.length > 0 && (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const isExpanded = expandedId === booking.id
            const status = statusBadge[booking.status]

            return (
              <div
                key={booking.id}
                className="glass rounded-xl overflow-hidden animate-fade-in"
              >
                {/* Main row */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-card/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground truncate">{booking.customer_name}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>{booking.customer_phone}</span>
                      {booking.product_name && <span>• {booking.product_name}</span>}
                      <span>• {formatDate(booking.booking_date)}</span>
                      {booking.start_time && <span>• {booking.start_time}{booking.end_time ? ` - ${booking.end_time}` : ''}</span>}
                    </div>
                  </div>

                  {/* Total */}
                  {booking.total_price && (
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-medium text-foreground">{formatPrice(booking.total_price)}</div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* WhatsApp */}
                    <a
                      href={getWhatsAppUrl(booking.customer_phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-muted-foreground hover:text-green-400 hover:bg-card transition-colors"
                      title="Hubungi via WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </a>

                    {/* Confirm */}
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => setConfirmDialog({ id: booking.id, action: 'confirmed', label: 'Konfirmasi' })}
                        disabled={actionLoading === booking.id}
                        className="p-2 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-card transition-colors disabled:opacity-50"
                        title="Konfirmasi"
                      >
                        <Check size={16} />
                      </button>
                    )}

                    {/* Complete */}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => setConfirmDialog({ id: booking.id, action: 'completed', label: 'Selesaikan' })}
                        disabled={actionLoading === booking.id}
                        className="p-2 rounded-lg text-muted-foreground hover:text-green-400 hover:bg-card transition-colors disabled:opacity-50"
                        title="Selesaikan"
                      >
                        <Check size={16} />
                      </button>
                    )}

                    {/* Cancel */}
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button
                        onClick={() => setConfirmDialog({ id: booking.id, action: 'cancelled', label: 'Batalkan' })}
                        disabled={actionLoading === booking.id}
                        className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-card transition-colors disabled:opacity-50"
                        title="Batalkan"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-border/50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">Kode Booking</span>
                        <p className="text-foreground mt-0.5 font-mono">{booking.booking_code || booking.id}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Nama</span>
                        <p className="text-foreground mt-0.5">{booking.customer_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">No. WhatsApp</span>
                        <p className="text-foreground mt-0.5">{booking.customer_phone}</p>
                      </div>
                      {booking.customer_email && (
                        <div>
                          <span className="text-muted-foreground text-xs">Email</span>
                          <p className="text-foreground mt-0.5">{booking.customer_email}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground text-xs">Produk</span>
                        <p className="text-foreground mt-0.5">{booking.product_name || '-'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Tanggal Booking</span>
                        <p className="text-foreground mt-0.5">{formatDate(booking.booking_date)}</p>
                      </div>
                      {booking.start_time && (
                        <div>
                          <span className="text-muted-foreground text-xs">Waktu Mulai</span>
                          <p className="text-foreground mt-0.5">{booking.start_time}</p>
                        </div>
                      )}
                      {booking.end_time && (
                        <div>
                          <span className="text-muted-foreground text-xs">Waktu Selesai</span>
                          <p className="text-foreground mt-0.5">{booking.end_time}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground text-xs">Status</span>
                        <p className="mt-0.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </p>
                      </div>
                      {booking.total_price && (
                        <div>
                          <span className="text-muted-foreground text-xs">Total Harga</span>
                          <p className="text-foreground mt-0.5 font-medium">{formatPrice(booking.total_price)}</p>
                        </div>
                      )}
                      {booking.payment_method && (
                        <div>
                          <span className="text-muted-foreground text-xs">Metode Pembayaran</span>
                          <p className="text-foreground mt-0.5">{booking.payment_method}</p>
                        </div>
                      )}
                      {booking.notes && (
                        <div className="col-span-full">
                          <span className="text-muted-foreground text-xs">Catatan Pelanggan</span>
                          <p className="text-foreground mt-0.5">{booking.notes}</p>
                        </div>
                      )}
                      {booking.admin_notes && (
                        <div className="col-span-full">
                          <span className="text-muted-foreground text-xs">Catatan Admin</span>
                          <p className="text-foreground mt-0.5">{booking.admin_notes}</p>
                        </div>
                      )}
                    </div>

                    {/* WhatsApp button */}
                    <div className="mt-4">
                      <a
                        href={getWhatsAppUrl(booking.customer_phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-600/30 transition-colors"
                      >
                        <ExternalLink size={14} />
                        Hubungi via WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setConfirmDialog(null)}>
          <div
            className="glass rounded-xl w-full max-w-sm p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {confirmDialog.label} Pesanan
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Apakah Anda yakin ingin {confirmDialog.label.toLowerCase()} pesanan ini?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2.5 bg-[#262626] text-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Batal
              </button>
              <button
                onClick={() => handleStatusUpdate(confirmDialog.id, confirmDialog.action as Booking['status'])}
                disabled={actionLoading === confirmDialog.id}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  confirmDialog.action === 'cancelled'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-[#fafafa] text-[#0a0a0a] hover:opacity-90'
                }`}
              >
                {actionLoading === confirmDialog.id ? 'Memproses...' : confirmDialog.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
