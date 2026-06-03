'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Search, Filter, Download, Edit2, Check, X, Music, Calendar, Clock, User, Mail, Phone, FileText, MessageCircle, ExternalLink } from 'lucide-react'
import { formatDate, getWhatsAppUrl } from '@/lib/utils'
import type { Profile } from '@/lib/types'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  confirmed: { label: 'Dikonfirmasi', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  enrolled: { label: 'Sudah Mulai', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  cancelled: { label: 'Dibatalkan', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
}

const INSTRUMENT_ICONS: Record<string, string> = {
  'Gitar': '🎸',
  'Piano': '🎹',
  'Drum': '🥁',
}

interface KMCRegistration {
  id: string
  user_id: string
  student_name: string
  instrument: string
  preferred_day: string
  preferred_time: string | null
  age_group: string | null
  experience_level: string | null
  notes: string | null
  status: string
  admin_notes: string | null
  created_at: string
  updated_at: string
  profile?: Profile
}

export default function AdminKMCRegistrations() {
  const [registrations, setRegistrations] = useState<KMCRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [instrumentFilter, setInstrumentFilter] = useState<string>('all')
  const [selectedRegistration, setSelectedRegistration] = useState<KMCRegistration | null>(null)
  const [editingNotes, setEditingNotes] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchRegistrations()
  }, [])

  async function fetchRegistrations() {
    try {
      // Fetch all registrations
      const { data, error } = await supabase
        .from('kmc_registrations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch profiles for each registration
      const userIds = data?.map(r => r.user_id) || []
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', userIds)

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || [])

      const enrichedData = data?.map(r => ({
        ...r,
        profile: profilesMap.get(r.user_id),
      })) || []

      setRegistrations(enrichedData)
    } catch (err) {
      console.error('Failed to fetch registrations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    // Get the registration first to know the day/time
    const registration = registrations.find(r => r.id === id)
    if (!registration) return

    const { error } = await supabase
      .from('kmc_registrations')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      alert('Gagal update status. Silakan coba lagi.')
      return
    }

    // Sync with kmc_schedules
    if (registration.preferred_time && registration.preferred_day) {
      const startMatch = registration.preferred_time.match(/^(\d{2}:\d{2})/)
      if (startMatch) {
        const startTime = startMatch[1] + ':00' // "12:00" → "12:00:00"

        if (newStatus === 'confirmed' || newStatus === 'enrolled') {
          // Mark slot as unavailable
          await supabase
            .from('kmc_schedules')
            .update({ is_available: false })
            .eq('day', registration.preferred_day)
            .eq('start_time', startTime)
        } else if (newStatus === 'cancelled') {
          // Free up the slot
          await supabase
            .from('kmc_schedules')
            .update({ is_available: true })
            .eq('day', registration.preferred_day)
            .eq('start_time', startTime)
        }
      }
    }

    setRegistrations(registrations.map(r => 
      r.id === id ? { ...r, status: newStatus } : r
    ))
    setSelectedRegistration(null)
  }

  const handleSaveAdminNotes = async () => {
    if (!selectedRegistration) return

    setUpdating(true)
    const { error } = await supabase
      .from('kmc_registrations')
      .update({ 
        admin_notes: adminNotes.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedRegistration.id)

    if (error) {
      alert('Gagal simpan catatan. Silakan coba lagi.')
      setUpdating(false)
      return
    }

    setRegistrations(registrations.map(r => 
      r.id === selectedRegistration.id ? { ...r, admin_notes: adminNotes.trim() || null } : r
    ))
    setEditingNotes(false)
    setSelectedRegistration({ ...selectedRegistration, admin_notes: adminNotes.trim() || null })
    setUpdating(false)
    alert('Catatan berhasil disimpan!')
  }

  const handleExport = () => {
    const headers = ['Tanggal', 'Nama Murid', 'Instrument', 'Hari', 'Waktu', 'Level', 'Umur', 'Status', 'Email', 'Nama Parent']
    const rows = registrations.map(r => [
      formatDate(r.created_at),
      r.student_name,
      r.instrument,
      r.preferred_day,
      r.preferred_time || '-',
      r.experience_level || '-',
      r.age_group || '-',
      r.status,
      r.profile?.full_name || '-',
      '-'
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kmc-registrations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    const matchesInstrument = instrumentFilter === 'all' || r.instrument === instrumentFilter
    return matchesSearch && matchesStatus && matchesInstrument
  })

  const stats = {
    total: registrations.length,
    pending: registrations.filter(r => r.status === 'pending').length,
    confirmed: registrations.filter(r => r.status === 'confirmed').length,
    enrolled: registrations.filter(r => r.status === 'enrolled').length,
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pendaftaran KMC</h1>
          <p className="text-muted-foreground mt-1">Kelola pendaftaran kursus musik</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 border border-border">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Pendaftaran</div>
        </div>
        <div className="glass rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/5">
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-xs text-yellow-400">Pending</div>
        </div>
        <div className="glass rounded-xl p-4 border border-blue-500/30 bg-blue-500/5">
          <div className="text-2xl font-bold text-blue-400">{stats.confirmed}</div>
          <div className="text-xs text-blue-400">Dikonfirmasi</div>
        </div>
        <div className="glass rounded-xl p-4 border border-green-500/30 bg-green-500/5">
          <div className="text-2xl font-bold text-green-400">{stats.enrolled}</div>
          <div className="text-xs text-green-400">Sudah Mulai</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 border border-border space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama murid atau parent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-muted-foreground transition-colors appearance-none"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Dikonfirmasi</option>
              <option value="enrolled">Sudah Mulai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>

          {/* Instrument Filter */}
          <div className="relative">
            <Music size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={instrumentFilter}
              onChange={(e) => setInstrumentFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-muted-foreground transition-colors appearance-none"
            >
              <option value="all">Semua Instrument</option>
              <option value="Gitar">🎸 Gitar</option>
              <option value="Piano">🎹 Piano</option>
              <option value="Drum">🥁 Drum</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredRegistrations.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center border border-border">
          <Users size={48} className="mx-auto mb-4 opacity-40 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            {searchQuery || statusFilter !== 'all' || instrumentFilter !== 'all'
              ? 'Tidak ada data yang sesuai filter'
              : 'Belum ada pendaftaran'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || statusFilter !== 'all' || instrumentFilter !== 'all'
              ? 'Coba ubah filter pencarian'
              : 'Pendaftaran akan muncul setelah user mendaftar'}
          </p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Murid</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Instrument</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Jadwal</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Level</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Parent</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tanggal</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => (
                  <tr
                    key={reg.id}
                    className="border-b border-border last:border-b-0 hover:bg-card/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{reg.student_name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-lg">{INSTRUMENT_ICONS[reg.instrument]}</span>
                      <span className="text-foreground ml-2">{reg.instrument}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-foreground">{reg.preferred_day}</div>
                      <div className="text-xs text-muted-foreground">{reg.preferred_time || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-foreground capitalize">{reg.experience_level || '-'}</div>
                      <div className="text-xs text-muted-foreground capitalize">{reg.age_group || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-foreground">{reg.profile?.full_name || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[reg.status]?.color}`}>
                        {STATUS_CONFIG[reg.status]?.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-foreground text-xs">{formatDate(reg.created_at)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRegistration(reg)
                            setAdminNotes(reg.admin_notes || '')
                            setEditingNotes(false)
                          }}
                          className="px-3 py-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-xs font-medium transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl p-6 border border-border max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Detail Pendaftaran</h2>
              <button
                onClick={() => setSelectedRegistration(null)}
                className="p-2 hover:bg-card rounded-lg transition-colors text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_CONFIG[selectedRegistration.status]?.color}`}>
                  {STATUS_CONFIG[selectedRegistration.status]?.label}
                </span>
              </div>

              {/* Data Murid */}
              <div className="glass rounded-xl p-4 border border-border">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <User size={16} />
                  Data Murid
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Nama</div>
                    <div className="text-foreground font-medium">{selectedRegistration.student_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Instrument</div>
                    <div className="text-foreground font-medium">{selectedRegistration.instrument}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Level</div>
                    <div className="text-foreground capitalize">{selectedRegistration.experience_level || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Umur</div>
                    <div className="text-foreground capitalize">{selectedRegistration.age_group || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Preferensi Jadwal */}
              <div className="glass rounded-xl p-4 border border-border">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar size={16} />
                  Preferensi Jadwal
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Hari</div>
                    <div className="text-foreground">{selectedRegistration.preferred_day}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Waktu</div>
                    <div className="text-foreground capitalize">{selectedRegistration.preferred_time || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Catatan Pendaftaran */}
              {selectedRegistration.notes && (
                <div className="glass rounded-xl p-4 border border-border">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    Catatan dari Murid
                  </h3>
                  <p className="text-sm text-foreground">{selectedRegistration.notes}</p>
                </div>
              )}

              {/* Catatan Admin */}
              <div className="glass rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <FileText size={16} />
                    Catatan Admin
                  </h3>
                  {!editingNotes && (
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="text-xs text-accent hover:text-accent/90 flex items-center gap-1 transition-colors"
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>
                  )}
                </div>

                {editingNotes ? (
                  <div className="space-y-3">
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      placeholder="Tambahkan catatan internal..."
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveAdminNotes}
                        disabled={updating}
                        className="px-4 py-2 bg-accent hover:bg-accent/90 disabled:bg-muted text-accent-foreground rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        {updating && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                        Simpan
                      </button>
                      <button
                        onClick={() => {
                          setEditingNotes(false)
                          setAdminNotes(selectedRegistration.admin_notes || '')
                        }}
                        className="px-4 py-2 bg-card hover:bg-card/80 text-foreground rounded-lg text-sm font-medium transition-colors border border-border"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {selectedRegistration.admin_notes || 'Belum ada catatan admin'}
                  </p>
                )}
              </div>

              {/* Update Status */}
              <div className="glass rounded-xl p-4 border border-border">
                <h3 className="font-semibold text-foreground mb-3">Update Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusUpdate(selectedRegistration.id, key)}
                      disabled={selectedRegistration.status === key}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        selectedRegistration.status === key
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : config.color + ' hover:opacity-80'
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp Actions */}
              <div className="glass rounded-xl p-4 border border-border">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MessageCircle size={16} />
                  Kirim WhatsApp
                </h3>
                <div className="space-y-2">
                  {/* Template: Konfirmasi Pendaftaran */}
                  {selectedRegistration.status === 'pending' && (
                    <a
                      href={getWhatsAppUrl(
                        '-',
                        `Halo Kak ${selectedRegistration.profile?.full_name || selectedRegistration.student_name}! 🎉\n\nTerima kasih sudah mendaftar di *Krisna Music Course* untuk pelajaran *${selectedRegistration.instrument}*.\n\n📋 *Detail Pendaftaran:*\n- Nama Murid: ${selectedRegistration.student_name}\n- Instrument: ${selectedRegistration.instrument}\n- Hari: ${selectedRegistration.preferred_day}\n- Waktu: ${selectedRegistration.preferred_time || 'Akan dikonfirmasi'}\n\nKami akan segera menghubungi Anda untuk konfirmasi jadwal lebih lanjut.\n\nTerima kasih! 🎵`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-3 bg-blue-600/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition-colors text-center"
                    >
                      📩 Kirim Konfirmasi Pendaftaran
                    </a>
                  )}

                  {/* Template: Jadwal Dikonfirmasi */}
                  {selectedRegistration.status === 'confirmed' && (
                    <a
                      href={getWhatsAppUrl(
                        '-',
                        `Halo Kak ${selectedRegistration.profile?.full_name || selectedRegistration.student_name}! 🎸\n\n*Pendaftaran ${selectedRegistration.instrument}* sudah dikonfirmasi!\n\n✅ *Jadwal Les:*\n- Hari: ${selectedRegistration.preferred_day}\n- Waktu: ${selectedRegistration.preferred_time || 'Akan dijadwalkan'}\n- Durasi: 60 menit\n\n📍 *Lokasi:* Krisna Music Course\n\nSilakan hadir 10 menit sebelum jadwal dimulai. Jika ada pertanyaan, jangan ragu untuk menghubungi kami.\n\nSampai jumpa! 🎵`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-3 bg-green-600/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-600/30 transition-colors text-center"
                    >
                      ✅ Kirim Jadwal Dikonfirmasi
                    </a>
                  )}

                  {/* Template: Sudah Mulai */}
                  {selectedRegistration.status === 'enrolled' && (
                    <a
                      href={getWhatsAppUrl(
                        '-',
                        `Halo Kak ${selectedRegistration.profile?.full_name || selectedRegistration.student_name}! 🎉\n\nSelamat! Pendaftaran *${selectedRegistration.instrument}* sudah aktif.\n\n🎵 *Krisna Music Course*\n- Murid: ${selectedRegistration.student_name}\n- Jadwal: ${selectedRegistration.preferred_day}, ${selectedRegistration.preferred_time || 'TBD'}\n\nSelamat belajar dan semoga sukses! 🎸🎹🥁`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-3 bg-purple-600/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-600/30 transition-colors text-center"
                    >
                      🎉 Kirim Ucapan Selamat
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
