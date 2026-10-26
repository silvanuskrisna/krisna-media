'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Percent, Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { DiscountCode } from '@/lib/types'

interface DiscountForm {
  code: string
  name: string
  type: 'percent' | 'nominal'
  value: number
  quota: string // '' = unlimited
  max_use_per_phone: number
  start_date: string
  end_date: string
  is_active: boolean
}

const emptyForm: DiscountForm = {
  code: '',
  name: '',
  type: 'percent',
  value: 0,
  quota: '',
  max_use_per_phone: 5,
  start_date: '',
  end_date: '',
  is_active: true,
}

export default function AdminDiscountCodes() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [usageMap, setUsageMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DiscountForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchCodes()
  }, [])

  async function fetchCodes() {
    try {
      const [{ data, error }, { data: usageData, error: usageError }] = await Promise.all([
        supabase
          .from('discount_codes')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('bookings')
          .select('discount_code_id')
          .neq('status', 'cancelled'),
      ])

      if (error) throw error
      if (usageError) throw usageError

      setCodes(data ?? [])

      // Hitung pemakaian live per kode (booking tidak dibatalkan)
      const usage: Record<string, number> = {}
      ;(usageData ?? []).forEach((b) => {
        if (b.discount_code_id) {
          usage[b.discount_code_id] = (usage[b.discount_code_id] || 0) + 1
        }
      })
      setUsageMap(usage)
    } catch (err) {
      console.error('Failed to fetch discount codes:', err)
    } finally {
      setLoading(false)
    }
  }

  function openAddDialog() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(code: DiscountCode) {
    setEditingId(code.id)
    setForm({
      code: code.code,
      name: code.name,
      type: code.type,
      value: code.value,
      quota: code.quota === null ? '' : String(code.quota),
      max_use_per_phone: code.max_use_per_phone,
      start_date: code.start_date || '',
      end_date: code.end_date || '',
      is_active: code.is_active,
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSave() {
    const codeClean = form.code.trim().toUpperCase().replace(/\s+/g, '')
    if (!codeClean || !form.name.trim() || form.value <= 0) {
      alert('Lengkapi data kode diskon dengan benar.')
      return
    }
    if (!/^[A-Z0-9_-]{3,30}$/.test(codeClean)) {
      alert('Kode hanya boleh huruf, angka, strip (-) atau underscore (_), minimal 3 karakter.')
      return
    }
    if (form.max_use_per_phone < 1) {
      alert('Batas pemakaian per orang minimal 1x.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: codeClean,
        name: form.name.trim(),
        type: form.type,
        value: form.value,
        quota: form.quota === '' ? null : parseInt(form.quota) || null,
        max_use_per_phone: form.max_use_per_phone,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      }

      if (editingId) {
        const { error } = await supabase
          .from('discount_codes')
          .update(payload)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('discount_codes')
          .insert(payload)

        if (error) throw error
      }

      closeDialog()
      fetchCodes()
    } catch (err: any) {
      console.error('Failed to save discount code:', err)
      if (err?.code === '23505') {
        alert(`Kode "${form.code.trim().toUpperCase()}" sudah ada. Gunakan kode lain.`)
      } else {
        alert('Gagal menyimpan kode diskon.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id)

      if (error) throw error
      setDeleteConfirm(null)
      fetchCodes()
    } catch (err) {
      console.error('Failed to delete discount code:', err)
      alert('Gagal menghapus kode diskon.')
    }
  }

  const filteredCodes = codes.filter((c) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
  })

  function formatValue(code: DiscountCode): string {
    return code.type === 'percent' ? `${code.value}%` : formatPrice(code.value)
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
          <h1 className="text-2xl font-bold text-foreground">Kode Diskon</h1>
          <p className="text-muted-foreground mt-1">
            Kelola kode kupon diskon untuk booking studio
          </p>
        </div>
        <button
          onClick={openAddDialog}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Tambah Kode
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari kode / nama..."
          className="w-full pl-9 pr-4 py-2 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        {filteredCodes.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Percent size={40} className="mx-auto mb-3 opacity-40" />
            <p>{searchQuery ? 'Kode tidak ditemukan' : 'Belum ada kode diskon. Klik "Tambah Kode" untuk membuat.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Kode</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nama</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Diskon</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Pemakaian</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Per Orang</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Periode</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.map((code) => {
                  const used = usageMap[code.id] || 0
                  const unlimited = code.quota === null
                  const exhausted = !unlimited && used >= (code.quota || 0)
                  return (
                    <tr key={code.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                          {code.code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-foreground font-medium">{code.name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          code.type === 'percent'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {code.type === 'percent' ? '% Persen' : 'Rp Nominal'} · {formatValue(code)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {!unlimited && (
                            <div className="flex-1 max-w-[60px] h-2 bg-[#262626] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${exhausted ? 'bg-red-500' : 'bg-accent'}`}
                                style={{ width: `${Math.min(100, (used / (code.quota || 1)) * 100)}%` }}
                              />
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {used}{unlimited ? ' / ∞' : ` / ${code.quota}`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {code.max_use_per_phone}x
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {code.start_date && code.end_date
                          ? `${code.start_date} — ${code.end_date}`
                          : code.start_date
                            ? `Mulai ${code.start_date}`
                            : code.end_date
                              ? `Sampai ${code.end_date}`
                              : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            code.is_active && !exhausted
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                          }`}
                        >
                          {code.is_active && !exhausted ? 'Aktif' : exhausted ? 'Habis' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditDialog(code)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(code.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-card transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Catatan */}
      <p className="text-xs text-muted-foreground">
        💡 Pemakaian dihitung dari booking yang <span className="text-foreground">tidak dibatalkan</span>.
        Jika booking dibatalkan, pemakaiannya otomatis kembali. Kode diskon tidak bisa digabung dengan promo / Happy Hour.
      </p>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">Hapus Kode Diskon?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tindakan ini tidak bisa dibatalkan. Booking lama tetap tersimpan,
              tapi kode ini tidak bisa dipakai lagi untuk booking baru.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                {editingId ? 'Edit Kode Diskon' : 'Tambah Kode Diskon'}
              </h3>
              <button onClick={closeDialog} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Kode */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Kode <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="Contoh: KRSNA10"
                  className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm font-mono uppercase focus:outline-none focus:border-muted-foreground transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Huruf, angka, strip/underscore. Otomatis uppercase — customer bisa ketik huruf kecil.
                </p>
              </div>

              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nama <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Diskon Referral Teman"
                  className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                />
              </div>

              {/* Tipe + Nilai */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Tipe Diskon <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as 'percent' | 'nominal' })}
                    className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                  >
                    <option value="percent">Persen (%)</option>
                    <option value="nominal">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {form.type === 'percent' ? 'Persentase (%)' : 'Nominal (Rp)'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: parseInt(e.target.value) || 0 })}
                    min={1}
                    placeholder={form.type === 'percent' ? 'Contoh: 10' : 'Contoh: 25000'}
                    className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                  />
                </div>
              </div>

              {/* Kuota */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Kuota Total (opsional)
                  </label>
                  <input
                    type="number"
                    value={form.quota}
                    onChange={(e) => setForm({ ...form, quota: e.target.value })}
                    min={1}
                    placeholder="Kosongkan = unlimited"
                    className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Kosongkan untuk tanpa batas.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Maks per Orang <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.max_use_per_phone}
                    onChange={(e) => setForm({ ...form, max_use_per_phone: parseInt(e.target.value) || 0 })}
                    min={1}
                    className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Batas pemakaian per nomor WhatsApp.</p>
                </div>
              </div>

              {/* Periode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#262626] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent" />
                </label>
                <span className="text-sm text-foreground">Aktif</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={closeDialog}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Kode'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}