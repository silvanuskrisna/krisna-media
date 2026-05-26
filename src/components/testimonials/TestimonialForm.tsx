'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Star, Send, CheckCircle } from 'lucide-react'

export default function TestimonialForm() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setLoggedIn(true)
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || '')
      }
    })
  }, [])

  if (!loggedIn) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setSending(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('testimonials')
      .insert({
        customer_name: userName,
        content: content.trim(),
        rating,
        is_active: false, // butuh persetujuan admin dulu
      })

    setSending(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="glass rounded-xl p-8 text-center border border-accent/20 animate-fade-in">
        <CheckCircle size={48} className="mx-auto mb-4 text-accent" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Testimoni Terkirim! 🎉</h3>
        <p className="text-muted-foreground text-sm">
          Terima kasih! Testimoni kamu akan ditampilkan setelah diverifikasi oleh admin.
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-8 border border-border/50 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-1">Berikan Testimoni</h3>
      <p className="text-muted-foreground text-sm mb-6">
        Bagikan pengalaman kamu menggunakan layanan Krisna Media
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nama */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Nama</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
          />
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  size={24}
                  className={
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'text-muted'
                  }
                />
              </button>
            ))}
          </div>
        </div>

        {/* Isi testimoni */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Testimoni <span className="text-red-400">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            placeholder="Ceritakan pengalaman kamu..."
            className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} />
          {sending ? 'Mengirim...' : 'Kirim Testimoni'}
        </button>

        <p className="text-xs text-muted-foreground">
          Testimoni akan ditampilkan setelah diverifikasi oleh admin.
        </p>
      </form>
    </div>
  )
}
