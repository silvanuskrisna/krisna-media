'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit3, Trash2, MessageCircle, Copy, Check, GripVertical, X, Save } from 'lucide-react'
import type { AdminTemplate } from '@/lib/types'

const categories = [
  { value: 'booking', label: 'Booking' },
  { value: 'payment', label: 'Pembayaran' },
  { value: 'general', label: 'Umum' },
  { value: 'studio', label: 'Studio' },
  { value: 'kmc', label: 'KMC' },
]

const triggerEvents = [
  { value: '', label: '— Manual (pilih dari Template Lainnya) —' },
  { value: 'booking_confirm', label: '🔵 Konfirmasi Booking (muncul saat Pending)' },
  { value: 'payment_reminder', label: '🟡 Reminder Bayar (muncul saat Confirmed)' },
  { value: 'after_event', label: '🟣 After Event (muncul saat Confirmed/Completed)' },
  { value: 'ask_testimonial', label: '🟢 Minta Testimoni (muncul saat Completed)' },
  { value: 'cancellation', label: '🔴 Info Pembatalan (muncul saat Cancelled)' },
]

const categoryColors: Record<string, string> = {
  booking: 'bg-blue-500/20 text-blue-400',
  payment: 'bg-green-500/20 text-green-400',
  general: 'bg-gray-500/20 text-gray-400',
  studio: 'bg-purple-500/20 text-purple-400',
  kmc: 'bg-pink-500/20 text-pink-400',
}

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<AdminTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialog, setEditDialog] = useState<{ template?: AdminTemplate } | null>(null)
  const [form, setForm] = useState({ name: '', category: 'general', trigger_event: '', content: '' })
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    setLoading(true)
    const { data } = await supabase
      .from('admin_templates')
      .select('*')
      .order('sort_order', { ascending: true })
    if (data) setTemplates(data)
    setLoading(false)
  }

  function openCreate() {
    setForm({ name: '', category: 'general', trigger_event: '', content: '' })
    setEditDialog({})
  }

  function openEdit(template: AdminTemplate) {
    setForm({ name: template.name, category: template.category, trigger_event: template.trigger_event ?? '', content: template.content })
    setEditDialog({ template })
  }

  async function handleSave() {
    if (!form.name || !form.content) return
    setSaving(true)
    try {
      if (editDialog?.template) {
        await supabase
          .from('admin_templates')
          .update({
            name: form.name,
            category: form.category,
            trigger_event: form.trigger_event || null,
            content: form.content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editDialog.template.id)
      } else {
        await supabase
          .from('admin_templates')
          .insert({
            name: form.name,
            category: form.category,
            trigger_event: form.trigger_event || null,
            content: form.content,
            sort_order: templates.length,
          })
      }
      setEditDialog(null)
      await fetchTemplates()
    } catch (err) {
      console.error('Failed to save template:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus template ini?')) return
    await supabase.from('admin_templates').delete().eq('id', id)
    await fetchTemplates()
  }

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // fallback
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }, [])

  const variables = ['{{nama}}', '{{tanggal}}', '{{paket}}', '{{jam_mulai}}', '{{jam_selesai}}', '{{lokasi}}', '{{total}}', '{{kode_booking}}', '{{no_wa}}', '{{dp}}', '{{sisa}}', '{{batas_waktu}}', '{{link_booking}}']

  function insertVariable(v: string) {
    setForm(f => ({ ...f, content: f.content + v }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Template Balasan</h1>
          <p className="text-sm text-muted-foreground mt-1">Template WA yang bisa dipilih dari halaman booking detail</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Template Baru
        </button>
      </div>

      {/* Template List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse">Memuat...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Belum ada template. Klik "Template Baru" untuk mulai.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => {
            const catColor = categoryColors[tpl.category] || categoryColors.general
            const triggerLabel = triggerEvents.find(t => t.value === tpl.trigger_event)?.label || ''
            return (
              <div key={tpl.id} className="glass rounded-xl p-4 border border-border hover-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">{tpl.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>
                        {categories.find(c => c.value === tpl.category)?.label || tpl.category}
                      </span>
                      {tpl.trigger_event && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                          Auto
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-line font-mono text-xs">{tpl.content.slice(0, 200)}{tpl.content.length > 200 ? '...' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyToClipboard(tpl.content, `list-${tpl.id}`)}
                      className="p-2 rounded-lg hover:bg-[#262626] text-muted-foreground hover:text-foreground transition-colors"
                      title="Salin template"
                    >
                      {copiedId === `list-${tpl.id}` ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={() => openEdit(tpl)}
                      className="p-2 rounded-lg hover:bg-[#262626] text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="p-2 rounded-lg hover:bg-red-600/20 text-muted-foreground hover:text-red-400 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit/Create Dialog */}
      {editDialog !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setEditDialog(null)}>
          <div className="glass rounded-xl w-full max-w-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {editDialog.template ? 'Edit Template' : 'Template Baru'}
              </h2>
              <button onClick={() => setEditDialog(null)} className="p-1 rounded-lg hover:bg-[#262626] text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nama Template</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Konfirmasi Booking"
                  className="w-full bg-[#1a1a1a] border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Kategori</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                >
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Auto-tampil saat</label>
                <select
                  value={form.trigger_event}
                  onChange={e => setForm(f => ({ ...f, trigger_event: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                >
                  {triggerEvents.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Kalo "Manual", template cuma muncul di "Template Lainnya"</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-foreground">Konten Template</label>
                  <div className="flex flex-wrap gap-1 max-w-sm">
                    {variables.map(v => (
                      <button
                        key={v}
                        onClick={() => insertVariable(v)}
                        className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors font-mono"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Klik tombol variable di atas untuk menyisipkan ke template</p>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={12}
                  className="w-full bg-[#1a1a1a] border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent font-mono"
                  placeholder="Tulis template di sini...&#10;&#10;Gunakan {{nama}} untuk nama customer, {{tanggal}} untuk tanggal, dll."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => setEditDialog(null)}
                className="px-4 py-2.5 bg-[#262626] text-foreground rounded-lg text-sm font-medium hover:opacity-90"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.content}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}