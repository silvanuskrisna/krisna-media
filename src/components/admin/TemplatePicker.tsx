'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AdminTemplate, Booking } from '@/lib/types'
import { renderTemplate } from '@/lib/template-renderer'
import { MessageCircle, Copy, Check, ChevronDown, ExternalLink } from 'lucide-react'

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

interface Props {
  booking: Booking
  onSendWhatsApp?: (message: string) => void
}

export default function TemplatePicker({ booking, onSendWhatsApp }: Props) {
  const [templates, setTemplates] = useState<AdminTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AdminTemplate | null>(null)
  const [rendered, setRendered] = useState('')
  const [copied, setCopied] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('all')

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    const { data } = await supabase
      .from('admin_templates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (data) setTemplates(data)
    setLoading(false)
  }

  function handleSelect(tpl: AdminTemplate) {
    setSelected(tpl)
    setRendered(renderTemplate(tpl.content, booking))
    setShowPicker(true)
    setCopied(false)
  }

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rendered)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = rendered
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [rendered])

  const categories = ['all', ...new Set(templates.map(t => t.category))]
  const filtered = activeTab === 'all'
    ? templates
    : templates.filter(t => t.category === activeTab)

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setShowPicker(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent/10 text-accent rounded-lg text-sm font-medium hover:bg-accent/20 transition-colors"
      >
        <MessageCircle size={16} />
        Template Balasan
      </button>

      {/* Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowPicker(false)}>
          <div
            className="glass rounded-xl w-full max-w-2xl p-6 animate-scale-in max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Template Balasan</h2>
              <button onClick={() => { setShowPicker(false); setCopied(false) }} className="p-1 rounded-lg hover:bg-[#262626] text-muted-foreground">
                <ChevronDown size={18} />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">Memuat template...</div>
            ) : (
              <div className="flex gap-4 flex-1 min-h-0">
                {/* Left: template list */}
                <div className="w-56 shrink-0 space-y-1 overflow-y-auto">
                  {/* Category tabs */}
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

                  {filtered.map(tpl => {
                    const catColor = categoryColors[tpl.category] || categoryColors.general
                    return (
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
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${catColor}`}>
                            {categoryLabels[tpl.category] || tpl.category}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{tpl.content.replace(/{{.*?}}/g, '...').slice(0, 80)}</p>
                      </button>
                    )
                  })}

                  {filtered.length === 0 && (
                    <p className="text-xs text-muted-foreground py-4 text-center">Belum ada template</p>
                  )}
                </div>

                {/* Right: rendered preview */}
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
                          {onSendWhatsApp && (
                            <button
                              onClick={() => onSendWhatsApp(rendered)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-600/30 transition-colors"
                            >
                              <ExternalLink size={14} />
                              Buka WA
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 bg-[#0a0a0a] border border-border rounded-lg p-4 overflow-y-auto">
                        <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{rendered}</pre>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                      Pilih template di samping untuk melihat pratinjau
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
