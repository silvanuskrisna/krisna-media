'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type UpdateState = 'loading' | 'ready' | 'success' | 'error'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [state, setState] = useState<UpdateState>('loading')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setState('ready')
      }
    })

    // Check if already recovered (in case listener fires late)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // Session exists — might be PASSWORD_RECOVERY
        const hash = window.location.hash
        if (hash && hash.includes('type=recovery')) {
          setState('ready')
        }
      } else {
        // No session, no recovery — redirect
        setTimeout(() => {
          if (state === 'loading') {
            setState('error')
            setError('Link reset tidak valid atau sudah kedaluwarsa. Silakan coba lagi.')
          }
        }, 5000)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setError('Password tidak cocok.')
      return
    }

    setSaving(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setState('success')
    setTimeout(() => {
      // Sign out so user logs in with new password
      supabase.auth.signOut()
      router.push('/auth')
      router.refresh()
    }, 2000)
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-mesh-grid bg-noise">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-sm text-muted-foreground">Memverifikasi link...</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-mesh-grid bg-noise">
        <div className="w-full max-w-md text-center space-y-4 animate-fade-in">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Link Tidak Valid</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={() => router.push('/auth')}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all">
            Kembali ke Login
          </button>
        </div>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-mesh-grid bg-noise">
        <div className="w-full max-w-md text-center space-y-4 animate-fade-in">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Password Berhasil Diubah!</h1>
          <p className="text-sm text-muted-foreground">Mengarahkan ke halaman login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-mesh-grid bg-noise">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Krisna Media
          </h1>
          <p className="text-muted-foreground">Buat password baru</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {/* Password Baru */}
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-sm font-medium text-foreground">Password Baru</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input id="new-password" type={showPassword ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 karakter" required minLength={6} disabled={saving}
                className="w-full pl-10 pr-10 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all disabled:opacity-50" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Konfirmasi Password */}
          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">Konfirmasi Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input id="confirm-password" type={showConfirm ? 'text' : 'password'}
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password" required minLength={6} disabled={saving}
                className="w-full pl-10 pr-10 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all disabled:opacity-50" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="animate-scale-in rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Submit */}
          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
            ) : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  )
}
