import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import { Search, ArrowRight, Headphones, Lightbulb, Music, Package, Star } from 'lucide-react'
import { cn, formatPrice, categoryLabels } from '@/lib/utils'
import type { Product } from '@/lib/types'
import PromoBanner from '@/components/PromoBanner'

const categories = [
  { value: '', label: 'Semua' },
  { value: 'sound', label: 'Sound System' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'studio', label: 'Studio Musik' },
  { value: 'senar-gitar', label: 'Senar Gitar' },
]

const categoryColors: Record<string, string> = {
  sound: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  lighting: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  studio: 'bg-green-500/10 text-green-400 border-green-500/20',
  'senar-gitar': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'kursus-musik': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
}

const categoryIcons: Record<string, React.ReactNode> = {
  sound: <Headphones size={16} />,
  lighting: <Lightbulb size={16} />,
  studio: <Music size={16} />,
  'senar-gitar': <Package size={16} />,
  'kursus-musik': <Star size={16} />,
}

async function getProducts(): Promise<Product[]> {
  const sb = await createSupabaseServer()
  const { data } = await sb
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return data ?? []
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  const params = await searchParams
  const allProducts = await getProducts()

  const activeCategory = params.category ?? ''
  const searchQuery = params.search?.toLowerCase() ?? ''

  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory = !activeCategory || product.category === activeCategory
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery) ||
      (product.description ?? '').toLowerCase().includes(searchQuery)
    return matchesCategory && matchesSearch
  })

  return (
    <>
        <div className="fixed top-0 right-0 w-1/2 h-1/2 bg-accent/5 blur-[120px] rounded-full pointer-events-none z-0" />
        <div className="fixed bottom-0 left-0 w-1/3 h-1/3 bg-accent/3 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-28 pb-16 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-grid opacity-40 bg-noise" />
        <div className="absolute inset-0 bg-gradient-radial from-accent/8 via-background/90 to-background" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="animate-fade-in">
            <p className="inline-flex items-center gap-2 text-sm text-accent font-medium tracking-wider uppercase mb-4 border border-accent/20 rounded-full px-4 py-1.5 glass">
              <Package size={14} />
              Katalog Produk
            </p>
          </div>
          <h1 className="animate-fade-in delay-100 text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
            Layanan &amp; Produk
          </h1>
          <p className="animate-fade-in delay-200 text-muted text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Temukan berbagai layanan dan produk berkualitas dari Krisna Media
            — sound system, lighting, studio musik, dan senar gitar.
          </p>
        </div>
      </section>

      {/* ===== FILTERS ===== */}
      <section className="pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Category filters */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8 animate-fade-in-up delay-200">
            {categories.map((cat) => {
              const href = cat.value
                ? `/services?category=${cat.value}${searchQuery ? `&search=${params.search}` : ''}`
                : `/services${searchQuery ? `?search=${params.search}` : ''}`
              const isActive = activeCategory === cat.value

              return (
                <Link
                  key={cat.value}
                  href={href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border',
                    isActive
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/25'
                      : 'glass text-muted-foreground hover:text-foreground border-border hover:border-muted-foreground'
                  )}
                >
                  {cat.label}
                </Link>
              )
            })}
          </div>

          {/* Search */}
          <form
            action="/services"
            method="GET"
            className="max-w-md mx-auto animate-fade-in-up delay-300"
          >
            {activeCategory && (
              <input type="hidden" name="category" value={activeCategory} />
            )}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Cari layanan atau produk..."
                className="w-full pl-11 pr-4 py-3 rounded-lg glass text-foreground placeholder:text-muted-foreground text-sm border border-border focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all duration-200"
              />
            </div>
          </form>
        </div>
      </section>

      <div className="section-divider mx-6 md:mx-12" />

      <PromoBanner />

      {/* ===== PRODUCTS GRID ===== */}
      <section className="py-12 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          {/* KMC Special Card */}
          {!activeCategory && !searchQuery && (
            <div className="mb-8 animate-fade-in-up">
              <div className="glass rounded-xl p-6 border border-pink-500/30 bg-pink-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-[60px] rounded-full pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center text-3xl shrink-0">
                    🎵
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-pink-400 bg-pink-500/10 px-3 py-1.5 rounded-full border border-pink-500/20">
                        <Star size={12} />
                        Kursus Musik
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Krisna Music Course — Belajar Gitar, Piano & Drum
                    </h3>
                    <p className="text-muted text-sm leading-relaxed mb-4">
                      Kursus musik profesional untuk semua usia. Dari pemula hingga mahir, 
                      kami bimbing perjalanan musikal kamu dengan kurikulum terstruktur dan pengajar berpengalaman.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-foreground bg-card px-3 py-1.5 rounded-full border border-border">
                        🎸 Gitar
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-foreground bg-card px-3 py-1.5 rounded-full border border-border">
                        🎹 Piano
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-foreground bg-card px-3 py-1.5 rounded-full border border-border">
                        🥁 Drum
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link
                      href="/kmc/register"
                      className="inline-flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-300 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:-translate-y-0.5 text-sm"
                    >
                      <Star size={16} />
                      Daftar Sekarang
                    </Link>
                    <Link
                      href="/my-kmc-lessons"
                      className="inline-flex items-center justify-center gap-2 bg-card hover:bg-card/80 text-foreground font-medium px-6 py-3 rounded-lg transition-all duration-300 border border-border text-sm"
                    >
                      Lihat Status
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product, i) => {
                const truncatedDesc =
                  product.description && product.description.length > 100
                    ? product.description.slice(0, 100) + '...'
                    : product.description ?? 'Tidak ada deskripsi'

                const whatsappMessage = `Halo Krisna Media! Saya ingin menanyakan ketersediaan produk: ${product.name}`

                return (
                  <div
                    key={product.id}
                    className={cn(
                      'glass rounded-xl p-6 hover-card flex flex-col animate-fade-in-up',
                      i % 3 === 0 && 'delay-100',
                      i % 3 === 1 && 'delay-200',
                      i % 3 === 2 && 'delay-300'
                    )}
                  >
                    {/* Category badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border',
                          categoryColors[product.category] ?? ''
                        )}
                      >
                        {categoryIcons[product.category] ?? null}
                        {categoryLabels[product.category]?.id ?? product.category}
                      </span>
                    </div>

                    {/* Name */}
                    <Link href={`/services/${product.slug}`} className="group">
                      <h3 className="text-lg font-semibold text-foreground mb-2 transition-colors group-hover:text-accent">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Description */}
                    <p className="text-muted text-sm leading-relaxed mb-4 flex-1">
                      {truncatedDesc}
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

                    {/* CTA buttons */}
                    {product.category === 'kursus-musik' ? (
                      <Link
                        href="/kmc/register"
                        className="inline-flex items-center justify-center gap-2 w-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-300"
                      >
                        <Star size={16} />
                        Daftar Kursus
                        <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <Link
                        href={`/booking?product=${product.slug}`}
                        className="inline-flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-300"
                      >
                        Booking Sekarang
                        <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-20 animate-fade-in">
              <Package size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Layanan tidak ditemukan
              </h3>
              <p className="text-muted text-sm max-w-md mx-auto mb-8">
                Tidak ada layanan atau produk yang cocok dengan kategori atau
                kata kunci yang Anda cari. Silakan coba kata kunci lain atau
                reset filter.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 text-accent hover:text-accent-hover font-medium transition-colors"
              >
                Reset Filter
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
