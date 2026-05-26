'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

const navLinks = [
  { href: '/', label: { id: 'Beranda', en: 'Home' } },
  { href: '/services', label: { id: 'Layanan', en: 'Services' } },
  { href: '/about', label: { id: 'Tentang', en: 'About' } },
  { href: '/testimonials', label: { id: 'Testimoni', en: 'Testimonials' } },
  { href: '/contact', label: { id: 'Kontak', en: 'Contact' } },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const isAdmin = pathname.startsWith('/admin')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
    } catch {
      // fallback: clear session manually
    }
    setLoggingOut(false)
    router.push('/')
    router.refresh()
  }

  if (isAdmin) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 transition-all duration-300">
      <Link href="/" className="shrink-0">
        <img src="/km-icon.svg" alt="Krisna Media" className="h-12 md:h-14 w-auto" />
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-8 text-sm font-normal text-white/80">
        {navLinks
          .filter(link => !(link.href === '/services' && loggedIn))
          .map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'relative pb-1 group transition-colors duration-250 hover:text-white',
              pathname === link.href && 'text-white font-medium'
            )}
          >
            {link.label.id}
            <span className={cn(
              'absolute -bottom-[1px] left-0 h-[1.5px] bg-white transition-all duration-300',
              pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'
            )} />
          </Link>
        ))}
        {loggedIn ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 border border-red-500/40 hover:border-red-500 text-red-400 hover:text-red-300 font-medium px-5 py-2 rounded-lg transition-all duration-300 text-sm disabled:opacity-50"
            >
              <LogOut size={16} />
              {loggingOut ? 'Keluar...' : 'Keluar'}
            </button>
          </div>
        ) : (
          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white font-medium px-5 py-2 rounded-lg transition-all duration-300 text-sm"
          >
            Masuk / Daftar
          </Link>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden text-white p-2"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 glass md:hidden animate-scale-in">
          <div className="flex flex-col p-6 gap-4">
            {navLinks
            .filter(link => !(link.href === '/services' && loggedIn))
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'text-white/80 hover:text-white transition-colors py-2',
                  pathname === link.href && 'text-white font-medium'
                )}
              >
                {link.label.id}
              </Link>
            ))}
            {loggedIn && (
              <>
                <hr className="border-border/60" />
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false) }}
                  className="inline-flex items-center justify-center gap-2 border border-red-500/40 text-red-400 hover:text-red-300 hover:border-red-500 font-medium px-5 py-2.5 rounded-lg transition-all duration-300 text-sm w-full"
                >
                  <LogOut size={16} />
                  Keluar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
