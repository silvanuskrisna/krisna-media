import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Star, ArrowRight, ChevronRight, Sparkles, ShieldCheck, Headphones, Lightbulb, Music, Calendar, Clock, Package } from 'lucide-react'
import { cn, formatPrice, getWhatsAppUrl, formatDate, categoryLabels, statusColors } from '@/lib/utils'
import type { Product, Testimonial, Booking } from '@/lib/types'

interface SiteSettings {
  whatsapp: string
}

async function getFeaturedProducts(): Promise<Product[]> {
  const sb = await createSupabaseServer()
  const { data } = await sb
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('featured', true)
    .order('sort_order', { ascending: true })
    .limit(6)

  return data ?? []
}

async function getTestimonials(): Promise<Testimonial[]> {
  const sb = await createSupabaseServer()
  const { data } = await sb
    .from('testimonials')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(3)

  return data ?? []
}

async function getSiteSettings(): Promise<SiteSettings> {
  const sb = await createSupabaseServer()
  const { data } = await sb
    .from('site_settings')
    .select('value')
    .eq('key', 'whatsapp')
    .single()

  const whatsapp = (data?.value as string) ?? '+628115191097'
  return { whatsapp }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={cn(
            i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted'
          )}
        />
      ))}
    </div>
  )
}

// ───────── Member Dashboard Component ─────────
async function MemberDashboard() {
  const sb = await createSupabaseServer()
  const { data: { session } } = await sb.auth.getSession()
  const userEmail = session?.user?.email ?? ''

  const { data: bookings } = await sb
    .from('bookings')
    .select('*')
    .eq('customer_email', userEmail)
    .order('created_at', { ascending: false })

  const bookingList: Booking[] = bookings ?? []

  return (
    <div className="min-h-screen bg-background pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-10">
          <div className="animate-fade-in">
            <p className="inline-flex items-center gap-2 text-sm text-accent font-medium tracking-wider uppercase mb-3 border border-accent/20 rounded-full px-4 py-1.5 glass">
              Dashboard Member
            </p>
          </div>
          <h1 className="animate-fade-in delay-100 text-3xl md:text-4xl font-bold text-foreground">
            Halo, <span className="text-accent">{session?.user?.user_metadata?.full_name ?? userEmail.split('@')[0]}</span> 👋
          </h1>
          <p className="animate-fade-in delay-200 text-muted-foreground mt-2">
            {bookingList.length > 0
              ? `Kamu memiliki ${bookingList.length} pesanan`
              : 'Kamu belum memiliki pesanan'}
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 animate-fade-in-up delay-300">
          <Link
            href="/booking"
            className="glass rounded-xl p-5 hover-card flex items-center gap-4 border border-border/50 hover:border-accent/30 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent/20 transition-colors shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Booking Baru</p>
              <p className="text-xs text-muted-foreground">Pesan layanan sekarang</p>
            </div>
          </Link>
          <Link
            href="/services"
            className="glass rounded-xl p-5 hover-card flex items-center gap-4 border border-border/50 hover:border-accent/30 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent/20 transition-colors shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Layanan</p>
              <p className="text-xs text-muted-foreground">Lihat katalog lengkap</p>
            </div>
          </Link>
          <Link
            href="/contact"
            className="glass rounded-xl p-5 hover-card flex items-center gap-4 border border-border/50 hover:border-accent/30 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent/20 transition-colors shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Hubungi Kami</p>
              <p className="text-xs text-muted-foreground">Butuh bantuan?</p>
            </div>
          </Link>
        </div>

        {/* Bookings list */}
        <h2 className="animate-fade-in-up delay-400 text-xl font-semibold text-foreground mb-4">
          Pesanan Saya
        </h2>

        {bookingList.length === 0 ? (
          <div className="animate-fade-in-up delay-500 glass rounded-xl p-12 text-center border border-border/50">
            <Package size={48} className="mx-auto mb-4 opacity-40 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">Belum ada pesanan</h3>
            <p className="text-muted-foreground mb-6">
              Yuk, booking layanan pertama kamu sekarang!
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-6 py-3 rounded-lg transition-all"
            >
              Booking Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in-up delay-500">
            {bookingList.map((booking) => (
              <Link
                key={booking.id}
                href={`/booking-confirmation/${booking.id}`}
                className="glass rounded-xl p-5 flex items-center justify-between hover:border-accent/20 transition-all group border border-border/50"
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

// ───────── Landing Page (guest) Component ─────────
async function LandingPage() {
  const [products, testimonials, settings] = await Promise.all([
    getFeaturedProducts(),
    getTestimonials(),
    getSiteSettings(),
  ])

  const stats = [
    { number: '50+', label: 'Proyek Selesai' },
    { number: '30+', label: 'Klien Puas' },
    { number: '5+', label: 'Tahun Berpengalaman' },
  ]

  const whatsappUrl = getWhatsAppUrl(
    settings.whatsapp,
    'Halo Krisna Media! Saya tertarik dengan layanan Anda. Bisakah saya mendapatkan informasi lebih lanjut?'
  )

  const categoryIcons: Record<string, React.ReactNode> = {
    sound: <Headphones size={20} />,
    lighting: <Lightbulb size={20} />,
    studio: <Music size={20} />,
    'senar-gitar': <Music size={20} />,
  }

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Mesh + noise background */}
        <div className="absolute inset-0 bg-mesh-grid opacity-40 bg-noise" />

        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-radial from-accent/8 via-background/90 to-background" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-accent/3 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[80vh]">

            {/* LEFT COLUMN — Text */}
            <div className="lg:col-span-7 space-y-8">
              <div className="animate-fade-in">
                <span className="inline-flex items-center gap-2 text-xs text-accent font-semibold tracking-widest uppercase border border-accent/20 rounded-full px-4 py-1.5 glass">
                  <Sparkles size={12} />
                  Solusi Audio & Lighting Profesional
                </span>
              </div>

              <h1 className="animate-fade-in delay-100 text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.08]">
                Krisna{' '}
                <span className="text-accent">Media</span>
              </h1>

              <p className="animate-fade-in delay-200 text-base md:text-lg text-muted max-w-xl leading-relaxed">
                Penyedia layanan <span className="text-foreground font-medium">Sound System</span>,{' '}
                <span className="text-foreground font-medium">Lighting</span>,{' '}
                <span className="text-foreground font-medium">Studio Musik</span>, dan{' '}
                <span className="text-foreground font-medium">Perlengkapan Gitar</span>
                {' '}di Banjarmasin. Siap membantu acara Anda sukses.
              </p>

              <div className="animate-fade-in delay-300 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-7 py-3 rounded-lg transition-all duration-300 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 text-sm"
                >
                  Jelajahi Layanan
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center gap-2 border border-border hover:border-accent/50 text-foreground font-medium px-7 py-3 rounded-lg transition-all duration-300 hover:-translate-y-0.5 text-sm glass"
                >
                  Booking Sekarang
                </Link>
              </div>

              {/* Mini stats inline */}
              <div className="animate-fade-in delay-400 flex gap-8 pt-6 border-t border-border/60">
                <div>
                  <span className="text-xl font-bold text-accent">50+</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Proyek</p>
                </div>
                <div>
                  <span className="text-xl font-bold text-accent">30+</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Klien</p>
                </div>
                <div>
                  <span className="text-xl font-bold text-accent">5+</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Tahun</p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN — Service Cards Stack */}
            <div className="lg:col-span-5 animate-fade-in delay-200">
              <div className="relative flex flex-col gap-4">
                {[
                  { icon: Headphones, label: 'Sound System', desc: 'Speaker, mixer, mic untuk acara Anda', color: 'from-orange-500/20 to-orange-600/5' },
                  { icon: Lightbulb, label: 'Lighting', desc: 'PAR LED, moving head, efek panggung', color: 'from-amber-500/20 to-amber-600/5' },
                  { icon: Music, label: 'Studio Musik', desc: 'Rekaman & latihan dengan alat lengkap', color: 'from-yellow-500/20 to-yellow-600/5' },
                  { icon: Sparkles, label: 'Perlengkapan', desc: 'Senar gitar & aksesoris musik', color: 'from-orange-400/20 to-orange-500/5' },
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className="glass rounded-xl p-4 flex items-center gap-4 border border-border/50 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/15 hover:-translate-x-1 transition-all duration-300"
                      style={{ animationDelay: `${300 + i * 100}ms` }}
                    >
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0`}>
                        <Icon size={22} className="text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ===== STATS BAR ===== */}
      <div className="section-divider mx-6 md:mx-12" />

      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  'flex flex-col items-center text-center animate-fade-in-up',
                  i === 0 && 'delay-100',
                  i === 1 && 'delay-200',
                  i === 2 && 'delay-300'
                )}
              >
                <span className="text-4xl md:text-5xl font-bold text-accent mb-2">
                  {stat.number}
                </span>
                <span className="text-muted text-sm md:text-base font-medium">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider mx-6 md:mx-12" />

      {/* ===== FEATURED SERVICES ===== */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section header */}
          <div className="text-center mb-16 animate-fade-in">
            <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">
              Layanan
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Layanan Kami
            </h2>
            <p className="text-muted max-w-xl mx-auto text-base md:text-lg">
              Dari sound system hingga studio musik, kami menyediakan solusi
              lengkap untuk kebutuhan acara dan peralatan musik Anda.
            </p>
          </div>

          {/* Products grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, i) => (
                <div
                  key={product.id}
                  className={cn(
                    'glass rounded-xl p-6 hover-card flex flex-col animate-fade-in-up',
                    i === 0 && 'delay-100',
                    i === 1 && 'delay-200',
                    i === 2 && 'delay-300',
                    i === 3 && 'delay-100',
                    i === 4 && 'delay-200',
                    i === 5 && 'delay-300'
                  )}
                >
                  {/* Category badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent bg-accent/10 px-3 py-1.5 rounded-full">
                      {categoryIcons[product.category] ?? null}
                      {categoryLabels[product.category]?.id ?? product.category}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {product.name}
                  </h3>

                  {/* Description */}
                  <p className="text-muted text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                    {product.description ?? 'Tidak ada deskripsi'}
                  </p>

                  {/* Price */}
                  <div className="mb-5">
                    <span className="text-xl font-bold text-foreground">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-muted-foreground text-sm ml-1">
                      /{product.price_unit}
                    </span>
                  </div>

                  {/* CTA */}
                  <Link
                    href="/booking"
                    className="inline-flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-300"
                  >
                    Booking Sekarang
                    <ChevronRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted text-lg">
                Belum ada layanan unggulan saat ini.
              </p>
            </div>
          )}

          {/* View all link */}
          <div className="text-center mt-12 animate-fade-in delay-500">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-accent hover:text-accent-hover font-medium transition-colors group"
            >
              Lihat Semua Layanan
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS PREVIEW ===== */}
      <div className="section-divider mx-6 md:mx-12" />

      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          {/* Section header */}
          <div className="text-center mb-16 animate-fade-in">
            <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">
              Testimoni
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Apa Kata Klien
            </h2>
            <p className="text-muted max-w-xl mx-auto text-base md:text-lg">
              Kepercayaan dan kepuasan klien adalah prioritas utama kami.
            </p>
          </div>

          {/* Testimonials */}
          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <div
                  key={testimonial.id}
                  className={cn(
                    'glass rounded-xl p-6 hover-card animate-fade-in-up',
                    i === 0 && 'delay-100',
                    i === 1 && 'delay-200',
                    i === 2 && 'delay-300'
                  )}
                >
                  {/* Rating */}
                  <div className="mb-4">
                    <StarRating rating={testimonial.rating} />
                  </div>

                  {/* Quote */}
                  <blockquote className="text-muted text-sm leading-relaxed mb-5 italic">
                    &ldquo;{testimonial.content}&rdquo;
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                    <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
                      {testimonial.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-foreground text-sm font-medium">
                      {testimonial.customer_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted text-lg">
                Belum ada testimoni saat ini.
              </p>
            </div>
          )}

          {/* View all link */}
          <div className="text-center mt-12 animate-fade-in delay-500">
            <Link
              href="/testimonials"
              className="inline-flex items-center gap-2 text-accent hover:text-accent-hover font-medium transition-colors group"
            >
              Lihat Semua Testimoni
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <div className="section-divider mx-6 md:mx-12" />

      <section className="py-20 md:py-28 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-accent/10" />
        <div className="absolute inset-0 bg-mesh-grid opacity-30 bg-noise" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="animate-fade-in">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Siap untuk acara Anda?
            </h2>
            <p className="text-muted text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Konsultasikan kebutuhan sound, lighting, studio, atau alat musik
              Anda bersama tim profesional kami. Gratis!
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-8 py-4 rounded-lg transition-all duration-300 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 text-base"
            >
              <ShieldCheck size={20} />
              Hubungi Kami via WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

// ───────── Main HomePage — routes by auth state ─────────
export default async function HomePage() {
  const sb = await createSupabaseServer()
  const { data: { session } } = await sb.auth.getSession()

  if (session?.user) {
    const { data: profile } = await sb
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const role = profile?.role

    // Admin → redirect to admin panel
    if (role === 'admin' || role === 'superadmin') {
      redirect('/admin')
    }

    // Member → show dashboard
    if (role === 'member') {
      return <MemberDashboard />
    }
  }

  // Not logged in → landing page
  return <LandingPage />
}
