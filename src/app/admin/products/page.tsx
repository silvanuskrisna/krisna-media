'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Package, Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import { slugify, formatPrice } from '@/lib/utils'
import type { Product, ProductCategory } from '@/lib/types'

const categoryOptions: { value: ProductCategory; label: string; color: string }[] = [
  { value: 'sound', label: 'Sound System', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'lighting', label: 'Lighting', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'studio', label: 'Studio Musik', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'senar-gitar', label: 'Senar Gitar', color: 'bg-green-500/20 text-green-400' },
]

interface ProductForm {
  name: string
  slug: string
  category: ProductCategory
  description: string
  price: number
  price_unit: string
  stock: number | null
  is_active: boolean
  featured: boolean
  sort_order: number
}

const emptyForm: ProductForm = {
  name: '',
  slug: '',
  category: 'sound',
  description: '',
  price: 0,
  price_unit: 'hari',
  stock: null,
  is_active: true,
  featured: false,
  sort_order: 0,
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      setProducts(data ?? [])
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  function openAddDialog() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(product: Product) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      slug: product.slug,
      category: product.category,
      description: product.description ?? '',
      price: product.price,
      price_unit: product.price_unit,
      stock: product.stock,
      is_active: product.is_active,
      featured: product.featured,
      sort_order: product.sort_order,
    })
    setDialogOpen(true)
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : slugify(name),
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.slug) return

    setSaving(true)
    try {
      const productData = {
        name: form.name,
        slug: form.slug,
        category: form.category,
        description: form.description || null,
        price: form.price,
        price_unit: form.price_unit,
        stock: form.stock || null,
        is_active: form.is_active,
        featured: form.featured,
        sort_order: form.sort_order,
      }

      if (editingId) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData)

        if (error) throw error
      }

      setDialogOpen(false)
      await fetchProducts()
    } catch (err) {
      console.error('Failed to save product:', err)
      alert('Gagal menyimpan produk')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      setDeleteConfirm(null)
      await fetchProducts()
    } catch (err) {
      console.error('Failed to delete product:', err)
      alert('Gagal menghapus produk')
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produk</h1>
          <p className="text-muted-foreground mt-1">Kelola daftar produk</p>
        </div>
        <button
          onClick={openAddDialog}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Tambah Produk
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari produk..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors"
        />
      </div>

      {/* Empty state */}
      {filteredProducts.length === 0 && !loading && (
        <div className="glass rounded-xl p-12 text-center">
          <Package size={48} className="mx-auto mb-4 opacity-40 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            {searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? 'Coba kata kunci lain' : 'Tambahkan produk pertama Anda'}
          </p>
          {!searchQuery && (
            <button
              onClick={openAddDialog}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Tambah Produk
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {filteredProducts.length > 0 && (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nama</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Kategori</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Harga</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const cat = categoryOptions.find((c) => c.value === product.category)
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-border/50 hover:bg-card/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.slug}</div>
                      </td>
                      <td className="py-3 px-4">
                        {cat && (
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>
                            {cat.label}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-foreground">
                        {formatPrice(product.price)}
                        <span className="text-xs text-muted-foreground ml-1">/{product.price_unit}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {product.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditDialog(product)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-card transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
                {editingId ? 'Edit Produk' : 'Tambah Produk'}
              </h2>
              <button onClick={() => setDialogOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nama Produk *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-1">Biarkan kosong untuk generate otomatis dari nama</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
                  className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors resize-none"
                />
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Harga *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                    min={0}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Satuan</label>
                  <input
                    type="text"
                    value={form.price_unit}
                    onChange={(e) => setForm({ ...form, price_unit: e.target.value })}
                    placeholder="hari"
                    className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Stok (opsional)</label>
                <input
                  type="number"
                  value={form.stock ?? ''}
                  onChange={(e) => setForm({ ...form, stock: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                  min={0}
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Urutan</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                  min={0}
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">Aktif</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">Featured</span>
                </label>
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
                  disabled={saving}
                  className="px-4 py-2.5 bg-[#fafafa] text-[#0a0a0a] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambahkan'}
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
            <h3 className="text-lg font-semibold text-foreground mb-2">Hapus Produk</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.
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
