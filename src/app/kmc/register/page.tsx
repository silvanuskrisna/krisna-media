'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, CheckCircle, Music, Calendar, Clock, User, FileText, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

const INSTRUMENTS = [
  { value: 'Gitar', label: 'Gitar', icon: '🎸', description: 'Akustik & Elektrik' },
  { value: 'Piano', label: 'Piano', icon: '🎹', description: 'Keyboard & Piano' },
  { value: 'Drum', label: 'Drum', icon: '🥁', description: 'Drum Set & Perkusi' },
]

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

const TIME_SLOTS = [
  { value: 'morning', label: 'Pagi (09:00 - 12:00)' },
  { value: 'afternoon', label: 'Siang (13:00 - 17:00)' },
  { value: 'evening', label: 'Malam (18:00 - 21:00)' },
]

interface ScheduleSlot {
  id: string
  day: string
  start_time: string
  end_time: string
  is_available: boolean
  instrument?: string
}

const AGE_GROUPS = [
  { value: 'kids', label: 'Anak-anak (5-12 tahun)' },
  { value: 'teen', label: 'Remaja (13-17 tahun)' },
  { value: 'adult', label: 'Dewasa (18+ tahun)' },
]

const LEVELS = [
  { value: 'beginner', label: 'Pemula (Belum bisa sama sekali)' },
  { value: 'intermediate', label: 'Menengah (Sudah bisa dasar)' },
  { value: 'advanced', label: 'Lanjut (Sudah bisa main lagu)' },
]

