'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { ImageIcon, Plus, Pencil, Trash2, X, Upload, Loader2, Eye, EyeOff, GripVertical } from 'lucide-react'
import type { GalleryItem, GalleryCategory } from '@/lib/types'
import { galleryCategories } from '@/lib/types'

interface GalleryForm {
  title: string
  description: string
  category: GalleryCategory
}

const emptyForm: GalleryForm = {
  title: '',
  description: '',
  category: 'studio',
}

export default function AdminGallery() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<GalleryForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchGallery()
  }, [])

  async function fetchGallery() {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data ?? [])
    } catch (err) {
      console.error('Failed to fetch gallery:', err)
    } finally {
      setLoading(false)
    }
  }

  function openAddDialog() {
    setEditingId(null)
    setForm(emptyForm)
    setUploadFile(null)
    setPreview(null)
    setDialogOpen(true)
  }

  function openEditDialog(item: GalleryItem) {
    setEditingId(item.id)
    setForm({
      title: item.title,
      description: item.description ?? '',
      category: item.category,
    })
    setUploadFile(null)
    setPreview(item.image_url)
    setDialogOpen(true)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function uploadImage(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop()
    const fileName = `public/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('Gagal upload foto: ' + uploadError.message)
    }

    const { data: urlData } = supabase.storage
      .from('gallery')
      .getPublicUrl(fileName)

    return urlData?.publicUrl ?? null
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return

    setSaving(true)
    try {
      let imageUrl = preview

      // Upload new image if selected
      if (uploadFile) {
        const url = await uploadImage(uploadFile)
        if (!url) throw new Error('Gagal mendapatkan URL gambar')
        imageUrl = url
      }

      if (!imageUrl) {
        alert('Pilih foto terlebih dahulu')
        setSaving(false)
        return
      }

      const galleryData = {
        title: form.title,
        description: form.description || null,
        image_url: imageUrl,
        category: form.category,
      }

      if (editingId) {
        const { error } = await supabase
          .from('gallery')
          .update(galleryData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('gallery')
          .insert(galleryData)

        if (error) throw error
      }

      setDialogOpen(false)
      await fetchGallery()
    } catch (err) {
      console.error('Failed to save gallery:', err)
      alert('Gagal menyimpan: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      // Get the item to find the image path
      const { data: item } = await supabase
        .from('gallery')
        .select('image_url')
        .eq('id', id)
        .single()

      // Delete from database
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Try to delete from storage (optional — might fail if URL format differs)
      if (item?.image_url) {
        const pathMatch = item.image_url.match(/\/gallery\/public\/(.+)$/)
        if (pathMatch) {
          await supabase.storage
            .from('gallery')
            .remove([`public/${pathMatch[1]}`])
        }
      }

      setDeleteConfirm(null)
      await fetchGallery()
    } catch (err) {
      console.error('Failed to delete gallery item:', err)
      alert('Gagal menghapus')
    }
  }

  async function toggleActive(item: GalleryItem) {
    try {
      const { error } = await supabase
        .from('gallery')
        .update({ is_active: !item.is_active })
        .eq('id', item.id)

      if (error) throw error
      await fetchGallery()
    } catch (err) {
      console.error('Failed to toggle:', err)
    }
  }

  const categoryBadgeColors: Record<string, string> = {
    studio: 'bg-green-500/20 text-green-400',
    sound: 'bg-blue-500/20 text-blue-400',
    lighting: 'bg-purple-500/20 text-purple-400',
    event: 'bg-orange-500/20 text-orange-400',
    other: 'bg-gray-500/20 text-gray-400',
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
          <h1 className="text-2xl font-bold text-foreground">Galeri</h1>
          <p className="text-muted-foreground mt-1">Kelola foto galeri</p>
        </div>
        <button
          onClick={openAddDialog}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Tambah Foto
        </button>
      </div>

      {/* Empty state */}
      {items.length === 0 && !loading && (
        <div className="glass rounded-xl p-12 text-center">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-40 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-1">Belum ada foto</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tambahkan foto galeri pertama Anda
          </p>
          <button
            onClick={openAddDialog}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Tambah Foto
          </button>
        </div>
      )}

      {/* Gallery Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="glass rounded-xl overflow-hidden group relative border border-border hover:border-muted-foreground/30 transition-all"
            >
              {/* Image */}
              <div className="aspect-[4/3] relative overflow-hidden bg-card">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = ''
                    ;(e.target as HTMLImageElement).classList.add('hidden')
                  }}
                />
                {/* Status overlay */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm ${
                  item.is_active
                    ? 'bg-green-500/70 text-white'
                    : 'bg-red-500/70 text-white'
                }`}>
                  {item.is_active ? 'Aktif' : 'Nonaktif'}
                </div>
                {/* Category badge */}
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm ${categoryBadgeColors[item.category] ?? 'bg-gray-500/20 text-gray-400'}`}>
                    {galleryCategories.find(c => c.value === item.category)?.label ?? item.category}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-foreground truncate">{item.title}</h3>
                {item.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
                )}
              </div>

              {/* Actions on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                <button
                  onClick={() => openEditDialog(item)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => toggleActive(item)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                  title={item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {item.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={() => setDeleteConfirm(item.id)}
                  className="p-2 rounded-lg bg-red-500/40 hover:bg-red-500/60 text-white transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setDialogOpen(false)}>
          <div
            className="glass rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {editingId ? 'Edit Foto' : 'Tambah Foto'}
              </h2>
              <button onClick={() => setDialogOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Upload / Preview */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Foto</label>
                {preview ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-card border border-border mb-3">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreview(null)
                        setUploadFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-muted-foreground flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors bg-card/50"
                  >
                    <Upload size={24} />
                    <span className="text-sm">Klik untuk pilih foto</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Judul *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                  placeholder="Mis: Studio Musik - Ruang Utama"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as GalleryCategory })}
                  className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                >
                  {galleryCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Deskripsi (opsional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors resize-none"
                  placeholder="Deskripsi singkat tentang foto ini..."
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="px-4 py-2.5 bg-[#262626] text-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#fafafa] text-[#0a0a0a] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {(saving || uploading) && <Loader2 size={14} className="animate-spin" />}
                  {saving || uploading ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setDeleteConfirm(null)}>
          <div
            className="glass rounded-xl w-full max-w-sm p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">Hapus Foto</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Apakah Anda yakin ingin menghapus foto ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2.5 bg-[#262626] text-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
