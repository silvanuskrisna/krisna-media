'use client'

import { Suspense, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { LogIn, UserPlus, Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type AuthTab = 'login' | 'signup'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/'

  const [tab, setTab] = useState<AuthTab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [namaLengkap, setNamaLengkap] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message === 'Invalid login credentials'
        ? 'Email atau password salah.'
        : signInError.message
      )
      setLoading(false)
      return
    }

    router.push(redirectPath)
    router.refresh()
  }

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setResetSent(true)
  }

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: namaLengkap },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('Email sudah terdaftar. Silakan masuk.')
      setLoading(false)
      return
    }

    setLoading(false)
    setTab('login')
    setError(null)
    alert('Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi, lalu masuk.')
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    }
  }

  const enterForgotMode = () => {
    setForgotMode(true)
    setResetSent(false)
    setError(null)
  }

  const exitForgotMode = () => {
    setForgotMode(false)
    setResetSent(false)
    setError(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-mesh-grid bg-noise">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Krisna Media
          </h1>
          <p className="text-muted-foreground">
            {forgotMode
              ? 'Reset password'
              : tab === 'login'
                ? 'Masuk ke akun Anda'
                : 'Buat akun baru'}
          </p>
        </div>

        {/* ───── FORGOT PASSWORD VIEW ───── */}
        {forgotMode ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email-forgot" className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input id="email-forgot" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com" required disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all disabled:opacity-50" />
              </div>
            </div>

            {resetSent ? (
              <div className="animate-scale-in rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
                ✅ Link reset password telah dikirim ke <strong>{email}</strong>.
                Silakan cek inbox (atau folder spam) untuk mengatur password baru.
              </div>
            ) : (
              <p className="text-xs text-muted-foreground -mt-2">
                Masukkan email Anda, kami akan kirim link untuk reset password.
              </p>
            )}

            {error && (
              <div className="animate-scale-in rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            {!resetSent && (
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                ) : 'Kirim Link Reset'}
              </button>
            )}

            <button type="button" onClick={exitForgotMode}
              className="text-center text-xs text-accent hover:underline w-full">
              ← Kembali ke Login
            </button>
          </form>
        ) : (
          <>
            {/* Tab Selector */}
            <div className="flex rounded-lg border border-border p-1 bg-card">
              <button
                onClick={() => { setTab('login'); setError(null) }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  tab === 'login'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Masuk
              </button>
              <button
                onClick={() => { setTab('signup'); setError(null) }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  tab === 'signup'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Daftar
              </button>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="glass w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-card-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {loading ? 'Memproses...' : 'Masuk dengan Google'}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Atau</span>
              </div>
            </div>

            {/* Auth Form */}
            <form onSubmit={tab === 'login' ? handleLogin : handleSignUp} className="space-y-4">
              {/* Nama (signup only) */}
              {tab === 'signup' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label htmlFor="nama" className="text-sm font-medium text-foreground">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input id="nama" type="text" value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                      placeholder="Masukkan nama lengkap" required disabled={loading}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all disabled:opacity-50" />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com" required disabled={loading}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all disabled:opacity-50" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="password" type={showPassword ? 'text' : 'password'}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 karakter" required minLength={6} disabled={loading}
                    className="w-full pl-10 pr-10 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all disabled:opacity-50" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Lupa Password? link (login only) */}
              {tab === 'login' && (
                <button type="button" onClick={enterForgotMode}
                  className="text-xs text-accent hover:underline self-start -mt-2">
                  Lupa password?
                </button>
              )}

              {/* Error */}
              {error && (
                <div className="animate-scale-in rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {tab === 'login' ? 'Memproses...' : 'Mendaftarkan...'}</>
                ) : (
                  <>{tab === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {tab === 'login' ? 'Masuk' : 'Daftar'}</>
                )}
              </button>
            </form>

            {/* Toggle */}
            <p className="text-center text-xs text-muted-foreground">
              {tab === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <button onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError(null) }}
                className="text-accent hover:underline font-medium">
                {tab === 'login' ? 'Daftar di sini' : 'Masuk di sini'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted">Memuat...</div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
}
