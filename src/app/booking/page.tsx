'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, ArrowLeft, Send, CheckCircle, User, Phone, Mail, MessageCircle, FileText, Tag } from 'lucide-react'
import { cn, formatPrice, getWhatsAppUrl } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/types'

function BookingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productSlug = searchParams.get('product')

  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookedSlots, setBookedSlots] = useState<{ start: string; end: string; customer: string; status: string }[]>([])
  const [checkingSlots, setCheckingSlots] = useState(false)

  // Form fields
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      setProducts(data ?? [])
      setLoadingProducts(false)

      // Pre-select product if slug param exists
      if (productSlug && data) {
        const matched = data.find((p) => p.slug === productSlug)
        if (matched) {
          setSelectedProductId(matched.id)
        }
      }
    }

    fetchProducts()
  }, [productSlug])

  // ───── CEK KETERSEDIAAN SAAT PILIH PRODUK + TANGGAL ─────
  useEffect(() => {
    if (!selectedProductId || !bookingDate) {
      setBookedSlots([])
      return
    }

    setCheckingSlots(true)
    supabase
      .from('bookings')
      .select('start_time, end_time, customer_name, status')
      .eq('product_id', selectedProductId)
      .eq('booking_date', bookingDate)
      .in('status', ['pending', 'confirmed'])
      .order('start_time', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setBookedSlots(
            data.map((b) => ({
              start: b.start_time?.slice(0, 5) ?? '-',
              end: b.end_time?.slice(0, 5) ?? '-',
              customer: b.customer_name,
              status: b.status === 'confirmed' ? 'Dikonfirmasi' : 'Pending',
            }))
          )
        } else {
          setBookedSlots([])
        }
        setCheckingSlots(false)
      })
  }, [selectedProductId, bookingDate])

  // Auto-fill email from session & redirect if not logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setCustomerEmail(session.user.email)
      } else {
        // Redirect to login, then come back here
        router.push('/auth?redirect=/booking')
      }
    })
  }, [router])

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!customerName.trim() || !customerPhone.trim() || !selectedProductId || !bookingDate) {
      setError('Harap isi semua field yang wajib diisi.')
      return
    }

    setSubmitting(true)

    const productName = selectedProduct?.name ?? ''
    const priceUnit = selectedProduct?.price_unit ?? ''

    // ───── CEK KONFLIK BOOKING ─────
    const { data: existingBookings, error: conflictError } = await supabase
      .from('bookings')
      .select('id, start_time, end_time, customer_name, status')
      .eq('product_id', selectedProductId)
      .eq('booking_date', bookingDate)
      .in('status', ['pending', 'confirmed'])
      .order('start_time', { ascending: true })

    if (conflictError) {
      setError('Gagal mengecek jadwal. Silakan coba lagi.')
      setSubmitting(false)
      return
    }

    // Check time overlap if both new and existing have time ranges
    if (existingBookings && existingBookings.length > 0) {
      let conflict = false
      let conflictDetail = ''

      if (startTime && endTime) {
        // Cek overlap jam
        for (const booking of existingBookings) {
          if (booking.start_time && booking.end_time) {
            const newStart = startTime
            const newEnd = endTime
            const existStart = booking.start_time.slice(0, 5)
            const existEnd = booking.end_time.slice(0, 5)

            // Overlap: A.start < B.end AND A.end > B.start
            if (newStart < existEnd && newEnd > existStart) {
              conflict = true
              conflictDetail += `\n• ${booking.customer_name} (${existStart}-${existEnd}) — ${booking.status === 'confirmed' ? 'Dikonfirmasi' : 'Pending'}`
            }
          }
        }
      } else {
        // Booking tanpa jam — cukup tanggal sama berarti konflik
        conflict = true
        conflictDetail = ` (${existingBookings.length} booking lain pada tanggal ini)`
      }

      if (conflict) {
        setError(
          `⚠️ Jadwal sudah dibooking oleh orang lain di tanggal dan jam yang sama:${conflictDetail}\n\nSilakan pilih tanggal/jam lain.`
        )
        setSubmitting(false)
        return
      }
    }

    // ───── HITUNG TOTAL HARGA ─────
    // Calculate total price based on unit
    let totalPrice = selectedProduct?.price ?? null
    if (totalPrice != null && priceUnit === 'jam' && startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number)
      const [eh, em] = endTime.split(':').map(Number)
      const hours = Math.max(0, (eh + em / 60) - (sh + sm / 60))
      if (hours > 0) {
        totalPrice = Math.round(selectedProduct!.price * Math.ceil(hours))
      }
    }

    // ───── GENERATE BOOKING CODE ─────
    // Format: KM-XXXXXX (6 karakter alfanumerik)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // tanpa O,0,I,1
    let code = 'KM-'
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    const bookingCode = code

    const { data, error: insertError } = await supabase
      .from('bookings')
      .insert({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || null,
        product_id: selectedProductId,
        product_name: productName,
        booking_code: bookingCode,
        total_price: totalPrice,
        booking_date: bookingDate,
        start_time: startTime || null,
        end_time: endTime || null,
        notes: notes.trim() || null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError) {
      setError('Gagal mengirim booking. Silakan coba lagi.')
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    setSuccess(true)

    // Redirect to confirmation page after short delay
    setTimeout(() => {
      router.push(`/booking-confirmation/${data.id}`)
    }, 1500)
  }

  const whatsappMessage = selectedProduct
    ? `Halo Krisna Media! Saya ingin booking layanan: ${selectedProduct.name}`
    : 'Halo Krisna Media! Saya ingin melakukan booking.'

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-grid opacity-40 bg-noise" />
        <div className="absolute inset-0 bg-gradient-radial from-accent/5 via-background/80 to-background" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="animate-fade-in">
            <p className="inline-flex items-center gap-2 text-sm text-accent font-medium tracking-wider uppercase mb-4 border border-accent/20 rounded-full px-4 py-1.5 glass">
              <Calendar size={14} />
              Booking
            </p>
          </div>
          <h1 className="animate-fade-in delay-100 text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
            Booking Layanan
          </h1>
          <p className="animate-fade-in delay-200 text-muted text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Isi form di bawah untuk memesan layanan Krisna Media. Tim kami akan
            menghubungi Anda untuk konfirmasi.
          </p>
        </div>
      </section>

      <div className="section-divider mx-6 md:mx-12" />

      {/* ===== BOOKING FORM ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          {/* Success overlay */}
          {success ? (
            <div className="glass rounded-2xl p-12 border border-border text-center animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={36} className="text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Booking Berhasil Dikirim!
              </h2>
              <p className="text-muted text-sm mb-6">
                Mengalihkan ke halaman konfirmasi...
              </p>
              <div className="animate-pulse">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto animate-spin" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Back link */}
              <Link
                href="/services"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors group"
              >
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                Kembali ke Layanan
              </Link>

              {/* Error */}
              {error && (
                <div className="glass rounded-xl p-4 border border-red-500/30 bg-red-500/5">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Form card */}
              <div className="glass rounded-2xl p-8 md:p-10 border border-border space-y-6 animate-fade-in-up">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Data Pemesan
                </h2>

                {/* Nama */}
                <div>
                  <label
                    htmlFor="customerName"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    <User size={14} className="inline mr-1.5 -mt-0.5" />
                    Nama Lengkap <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    placeholder="Masukkan nama lengkap Anda"
                    className="w-full px-4 py-3 rounded-lg bg-[#171717] border border-[#262626] text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all duration-200"
                  />
                </div>

                {/* No. WhatsApp */}
                <div>
                  <label
                    htmlFor="customerPhone"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    <Phone size={14} className="inline mr-1.5 -mt-0.5" />
                    No. WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    placeholder="Contoh: 0811-519-1097"
                    className="w-full px-4 py-3 rounded-lg bg-[#171717] border border-[#262626] text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all duration-200"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="customerEmail"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    <Mail size={14} className="inline mr-1.5 -mt-0.5" />
                    Email <span className="text-muted-foreground text-xs">(opsional)</span>
                  </label>
                  <input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="contoh@email.com"
                    className="w-full px-4 py-3 rounded-lg bg-[#171717] border border-[#262626] text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Service & Schedule */}
              <div className="glass rounded-2xl p-8 md:p-10 border border-border space-y-6 animate-fade-in-up delay-100">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Layanan & Jadwal
                </h2>

                {/* Pilih Layanan */}
                <div>
                  <label
                    htmlFor="product"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    <Tag size={14} className="inline mr-1.5 -mt-0.5" />
                    Pilih Layanan <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="product"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-[#171717] border border-[#262626] text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all duration-200 appearance-none"
                  >
                    <option value="" disabled>
                      {loadingProducts ? 'Memuat layanan...' : 'Pilih Layanan...'}
                    </option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — {formatPrice(product.price)}/{product.price_unit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estimated price */}
                {selectedProduct && (
                  <div className="glass rounded-xl p-5 border border-accent/20 bg-accent/5 animate-scale-in">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Estimasi Harga
                    </p>
                    <span className="text-2xl font-bold text-foreground">
                      {formatPrice(selectedProduct.price)}
                    </span>
                    <span className="text-muted-foreground text-sm ml-1">
                      /{selectedProduct.price_unit}
                    </span>
                  </div>
                )}

                {/* Tanggal Acara */}
                <div>
                  <label
                    htmlFor="bookingDate"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    <Calendar size={14} className="inline mr-1.5 -mt-0.5" />
                    Tanggal Acara <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="bookingDate"
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-[#171717] border border-[#262626] text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all duration-200 [color-scheme:dark]"
                  />
                </div>

                {/* Time range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="startTime"
                      className="block text-sm font-medium text-foreground mb-1.5"
                    >
                      <Clock size={14} className="inline mr-1.5 -mt-0.5" />
                      Jam Mulai <span className="text-muted-foreground text-xs">(opsional)</span>
                    </label>
                    <input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-[#171717] border border-[#262626] text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all duration-200 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="endTime"
                      className="block text-sm font-medium text-foreground mb-1.5"
                    >
                      <Clock size={14} className="inline mr-1.5 -mt-0.5" />
                      Jam Selesai <span className="text-muted-foreground text-xs">(opsional)</span>
                    </label>
                    <input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-[#171717] border border-[#262626] text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all duration-200 [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Indikasi slot terpakai */}
                {bookedSlots.length > 0 && (
                  <div className="glass rounded-xl p-4 border border-amber-500/20 bg-amber-500/5 animate-scale-in">
                    <div className="flex items-start gap-3">
                      <Clock size={16} className="text-amber-400 mt-0.5 shrink-0" />
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-amber-300">
                          ⚠️ Jadwal sudah terisi di tanggal ini:
                        </p>
                        <div className="space-y-1">
                          {bookedSlots.map((slot, i) => (
                            <p key={i} className="text-xs text-muted-foreground">
                              {slot.start !== '-' && slot.end !== '-'
                                ? `${slot.start} - ${slot.end}`
                                : 'Full hari'} · {slot.customer} ({slot.status})
                            </p>
                          ))}
                        </div>
                        {checkingSlots && (
                          <p className="text-xs text-muted-foreground animate-pulse">Memeriksa...</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Catatan */}
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    <FileText size={14} className="inline mr-1.5 -mt-0.5" />
                    Catatan <span className="text-muted-foreground text-xs">(opsional)</span>
                  </label>
                  <textarea
                    id="notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tulis catatan tambahan, misalnya: alamat lokasi acara, permintaan khusus, dll."
                    className="w-full px-4 py-3 rounded-lg bg-[#171717] border border-[#262626] text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all duration-200 resize-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="animate-fade-in-up delay-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:bg-accent/50 disabled:cursor-not-allowed text-white font-medium px-8 py-4 rounded-lg transition-all duration-300 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 disabled:hover:transform-none disabled:hover:shadow-lg"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Kirim Booking
                    </>
                  )}
                </button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Data Anda akan dikirim dengan aman. Kami akan menghubungi Anda
                  melalui WhatsApp untuk konfirmasi booking.
                </p>
              </div>
            </form>
          )}

          {/* WhatsApp alternative */}
          {!success && (
            <div className="mt-12 text-center animate-fade-in-up delay-300">
              <div className="section-divider mb-8" />
              <p className="text-sm text-muted mb-4">
                Atau booking langsung via WhatsApp
              </p>
              <a
                href={getWhatsAppUrl('628115191097', whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-border hover:border-muted-foreground text-foreground font-medium px-6 py-3 rounded-lg transition-all duration-300 hover:-translate-y-0.5 glass"
              >
                <MessageCircle size={18} />
                Booking via WhatsApp
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted">Memuat...</div>
      </div>
    }>
      <BookingForm />
    </Suspense>
  )
}
