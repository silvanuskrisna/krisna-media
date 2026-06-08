'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, CheckCircle, Music, Plus, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

const INSTRUMENTS = [
  { value: 'Gitar', label: 'Gitar', icon: '🎸' },
  { value: 'Piano', label: 'Piano', icon: '🎹' },
  { value: 'Drum', label: 'Drum', icon: '🥁' },
]

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
const TIME_OPTIONS = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

interface FormRow {
  id: string
  name: string
  age: string
  instrument: string
  day: string
  time: string
}

let rowCounter = 0
function newRow(): FormRow {
  return { id: `r${++rowCounter}`, name: '', age: '', instrument: '', day: 'Senin', time: '14:00' }
}

export default function KMCRegistration() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Profile
  const [fullName, setFullName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [address, setAddress] = useState('')

  // Available slots: map of day → Set<time>
  const [availableTimes, setAvailableTimes] = useState<Record<string, Set<string>>>({})

  // Student rows
  const [rows, setRows] = useState<FormRow[]>([newRow()])

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth?redirect=/kmc/register'); return }
      setUser(session.user)

      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (p) {
        setProfile(p)
        setFullName(p.full_name || '')
      }

      const { data: m } = await supabase.from('members').select('*').eq('id', session.user.id).single()
      if (m) {
        setWhatsapp(m.whatsapp || '')
        setAddress(m.address || '')
      }

      setLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    if (!user) return
    async function fetchSlots() {
      const { data } = await supabase
        .from('kmc_schedules')
        .select('day, start_time')
        .eq('is_available', true)

      const map: Record<string, Set<string>> = {}
      for (const d of DAYS) map[d] = new Set()
      if (data) {
        for (const s of data) {
          const time = s.start_time.slice(0, 5)
          if (map[s.day]) map[s.day].add(time)
        }
      }
      setAvailableTimes(map)
    }
    fetchSlots()
  }, [user])

  function addRow() { setRows([...rows, newRow()]) }

  function removeRow(id: string) {
    if (rows.length <= 1) return
    setRows(rows.filter(r => r.id !== id))
  }

  function updateRow(id: string, field: keyof FormRow, value: string) {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  function getAvailableTimeOptions(day: string): string[] {
    return (availableTimes[day] ? [...availableTimes[day]] : TIME_OPTIONS).sort()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const validRows = rows.filter(r => r.name.trim() && r.instrument)
    if (validRows.length === 0) { setError('Isi minimal 1 siswa.'); return }

    setSubmitting(true)
    try {
      // 1. Upsert member profile
      const { error: mErr } = await supabase
        .from('members')
        .upsert({
          id: user.id,
          full_name: fullName.trim() || profile?.full_name || 'Member',
          whatsapp: whatsapp.trim() || null,
          address: address.trim() || null,
        }, { onConflict: 'id' })
      if (mErr) throw mErr

      // 2. Get existing students for this member (name → id)
      const { data: existing } = await supabase
        .from('students')
        .select('id, name')
        .eq('member_id', user.id)

      const existingByName = new Map<string, string>()
      if (existing) {
        for (const s of existing) existingByName.set(s.name.trim().toLowerCase(), s.id)
      }

      // 3. Collect new students to insert
      const newStudentRows: FormRow[] = []
      for (const r of validRows) {
        const key = r.name.trim().toLowerCase()
        if (!existingByName.has(key)) newStudentRows.push(r)
      }

      // 4. Insert new students (batch)
      if (newStudentRows.length > 0) {
        const { error: nsErr } = await supabase
          .from('students')
          .insert(newStudentRows.map(r => ({
            member_id: user.id,
            name: r.name.trim(),
            age: r.age ? parseInt(r.age) : null,
          })))
        if (nsErr) throw nsErr
      }

      // 5. Re-fetch all students to have fresh IDs
      const { data: allStudents } = await supabase
        .from('students')
        .select('id, name')
        .eq('member_id', user.id)

      const studentIdMap = new Map<string, string>()
      if (allStudents) {
        for (const s of allStudents) studentIdMap.set(s.name.trim().toLowerCase(), s.id)
      }

      // 6. Create enrollments + lesson_schedules
      for (const r of validRows) {
        const studentId = studentIdMap.get(r.name.trim().toLowerCase())
        if (!studentId) continue

        const endHour = parseInt(r.time.split(':')[0]) + 1
        const endTime = `${String(endHour).padStart(2, '0')}:00`
        const ageNum = r.age ? parseInt(r.age) : null
        const ageGroup = ageNum
          ? (ageNum <= 12 ? 'kids' : ageNum <= 17 ? 'teen' : 'adult')
          : null

        const { data: enrollment, error: enrErr } = await supabase
          .from('enrollments')
          .insert({
            student_id: studentId,
            instrument: r.instrument,
            age_group: ageGroup,
            experience_level: null,
            status: 'pending',
            sessions_per_month: 4,
          })
          .select()
          .single()
        if (enrErr) throw enrErr

        const { error: schErr } = await supabase
          .from('lesson_schedules')
          .insert({
            enrollment_id: enrollment.id,
            day: r.day,
            start_time: r.time + ':00',
            end_time: endTime + ':00',
          })
        if (schErr) throw schErr
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-16">
        <div className="max-w-xl mx-auto px-6">
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="text-muted-foreground animate-pulse">Memuat data...</div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen pt-32 pb-16">
        <div className="max-w-lg mx-auto px-6 text-center">
          <div className="glass rounded-2xl p-10 border border-border">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={36} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Pendaftaran Terkirim! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              Data kamu sudah kami terima. Admin akan konfirmasi maksimal 1×24 jam.
              Pantau status di menu <strong>Kursus Saya</strong>.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/my-kmc-lessons"
                className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors"
              >
                Lihat Kursus Saya
              </Link>
              <Link
                href="/kmc/register"
                className="px-5 py-2.5 bg-card text-foreground border border-border rounded-lg font-medium hover:bg-card/80 transition-colors"
                onClick={() => { setSuccess(false); setRows([newRow()]) }}
              >
                Daftar Lagi
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-xl mx-auto px-6">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors group mb-6"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Kembali
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-1">Daftar Kursus Musik</h1>
          <p className="text-muted-foreground text-sm">
            Isi data siswa dan pilih jadwal. Admin akan konfirmasi maksimal 1×24 jam.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Section — collapsed card */}
          <div className="glass rounded-xl p-5 border border-border">
            <h2 className="text-sm font-semibold text-foreground mb-3">Data Diri</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Nama</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  No. WhatsApp <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
                  placeholder="0852xxxxxxxx"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Alamat</label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent transition-colors resize-none"
                  placeholder="Alamat rumah (opsional)"
                />
              </div>
            </div>
          </div>

          {/* Students Section */}
          <div className="glass rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Pendaftaran Siswa</h2>
              {rows.length > 1 && (
                <span className="text-[11px] text-muted-foreground">{rows.length} siswa</span>
              )}
            </div>

            <div className="space-y-4">
              {rows.map((row, i) => (
                <div key={row.id} className="bg-card/50 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">Siswa {i + 1}</span>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Nama */}
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Nama <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={row.name}
                        onChange={e => updateRow(row.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
                        placeholder="Nama siswa"
                        required
                      />
                    </div>
                    {/* Umur */}
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Umur</label>
                      <input
                        type="number"
                        value={row.age}
                        onChange={e => updateRow(row.id, 'age', e.target.value)}
                        min={1}
                        max={100}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
                        placeholder="Tahun"
                      />
                    </div>
                    {/* Instrument */}
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Instrument <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={row.instrument}
                        onChange={e => updateRow(row.id, 'instrument', e.target.value)}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent transition-colors appearance-none"
                        required
                      >
                        <option value="">Pilih instrument</option>
                        {INSTRUMENTS.map(inst => (
                          <option key={inst.value} value={inst.value}>
                            {inst.icon} {inst.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Jadwal */}
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Jadwal <span className="text-red-400">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={row.day}
                          onChange={e => updateRow(row.id, 'day', e.target.value)}
                          className="flex-[3] px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent transition-colors appearance-none"
                        >
                          {DAYS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <select
                          value={row.time}
                          onChange={e => updateRow(row.id, 'time', e.target.value)}
                          className="flex-[4] px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent transition-colors appearance-none"
                        >
                          {getAvailableTimeOptions(row.day).map(t => {
                            const endH = parseInt(t.split(':')[0]) + 1
                            const end = `${String(endH).padStart(2, '0')}:00`
                            return (
                              <option key={t} value={t}>{t}-{end}</option>
                            )
                          })}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add row */}
            <button
              type="button"
              onClick={addRow}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
            >
              <Plus size={16} />
              Tambah Siswa
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <><Loader2 size={18} className="animate-spin" /> Mengirim...</>
            ) : (
              <><Send size={18} /> Daftar Sekarang</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
