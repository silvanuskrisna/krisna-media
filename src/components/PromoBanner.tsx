import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import { Tag, ArrowRight, Sparkles } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { Promo } from '@/lib/types'

export default async function PromoBanner() {
  const sb = await createSupabaseServer()

  const { data: promos } = await sb
    .from('promos')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (!promos || promos.length === 0) return null

  // Filter promo yang masih dalam periode ATAU akan datang (max 7 hari ke depan)
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextWeekStr = nextWeek.toISOString().split('T')[0]

  const activePromos = promos.filter((p: Promo) => {
    if (p.used >= p.quota) return false
    if (p.end_date && today > p.end_date) return false
    if (p.start_date && p.start_date > nextWeekStr) return false
    return true
  })

  if (activePromos.length === 0) return null

  return (
    <>
      <div className="section-divider mx-6 md:mx-12" />

      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="animate-fade-in-up space-y-6">
            {activePromos.map((promo: Promo) => (
              <Link
                key={promo.id}
                href="/booking"
                className="block glass rounded-2xl p-6 md:p-8 border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent hover:border-purple-500/40 transition-all duration-300 group"
              >
                <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Sparkles size={28} className="text-purple-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      {(!promo.start_date || today >= promo.start_date) ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">
                          <Tag size={12} />
                          PROMO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium">
                          📅 Mulai{' '}
                          {new Date(promo.start_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      )}
                      {promo.start_date && today < promo.start_date && promo.quota - promo.used <= 5 && (
                        <span className="text-xs text-amber-400 font-medium">
                          🎯 Segera hadir!
                        </span>
                      )}
                      {(!promo.start_date || today >= promo.start_date) && promo.quota - promo.used <= 3 && (
                        <span className="text-xs text-red-400 font-medium animate-pulse">
                          ⚡ Sisa {promo.quota - promo.used} slot!
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mt-2">
                      {promo.name}
                    </h3>
                    {promo.description && (
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {promo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {(!promo.start_date || today >= promo.start_date) ? (
                        <>
                          <span className="text-2xl font-bold text-purple-400">
                            {formatPrice(promo.price_per_2hour)}
                            <span className="text-sm text-muted-foreground font-normal"> / 2 jam</span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            🎯 Tersedia {promo.quota - promo.used} dari {promo.quota} slot
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-amber-300">
                          🗓️ Mulai{' '}
                          {new Date(promo.start_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}{' '}
                          — {promo.quota - promo.used} slot tersedia
                        </span>
                      )}
                      {promo.end_date && (
                        <span className="text-xs text-muted-foreground">
                          📅 Sampai {new Date(promo.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="shrink-0">
                    {(!promo.start_date || today >= promo.start_date) ? (
                      <span className="inline-flex items-center gap-2 px-5 py-3 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-medium group-hover:bg-purple-500/30 transition-colors">
                        Booking
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500/15 text-amber-300 rounded-lg text-sm font-medium">
                        🗓️ Segera
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
