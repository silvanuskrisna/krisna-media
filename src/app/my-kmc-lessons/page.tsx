'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Music, Calendar, Clock, User, FileText, CheckCircle, Hourglass, XCircle, TrendingUp, ArrowLeft, GraduationCap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

interface EnrollmentWithDetails {
  id: string
  instrument: string
  status: 'pending' | 'active' | 'cuti' | 'inactive'
  age_group: string | null
  experience_level: string | null
  admin_notes: string | null
  created_at: string
  lesson_schedules: {
    id: string
    day: string
    start_time: string
    end_time: string
  }[]
}

interface StudentWithEnrollments {
  id: string
  name: string
  age: number | null
  enrollments: EnrollmentWithDetails[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending Review', color: 'text-yellow-400', icon: Hourglass },
  active: { label: 'Aktif', color: 'text-green-400', icon: TrendingUp },
  cuti: { label: 'Cuti', color: 'text-blue-400', icon: CheckCircle },
  inactive: { label: 'Nonaktif', color: 'text-gray-400', icon: XCircle },
}

const INSTRUMENT_ICONS: Record<string, string> = {
  'Gitar': '🎸',
  'Piano': '🎹',
  'Drum': '🥁',
}

export default function MyKMCLessons() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<StudentWithEnrollments[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth?redirect=/my-kmc-lessons')
        return
      }

      setUser(session.user)
      await fetchData(session.user.id)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  async function fetchData(userId: string) {
    try {
      // Check if user is a member first
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('id', userId)
        .single()

      if (!member) {
        setLoading(false)
        return
      }

      // Fetch students with enrollments and schedules
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('member_id', userId)
        .order('name')

      if (!studentsData) {
        setLoading(false)
        return
      }

      const studentIds = studentsData.map(s => s.id)

      // Fetch all enrollments for these students
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('*, lesson_schedules(*)')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })

      // Assemble
      const result: StudentWithEnrollments[] = studentsData.map(s => ({
        ...s,
        enrollments: (enrollmentsData || [])
          .filter(e => e.student_id === s.id)
          .map(e => ({
            id: e.id,
            instrument: e.instrument,
            status: e.status,
            age_group: e.age_group,
            experience_level: e.experience_level,
            admin_notes: e.admin_notes,
            created_at: e.created_at,
            lesson_schedules: e.lesson_schedules || [],
          })),
      }))

      setStudents(result)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-muted-foreground animate-pulse">Memuat data...</div>
          </div>
        </div>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-16">
        <div className="max-w-2xl mx-auto px-6">
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

  const allEnrollments = students.flatMap(s => s.enrollments)

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors group mb-6"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Kembali ke Beranda
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Kursus Saya</h1>
          <p className="text-muted-foreground">
            {students.length} siswa · {allEnrollments.filter(e => e.status === 'active').length} aktif · {allEnrollments.filter(e => e.status === 'pending').length} pending
          </p>
        </div>

        {/* Students */}
        {students.map((student) => (
          <div key={student.id} className="mb-8">
            {/* Student Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-lg font-bold text-accent">
                {(student.name[0] || '?').toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{student.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {student.age ? `${student.age} tahun` : ''}
                  {student.enrollments.length > 0 ? ` · ${student.enrollments.length} pendaftaran` : ''}
                </p>
              </div>
            </div>

            {student.enrollments.length === 0 && (
              <div className="glass rounded-xl p-6 text-center border border-border mb-4">
                <p className="text-sm text-muted-foreground">
                  Belum ada pendaftaran untuk {student.name}
                </p>
              </div>
            )}

            {/* Enrollment Cards */}
            <div className="space-y-4">
              {student.enrollments.map((enrollment) => {
                const statusCfg = STATUS_CONFIG[enrollment.status] || STATUS_CONFIG.pending
                const StatusIcon = statusCfg.icon
                const instrumentIcon = INSTRUMENT_ICONS[enrollment.instrument] || '🎵'

                return (
                  <div key={enrollment.id} className="glass rounded-xl p-6 border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-2xl">
                          {instrumentIcon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{enrollment.instrument}</h3>
                          <p className="text-xs text-muted-foreground">
                            Terdaftar {formatDate(enrollment.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card ${statusCfg.color}`}>
                        <StatusIcon size={14} />
                        <span className="text-xs font-medium">{statusCfg.label}</span>
                      </div>
                    </div>

                    {/* Schedule info */}
                    {enrollment.lesson_schedules.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {enrollment.lesson_schedules.map((sch) => (
                          <div key={sch.id} className="flex items-center gap-3 p-2.5 bg-card rounded-lg border border-border/50">
                            <div className="flex items-center gap-1.5 text-accent">
                              <Calendar size={14} />
                              <span className="text-sm font-medium">{sch.day}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock size={14} />
                              <span className="text-sm">{sch.start_time.slice(0, 5)} - {sch.end_time.slice(0, 5)}</span>
                            </div>
                            <span className="text-xs text-muted-foreground ml-auto">(1 jam)</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {enrollment.age_group && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Umur: </span>
                          <span className="text-foreground font-medium capitalize">
                            {enrollment.age_group === 'kids' ? 'Anak-anak' : enrollment.age_group === 'teen' ? 'Remaja' : 'Dewasa'}
                          </span>
                        </div>
                      )}
                      {enrollment.experience_level && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Level: </span>
                          <span className="text-foreground font-medium capitalize">
                            {enrollment.experience_level}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Admin Notes */}
                    {enrollment.admin_notes && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-blue-400">
                          <span className="font-medium">Catatan Admin: </span>
                          {enrollment.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Bottom CTA */}
        <div className="glass rounded-xl p-6 border border-border mt-8">
          <h3 className="font-semibold text-foreground mb-2">Ingin daftar lagi?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tambah siswa baru atau daftarkan instrument lain.
          </p>
          <Link
            href="/kmc/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors"
          >
            <Music size={16} />
            Daftar Lagi
          </Link>
        </div>
      </div>
    </div>
  )
}
