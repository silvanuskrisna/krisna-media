import Link from 'next/link'
import { Phone, Mail, MapPin, MessageCircle, ArrowRight } from 'lucide-react'
import { getWhatsAppUrl } from '@/lib/utils'
import ContactForm from './ContactForm'

const contactMethods = [
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    description: 'Respon cepat via chat',
    action: {
      label: '+62 811-5191-097',
      href: getWhatsAppUrl(
        '628115191097',
        'Halo Krisna Media! Saya ingin bertanya tentang layanan Anda.'
      ),
    },
  },
  {
    icon: Mail,
    title: 'Email',
    description: 'Kirim pesan via email',
    action: {
      label: 'krisna.media.bdj@gmail.com',
      href: 'mailto:krisna.media.bdj@gmail.com',
    },
  },
  {
    icon: MapPin,
    title: 'Alamat',
    description: 'Kunjungi lokasi kami',
    action: {
      label: 'Jl. KS Tubun Rt 5 No 63, Banjarmasin',
      href: 'https://www.google.com/maps?q=-3.329296,114.591425',
    },
  },
]

export default function ContactPage() {
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
              Kontak
            </p>
          </div>
          <h1 className="animate-fade-in delay-100 text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
            Hubungi Kami
          </h1>
          <p className="animate-fade-in delay-200 text-muted text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Punya pertanyaan atau ingin konsultasi? Tim kami siap membantu Anda.
          </p>
        </div>
      </section>

      {/* ===== CONTACT METHODS ===== */}
      <section className="pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, i) => (
              <a
                key={method.title}
                href={method.action.href}
                target={
                  method.action.href.startsWith('http') ? '_blank' : undefined
                }
                rel={
                  method.action.href.startsWith('http')
                    ? 'noopener noreferrer'
                    : undefined
                }
                className={[
                  'glass rounded-xl p-6 hover-card flex flex-col items-center text-center animate-fade-in-up group',
                  i === 0 && 'delay-100',
                  i === 1 && 'delay-200',
                  i === 2 && 'delay-300',
                ].join(' ')}
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:bg-accent/20 transition-colors">
                  <method.icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {method.title}
                </h3>
                <p className="text-muted text-sm mb-4">{method.description}</p>
                <span className="text-accent text-sm font-medium group-hover:text-accent-hover transition-colors">
                  {method.action.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider mx-6 md:mx-12" />

      {/* ===== CONTACT FORM ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
            {/* Form */}
            <div className="lg:col-span-3 animate-fade-in-up delay-100">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Kirim Pesan
              </h2>
              <p className="text-muted text-sm mb-8">
                Isi form di bawah ini dan pesan Anda akan langsung terkirim
                melalui WhatsApp.
              </p>
              <ContactForm />
            </div>

            {/* Info sidebar */}
            <div className="lg:col-span-2 animate-fade-in-up delay-300">
              <div className="glass rounded-xl p-6 border border-border sticky top-28">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Mengapa menghubungi kami?
                </h3>
                <ul className="space-y-3 text-sm text-muted">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                    <span>Konsultasi gratis untuk kebutuhan acara Anda</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                    <span>Tim profesional yang siap membantu</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                    <span>Respon cepat via WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                    <span>Penawaran harga khusus untuk paket acara</span>
                  </li>
                </ul>

                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-3">
                    Atau langsung chat via WhatsApp
                  </p>
                  <a
                    href={getWhatsAppUrl(
                    '628115191097',
                    'Halo Krisna Media! Saya ingin bertanya tentang layanan Anda.'
                  )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-300"
                  >
                    <MessageCircle size={16} />
                    Chat WhatsApp
                    <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
