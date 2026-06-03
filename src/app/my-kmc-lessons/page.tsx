'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Music, Calendar, Clock, User, FileText, CheckCircle, Hourglass, XCircle, TrendingUp, ArrowLeft, Edit2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending Review', color: 'text-yellow-400', icon: Hourglass },
  confirmed: { label: 'Dikonfirmasi', color: 'text-blue-400', icon: CheckCircle },
  enrolled: { label: 'Sudah Mulai', color: 'text-green-400', icon: TrendingUp },
  cancelled: { label: 'Dibatalkan', color: 'text-red-400', icon: XCircle },
}

const INSTRUMENT_ICONS: Record<string, string> = {
  'Gitar': '🎸',
  'Piano': '🎹',
  'Drum': '🥁',
}

export default function MyKMCLessons() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [registration, setRegistration] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  // Form state for editing
  const [preferredDay, setPreferredDay] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth?redirect=/my-kmc-lessons')
        return
      }

      setUser(session.user)

      // Fetch registration
      const { data, error } = await supabase
        .from('kmc_registrations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setRegistration(data)
        setPreferredDay(data.preferred_day)
        setPreferredTime(data.preferred_time || '')
        setNotes(data.notes || '')
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase
      .from('kmc_registrations')
      .update({
        preferred_day: preferredDay,
        preferred_time: preferredTime || null,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', registration.id)

    if (error) {
      alert('Gagal update data. Silakan coba lagi.')
      return
    }

    setRegistration({ ...registration, preferred_day: preferredDay, preferred_time: preferredTime, notes })
    setEditing(false)
    alert('Data berhasil diupdate!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground animate-pulse">Memuat data...</div>
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="min-h-screen pt-32 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors group mb-8"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Kembali ke Beranda
          </Link>

          <div className="glass rounded-2xl p-12 text-center border border-border">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-5">
              <Music size={36} className="text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Belum Terdaftar di KMC
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Mulai perjalanan musikal kamu dengan mendaftar kursus.
            </p>
            <Link
              href="/kmc/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-medium transition-colors"
            >
              <Music size={18} />
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const StatusIcon = STATUS_CONFIG[registration.status]?.icon || Hourglass
  const statusColor = STATUS_CONFIG[registration.status]?.color || 'text-muted-foreground'
  const statusLabel = STATUS_CONFIG[registration.status]?.label || 'Unknown'
  const instrumentIcon = INSTRUMENT_ICONS[registration.instrument] || '🎵'

  return (
    <div className="min-h-screen pt-32 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors group mb-8"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Kembali ke Beranda
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Pendaftaran KMC Saya</h1>
          <p className="text-muted-foreground">Status dan informasi pendaftaran kursus musik</p>
        </div>

        {/* Status Card */}
        <div className="glass rounded-2xl p-8 border border-border mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-2xl">
                {instrumentIcon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{registration.instrument}</h2>
                <p className="text-sm text-muted-foreground">
                  Terdaftar {formatDate(registration.created_at)}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-card ${statusColor}`}>
              <StatusIcon size={18} />
              <span className="text-sm font-medium">{statusLabel}</span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-8 pt-8 border-t border-border">
            <div className={`flex flex-col items-center gap-2 ${['confirmed', 'enrolled'].includes(registration.status) ? 'text-accent' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${['confirmed', 'enrolled'].includes(registration.status) ? 'border-accent bg-accent/20' : 'border-border bg-card'}`}>
                <FileText size={18} />
              </div>
              <span className="text-xs font-medium">Terdaftar</span>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${['confirmed', 'enrolled'].includes(registration.status) ? 'bg-accent' : 'bg-border'}`} />
            <div className={`flex flex-col items-center gap-2 ${registration.status !== 'pending' ? 'text-accent' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${registration.status !== 'pending' ? 'border-accent bg-accent/20' : 'border-border bg-card'}`}>
                <CheckCircle size={18} />
              </div>
              <span className="text-xs font-medium">Dikonfirmasi</span>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${registration.status === 'enrolled' ? 'bg-accent' : 'bg-border'}`} />
            <div className={`flex flex-col items-center gap-2 ${registration.status === 'enrolled' ? 'text-accent' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${registration.status === 'enrolled' ? 'border-accent bg-accent/20' : 'border-border bg-card'}`}>
                <TrendingUp size={18} />
              </div>
              <span className="text-xs font-medium">Mulai Les</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Data Murid */}
          <div className="glass rounded-xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-accent" />
              <h3 className="font-semibold text-foreground">Data Murid</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama:</span>
                <span className="text-foreground font-medium">{registration.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Instrument:</span>
                <span className="text-foreground font-medium">{registration.instrument}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Level:</span>
                <span className="text-foreground font-medium capitalize">{registration.experience_level || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Umur:</span>
                <span className="text-foreground font-medium capitalize">{registration.age_group || '-'}</span>
              </div>
            </div>
          </div>

          {/* Preferensi Jadwal */}
          <div className="glass rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-accent" />
                <h3 className="font-semibold text-foreground">Preferensi Jadwal</h3>
              </div>
              {registration.status === 'pending' && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-accent hover:text-accent/90 flex items-center gap-1 transition-colors"
                >
                  <Edit2 size={12} />
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Hari</label>
                  <select
                    value={preferredDay}
                    onChange={(e) => setPreferredDay(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent"
                  >
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Waktu</label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="">-</option>
                    <option value="morning">Pagi (09:00 - 12:00)</option>
                    <option value="afternoon">Siang (13:00 - 17:00)</option>
                    <option value="evening">Malam (18:00 - 21:00)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Catatan</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 px-3 py-2 bg-card hover:bg-card/80 text-foreground rounded-lg text-sm font-medium transition-colors border border-border"
                  >
                    Batal
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hari:</span>
                  <span className="text-foreground font-medium">{registration.preferred_day}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waktu:</span>
                  <span className="text-foreground font-medium">
                    {registration.preferred_time || '-'}
                  </span>
                </div>
                {registration.notes && (
                  <div className="pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">Catatan:</span>
                    <p className="text-foreground text-sm mt-1">{registration.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Admin Notes */}
        {registration.admin_notes && (
          <div className="glass rounded-xl p-6 border border-blue-500/30 bg-blue-500/5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-blue-400" />
              <h3 className="font-semibold text-blue-400">Catatan dari Admin</h3>
            </div>
            <p className="text-foreground text-sm">{registration.admin_notes}</p>
          </div>
        )}

        {/* Contact Info */}
        <div className="glass rounded-xl p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-3">Butuh Bantuan?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Jika ada pertanyaan tentang pendaftaran Anda, hubungi kami:
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://wa.me/628115191097"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </a>
            <a
              href="mailto:krisna.media.bdj@gmail.com"
              className="px-4 py-2 bg-card hover:bg-card/80 text-foreground rounded-lg text-sm font-medium transition-colors border border-border flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
