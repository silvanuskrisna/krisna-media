import Link from 'next/link'
import { Phone, Mail, MapPin, Globe, Camera, Video } from 'lucide-react'

const socialLinks = [
  { label: 'Instagram', icon: Camera, href: '#' },
  { label: 'Facebook', icon: Globe, href: '#' },
  { label: 'YouTube', icon: Video, href: '#' },
]

export default function Footer() {
  return (
    <footer className="border-t border-[#262626] bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block">
              <img src="/logo.svg" alt="Krisna Media" className="h-9 w-auto" />
            </Link>
            <p className="mt-4 text-sm text-[#737373] leading-relaxed">
              Sound | Lighting | Studio | Gear
            </p>
            <p className="mt-2 text-sm text-[#737373]">
              Jl. KS Tubun Rt 5 No 63, Banjarmasin
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-medium text-sm uppercase tracking-wider mb-4">Links</h3>
            <div className="flex flex-col gap-3">
              {[
                { href: '/services', label: 'Layanan' },
                { href: '/about', label: 'Tentang' },
                { href: '/testimonials', label: 'Testimoni' },
                { href: '/booking', label: 'Booking' },
                { href: '/contact', label: 'Kontak' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-[#737373] hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-medium text-sm uppercase tracking-wider mb-4">Kontak</h3>
            <div className="flex flex-col gap-3">
              <a href="https://wa.me/628115191097" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-[#737373] hover:text-white transition-colors">
                <Phone size={14} />
                <span>0811-519-1097</span>
              </a>
              <a href="mailto:krisna.media.bdj@gmail.com"
                className="flex items-center gap-3 text-sm text-[#737373] hover:text-white transition-colors">
                <Mail size={14} />
                <span>krisna.media.bdj@gmail.com</span>
              </a>
              <div className="flex items-start gap-3 text-sm text-[#737373]">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span>Jl. KS Tubun Rt 5 No 63, Banjarmasin</span>
              </div>
            </div>
            {/* Social */}
            <div className="flex gap-4 mt-6">
              {socialLinks.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="text-[#737373] hover:text-white transition-colors"
                  aria-label={s.label}>
                  <s.icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#262626] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#525252]">
            &copy; {new Date().getFullYear()} Krisna Media. All rights reserved.
          </p>
          <p className="text-xs text-[#525252]">
            Jl. KS Tubun Rt 5 No 63, Banjarmasin
          </p>
        </div>
      </div>
    </footer>
  )
}
