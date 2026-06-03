'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, Edit, Clock, Calendar, X } from 'lucide-react'

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']

const TIME_OPTIONS = [
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
]

interface Schedule {
  id: string
  day: string
  start_time: string
  end_time: string
  is_available: boolean
  created_at: string
}

export default function AdminKMCSchedules() {
  const router = useRouter()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  
  // Form state
  const [day, setDay] = useState('Senin')
  const [startTime, setStartTime] = useState('12:00')
  const [endTime, setEndTime] = useState('13:00')

  // Auto-update end time when start time changes (always +1 hour)
  useEffect(() => {
    const startHour = parseInt(startTime.split(':')[0])
    setEndTime(`${String(startHour + 1).padStart(2, '0')}:00`)
  }, [startTime])

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth?redirect=/admin/kmc-schedules')
      return
    }
    fetchSchedules()
  }

  async function fetchSchedules() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('kmc_schedules')
        .select('*')
        .order('day')
        .order('start_time')

      if (error) {
        console.error('Error fetching schedules:', error)
        alert('Gagal memuat jadwal: ' + error.message)
        return
      }
      
      // Sort by day order (Senin->Jumat) then by time
      const sorted = (data || []).sort((a, b) => {
        const dayA = DAYS.indexOf(a.day)
        const dayB = DAYS.indexOf(b.day)
        if (dayA !== dayB) return dayA - dayB
        return a.start_time.localeCompare(b.start_time)
      })
      setSchedules(sorted)
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Terjadi kesalahan saat memuat jadwal')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const scheduleData = {
      day,
      start_time: startTime + ':00',
      end_time: endTime + ':00',
      is_available: true,
    }

    let error
    if (editingSchedule) {
      const res = await supabase
        .from('kmc_schedules')
        .update(scheduleData)
        .eq('id', editingSchedule.id)
      error = res.error
    } else {
      const res = await supabase
        .from('kmc_schedules')
        .insert(scheduleData)
      error = res.error
    }

    if (error) {
      alert('Gagal menyimpan schedule: ' + error.message)
    } else {
      setShowModal(false)
      setEditingSchedule(null)
      resetForm()
      fetchSchedules()
    }
  }

  async function toggleAvailability(id: string, current: boolean) {
    const { error } = await supabase
      .from('kmc_schedules')
      .update({ is_available: !current })
      .eq('id', id)

    if (error) {
      alert('Gagal update availability')
    } else {
      fetchSchedules()
    }
  }

  async function deleteSchedule(id: string) {
    if (!confirm('Hapus schedule ini?')) return

    const { error } = await supabase
      .from('kmc_schedules')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Gagal hapus schedule')
    } else {
      fetchSchedules()
    }
  }

  function resetForm() {
    setDay('Senin')
    setStartTime('12:00')
    setEndTime('13:00')
    setEditingSchedule(null)
  }

  function openEdit(schedule: Schedule) {
    setEditingSchedule(schedule)
    setDay(schedule.day)
    setStartTime(schedule.start_time.slice(0, 5))
    // End time will auto-update via useEffect
    setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="pt-32 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors group mb-6"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Kembali ke Admin
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Jadwal KMC
              </h1>
              <p className="text-muted text-sm">
                Kelola slot waktu tersedia untuk Kursus Musik
              </p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-5 py-2.5 rounded-lg transition-all"
            >
              <Plus size={18} />
              Tambah Jadwal
            </button>
          </div>
        </div>
      </section>

      <div className="section-divider mx-6 md:mx-12" />

      {/* Schedules by Day */}
      <section className="py-12 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          {loading ? (
            <div className="text-center py-20 text-muted-foreground">
              Memuat jadwal...
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-20">
              <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Belum ada jadwal
              </h3>
              <p className="text-muted text-sm mb-6">
                Tambahkan slot waktu tersedia untuk Kursus Musik
              </p>
              <button
                onClick={() => {
                  resetForm()
                  setShowModal(true)
                }}
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-5 py-2.5 rounded-lg transition-all"
              >
                <Plus size={18} />
                Tambah Jadwal Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {DAYS.map((day) => {
                const daySchedules = schedules.filter((s) => s.day === day)
                if (daySchedules.length === 0) return null

                const available = daySchedules.filter((s) => s.is_available).length

                return (
                  <div
                    key={day}
                    className="glass rounded-xl p-5 border border-border"
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Calendar size={20} className="text-accent" />
                        <div>
                          <h3 className="font-semibold text-foreground">{day}</h3>
                          <p className="text-xs text-muted-foreground">
                            {available} dari {daySchedules.length} slot tersedia
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setDay(day)
                            setStartTime('12:00')
                            setShowModal(true)
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover px-3 py-1.5 rounded-lg border border-accent/30 hover:border-accent/50 transition-colors"
                        >
                          <Plus size={14} />
                          Tambah Slot
                        </button>
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div className="flex flex-wrap gap-2">
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className={`group relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all cursor-pointer border ${
                            schedule.is_available
                              ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                              : 'bg-card/50 text-muted-foreground border-border hover:bg-card'
                          }`}
                          onClick={() => toggleAvailability(schedule.id, schedule.is_available)}
                          title={schedule.is_available ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                        >
                          <Clock size={12} className="shrink-0 opacity-60" />
                          <span>
                            {schedule.start_time.slice(0, 5)}–{schedule.end_time.slice(0, 5)}
                          </span>
                          
                          {/* Hover actions */}
                          <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openEdit(schedule)
                              }}
                              className="p-0.5 rounded hover:bg-white/10 text-foreground/60 hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Edit size={11} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteSchedule(schedule.id)
                              }}
                              className="p-0.5 rounded hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass rounded-2xl p-8 max-w-md w-full border border-border animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Day */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hari
                </label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-accent transition-colors"
                  required
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Jam Mulai
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-accent transition-colors"
                  required
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  Durasi: 60 menit (otomatis {endTime})
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg transition-all"
              >
                {editingSchedule ? 'Update' : 'Tambah'} Jadwal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
