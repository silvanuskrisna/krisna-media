'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Search, Plus, ChevronDown, ChevronRight, Music, Phone, MapPin, User, X, Edit2, Trash2, Check, Loader2, GraduationCap } from 'lucide-react'
import type { Member, Student, Enrollment, LessonSchedule, MemberWithDetails } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const INSTRUMENTS = ['Gitar', 'Piano', 'Drum']
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const TIME_OPTIONS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  active: 'text-green-400 bg-green-500/10 border-green-500/30',
  cuti: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  inactive: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  active: 'Aktif',
  cuti: 'Cuti',
  inactive: 'Nonaktif',
}

export default function AdminKMCMembers() {
  const [members, setMembers] = useState<MemberWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedMember, setExpandedMember] = useState<string | null>(null)
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  // Add student modal
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [addStudentMemberId, setAddStudentMemberId] = useState<string | null>(null)
  const [newStudentName, setNewStudentName] = useState('')
  const [newStudentAge, setNewStudentAge] = useState('')
  const [addingStudent, setAddingStudent] = useState(false)

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberWhatsapp, setNewMemberWhatsapp] = useState('')
  const [newMemberAddress, setNewMemberAddress] = useState('')
  const [newMemberReferral, setNewMemberReferral] = useState('')
  const [addingMember, setAddingMember] = useState(false)

  // Add enrollment modal
  const [showAddEnrollment, setShowAddEnrollment] = useState(false)
  const [addEnrollmentStudentId, setAddEnrollmentStudentId] = useState<string | null>(null)
  const [newInstrument, setNewInstrument] = useState('Gitar')
  const [newDay, setNewDay] = useState('Senin')
  const [newStartTime, setNewStartTime] = useState('14:00')
  const [newStartDate, setNewStartDate] = useState('')
  const [addingEnrollment, setAddingEnrollment] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    try {
      setLoading(true)

      // Fetch all members (using service_role/admin via RLS — admin can see all)
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .order('full_name')

      if (membersError) throw membersError

      // Fetch all students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('name')

      if (studentsError) throw studentsError

      // Fetch all enrollments with schedules
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*, lesson_schedules(*)')

      if (enrollmentsError) throw enrollmentsError

      // Assemble the nested structure
      const membersWithDetails: MemberWithDetails[] = (membersData || []).map(m => ({
        ...m,
        students: (studentsData || [])
          .filter(s => s.member_id === m.id)
          .map(s => ({
            ...s,
            enrollments: (enrollmentsData || [])
              .filter(e => e.student_id === s.id)
              .map(e => ({
                ...e,
                lesson_schedules: e.lesson_schedules || [],
              })),
          })),
      }))

      setMembers(membersWithDetails)
    } catch (err) {
      console.error('Failed to fetch members:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMember() {
    if (!newMemberName.trim()) return
    setAddingMember(true)
    try {
      const { data, error } = await supabase
        .from('members')
        .insert({
          full_name: newMemberName.trim(),
          whatsapp: newMemberWhatsapp.trim() || null,
          address: newMemberAddress.trim() || null,
          referral_source: newMemberReferral.trim() || null,
        })
        .select()
        .single()

      if (error) throw error
      await fetchMembers()
      setShowAddMember(false)
      setNewMemberName('')
      setNewMemberWhatsapp('')
      setNewMemberAddress('')
      setNewMemberReferral('')
    } catch (err: any) {
      alert('Gagal menambahkan member: ' + err.message)
    } finally {
      setAddingMember(false)
    }
  }

  async function handleAddStudent() {
    if (!addStudentMemberId || !newStudentName.trim()) return
    setAddingStudent(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .insert({
          member_id: addStudentMemberId,
          name: newStudentName.trim(),
          age: newStudentAge ? parseInt(newStudentAge) : null,
        })
        .select()
        .single()

      if (error) throw error
      await fetchMembers()
      setShowAddStudent(false)
      setNewStudentName('')
      setNewStudentAge('')
    } catch (err: any) {
      alert('Gagal menambahkan siswa: ' + err.message)
    } finally {
      setAddingStudent(false)
    }
  }

  async function handleAddEnrollment() {
    if (!addEnrollmentStudentId) return
    setAddingEnrollment(true)
    try {
      const endHour = parseInt(newStartTime.split(':')[0]) + 1
      const endTime = `${String(endHour).padStart(2, '0')}:00`

      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          student_id: addEnrollmentStudentId,
          instrument: newInstrument,
          status: 'pending',
          sessions_per_month: 4,
          start_date: newStartDate || null,
        })
        .select()
        .single()

      if (enrollError) throw enrollError

      // Create schedule
      const { error: scheduleError } = await supabase
        .from('lesson_schedules')
        .insert({
          enrollment_id: enrollment.id,
          day: newDay,
          start_time: newStartTime + ':00',
          end_time: endTime + ':00',
        })

      if (scheduleError) throw scheduleError

      await fetchMembers()
      setShowAddEnrollment(false)
      setNewInstrument('Gitar')
      setNewDay('Senin')
      setNewStartTime('14:00')
      setNewStartDate('')
    } catch (err: any) {
      alert('Gagal menambahkan pendaftaran: ' + err.message)
    } finally {
      setAddingEnrollment(false)
    }
  }

  async function handleDeleteStudent(studentId: string) {
    if (!confirm('Yakin mau hapus siswa ini? Semua data enrollments juga akan terhapus.')) return
    try {
      const { error } = await supabase.from('students').delete().eq('id', studentId)
      if (error) throw error
      await fetchMembers()
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message)
    }
  }

  async function handleUpdateEnrollmentStatus(enrollmentId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', enrollmentId)

      if (error) throw error
      await fetchMembers()
    } catch (err: any) {
      alert('Gagal update status: ' + err.message)
    }
  }

  async function handleDeleteEnrollment(enrollmentId: string) {
    if (!confirm('Yakin mau hapus enrollment ini?')) return
    try {
      const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId)
      if (error) throw error
      await fetchMembers()
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message)
    }
  }

  // Compute stats
  const totalStudents = members.reduce((sum, m) => sum + m.students.length, 0)
  const totalEnrollments = members.reduce((sum, m) =>
    sum + m.students.reduce((s, st) => s + st.enrollments.length, 0), 0)
  const activeEnrollments = members.reduce((sum, m) =>
    sum + m.students.reduce((s, st) =>
      s + st.enrollments.filter(e => e.status === 'active').length, 0), 0)
  const pendingEnrollments = members.reduce((sum, m) =>
    sum + m.students.reduce((s, st) =>
      s + st.enrollments.filter(e => e.status === 'pending').length, 0), 0)

  const filteredMembers = members.filter(m =>
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone?.includes(searchQuery) ||
    m.students.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground animate-pulse">Memuat data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">KMC Member</h1>
          <p className="text-muted-foreground mt-1">Kelola member, siswa, dan pendaftaran kursus</p>
        </div>
        <button
          onClick={() => setShowAddMember(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors shrink-0"
        >
          <Plus size={16} />
          Tambah Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <GraduationCap size={16} />
            <span>Orang Tua</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{members.length}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <User size={16} />
            <span>Siswa</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <Music size={16} />
            <span>Aktif</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{activeEnrollments}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 text-yellow-400 text-sm mb-1">
            <Music size={16} />
            <span>Pending</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{pendingEnrollments}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari nama parent, no telp, atau nama siswa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors"
        />
      </div>

      {/* Empty state */}
      {filteredMembers.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <Users size={48} className="mx-auto mb-4 opacity-40 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            {searchQuery ? 'Member tidak ditemukan' : 'Belum ada member'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'Coba kata kunci lain' : (
              <>
                Klik <span className="text-accent">Tambah Member</span> untuk menambahkan member baru
              </>
            )}
          </p>
        </div>
      )}

      {/* Members List */}
      {filteredMembers.length > 0 && (
        <div className="space-y-4">
          {filteredMembers.map((member) => (
            <div key={member.id} className="glass rounded-xl border border-border overflow-hidden">
              {/* Member Header */}
              <button
                onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-card/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-medium text-accent shrink-0">
                    {(member.full_name?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{member.full_name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      {member.whatsapp && (
                        <span className="flex items-center gap-1">
                          <Phone size={10} /> {member.whatsapp}
                        </span>
                      )}
                      {member.students.length > 0 && (
                        <span>{member.students.length} siswa</span>
                      )}
                      {member.students.reduce((s, st) => s + st.enrollments.filter(e => e.status === 'active').length, 0) > 0 && (
                        <span className="text-green-400">
                          {member.students.reduce((s, st) => s + st.enrollments.filter(e => e.status === 'active').length, 0)} aktif
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{formatDate(member.created_at)}</span>
                  {expandedMember === member.id ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronRight size={18} className="text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded: Students */}
              {expandedMember === member.id && (
                <div className="border-t border-border">
                  {/* Add Student Button */}
                  <div className="p-3 bg-card/30">
                    <button
                      onClick={() => { setAddStudentMemberId(member.id); setShowAddStudent(true) }}
                      className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/90 transition-colors"
                    >
                      <Plus size={14} />
                      Tambah Siswa
                    </button>
                  </div>

                  {member.students.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-sm text-muted-foreground">Belum ada siswa</p>
                    </div>
                  )}

                  {member.students.map((student) => (
                    <div key={student.id} className="border-t border-border/50">
                      {/* Student Header */}
                      <div
                        onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                        className="w-full flex items-center justify-between p-3 pl-12 hover:bg-card/30 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-xs font-medium text-foreground">
                            {(student.name[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{student.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {student.age ? `${student.age} tahun` : 'Umur -'}
                              {student.enrollments.length > 0 && ` · ${student.enrollments.length} pendaftaran`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteStudent(student.id) }}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-400 transition-colors"
                            title="Hapus siswa"
                          >
                            <Trash2 size={14} />
                          </button>
                          {expandedStudent === student.id ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                        </div>
                      </div>

                      {/* Expanded: Enrollments */}
                      {expandedStudent === student.id && (
                        <div className="pl-16 pr-4 pb-4 space-y-2">
                          {/* Add Enrollment */}
                          <button
                            onClick={() => { setAddEnrollmentStudentId(student.id); setShowAddEnrollment(true) }}
                            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/90 transition-colors"
                          >
                            <Plus size={14} />
                            Tambah Pendaftaran
                          </button>

                          {student.enrollments.length === 0 && (
                            <p className="text-xs text-muted-foreground py-2">Belum ada pendaftaran</p>
                          )}

                          {student.enrollments.map((enrollment) => (
                            <div key={enrollment.id} className="bg-card rounded-lg p-3 border border-border/50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Music size={16} className="text-accent" />
                                  <span className="text-sm font-medium text-foreground">{enrollment.instrument}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[enrollment.status] || 'text-muted-foreground'}`}>
                                    {STATUS_LABELS[enrollment.status] || enrollment.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {/* Quick status change */}
                                  {enrollment.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateEnrollmentStatus(enrollment.id, 'active')}
                                        className="p-1 hover:bg-green-500/10 rounded text-muted-foreground hover:text-green-400 transition-colors"
                                        title="Aktifkan"
                                      >
                                        <Check size={14} />
                                      </button>
                                    </>
                                  )}
                                  {enrollment.status === 'active' && (
                                    <button
                                      onClick={() => handleUpdateEnrollmentStatus(enrollment.id, 'cuti')}
                                      className="p-1 hover:bg-blue-500/10 rounded text-muted-foreground hover:text-blue-400 transition-colors text-[10px]"
                                      title="Cuti"
                                    >
                                      Cuti
                                    </button>
                                  )}
                                  {enrollment.status === 'cuti' && (
                                    <button
                                      onClick={() => handleUpdateEnrollmentStatus(enrollment.id, 'active')}
                                      className="p-1 hover:bg-green-500/10 rounded text-muted-foreground hover:text-green-400 transition-colors text-[10px]"
                                      title="Aktifkan kembali"
                                    >
                                      Aktif
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteEnrollment(enrollment.id)}
                                    className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-400 transition-colors"
                                    title="Hapus enrollment"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              {/* Lesson Schedule */}
                              {enrollment.lesson_schedules.length > 0 && (
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                  {enrollment.lesson_schedules.map(sch => (
                                    <div key={sch.id} className="flex items-center gap-2">
                                      <span>{sch.day}</span>
                                      <span>{sch.start_time.slice(0, 5)} - {sch.end_time.slice(0, 5)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {enrollment.start_date && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Mulai: {new Date(enrollment.start_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                              )}

                              {enrollment.tuition_fee && (
                                <div className="text-xs text-foreground mt-1">
                                  Rp {enrollment.tuition_fee.toLocaleString('id-ID')}/bln
                                </div>
                              )}

                              {enrollment.admin_notes && (
                                <div className="text-xs text-muted-foreground mt-1 italic">
                                  {enrollment.admin_notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowAddMember(false)}>
          <div className="glass rounded-xl p-6 border border-border w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Tambah Member</h3>
              <button onClick={() => setShowAddMember(false)} className="p-1 hover:bg-card rounded-lg text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleAddMember() }} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent"
                  placeholder="Nama orang tua / wali"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={newMemberWhatsapp}
                  onChange={(e) => setNewMemberWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent"
                  placeholder="Contoh: 0812..."
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Alamat</label>
                <textarea
                  value={newMemberAddress}
                  onChange={(e) => setNewMemberAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent resize-none"
                  rows={2}
                  placeholder="Alamat rumah"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Tahu dari</label>
                <select
                  value={newMemberReferral}
                  onChange={(e) => setNewMemberReferral(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">Pilih sumber...</option>
                  <option value="teman">Teman / Keluarga</option>
                  <option value="instagram">Instagram</option>
                  <option value="google">Google</option>
                  <option value="facebook">Facebook</option>
                  <option value="jalan">Lewat jalan / Lihat papan nama</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 px-3 py-2 bg-card hover:bg-card/80 text-foreground rounded-lg text-sm font-medium transition-colors border border-border"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addingMember || !newMemberName.trim()}
                  className="flex-1 px-3 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {addingMember ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowAddStudent(false)}>
          <div className="glass rounded-xl p-6 border border-border w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Tambah Siswa</h3>
              <button onClick={() => setShowAddStudent(false)} className="p-1 hover:bg-card rounded-lg text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleAddStudent() }} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent"
                  placeholder="Nama siswa"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Umur</label>
                <input
                  type="number"
                  value={newStudentAge}
                  onChange={(e) => setNewStudentAge(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent"
                  placeholder="Contoh: 15"
                  min={1} max={100}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="flex-1 px-3 py-2 bg-card hover:bg-card/80 text-foreground rounded-lg text-sm font-medium transition-colors border border-border"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addingStudent || !newStudentName.trim()}
                  className="flex-1 px-3 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {addingStudent ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Enrollment Modal */}
      {showAddEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowAddEnrollment(false)}>
          <div className="glass rounded-xl p-6 border border-border w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Tambah Pendaftaran</h3>
              <button onClick={() => setShowAddEnrollment(false)} className="p-1 hover:bg-card rounded-lg text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleAddEnrollment() }} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Instrument</label>
                <select
                  value={newInstrument}
                  onChange={(e) => setNewInstrument(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent"
                >
                  {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Hari</label>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent"
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Jam Mulai</label>
                <select
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent"
                >
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Mulai</label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEnrollment(false)}
                  className="flex-1 px-3 py-2 bg-card hover:bg-card/80 text-foreground rounded-lg text-sm font-medium transition-colors border border-border"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addingEnrollment}
                  className="flex-1 px-3 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {addingEnrollment ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
