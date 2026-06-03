import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, Headphones, Lightbulb, Music, Package, Calendar, MessageCircle, ImageIcon, Star } from 'lucide-react'
import { cn, formatPrice, getWhatsAppUrl, categoryLabels } from '@/lib/utils'
import type { Product } from '@/lib/types'

const categoryIcons: Record<string, React.ReactNode> = {
  sound: <Headphones size={20} />,
  lighting: <Lightbulb size={20} />,
  studio: <Music size={20} />,
  'senar-gitar': <Package size={20} />,
  'kursus-musik': <Star size={20} />,
}

const categoryColors: Record<string, string> = {
  sound: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  lighting: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  studio: 'bg-green-500/10 text-green-400 border-green-500/20',
  'senar-gitar': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'kursus-musik': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
}

async function getProductBySlug(slug: string): Promise<Product | null> {
  const sb = await createSupabaseServer()
  const { data } = await sb
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  return data
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  // Redirect kursus-musik to KMC registration
  if (product.category === 'kursus-musik') {
    redirect('/kmc/register')
  }

  const whatsappMessage = `Halo Krisna Media! Saya tertarik dengan produk: ${product.name}. Bisakah saya mendapatkan informasi lebih lanjut?`

  return (
    <>
        <div className="fixed top-0 right-0 w-1/2 h-1/2 bg-accent/5 blur-[120px] rounded-full pointer-events-none z-0" />
        <div className="fixed bottom-0 left-0 w-1/3 h-1/3 bg-accent/3 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* ===== BACK NAV ===== */}
      <section className="relative pt-32 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-grid opacity-40 bg-noise" />
        <div className="absolute inset-0 bg-gradient-radial from-accent/8 via-background/90 to-background" />

        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors mb-8 group"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Kembali ke Layanan
          </Link>
        </div>
      </section>

      {/* ===== PRODUCT DETAIL ===== */}
      <section className="pb-20 md:pb-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Image placeholder */}
            <div className="animate-fade-in">
              <div className="glass rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center border border-border">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <ImageIcon size={48} />
                    <span className="text-sm">Belum ada gambar</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="animate-fade-in-up delay-100 flex flex-col">
              {/* Category badge */}
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border w-fit mb-4',
                  categoryColors[product.category] ?? ''
                )}
              >
                {categoryIcons[product.category] ?? null}
                {categoryLabels[product.category]?.id ?? product.category}
              </span>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                {product.name}
              </h1>

              {/* Description */}
              {product.description && (
                <div className="text-muted text-base leading-relaxed mb-6 whitespace-pre-line">
                  {product.description}
                </div>
              )}

              {/* Price */}
              <div className="glass rounded-xl p-5 border border-border mb-8">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Harga
                </p>
                <span className="text-3xl font-bold text-foreground">
                  {formatPrice(product.price)}
                </span>
                <span className="text-muted-foreground text-base ml-1">
                  /{product.price_unit}
                </span>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                <Link
                  href={`/booking?product=${product.slug}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-6 py-3.5 rounded-lg transition-all duration-300 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5"
                >
                  <Calendar size={18} />
                  Booking Sekarang
                  <ArrowRight size={18} />
                </Link>
                <a
                  href={getWhatsAppUrl('628115191097', whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 border border-border hover:border-muted-foreground text-foreground font-medium px-6 py-3.5 rounded-lg transition-all duration-300 hover:-translate-y-0.5 glass"
                >
                  <MessageCircle size={18} />
                  Hubungi via WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
