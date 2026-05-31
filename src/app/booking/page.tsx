'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, ArrowLeft, Send, CheckCircle, User, Phone, Mail, MessageCircle, FileText, Tag, Banknote, Wallet, Upload } from 'lucide-react'
import { cn, formatPrice, getWhatsAppUrl } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Product, Promo, HappyHourSettings } from '@/lib/types'

function BookingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productSlug = searchParams.get('product')

  const [products, setProducts] = useState<Product[]>([])
  const [promos, setPromos] = useState<Promo[]>([])
  const [happyHour, setHappyHour] = useState<HappyHourSettings | null>(null)
  const [bankInfo, setBankInfo] = useState({ bank_name: '', bank_account: '', bank_holder: '' })
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
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash' | ''>('')
  const [selectedPromoId, setSelectedPromoId] = useState('')
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)

  // Calculate if happy hour applies
  const selectedProduct = products.find((p) => p.id === selectedProductId)
  const isStudio = selectedProduct?.category === 'studio'

  const isHappyHourActive = (() => {
    if (!happyHour?.enabled || !bookingDate || !startTime || !isStudio) return false
    const dayName = new Date(bookingDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    if (!happyHour.days.includes(dayName)) return false
    return startTime >= happyHour.start_time && startTime < happyHour.end_time
  })()

  // Calculate price
  const calculatedPrice = (() => {
    if (!selectedProduct) return null
    const basePrice = selectedProduct.price
    const unit = selectedProduct.price_unit

    // Happy Hour pricing for studio products
    if (isHappyHourActive) {
      if (unit === 'paket' && (selectedProduct.slug === 'rental-studio-paket-2' || selectedProduct.name.includes('2 Jam'))) {
        return happyHour!.price_2hour
      }
      if (unit === 'jam') {
        // For per-jam studio during HH
        const hours = startTime && endTime
          ? Math.max(0, (parseInt(endTime.split(':')[0]) + parseInt(endTime.split(':')[1]) / 60) -
              (parseInt(startTime.split(':')[0]) + parseInt(startTime.split(':')[1]) / 60))
          : 1
        if (hours <= 1) return happyHour!.price_1hour
        // 2+ hours during HH: cap at price_2hour
        return happyHour!.price_2hour
      }
    }

    // Promo pricing (overrides everything)
    if (selectedPromoId && promos.length > 0) {
      const promo = promos.find(p => p.id === selectedPromoId)
      if (promo) return promo.price_per_2hour
    }

    // Normal pricing
    if (unit === 'jam' && startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number)
      const [eh, em] = endTime.split(':').map(Number)
      const hours = Math.max(0, (eh + em / 60) - (sh + sm / 60))
      if (hours > 0) return Math.round(basePrice * Math.ceil(hours))
    }

    return basePrice
  })()

  // Fetch products, promos, settings
  useEffect(() => {
    async function fetchData() {
      // Products
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      setProducts(productData ?? [])
      setLoadingProducts(false)

      // Pre-select product if slug param exists
      if (productSlug && productData) {
        const matched = productData.find((p) => p.slug === productSlug)
        if (matched) setSelectedProductId(matched.id)
      }

      // Promos
      const { data: promoData } = await supabase
        .from('promos')
        .select('*')
        .eq('is_active', true)
      if (promoData) setPromos(promoData)

      // Happy Hour settings (individual keys)
      const [hhEnabled, hhStart, hhEnd, hhPrice1h, hhPrice2h] = await Promise.all([
        supabase.from('site_settings').select('value').eq('key', 'happy_hour_enabled').single(),
        supabase.from('site_settings').select('value').eq('key', 'happy_hour_start_time').single(),
        supabase.from('site_settings').select('value').eq('key', 'happy_hour_end_time').single(),
        supabase.from('site_settings').select('value').eq('key', 'happy_hour_price_1hour').single(),
        supabase.from('site_settings').select('value').eq('key', 'happy_hour_price_2hour').single(),
      ])
      const enabled = (hhEnabled.data?.value as any)?.happy_hour_enabled === 'true'
      if (enabled) {
        setHappyHour({
          enabled: true,
          start_time: String((hhStart.data?.value as any)?.happy_hour_start_time ?? '14:00'),
          end_time: String((hhEnd.data?.value as any)?.happy_hour_end_time ?? '18:00'),
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          price_1hour: Number((hhPrice1h.data?.value as any)?.happy_hour_price_1hour ?? 60000),
          price_2hour: Number((hhPrice2h.data?.value as any)?.happy_hour_price_2hour ?? 100000),
        })
      } else {
        setHappyHour(null)
      }

      // Bank info
      const [bankNameR, bankAccR, bankHolderR] = await Promise.all([
        supabase.from('site_settings').select('value').eq('key', 'bank_name').single(),
        supabase.from('site_settings').select('value').eq('key', 'bank_account').single(),
        supabase.from('site_settings').select('value').eq('key', 'bank_holder').single(),
      ])
      setBankInfo({
        bank_name: (bankNameR.data?.value as any)?.bank_name ?? '',
        bank_account: (bankAccR.data?.value as any)?.bank_account ?? '',
        bank_holder: (bankHolderR.data?.value as any)?.bank_holder ?? '',
      })
    }

    fetchData()
  }, [productSlug])

  // Reset promo when HH status changes
  useEffect(() => {
    if (isHappyHourActive) setSelectedPromoId('')
  }, [isHappyHourActive])

  // Prevent loop when promo auto-sets product
  const promoAutoRef = useRef(false)

  // When promo is selected, auto-fill service to Paket 2 Jam
  useEffect(() => {
    if (selectedPromoId && products.length > 0) {
      const paket2 = products.find(p => p.slug === 'rental-studio-paket-2')
      if (paket2 && paket2.id !== selectedProductId) {
        promoAutoRef.current = true
        setSelectedProductId(paket2.id)
      }
    }
  }, [selectedPromoId, products])

  // Reset promo & payment when product changes (skip if auto-set by promo)
  useEffect(() => {
    if (promoAutoRef.current) {
      promoAutoRef.current = false
      return
    }
    setSelectedPromoId('')
    setPaymentMethod('')
  }, [selectedProductId])

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
        router.push('/auth?redirect=/booking')
      }
    })
  }, [router])

  // Filter promos that still have quota and are within date range
  const availablePromos = promos.filter(p => {
    if (p.used >= p.quota) return false
    if (isHappyHourActive) return false // HH already active, no promo
    if (p.start_date && bookingDate && bookingDate < p.start_date) return false
    if (p.end_date && bookingDate && bookingDate > p.end_date) return false
    return true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validasi
    if (!customerName.trim() || !customerPhone.trim() || !selectedProductId || !bookingDate) {
      setError('Harap isi semua field yang wajib diisi.')
      return
    }
    if (!paymentMethod) {
      setError('Pilih metode pembayaran terlebih dahulu.')
      return
    }
    if (paymentMethod === 'transfer' && !paymentProof) {
      setError('Upload bukti transfer untuk pembayaran via transfer.')
      return
    }
    if (isHappyHourActive && selectedPromoId) {
      setError('Promo tidak bisa digabung dengan Happy Hour.')
      return
    }

    setSubmitting(true)

    const productName = selectedProduct?.name ?? ''

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

    // Check time overlap
    if (existingBookings && existingBookings.length > 0) {
      let conflict = false
      let conflictDetail = ''

      if (startTime && endTime) {
        for (const booking of existingBookings) {
          if (booking.start_time && booking.end_time) {
            const newStart = startTime
            const newEnd = endTime
            const existStart = booking.start_time.slice(0, 5)
            const existEnd = booking.end_time.slice(0, 5)
            if (newStart < existEnd && newEnd > existStart) {
              conflict = true
              conflictDetail += `\n• ${booking.customer_name} (${existStart}-${existEnd}) — ${booking.status === 'confirmed' ? 'Dikonfirmasi' : 'Pending'}`
            }
          }
        }
      } else {
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

    // ───── UPLOAD BUKTI TRANSFER ─────
    let paymentProofUrl: string | null = null
    if (paymentMethod === 'transfer' && paymentProof) {
      setUploadingProof(true)
      const fileExt = paymentProof.name.split('.').pop()
      const filePath = `payment-proofs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, paymentProof)

      if (uploadError) {
        setError('Gagal mengupload bukti transfer. Pastikan file tidak lebih dari 5MB dan format jpg/png.')
        setSubmitting(false)
        setUploadingProof(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath)
      paymentProofUrl = publicUrl
      setUploadingProof(false)
    }

    // ───── HITUNG TOTAL HARGA ─────
    const totalPrice = calculatedPrice

    // ───── GENERATE BOOKING CODE ─────
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'KM-'
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    const bookingCode = code

    // Data booking
    const bookingData: any = {
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
      payment_method: paymentMethod,
      payment_proof: paymentProofUrl,
      notes: notes.trim() || null,
      status: paymentMethod === 'transfer' ? 'confirmed' : 'pending',
      promo_id: selectedPromoId || null,
      promo_name: selectedPromoId ? promos.find(p => p.id === selectedPromoId)?.name || null : null,
    }

    const { data, error: insertError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select('id')
      .single()

    if (insertError) {
      setError('Gagal mengirim booking. Silakan coba lagi.')
      setSubmitting(false)
      return
    }

    // ───── UPDATE PROMO QUOTA ─────
    if (selectedPromoId) {
      try {
        await supabase.rpc('increment_promo_used', { promo_id: selectedPromoId })
      } catch {
        // Fallback: increment used field directly
        const promo = promos.find(p => p.id === selectedPromoId)
        if (promo) {
          await supabase.from('promos').update({ used: promo.used + 1 }).eq('id', selectedPromoId)
        }
      }
    }

    setSubmitting(false)
    setSuccess(true)

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
            Isi form di bawah untuk memesan layanan Krisna Media.
          </p>
        </div>
      </section>

      <div className="section-divider mx-6 md:mx-12" />

      {/* ===== BOOKING FORM ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          {success ? (
            <div className="glass rounded-2xl p-12 border border-border text-center animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={36} className="text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Booking Berhasil!
              </h2>
              <p className="text-muted text-sm mb-6">
                {paymentMethod === 'transfer'
                  ? 'Pembayaran diterima, jadwal Anda sudah dikonfirmasi!'
                  : 'Silakan hubungi admin via WhatsApp untuk konfirmasi jadwal.'}
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
                  <p className="text-red-400 text-sm whitespace-pre-line">{error}</p>
                </div>
              )}

              {/* Promo — tampil di atas biar langsung kelihatan */}
              {availablePromos.length > 0 && !isHappyHourActive && (
                <div className="glass rounded-2xl p-8 md:p-10 border border-border space-y-4 animate-fade-in-up">
                  <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Tag size={18} />
                    Promo Tersedia 🎪
                  </h2>
                  <div className="space-y-3">
                    {availablePromos.map(promo => (
                      <label
                        key={promo.id}
                        className={`block p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          selectedPromoId === promo.id
                            ? 'border-purple-500/50 bg-purple-500/10'
                            : 'border-border hover:border-muted-foreground/30 bg-[#171717]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="promo"
                            value={promo.id}
                            checked={selectedPromoId === promo.id}
                            onChange={() => {
                              setSelectedPromoId(promo.id)
                            }}
                            className="accent-purple-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{promo.name}</p>
                            {promo.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{promo.description}</p>
                            )}
                            <p className="text-xs text-purple-400 mt-1">
                              {formatPrice(promo.price_per_2hour)} / 2 jam · Sisa {promo.quota - promo.used} slot
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Form card — Data Pemesan */}
              <div className="glass rounded-2xl p-8 md:p-10 border border-border space-y-6 animate-fade-in-up">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Data Pemesan
                </h2>

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
                    disabled={!!selectedPromoId}
                    required
                    className={`w-full px-4 py-3 rounded-lg bg-[#171717] text-white placeholder:text-muted-foreground text-sm focus:outline-none transition-all duration-200 appearance-none ${
                      selectedPromoId
                        ? 'border border-purple-500/30 opacity-70 cursor-not-allowed'
                        : 'border border-[#262626] focus:border-accent/50 focus:ring-1 focus:ring-accent/30'
                    }`}
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
                  {selectedPromoId && (
                    <p className="text-xs text-purple-400 mt-1.5">
                      ✅ Layanan otomatis: Rental Studio (Paket 2 Jam) — sesuai promo aktif 🎪
                    </p>
                  )}
                </div>

                {/* Harga — HH / Normal / Promo */}
                {selectedProduct && calculatedPrice != null && (
                  <div className={`glass rounded-xl p-5 border animate-scale-in ${
                    isHappyHourActive
                      ? 'border-green-500/30 bg-green-500/10'
                      : selectedPromoId
                        ? 'border-purple-500/30 bg-purple-500/10'
                        : 'border-accent/20 bg-accent/5'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Total Harga
                        </p>
                        <span className="text-2xl font-bold text-foreground">
                          {formatPrice(calculatedPrice)}
                        </span>
                      </div>
                      <div className="text-right">
                        {isHappyHourActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                            🎯 Happy Hour
                          </span>
                        )}
                        {selectedPromoId && !isHappyHourActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                            🎪 Promo
                          </span>
                        )}
                      </div>
                    </div>
                    {isHappyHourActive && (
                      <p className="text-xs text-green-400/70 mt-2">
                        Diskon Happy Hour weekdays! Harga spesial untuk kamu 🎉
                      </p>
                    )}
                  </div>
                )}

                {/* HH info bar when applicable but not yet HH hours */}
                {happyHour?.enabled && isStudio && bookingDate && startTime && !isHappyHourActive && (
                  <div className="glass rounded-xl p-4 border border-amber-500/20 bg-amber-500/5 animate-scale-in">
                    <p className="text-xs text-amber-300">
                      💡 Happy Hour tersedia weekdays jam {happyHour.start_time}-{happyHour.end_time} — 1 jam Rp{formatPrice(happyHour.price_1hour).replace('Rp', '')}, 2 jam Rp{formatPrice(happyHour.price_2hour).replace('Rp', '')}
                    </p>
                  </div>
                )}

                {/* Tanggal */}
                <div>
                  <label
                    htmlFor="bookingDate"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    <Calendar size={14} className="inline mr-1.5 -mt-0.5" />
                    Tanggal <span className="text-red-400">*</span>
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

                {/* Slots terisi */}
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
                    placeholder="Tulis catatan tambahan, misalnya: permintaan khusus, dll."
                    className="w-full px-4 py-3 rounded-lg bg-[#171717] border border-[#262626] text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all duration-200 resize-none"
                  />
                </div>
              </div>

              {/* Promo — dipindah ke atas (sebelum Data Pemesan) */}

              {/* Pembayaran */}
              <div className="glass rounded-2xl p-8 md:p-10 border border-border space-y-6 animate-fade-in-up delay-200">
                <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Wallet size={18} />
                  Pembayaran
                </h2>

                {/* Pilih metode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-5 rounded-xl border text-left transition-all duration-200 ${
                      paymentMethod === 'transfer'
                        ? 'border-accent/50 bg-accent/10'
                        : 'border-border hover:border-muted-foreground/30 bg-[#171717]'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'transfer' ? 'border-accent' : 'border-muted-foreground'
                      }`}>
                        {paymentMethod === 'transfer' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                        )}
                      </div>
                      <Banknote size={20} className="text-accent" />
                      <span className="font-medium text-foreground">Transfer Bank</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-10">
                      ✓ Bayar dulu, jadwal langsung terkunci
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-5 rounded-xl border text-left transition-all duration-200 ${
                      paymentMethod === 'cash'
                        ? 'border-amber-500/50 bg-amber-500/10'
                        : 'border-border hover:border-muted-foreground/30 bg-[#171717]'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'cash' ? 'border-amber-500' : 'border-muted-foreground'
                      }`}>
                        {paymentMethod === 'cash' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        )}
                      </div>
                      <MessageCircle size={20} className="text-amber-400" />
                      <span className="font-medium text-foreground">Bayar Langsung</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-10">
                      Booking dulu, bayar pas datang & hubungi admin
                    </p>
                  </button>
                </div>

                {/* Detail Transfer */}
                {paymentMethod === 'transfer' && bankInfo.bank_name && (
                  <div className="glass rounded-xl p-5 border border-accent/20 bg-accent/5 animate-scale-in">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Transfer ke:</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        Bank: <span className="text-foreground font-medium">{bankInfo.bank_name}</span>
                      </p>
                      <p className="text-muted-foreground">
                        No. Rekening: <span className="text-foreground font-medium">{bankInfo.bank_account}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Atas Nama: <span className="text-foreground font-medium">{bankInfo.bank_holder}</span>
                      </p>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Upload bukti transfer:</p>
                      <label className="block">
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed cursor-pointer ${
                          paymentProof ? 'border-green-500/50 bg-green-500/5' : 'border-[#262626] bg-[#171717] hover:border-accent/50'
                        }`}>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            className="hidden"
                            onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                          />
                          {paymentProof ? (
                            <>
                              <CheckCircle size={18} className="text-green-400 shrink-0" />
                              <span className="text-xs text-green-400 truncate">{paymentProof.name}</span>
                            </>
                          ) : (
                            <>
                              <Upload size={18} className="text-muted-foreground shrink-0" />
                              <span className="text-xs text-muted-foreground">Klik untuk upload (jpg/png, max 5MB)</span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Detail Cash */}
                {paymentMethod === 'cash' && (
                  <div className="glass rounded-xl p-5 border border-amber-500/20 bg-amber-500/5 animate-scale-in">
                    <p className="text-sm text-muted-foreground">
                      Setelah booking, silakan hubungi admin via WhatsApp untuk konfirmasi jadwal.
                      Jadwal akan terkunci setelah admin mengkonfirmasi.
                    </p>
                    <a
                      href={getWhatsAppUrl('628115191097', `Halo Kak! Saya ${customerName || '...'} mau booking ${selectedProduct?.name || 'layanan'} pada ${bookingDate || '...'} jam ${startTime || '...'} - ${endTime || '...'}. Mohon dikonfirmasi ya 🙏`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 px-5 py-3 bg-green-600/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-600/30 transition-all duration-200"
                    >
                      <MessageCircle size={18} />
                      Hubungi Admin via WhatsApp
                    </a>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="animate-fade-in-up delay-300">
                <button
                  type="submit"
                  disabled={submitting || uploadingProof}
                  className="w-full inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:bg-accent/50 disabled:cursor-not-allowed text-white font-medium px-8 py-4 rounded-lg transition-all duration-300 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 disabled:hover:transform-none disabled:hover:shadow-lg"
                >
                  {submitting || uploadingProof ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {uploadingProof ? 'Mengupload...' : 'Mengirim...'}
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {paymentMethod === 'transfer' ? 'Booking & Bayar' : 'Kirim Booking'}
                    </>
                  )}
                </button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  {paymentMethod === 'transfer'
                    ? 'Setelah transfer, booking langsung dikonfirmasi dan jadwal otomatis terkunci.'
                    : 'Booking akan diproses setelah admin mengkonfirmasi via WhatsApp.'}
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
