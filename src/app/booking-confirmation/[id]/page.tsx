import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle, Calendar, Clock, User, Phone, Mail, MessageCircle, Home, Tag, Wallet, Banknote } from 'lucide-react'
import { cn, formatDate, formatPrice, getWhatsAppUrl } from '@/lib/utils'
import type { Booking } from '@/lib/types'

async function getBookingById(id: string): Promise<Booking | null> {
  const sb = await createSupabaseServer()
  const { data } = await sb
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()

  return data
}

export const dynamic = 'force-dynamic'

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const booking = await getBookingById(id)

  if (!booking) {
    notFound()
  }

  const isTransfer = booking.payment_method === 'transfer'

  const whatsappMessage = booking.booking_code
    ? `Halo Krisna Media! Saya ${booking.customer_name}, booking dengan kode: ${booking.booking_code}. Mohon dikonfirmasi ya 🙏`
    : `Halo Krisna Media! Saya ${booking.customer_name}, mau konfirmasi booking saya. Terima kasih.`

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-grid opacity-40 bg-noise" />
        <div className="absolute inset-0 bg-gradient-radial from-accent/5 via-background/80 to-background" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="animate-fade-in">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
              isTransfer ? 'bg-green-500/20' : 'bg-amber-500/20'
            }`}>
              <CheckCircle size={36} className={isTransfer ? 'text-green-400' : 'text-amber-400'} />
            </div>
            <p className={`inline-flex items-center gap-2 text-sm font-medium tracking-wider uppercase mb-4 rounded-full px-4 py-1.5 glass ${
              isTransfer
                ? 'text-green-400 border border-green-500/30'
                : 'text-amber-400 border border-amber-500/30'
            }`}>
              {isTransfer ? '✅ Terkonfirmasi' : '📋 Booking Diproses'}
            </p>
          </div>
          <h1 className="animate-fade-in delay-100 text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            {isTransfer ? 'Booking Berhasil!' : 'Booking Diterima'}
          </h1>
          <p className="animate-fade-in delay-200 text-muted text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {isTransfer
              ? 'Pembayaran Anda telah diterima. Jadwal Anda sudah terkunci!'
              : 'Terima kasih! Silakan hubungi admin via WhatsApp untuk konfirmasi jadwal.'}
          </p>
        </div>
      </section>

      <div className="section-divider mx-6 md:mx-12" />

      {/* ===== BOOKING DETAILS ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="glass rounded-2xl p-8 md:p-10 border border-border animate-fade-in-up">
            {/* ID */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Kode Booking
              </p>
              <span className="text-sm font-mono text-accent bg-accent/10 px-3 py-1 rounded-md">
                {booking.booking_code || booking.id}
              </span>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Nama */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Nama Lengkap
                  </p>
                  <p className="text-foreground font-medium">
                    {booking.customer_name}
                  </p>
                </div>
              </div>

              {/* No. WhatsApp */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    No. WhatsApp
                  </p>
                  <p className="text-foreground font-medium">
                    {booking.customer_phone}
                  </p>
                </div>
              </div>

              {/* Email */}
              {booking.customer_email && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Email
                    </p>
                    <p className="text-foreground font-medium">
                      {booking.customer_email}
                    </p>
                  </div>
                </div>
              )}

              {/* Layanan */}
              {booking.product_name && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                    <Tag size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Layanan
                    </p>
                    <p className="text-foreground font-medium">
                      {booking.product_name}
                    </p>
                  </div>
                </div>
              )}

              {/* Tanggal */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Tanggal Acara
                  </p>
                  <p className="text-foreground font-medium">
                    {formatDate(booking.booking_date)}
                  </p>
                </div>
              </div>

              {/* Waktu */}
              {(booking.start_time || booking.end_time) && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Waktu
                    </p>
                    <p className="text-foreground font-medium">
                      {booking.start_time ? booking.start_time.slice(0, 5) : '—'}
                      {booking.start_time && booking.end_time ? ' — ' : ''}
                      {booking.end_time ? booking.end_time.slice(0, 5) : ''}
                    </p>
                  </div>
                </div>
              )}

              {/* Harga */}
              {booking.total_price != null && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                    <Wallet size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Total Harga
                    </p>
                    <p className="text-foreground font-bold">
                      {formatPrice(booking.total_price)}
                    </p>
                  </div>
                </div>
              )}

              {/* Metode Pembayaran */}
              {booking.payment_method && (
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    booking.payment_method === 'transfer' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    <Banknote size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Pembayaran
                    </p>
                    <p className="text-foreground font-medium capitalize">
                      {booking.payment_method === 'transfer' ? 'Transfer Bank' : 'Bayar Langsung'}
                    </p>
                  </div>
                </div>
              )}

              {/* Promo */}
              {booking.promo_name && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                    <Tag size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Promo
                    </p>
                    <p className="text-foreground font-medium">
                      {booking.promo_name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {booking.notes && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Catatan
                </p>
                <p className="text-muted text-sm leading-relaxed">
                  {booking.notes}
                </p>
              </div>
            )}

            {/* Status */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Status
              </p>
              <span
                className={cn(
                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                  booking.status === 'pending'
                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    : booking.status === 'confirmed'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : booking.status === 'completed'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                )}
              >
                {booking.status === 'pending'
                  ? 'Menunggu Konfirmasi'
                  : booking.status === 'confirmed'
                  ? 'Terkonfirmasi'
                  : booking.status === 'completed'
                  ? 'Selesai'
                  : 'Dibatalkan'}
              </span>
            </div>
          </div>

          {/* Info tambahan untuk cash */}
          {booking.payment_method === 'cash' && (
            <div className="mt-8 glass rounded-2xl p-8 border border-amber-500/20 bg-amber-500/5 animate-fade-in-up delay-150">
              <div className="flex items-start gap-4">
                <MessageCircle size={24} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Langkah Selanjutnya
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Booking Anda sedang menunggu. Untuk mengunci jadwal, silakan
                    hubungi admin Krisna Media via WhatsApp — admin akan
                    mengkonfirmasi jadwal Anda.
                  </p>
                  <a
                    href={getWhatsAppUrl('628115191097', whatsappMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-green-600/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-600/30 transition-all duration-200"
                  >
                    <MessageCircle size={18} />
                    Hubungi Admin via WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Payment proof display for transfer */}
          {booking.payment_method === 'transfer' && booking.payment_proof && (
            <div className="mt-8 glass rounded-2xl p-8 border border-green-500/20 bg-green-500/5 animate-fade-in-up delay-150">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-400" />
                Bukti Pembayaran Terupload
              </h3>
              <div className="relative aspect-video max-w-md rounded-lg overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={booking.payment_proof}
                  alt="Bukti Pembayaran"
                  className="w-full h-full object-contain bg-black/40"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-10 space-y-4 animate-fade-in-up delay-200">
            {booking.payment_method === 'cash' && (
              <a
                href={getWhatsAppUrl('628115191097', whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-8 py-4 rounded-lg transition-all duration-300 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5"
              >
                <MessageCircle size={18} />
                Hubungi Admin via WhatsApp
              </a>
            )}

            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 border border-border hover:border-muted-foreground text-foreground font-medium px-8 py-3.5 rounded-lg transition-all duration-300 hover:-translate-y-0.5 glass"
            >
              <Home size={18} />
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
