'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, User, Phone, Mail, MessageCircle, Check, X, ArrowLeft, Tag, FileText, ExternalLink } from 'lucide-react'
import { formatDate, formatPrice, getWhatsAppUrl } from '@/lib/utils'
import type { Booking } from '@/lib/types'
import TemplateActions from '@/components/admin/TemplateActions'

const statusBadge: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
  confirmed: { label: 'Dikonfirmasi', color: 'bg-blue-500/20 text-blue-400' },
  completed: { label: 'Selesai', color: 'bg-green-500/20 text-green-400' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-500/20 text-red-400' },
}

export default function AdminBookingDetail() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ action: string; label: string } | null>(null)

  useEffect(() => {
    fetchBooking()
  }, [])

  async function fetchBooking() {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setBooking(data)
    } catch (err) {
      console.error('Failed to fetch booking:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(status: Booking['status']) {
    if (!booking) return
    setActionLoading(status)
    setConfirmDialog(null)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', booking.id)

      if (error) throw error
      await fetchBooking()
      // Auto-close: redirect back to bookings list
      router.push('/admin/bookings')
    } catch (err) {
      console.error('Failed to update booking:', err)
      alert('Gagal mengupdate status pesanan')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground animate-pulse">Memuat data...</div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Pesanan tidak ditemukan</h2>
          <Link href="/admin/bookings" className="text-accent hover:underline text-sm">Kembali ke daftar pesanan</Link>
        </div>
      </div>
    )
  }

  const status = statusBadge[booking.status]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Kembali ke daftar pesanan
      </Link>

      {/* Header */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{booking.customer_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kode: <span className="font-mono text-accent">{booking.booking_code || booking.id}</span>
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex items-start gap-3">
            <User size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Nama Pelanggan</p>
              <p className="text-sm text-foreground font-medium">{booking.customer_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">No. WhatsApp</p>
              <p className="text-sm text-foreground font-medium">{booking.customer_phone}</p>
            </div>
          </div>

          {booking.customer_email && (
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm text-foreground font-medium">{booking.customer_email}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Tag size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Produk</p>
              <p className="text-sm text-foreground font-medium">{booking.product_name || '-'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Tanggal Booking</p>
              <p className="text-sm text-foreground font-medium">{formatDate(booking.booking_date)}</p>
            </div>
          </div>

          {booking.start_time && (
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Waktu</p>
                <p className="text-sm text-foreground font-medium">
                  {booking.start_time}{booking.end_time ? ` - ${booking.end_time}` : ''}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Tag size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total Harga</p>
              <p className="text-sm text-foreground font-semibold">
                {booking.total_price ? formatPrice(booking.total_price) : '-'}
              </p>
            </div>
          </div>

          {booking.payment_method && (
            <div className="flex items-start gap-3">
              <Tag size={16} className="text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Metode Pembayaran</p>
                <p className="text-sm text-foreground font-medium">{booking.payment_method}</p>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="mt-5 pt-5 border-t border-border/50">
            <div className="flex items-start gap-3">
              <FileText size={16} className="text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Catatan Pelanggan</p>
                <p className="text-sm text-foreground mt-1">{booking.notes}</p>
              </div>
            </div>
          </div>
        )}

        {booking.admin_notes && (
          <div className="mt-4">
            <div className="flex items-start gap-3">
              <FileText size={16} className="text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Catatan Admin</p>
                <p className="text-sm text-foreground mt-1">{booking.admin_notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Info */}
        {booking.payment_method && (
          <div className="mt-5 pt-5 border-t border-border/50">
            <div className="flex items-start gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Metode Pembayaran</p>
                <p className="text-sm text-foreground font-medium mt-0.5 capitalize">{booking.payment_method}</p>
              </div>
            </div>
          </div>
        )}
        {booking.payment_proof && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Bukti Transfer</p>
            <a href={booking.payment_proof} target="_blank" rel="noopener noreferrer">
              <img
                src={booking.payment_proof}
                alt="Bukti transfer"
                className="w-48 h-48 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity cursor-pointer"
              />
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Aksi</h2>
        <div className="space-y-4">
          {/* Template Actions — auto sesuai status */}
          <TemplateActions booking={booking} />

          {/* Status update buttons */}
          <div className="flex flex-wrap gap-3 pt-3 border-t border-border/50">
            {/* Confirm */}
            {booking.status === 'pending' && (
              <button
                onClick={() => setConfirmDialog({ action: 'confirmed', label: 'Konfirmasi' })}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition-colors disabled:opacity-50"
              >
                <Check size={16} />
                Konfirmasi Pesanan
              </button>
            )}

            {/* Complete */}
            {booking.status === 'confirmed' && (
              <button
                onClick={() => setConfirmDialog({ action: 'completed', label: 'Selesaikan' })}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-600/30 transition-colors disabled:opacity-50"
              >
                <Check size={16} />
                Tandai Selesai
              </button>
            )}

            {/* Cancel */}
            {(booking.status === 'pending' || booking.status === 'confirmed') && (
              <button
                onClick={() => setConfirmDialog({ action: 'cancelled', label: 'Batalkan' })}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50"
              >
                <X size={16} />
                Batalkan Pesanan
              </button>
            )}
          </div>
        </div>
      </div>

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
                onClick={() => handleStatusUpdate(confirmDialog.action as Booking['status'])}
                disabled={actionLoading === confirmDialog.action}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  confirmDialog.action === 'cancelled'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-[#fafafa] text-[#0a0a0a] hover:opacity-90'
                }`}
              >
                {actionLoading === confirmDialog.action ? 'Memproses...' : confirmDialog.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
