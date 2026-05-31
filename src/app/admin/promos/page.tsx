'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Tag, Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { Promo } from '@/lib/types'

interface PromoForm {
  name: string
  description: string
  price_per_2hour: number
  quota: number
  start_date: string
  end_date: string
  is_active: boolean
}

const emptyForm: PromoForm = {
  name: '',
  description: '',
  price_per_2hour: 0,
  quota: 10,
  start_date: '',
  end_date: '',
  is_active: true,
}

export default function AdminPromos() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PromoForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchPromos()
  }, [])

  async function fetchPromos() {
    try {
      const { data, error } = await supabase
        .from('promos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPromos(data ?? [])
    } catch (err) {
      console.error('Failed to fetch promos:', err)
    } finally {
      setLoading(false)
    }
  }

  function openAddDialog() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(promo: Promo) {
    setEditingId(promo.id)
    setForm({
      name: promo.name,
      description: promo.description || '',
      price_per_2hour: promo.price_per_2hour,
      quota: promo.quota,
      start_date: promo.start_date || '',
      end_date: promo.end_date || '',
      is_active: promo.is_active,
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSave() {
    if (!form.name.trim() || form.price_per_2hour <= 0 || form.quota <= 0) {
      alert('Lengkapi data promo dengan benar.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price_per_2hour: form.price_per_2hour,
        quota: form.quota,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      }

      if (editingId) {
        const { error } = await supabase
          .from('promos')
          .update(payload)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('promos')
          .insert({ ...payload, used: 0 })

        if (error) throw error
      }

      closeDialog()
      fetchPromos()
    } catch (err) {
      console.error('Failed to save promo:', err)
      alert('Gagal menyimpan promo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('promos')
        .delete()
        .eq('id', id)

      if (error) throw error
      setDeleteConfirm(null)
      fetchPromos()
    } catch (err) {
      console.error('Failed to delete promo:', err)
      alert('Gagal menghapus promo.')
    }
  }

  const filteredPromos = promos.filter((p) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
  })

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
          <h1 className="text-2xl font-bold text-foreground">Promo</h1>
          <p className="text-muted-foreground mt-1">Kelola promo event untuk studio musik</p>
        </div>
        <button
          onClick={openAddDialog}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Tambah Promo
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari promo..."
          className="w-full pl-9 pr-4 py-2 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        {filteredPromos.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Tag size={40} className="mx-auto mb-3 opacity-40" />
            <p>{searchQuery ? 'Promo tidak ditemukan' : 'Belum ada promo. Klik "Tambah Promo" untuk membuat.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nama</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Harga / 2 Jam</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Kuota</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Terpakai</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Periode</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPromos.map((promo) => (
                  <tr key={promo.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-foreground font-medium">{promo.name}</p>
                        {promo.description && (
                          <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1">{promo.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground font-mono">{formatPrice(promo.price_per_2hour)}</td>
                    <td className="py-3 px-4 text-foreground">{promo.quota}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[60px] h-2 bg-[#262626] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              promo.used >= promo.quota ? 'bg-red-500' : 'bg-accent'
                            }`}
                            style={{ width: `${Math.min(100, (promo.used / promo.quota) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{promo.used}/{promo.quota}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {promo.start_date && promo.end_date
                        ? `${promo.start_date} — ${promo.end_date}`
                        : promo.start_date
                          ? `Mulai ${promo.start_date}`
                          : promo.end_date
                            ? `Sampai ${promo.end_date}`
                            : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          promo.is_active && promo.used < promo.quota
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                        }`}
                      >
                        {promo.is_active && promo.used < promo.quota ? 'Aktif' : promo.used >= promo.quota ? 'Habis' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditDialog(promo)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(promo.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-card transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">Hapus Promo?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tindakan ini tidak bisa dibatalkan. Data promo akan dihapus permanen.
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
                {editingId ? 'Edit Promo' : 'Tambah Promo'}
              </h3>
              <button onClick={closeDialog} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nama Promo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Grand Opening Promo"
                  className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Deskripsi
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Deskripsi singkat promo"
                  className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors resize-none"
                />
              </div>

              {/* Harga */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Harga per 2 Jam (Rp) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={form.price_per_2hour}
                  onChange={(e) => setForm({ ...form, price_per_2hour: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                />
              </div>

              {/* Kuota */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Kuota (jumlah slot) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={form.quota}
                  onChange={(e) => setForm({ ...form, quota: parseInt(e.target.value) || 0 })}
                  min={1}
                  className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                />
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
                {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Promo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