export default function KMCRegistration() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasExistingRegistration, setHasExistingRegistration] = useState(false)

  // Form state
  const [studentName, setStudentName] = useState('')
  const [instrument, setInstrument] = useState('')
  const [preferredDay, setPreferredDay] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [preferredScheduleId, setPreferredScheduleId] = useState('')
  const [availableSchedules, setAvailableSchedules] = useState<ScheduleSlot[]>([])
  const [ageGroup, setAgeGroup] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [notes, setNotes] = useState('')

  // Check auth and existing registration
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth?redirect=/kmc/register')
        return
      }

      setUser(session.user)

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profileData) setProfile(profileData)

      // Check existing registration
      const { data: existing } = await supabase
        .from('kmc_registrations')
        .select('id, status')
        .eq('user_id', session.user.id)
        .single()

      if (existing) {
        setHasExistingRegistration(true)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  // Group schedules by day for organized display (ordered by day of week)
  const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  const schedulesByDay = availableSchedules.reduce((acc, schedule) => {
    const day = schedule.day
    if (!acc[day]) {
      acc[day] = []
    }
    acc[day].push(schedule)
    return acc
  }, {} as Record<string, ScheduleSlot[]>)
  
  // Get ordered day keys
  const orderedDays = DAY_ORDER.filter(day => schedulesByDay[day])

  // Fetch all schedules (available + occupied)
  useEffect(() => {
    async function fetchSchedules() {
      const { data, error } = await supabase
        .from('kmc_schedules')
        .select('id, day, start_time, end_time, is_available')
        .order('day')
        .order('start_time')

      if (error) {
        console.error('Error fetching schedules:', error)
      } else {
        setAvailableSchedules((data || []) as ScheduleSlot[])
      }
    }

    fetchSchedules()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!studentName.trim() || !instrument || !preferredScheduleId) {
      setError('Harap pilih instrument dan jadwal yang tersedia.')
      return
    }

    setSubmitting(true)

    // Get schedule details
    const selectedSchedule = availableSchedules.find(s => s.id === preferredScheduleId)
    if (!selectedSchedule) {
      setError('Jadwal tidak valid.')
      setSubmitting(false)
      return
    }

    const registrationData = {
      user_id: user.id,
      student_name: studentName.trim(),
      instrument,
      preferred_day: selectedSchedule.day,
      preferred_time: `${selectedSchedule.start_time.slice(0, 5)} - ${selectedSchedule.end_time.slice(0, 5)}`,
      age_group: ageGroup || null,
      experience_level: experienceLevel || null,
      notes: notes.trim() || null,
      status: 'pending',
    }

    const { data, error: insertError } = await supabase
      .from('kmc_registrations')
      .insert(registrationData)
      .select('id')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      setError(`Gagal mengirim pendaftaran: ${insertError.message}`)
      setSubmitting(false)
      return
    }

    // Mark schedule slot as unavailable
    const { error: scheduleError } = await supabase
      .from('kmc_schedules')
      .update({ is_available: false })
      .eq('id', preferredScheduleId)

    if (scheduleError) {
      console.error('Failed to reserve schedule:', scheduleError)
      // Don't block the user — registration already succeeded
    }

    setSubmitting(false)
    setSuccess(true)

    // Redirect to confirmation after 2 seconds
    setTimeout(() => {
      router.push(`/my-kmc-lessons`)
    }, 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground animate-pulse">Memuat data...</div>
      </div>
    )
  }

  if (hasExistingRegistration) {
    return (
      <div className="min-h-screen pt-32 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          <div className="glass rounded-2xl p-12 text-center border border-yellow-500/30 bg-yellow-500/5">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-5">
              <FileText size={36} className="text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Anda Sudah Terdaftar
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Pendaftaran KMC Anda sedang dalam proses review.
            </p>
            <Link
              href="/my-kmc-lessons"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-medium transition-colors"
            >
              Lihat Status Pendaftaran
              <ArrowLeft size={16} className="rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-grid opacity-40 bg-noise" />
        <div className="absolute inset-0 bg-gradient-radial from-accent/5 via-background/80 to-background" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="animate-fade-in">
            <p className="inline-flex items-center gap-2 text-sm text-accent font-medium tracking-wider uppercase mb-4 border border-accent/20 rounded-full px-4 py-1.5 glass">
              <Music size={14} />
              Krisna Music Course
            </p>
          </div>
          <h1 className="animate-fade-in delay-100 text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
            Daftar Kursus Musik
          </h1>
          <p className="animate-fade-in delay-200 text-muted text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Mulai perjalanan musikal kamu bersama Krisna Music Course.
          </p>
        </div>
      </section>

      <div className="section-divider mx-6 md:mx-12" />

      {/* ===== REGISTRATION FORM ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          {success ? (
            <div className="glass rounded-2xl p-12 border border-border text-center animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={36} className="text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Pendaftaran Berhasil!
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Terima kasih sudah mendaftar. Admin kami akan menghubungi Anda via WhatsApp untuk konfirmasi jadwal.
              </p>
              <div className="animate-pulse">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto animate-spin" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Back link */}
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors group"
              >
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                Kembali ke Beranda
              </Link>

              {/* Error */}
              {error && (
                <div className="glass rounded-xl p-4 border border-red-500/30 bg-red-500/5">
                  <p className="text-red-400 text-sm whitespace-pre-line">{error}</p>
                </div>
              )}

              {/* User Info */}
              <div className="glass rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <User size={20} className="text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">Informasi Akun</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-foreground">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama:</span>
                    <span className="text-foreground">{profile?.full_name || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Data Murid */}
              <div className="glass rounded-2xl p-8 md:p-10 border border-border space-y-6">
                <div className="flex items-center gap-3">
                  <User size={20} className="text-accent" />
                  <h3 className="text-xl font-semibold text-foreground">Data Murid</h3>
                </div>

                {/* Nama */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nama <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Masukkan nama"
                    className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Bisa nama sendiri atau nama anak (untuk orang tua yang mendaftarkan)
                  </p>
                </div>
              </div>

              {/* Pilih Instrument */}
              <div className="glass rounded-2xl p-8 md:p-10 border border-border space-y-6">
                <div className="flex items-center gap-3">
                  <Music size={20} className="text-accent" />
                  <h3 className="text-xl font-semibold text-foreground">Pilih Instrument</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {INSTRUMENTS.map((inst) => (
                    <label
                      key={inst.value}
                      className={`relative block p-6 rounded-xl border cursor-pointer transition-all duration-200 ${
                        instrument === inst.value
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-muted-foreground/30 bg-card'
                      }`}
                    >
                      <input
                        type="radio"
                        name="instrument"
                        value={inst.value}
                        checked={instrument === inst.value}
                        onChange={(e) => setInstrument(e.target.value)}
                        className="sr-only"
                        required
                      />
                      <div className="text-4xl mb-3">{inst.icon}</div>
                      <div className="text-sm font-medium text-foreground mb-1">{inst.label}</div>
                      <div className="text-xs text-muted-foreground">{inst.description}</div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pilih Jadwal Tersedia */}
              <div className="glass rounded-2xl p-8 md:p-10 border border-border space-y-6">
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-accent" />
                  <h3 className="text-xl font-semibold text-foreground">Pilih Jadwal</h3>
                </div>

                {availableSchedules.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Belum ada jadwal tersedia.<br />
                      Silakan hubungi admin untuk informasi lebih lanjut.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-xs text-muted-foreground -mt-4 mb-4">
                      Pilih jadwal yang sesuai dengan ketersediaanmu:
                    </p>
                    
                    {/* Grouped by Day */}
                    {orderedDays.map((day) => (
                      <div key={day} className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">
                          {day}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 border-l-2 border-accent/30">
                          {schedulesByDay[day].map((schedule) => (
                            <label
                              key={schedule.id}
                              className={`relative block p-4 rounded-xl border transition-all duration-200 ${
                                !schedule.is_available
                                  ? 'border-red-500/20 bg-red-500/5 opacity-60 cursor-not-allowed'
                                  : preferredScheduleId === schedule.id
                                    ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20 cursor-pointer'
                                    : 'border-border hover:border-muted-foreground/30 bg-card cursor-pointer'
                              }`}
                            >
                              <input
                                type="radio"
                                name="preferredSchedule"
                                value={schedule.id}
                                checked={preferredScheduleId === schedule.id}
                                onChange={(e) => setPreferredScheduleId(e.target.value)}
                                disabled={!schedule.is_available}
                                className="sr-only"
                                required
                              />
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-muted-foreground" />
                                    <span className={`text-sm font-medium ${schedule.is_available ? 'text-foreground' : 'text-muted-foreground'}`}>
                                      {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                                    </span>
                                  </div>
                                </div>
                                {!schedule.is_available && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                                    Sudah Diisi
                                  </span>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Informasi Tambahan */}
              <div className="glass rounded-2xl p-8 md:p-10 border border-border space-y-6">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-accent" />
                  <h3 className="text-xl font-semibold text-foreground">Informasi Tambahan</h3>
                </div>

                {/* Age Group */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Kelompok Umur
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {AGE_GROUPS.map((group) => (
                      <label
                        key={group.value}
                        className={`block p-3 rounded-lg border cursor-pointer text-center text-sm transition-all ${
                          ageGroup === group.value
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border hover:border-muted-foreground/30 text-foreground'
                        }`}
                      >
                        <input
                          type="radio"
                          name="ageGroup"
                          value={group.value}
                          checked={ageGroup === group.value}
                          onChange={(e) => setAgeGroup(e.target.value)}
                          className="sr-only"
                        />
                        {group.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Level Pengalaman
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {LEVELS.map((level) => (
                      <label
                        key={level.value}
                        className={`block p-3 rounded-lg border cursor-pointer text-center text-sm transition-all ${
                          experienceLevel === level.value
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border hover:border-muted-foreground/30 text-foreground'
                        }`}
                      >
                        <input
                          type="radio"
                          name="experienceLevel"
                          value={level.value}
                          checked={experienceLevel === level.value}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {[...Array(level.value === 'beginner' ? 1 : level.value === 'intermediate' ? 2 : 3)].map((_, i) => (
                            <Star key={i} size={12} className="fill-accent text-accent" />
                          ))}
                        </div>
                        {level.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Catatan Tambahan
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Target musikal, genre yang disukai, atau informasi lainnya..."
                    rows={4}
                    className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Opsional - bantu kami memahami kebutuhan belajar kamu
                  </p>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-accent hover:bg-accent/90 disabled:bg-muted disabled:text-muted-foreground text-accent-foreground rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Mengirim Pendaftaran...
                  </>
                ) : (
                  <>
                    <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                    Kirim Pendaftaran
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
