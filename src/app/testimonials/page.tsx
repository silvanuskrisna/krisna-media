import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import { Star, Quote, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { Testimonial } from '@/lib/types'
import TestimonialForm from '@/components/testimonials/TestimonialForm'

async function getTestimonials(): Promise<Testimonial[]> {
  const sb = await createSupabaseServer()
  const { data } = await sb
    .from('testimonials')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return data ?? []
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          className={cn(
            i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted'
          )}
        />
      ))}
    </div>
  )
}

export const dynamic = 'force-dynamic'

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials()

  return (
    <>
        <div className="fixed top-0 right-0 w-1/2 h-1/2 bg-accent/5 blur-[120px] rounded-full pointer-events-none z-0" />
        <div className="fixed bottom-0 left-0 w-1/3 h-1/3 bg-accent/3 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-grid opacity-40 bg-noise" />
        <div className="absolute inset-0 bg-gradient-radial from-accent/8 via-background/90 to-background" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="animate-fade-in">
            <p className="inline-flex items-center gap-2 text-sm text-accent font-medium tracking-wider uppercase mb-4 border border-accent/20 rounded-full px-4 py-1.5 glass">
              <Star size={14} />
              Testimoni
            </p>
          </div>
          <h1 className="animate-fade-in delay-100 text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
            Testimoni
          </h1>
          <p className="animate-fade-in delay-200 text-muted text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Apa kata mereka tentang Krisna Media
          </p>
        </div>
      </section>

      <div className="section-divider mx-6 md:mx-12" />

      {/* ===== TESTIMONIALS GRID ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <div
                  key={testimonial.id}
                  className={cn(
                    'glass rounded-xl p-7 hover-card animate-fade-in-up flex flex-col',
                    i % 3 === 0 && 'delay-100',
                    i % 3 === 1 && 'delay-200',
                    i % 3 === 2 && 'delay-300'
                  )}
                >
                  {/* Quote icon */}
                  <div className="mb-4">
                    <Quote size={24} className="text-accent/30" />
                  </div>

                  {/* Rating */}
                  <div className="mb-4">
                    <StarRating rating={testimonial.rating} />
                  </div>

                  {/* Content */}
                  <blockquote className="text-muted text-sm leading-relaxed mb-5 flex-1 italic">
                    &ldquo;{testimonial.content}&rdquo;
                  </blockquote>

                  {/* Author & Date */}
                  <div className="pt-5 border-t border-border/60 mt-auto">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
                          {testimonial.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-foreground text-sm font-semibold">
                            {testimonial.customer_name}
                          </p>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            {formatDate(testimonial.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 animate-fade-in">
              <Quote size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Belum Ada Testimoni
              </h3>
              <p className="text-muted text-sm max-w-md mx-auto mb-8">
                Belum ada testimoni dari klien saat ini. Testimoni akan muncul
                di sini setelah klien memberikan ulasan.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-accent hover:text-accent-hover font-medium transition-colors group"
              >
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                Kembali ke Beranda
              </Link>
            </div>
          )}

          {/* Form testimoni untuk member */}
          <div className="max-w-lg mx-auto mt-16">
            <TestimonialForm />
          </div>

          <div className="section-divider mt-16" />

          {/* Bottom CTA */}
          {testimonials.length > 0 && (
            <div className="text-center mt-16 animate-fade-in delay-500">
              <div className="section-divider mb-10" />
              <p className="text-muted text-sm mb-4">
                Tertarik menggunakan layanan kami?
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-6 py-3 rounded-lg transition-all duration-300 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5"
                >
                  Lihat Layanan
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center gap-2 border border-border hover:border-muted-foreground text-foreground font-medium px-6 py-3 rounded-lg transition-all duration-300 hover:-translate-y-0.5 glass"
                >
                  Booking Sekarang
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
