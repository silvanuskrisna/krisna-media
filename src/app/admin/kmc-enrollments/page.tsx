'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, Search, Filter, Music, Check, X, Edit2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Enrollment } from '@/lib/types'

const INSTRUMENTS = ['Gitar', 'Piano', 'Drum']

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  active: { label: 'Aktif', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  cuti: { label: 'Cuti', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  inactive: { label: 'Nonaktif', color: 'text-gray-400 bg-gray-500/10 border-gray-500/30' },
}

export default function AdminKMCEnrollments() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [instrumentFilter, setInstrumentFilter] = useState('all')

  // Edit modal
  const [editEnrollment, setEditEnrollment] = useState<any | null>(null)
  const [editTuition, setEditTuition] = useState('')
  const [editPrepaid, setEditPrepaid] = useState(1)
  const [editAdminNotes, setEditAdminNotes] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetchEnrollments()
  }, [])

  async function fetchEnrollments() {
    try {
      setLoading(true)

      // Fetch enrollments with student and member info
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, student:students!inner(*), lesson_schedules(*)')

      if (error) throw error

      // Get member info for each student
      const studentIds = [...new Set((data || []).map(e => e.student_id))]
      const { data: studentsData } = await supabase
        .from('students')
        .select('*, member:members!inner(full_name, phone, whatsapp)')
        .in('id', studentIds)

      const studentMap = new Map((studentsData || []).map(s => [s.id, s]))

      const enriched = (data || []).map(e => ({
        ...e,
        student_detail: studentMap.get(e.student_id) || e.student,
      }))

      setEnrollments(enriched)
    } catch (err) {
      console.error('Failed to fetch enrollments:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate() {
    if (!editEnrollment) return
    setEditing(true)
    try {
      const statusChanged = editStatus !== editEnrollment.status
      const updates: any = { updated_at: new Date().toISOString() }
      if (editTuition !== '') updates.tuition_fee = parseFloat(editTuition) || null
      if (statusChanged) updates.status = editStatus
      updates.admin_notes = editAdminNotes || null

      const { error } = await supabase
        .from('enrollments')
        .update(updates)
        .eq('id', editEnrollment.id)

      if (error) throw error

      // If activating with prepaid, create invoice
      if (statusChanged && editStatus === 'active' && editTuition !== '' && editPrepaid > 1) {
        const fee = parseFloat(editTuition) || 0
        const totalAmount = fee * editPrepaid
        const memberId = editEnrollment.student_detail?.member_id
        const studentName = editEnrollment.student_detail?.name || 'Siswa'
        const period = editEnrollment.start_date
          ? new Date(editEnrollment.start_date + 'T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
          : 'Bulan Ini'

        // Create invoice
        const { data: invoice, error: invErr } = await supabase
          .from('invoices')
          .insert({
            member_id: memberId,
            period: period + ` (${editPrepaid} bln)`,
            total: totalAmount,
            status: 'pending',
            due_date: null,
          })
          .select()
          .single()

        if (invErr) throw invErr

        // Create invoice item
        const { error: itemErr } = await supabase
          .from('invoice_items')
          .insert({
            invoice_id: invoice.id,
            enrollment_id: editEnrollment.id,
            student_name: studentName,
            instrument: editEnrollment.instrument,
            amount: totalAmount,
          })

        if (itemErr) throw itemErr
      }

      // Sync kmc_schedules when status changes
      if (statusChanged) {
        const schedules = editEnrollment.lesson_schedules || []
        if (schedules.length > 0) {
          const isActive = editStatus === 'active'
          for (const sch of schedules) {
            console.log('Edit mode - locking slot:', sch.day, sch.start_time, '→ available:', !isActive)
            const { error: schedErr } = await supabase
              .from('kmc_schedules')
              .update({ is_available: !isActive })
              .eq('day', sch.day)
              .eq('start_time', sch.start_time)
            if (schedErr) {
              console.error('Edit kmc_schedules update error:', schedErr)
              alert('Gagal update slot (edit) ' + sch.day + ' ' + sch.start_time + ': ' + schedErr.message)
            }
          }
        }
      }

      setEditEnrollment(null)
      await fetchEnrollments()
    } catch (err: any) {
      alert('Gagal update: ' + err.message)
    } finally {
      setEditing(false)
    }
  }

  async function handleQuickStatus(id: string, status: string) {
    try {
      // Get enrollment's schedule info
      const enrollment = enrollments.find(e => e.id === id)
      const schedules = enrollment?.lesson_schedules || []

      const { error } = await supabase
        .from('enrollments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      // Sync kmc_schedules based on status change
      if (schedules.length > 0) {
        const isActive = status === 'active'
        for (const sch of schedules) {
          console.log('Locking slot:', sch.day, sch.start_time, '→ available:', !isActive)
          const { error: schedErr } = await supabase
            .from('kmc_schedules')
            .update({ is_available: !isActive })
            .eq('day', sch.day)
            .eq('start_time', sch.start_time)
          if (schedErr) {
            console.error('kmc_schedules update error:', schedErr)
            alert('Gagal update slot ' + sch.day + ' ' + sch.start_time + ': ' + schedErr.message)
          } else {
            console.log('Slot updated successfully')
          }
        }
      }

      await fetchEnrollments()
    } catch (err: any) {
      alert('Gagal update status: ' + err.message)
    }
  }

  const filtered = enrollments.filter(e => {
    const matchesSearch =
      e.student_detail?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.student_detail?.member?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.instrument?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter
    const matchesInstrument = instrumentFilter === 'all' || e.instrument === instrumentFilter
    return matchesSearch && matchesStatus && matchesInstrument
  })

  const pendingCount = enrollments.filter(e => e.status === 'pending').length
  const activeCount = enrollments.filter(e => e.status === 'active').length
  const cutiCount = enrollments.filter(e => e.status === 'cuti').length

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
      <div>
        <h1 className="text-2xl font-bold text-foreground">KMC Enrollments</h1>
        <p className="text-muted-foreground mt-1">Kelola semua pendaftaran kursus musik</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 border border-border">
          <p className="text-xs text-yellow-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-border">
          <p className="text-xs text-green-400 mb-1">Aktif</p>
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-border">
          <p className="text-xs text-blue-400 mb-1">Cuti</p>
          <p className="text-2xl font-bold text-foreground">{cutiCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama siswa, parent, atau instrument..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-muted-foreground"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="active">Aktif</option>
          <option value="cuti">Cuti</option>
          <option value="inactive">Nonaktif</option>
        </select>
        <select
          value={instrumentFilter}
          onChange={(e) => setInstrumentFilter(e.target.value)}
          className="px-3 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-muted-foreground"
        >
          <option value="all">Semua Instrument</option>
          {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <FileText size={48} className="mx-auto mb-4 opacity-40 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-1">Belum ada enrollment</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'Coba filter lain' : 'Enrollment akan muncul setelah member mendaftar'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((enrollment) => {
            const statusCfg = STATUS_CONFIG[enrollment.status] || STATUS_CONFIG.pending
            const parent = enrollment.student_detail?.member
            const student = enrollment.student_detail

            return (
              <div key={enrollment.id} className="glass rounded-xl p-4 border border-border">
                <div className="flex items-start justify-between gap-4">
                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Music size={16} className="text-accent shrink-0" />
                      <span className="font-semibold text-foreground">{enrollment.instrument}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{student?.name || '-'}</span>
                      {student?.age && <span className="text-muted-foreground"> · {student.age} tahun</span>}
                    </p>
                    {parent && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Parent: {parent.full_name}
                        {parent.whatsapp && ` · ${parent.whatsapp}`}
                      </p>
                    )}
                    {/* Schedule */}
                    {enrollment.lesson_schedules?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {enrollment.lesson_schedules.map((sch: any) => (
                          <span key={sch.id} className="text-[11px] px-2 py-0.5 bg-card rounded-full text-muted-foreground border border-border/50">
                            {sch.day} {sch.start_time?.slice(0, 5)}-{sch.end_time?.slice(0, 5)}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Tuition */}
                    {enrollment.tuition_fee && (
                      <p className="text-xs text-foreground mt-1">
                        Rp {enrollment.tuition_fee.toLocaleString('id-ID')}/bln
                      </p>
                    )}
                    {/* Start date */}
                    {enrollment.start_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Mulai {formatDate(enrollment.start_date)}
                      </p>
                    )}
                    {/* Admin notes */}
                    {enrollment.admin_notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Catatan: {enrollment.admin_notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {enrollment.status === 'pending' && (
                      <button
                        onClick={() => handleQuickStatus(enrollment.id, 'active')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Check size={14} />
                        Setujui
                      </button>
                    )}
                    {enrollment.status === 'pending' && (
                      <button
                        onClick={() => handleQuickStatus(enrollment.id, 'inactive')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        <X size={14} />
                        Tolak
                      </button>
                    )}
                    {enrollment.status === 'active' && (
                      <button
                        onClick={() => handleQuickStatus(enrollment.id, 'cuti')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        Cuti
                      </button>
                    )}
                    {enrollment.status === 'cuti' && (
                      <button
                        onClick={() => handleQuickStatus(enrollment.id, 'active')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        Aktifkan
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditEnrollment(enrollment)
                        setEditTuition(enrollment.tuition_fee?.toString() || '')
                        setEditPrepaid(1)
                        setEditAdminNotes(enrollment.admin_notes || '')
                        setEditStatus(enrollment.status)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-card/80 text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium transition-colors border border-border"
                    >
                      <Edit2 size={14} />
                      Edit Detail
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setEditEnrollment(null)}>
          <div className="glass rounded-xl p-6 border border-border w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                Edit Enrollment: {editEnrollment.instrument}
              </h3>
              <button onClick={() => setEditEnrollment(null)} className="p-1 hover:bg-card rounded-lg text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleUpdate() }} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Aktif</option>
                  <option value="cuti">Cuti</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Biaya per Bulan (Rp)
                </label>
                <input
                  type="number"
                  value={editTuition}
                  onChange={(e) => setEditTuition(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent"
                  placeholder="Contoh: 400000"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Bayar untuk <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={editPrepaid}
                    onChange={(e) => setEditPrepaid(parseInt(e.target.value))}
                    className="px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent"
                  >
                    {[1,2,3,4,5,6].map(n => (
                      <option key={n} value={n}>{n} bulan</option>
                    ))}
                  </select>
                  {editTuition && parseFloat(editTuition) > 0 && (
                    <span className="text-xs text-muted-foreground">
                      = Rp {(parseFloat(editTuition) * editPrepaid).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {editPrepaid > 1
                    ? `Invoice akan dibuat otomatis sebesar Rp ${(parseFloat(editTuition || '0') * editPrepaid).toLocaleString('id-ID')}`
                    : 'Invoice dibuat manual per bulan (di menu Tagihan)'}
                </p>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Catatan Admin</label>
                <textarea
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent resize-none"
                  placeholder="Catatan internal..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditEnrollment(null)}
                  className="flex-1 px-3 py-2 bg-card hover:bg-card/80 text-foreground rounded-lg text-sm font-medium transition-colors border border-border"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="flex-1 px-3 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {editing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
