import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowRight, Music, Lightbulb, Headphones, Mic, Store, Coffee, Radio } from 'lucide-react'

const businesses = [
  {
    name: 'Toko Berkat Bersaudara',
    description: 'Toko kelontong dan sembako',
    icon: Store,
  },
  {
    name: 'Coco Coffee Corner',
    description: 'Kafe dan tempat nongkrong',
    icon: Coffee,
  },
  {
    name: 'Khana Radio',
    description: 'Radio komunitas',
    icon: Radio,
  },
]

const values = [
  {
    icon: Headphones,
    title: 'Kualitas Audio Terbaik',
    description: 'Mengutamakan kualitas suara jernih dan profesional untuk setiap acara.',
  },
  {
    icon: Lightbulb,
    title: 'Pencahayaan Maksimal',
    description: 'Lighting spektakuler yang menghidupkan suasana acara Anda.',
  },
  {
    icon: Mic,
    title: 'Layanan Profesional',
    description: 'Tim berpengalaman yang siap membantu dari persiapan hingga pelaksanaan.',
  },
  {
    icon: Music,
    title: 'Studio Lengkap',
    description: 'Fasilitas studio musik dan perlengkapan alat musik berkualitas.',
  },
]

export default function AboutPage() {
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
              Tentang Kami
            </p>
          </div>
          <h1 className="animate-fade-in delay-100 text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
            Tentang Krisna Media
          </h1>
          <p className="animate-fade-in delay-200 text-muted text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Mitra terpercaya Anda untuk solusi sound system, lighting, studio musik,
            dan perlengkapan alat musik di Banjarmasin, Kalimantan Selatan.
          </p>
        </div>
      </section>

      {/* ===== COMPANY STORY ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="animate-fade-in-up">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6">
              Cerita Kami
            </h2>
            <div className="space-y-4 text-muted leading-relaxed text-base md:text-lg">
              <p>
                Krisna Media hadir sebagai solusi lengkap di bidang audio,
                pencahayaan, studio musik, dan perlengkapan alat musik.
                Berbasis di Banjarmasin, Kalimantan Selatan, kami melayani
                berbagai acara — dari acara pribadi, komunitas, hingga event
                berskala besar.
              </p>
              <p>
                Dengan pengalaman bertahun-tahun, kami memahami bahwa setiap
                acara memiliki kebutuhan yang unik. Itulah sebabnya kami
                menyediakan layanan yang fleksibel, berkualitas, dan
                profesional — didukung oleh peralatan terbaik dan tim yang
                berdedikasi.
              </p>
              <p>
                Kami tidak hanya menyediakan perlengkapan, tetapi juga
                memberikan solusi yang tepat untuk mewujudkan acara impian
                Anda. Kepuasan pelanggan adalah prioritas utama kami.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider mx-6 md:mx-12" />

      {/* ===== VALUES ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in">
            <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">
              Nilai Kami
            </p>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              Komitmen Kami
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((value, i) => (
              <div
                key={value.title}
                className={cn(
                  'glass rounded-xl p-6 hover-card animate-fade-in-up',
                  i === 0 && 'delay-100',
                  i === 1 && 'delay-200',
                  i === 2 && 'delay-300',
                  i === 3 && 'delay-400'
                )}
              >
                <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-4">
                  <value.icon size={22} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider mx-6 md:mx-12" />

      {/* ===== OWNER ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="glass rounded-2xl p-8 md:p-12 border border-border animate-fade-in-up">
            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-10">
              {/* Avatar placeholder */}
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-accent/20 flex items-center justify-center text-accent font-bold text-2xl md:text-4xl shrink-0">
                SK
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Silvanus Krisna
                </h2>
                <p className="text-accent text-sm font-medium mb-4">
                  Pendiri &amp; Pemilik Krisna Media
                </p>
                <p className="text-muted leading-relaxed text-base">
                  Seorang pengusaha dan musisi asal Banjarmasin yang memiliki visi untuk
                  menghadirkan solusi audio, lighting, dan perlengkapan musik
                  berkualitas di Kalimantan Selatan. Selain mengelola Krisna Media,
                  beliau juga mengembangkan beberapa usaha lain di Banjarmasin
                  yang menunjukkan semangat kewirausahaan dan kontribusinya pada
                  ekonomi lokal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider mx-6 md:mx-12" />

      {/* ===== OTHER BUSINESSES ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in">
            <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">
              Portofolio Bisnis
            </p>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              Usaha Lainnya
            </h2>
            <p className="text-muted max-w-xl mx-auto text-sm md:text-base mt-3">
              Selain Krisna Media, Silvanus Krisna juga mengelola beberapa
              usaha berikut di Banjarmasin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((biz, i) => (
              <div
                key={biz.name}
                className={cn(
                  'glass rounded-xl p-5 hover-card flex items-start gap-4 animate-fade-in-up',
                  i === 0 && 'delay-100',
                  i === 1 && 'delay-200',
                  i === 2 && 'delay-300',
                  i === 3 && 'delay-400',
                  i === 4 && 'delay-500'
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <biz.icon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {biz.name}
                  </h3>
                  <p className="text-xs text-muted mt-1">
                    {biz.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <div className="section-divider mx-6 md:mx-12" />

      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-accent/10" />
        <div className="absolute inset-0 bg-mesh-grid opacity-30 bg-noise" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="animate-fade-in">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Tertarik Bekerja Sama?
            </h2>
            <p className="text-muted text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Hubungi kami untuk konsultasi gratis tentang kebutuhan sound,
              lighting, studio, atau alat musik Anda.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-8 py-4 rounded-lg transition-all duration-300 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 text-base"
            >
              Hubungi Kami
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
