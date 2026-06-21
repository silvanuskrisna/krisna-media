'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AdminTemplate, Booking } from '@/lib/types'
import { renderTemplate, type RenderSettings } from '@/lib/template-renderer'
import { getWhatsAppUrl } from '@/lib/utils'
import { MessageCircle, Loader2, Copy, Check, ChevronDown, ExternalLink } from 'lucide-react'

const categoryColors: Record<string, string> = {
  booking: 'bg-blue-500/20 text-blue-400',
  payment: 'bg-green-500/20 text-green-400',
  general: 'bg-gray-500/20 text-gray-400',
  studio: 'bg-purple-500/20 text-purple-400',
  kmc: 'bg-pink-500/20 text-pink-400',
}

const categoryLabels: Record<string, string> = {
  booking: 'Booking',
  payment: 'Pembayaran',
  general: 'Umum',
  studio: 'Studio',
  kmc: 'KMC',
}

/**
 * Map booking status → trigger_event yang relevan.
 * Urutan = prioritas (yang paling kiri = yang paling penting muncul)
 */
const statusTriggers: Record<string, string[]> = {
  pending: ['booking_confirm', 'general'],
  confirmed: ['payment_reminder', 'after_event', 'general'],
  completed: ['ask_testimonial', 'after_event', 'general'],
  cancelled: ['cancellation', 'general'],
}

interface Props {
  booking: Booking
}

export default function TemplateActions({ booking }: Props) {
  const [templates, setTemplates] = useState<AdminTemplate[]>([])
  const [settings, setSettings] = useState<RenderSettings>({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Modal for browsing all templates
  const [showPicker, setShowPicker] = useState(false)
  const [selected, setSelected] = useState<AdminTemplate | null>(null)
  const [rendered, setRendered] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('all')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    // Fetch templates
    const { data: tplData } = await supabase
      .from('admin_templates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (tplData) setTemplates(tplData)

    // Fetch settings (bank info)
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('*')
    if (settingsData) {
      const merged: RenderSettings = {}
      for (const row of settingsData) {
        if (row.key === 'bank_name') merged.bank_name = String(row.value?.bank_name ?? row.value ?? '')
        if (row.key === 'bank_account') merged.bank_account = String(row.value?.bank_account ?? row.value ?? '')
        if (row.key === 'bank_holder') merged.bank_holder = String(row.value?.bank_holder ?? row.value ?? '')
      }
      setSettings(merged)
    }

    setLoading(false)
  }

  /** Dapatkan template yang cocok untuk trigger_event tertentu (ambil yang pertama) */
  function getTemplateForEvent(event: string): AdminTemplate | undefined {
    return templates.find(t => t.trigger_event === event)
  }

  /** Buka WA langsung dengan template yang sudah di-render */
  function openWhatsApp(tpl: AdminTemplate) {
    const message = renderTemplate(tpl.content, booking, settings)
    window.open(getWhatsAppUrl(booking.customer_phone, message), '_blank')
  }

  /** Quick action — langsung buka WA tanpa modal */
  function handleQuickAction(event: string) {
    const tpl = getTemplateForEvent(event)
    if (!tpl) return
    setActionLoading(event)
    openWhatsApp(tpl)
    setTimeout(() => setActionLoading(null), 500)
  }

  /** Buka modal picker */
  function openPicker() {
    setSelected(null)
    setRendered('')
    setCopied(false)
    setShowPicker(true)
  }

  function handleSelect(tpl: AdminTemplate) {
    setSelected(tpl)
    setRendered(renderTemplate(tpl.content, booking, settings))
    setCopied(false)
  }

  function handleCopy() {
    if (!rendered) return
    navigator.clipboard.writeText(rendered).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = rendered
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const triggerEvents = statusTriggers[booking.status] || ['general']
  const categories = ['all', ...new Set(templates.map(t => t.category))]
  const filtered = activeTab === 'all' ? templates : templates.filter(t => t.category === activeTab)

  return (
    <>
      {/* 🔥 QUICK ACTION BUTTONS — langsung WA */}
      <div className="flex flex-wrap gap-2">
        {triggerEvents.map(event => {
          const tpl = getTemplateForEvent(event)
          const isGeneral = event === 'general'

          // General/Template Lainnya: selalu tampil tanpa perlu template
          if (!tpl && !isGeneral) return null

          const labels: Record<string, string> = {
            booking_confirm: 'Konfirmasi Booking 📩',
            payment_reminder: 'Reminder Bayar 💰',
            after_event: 'After Event 🙌',
            ask_testimonial: 'Minta Testimoni ⭐',
            cancellation: 'Info Pembatalan 📋',
            general: 'Template Lainnya',
          }

          const colors: Record<string, string> = {
            booking_confirm: 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30',
            payment_reminder: 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30',
            after_event: 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30',
            ask_testimonial: 'bg-green-600/20 text-green-400 hover:bg-green-600/30',
            cancellation: 'bg-red-600/20 text-red-400 hover:bg-red-600/30',
            general: 'bg-[#262626] text-foreground hover:bg-[#333]',
          }

          return (
            <button
              key={event}
              onClick={() => isGeneral ? openPicker() : handleQuickAction(event)}
              disabled={actionLoading === event}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${colors[event] || 'bg-accent/10 text-accent hover:bg-accent/20'}`}
            >
              {actionLoading === event ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isGeneral ? (
                <ChevronDown size={16} />
              ) : (
                <MessageCircle size={16} />
              )}
              {labels[event] || tpl?.name}
            </button>
          )
        })}
      </div>

      {/* 📋 MODAL — browse semua template + preview */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowPicker(false)}>
          <div
            className="glass rounded-xl w-full max-w-2xl p-6 animate-scale-in max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Template Balasan</h2>
              <button onClick={() => setShowPicker(false)} className="p-1 rounded-lg hover:bg-[#262626] text-muted-foreground">
                <ChevronDown size={18} />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">Memuat template...</div>
            ) : (
              <div className="flex gap-4 flex-1 min-h-0">
                {/* Kiri: daftar template */}
                <div className="w-56 shrink-0 space-y-1 overflow-y-auto">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          activeTab === cat
                            ? 'bg-accent text-white'
                            : 'bg-[#1a1a1a] text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {cat === 'all' ? 'Semua' : (categoryLabels[cat] || cat)}
                      </button>
                    ))}
                  </div>

                  {filtered.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => handleSelect(tpl)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selected?.id === tpl.id
                          ? 'bg-accent/10 border border-accent/30'
                          : 'hover:bg-[#1a1a1a] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground truncate">{tpl.name}</span>
                        {tpl.trigger_event && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium shrink-0">
                            auto
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {tpl.content.replace(/{{.*?}}/g, '...').slice(0, 80)}
                      </p>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-xs text-muted-foreground py-4 text-center">Belum ada template</p>
                  )}
                </div>

                {/* Kanan: preview */}
                <div className="flex-1 flex flex-col min-w-0">
                  {selected ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground">{selected.name}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover transition-colors"
                          >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Tersalin!' : 'Salin'}
                          </button>
                          <button
                            onClick={() => openWhatsApp(selected)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-600/30 transition-colors"
                          >
                            <ExternalLink size={14} />
                            Buka WA
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 bg-[#0a0a0a] border border-border rounded-lg p-4 overflow-y-auto">
                        <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{rendered}</pre>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                      Pilih template untuk lihat pratinjau
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}