'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Settings, Save, Loader2, Plus, Trash2, GripVertical } from 'lucide-react'
import type { SiteSetting } from '@/lib/types'

interface GearItem {
  id: string
  name: string
  description: string
  price: number
  sort_order: number
  is_active: boolean
}

interface SettingsData {
  site_name: string
  tagline: string
  whatsapp: string
  email: string
  address: string
  instagram: string
  facebook: string
  youtube: string
  tiktok: string
  bank_name: string
  bank_account: string
  bank_holder: string
  happy_hour_enabled: string
  happy_hour_start_time: string
  happy_hour_end_time: string
  happy_hour_price_1hour: string
  happy_hour_price_2hour: string
}

const defaultSettings: SettingsData = {
  site_name: 'Krisna Media',
  tagline: 'Solusi Sound, Lighting, Studio & Music Gear',
  whatsapp: '',
  email: '',
  address: '',
  instagram: '',
  facebook: '',
  youtube: '',
  tiktok: '',
  bank_name: '',
  bank_account: '',
  bank_holder: '',
  happy_hour_enabled: 'false',
  happy_hour_start_time: '14:00',
  happy_hour_end_time: '18:00',
  happy_hour_price_1hour: '60000',
  happy_hour_price_2hour: '100000',
}

const fieldGroups = [
  {
    title: 'Informasi Umum',
    fields: [
      { key: 'site_name', label: 'Nama Website', type: 'text' },
      { key: 'tagline', label: 'Tagline', type: 'text' },
    ],
  },
  {
    title: 'Kontak',
    fields: [
      { key: 'whatsapp', label: 'No. WhatsApp', type: 'text', placeholder: '08123456789' },
      { key: 'email', label: 'Email', type: 'email', placeholder: 'info@krisnamedia.com' },
      { key: 'address', label: 'Alamat', type: 'textarea' },
    ],
  },
  {
    title: 'Media Sosial',
    fields: [
      { key: 'instagram', label: 'Instagram', type: 'text', placeholder: '@krisnamedia' },
      { key: 'facebook', label: 'Facebook', type: 'text', placeholder: 'Krisna Media' },
      { key: 'youtube', label: 'Youtube', type: 'text', placeholder: 'Krisna Media' },
      { key: 'tiktok', label: 'TikTok', type: 'text', placeholder: '@krisnamedia' },
    ],
  },
  {
    title: 'Pembayaran Transfer Bank',
    fields: [
      { key: 'bank_name', label: 'Nama Bank', type: 'text', placeholder: 'BCA / Mandiri / BSI' },
      { key: 'bank_account', label: 'No. Rekening', type: 'text', placeholder: '1234567890' },
      { key: 'bank_holder', label: 'Atas Nama', type: 'text', placeholder: 'Krisna Media / a.n. Pemilik' },
    ],
  },
  {
    title: 'Happy Hour Studio',
    description: 'Diskon harga studio di weekdays jam tertentu. Hanya berlaku untuk studio musik.',
    fields: [
      { key: 'happy_hour_enabled', label: 'Aktifkan Happy Hour', type: 'select', options: [{ value: 'true', label: 'Aktif' }, { value: 'false', label: 'Nonaktif' }] },
      { key: 'happy_hour_start_time', label: 'Jam Mulai', type: 'text', placeholder: '14:00' },
      { key: 'happy_hour_end_time', label: 'Jam Selesai', type: 'text', placeholder: '18:00' },
      { key: 'happy_hour_price_1hour', label: 'Harga 1 Jam (Rp)', type: 'text', placeholder: '60000' },
      { key: 'happy_hour_price_2hour', label: 'Harga 2 Jam (Rp)', type: 'text', placeholder: '100000' },
    ],
  },
]

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings)
  const [gears, setGears] = useState<GearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')

      if (error) throw error

      if (data && data.length > 0) {
        const merged: SettingsData = { ...defaultSettings }
        for (const row of data) {
          const key = row.key as keyof SettingsData
          if (key in defaultSettings && row.value) {
            if (typeof row.value === 'object' && row.value !== null) {
              const val = row.value
              if (typeof val === 'object') {
                merged[key] = String(row.value[key] ?? row.value ?? '')
              } else {
                merged[key] = String(val)
              }
            } else {
              merged[key] = String(row.value ?? '')
            }
          }

          // Load gears from site_settings
          if (row.key === 'studio_addon_gears' && Array.isArray(row.value?.studio_addon_gears)) {
            setGears(row.value.studio_addon_gears)
          }
        }
        setSettings(merged)
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)

    try {
      const upserts = Object.entries(settings).map(([key, value]) => ({
        key,
        value: { [key]: value },
        updated_at: new Date().toISOString(),
      }))

      // Add gears as JSONB
      upserts.push({
        key: 'studio_addon_gears',
        value: { studio_addon_gears: gears },
        updated_at: new Date().toISOString(),
      })

      // Delete all existing and re-insert
      const allKeys = [...Object.keys(settings), 'studio_addon_gears']
      const { error: deleteError } = await supabase
        .from('site_settings')
        .delete()
        .in('key', allKeys)

      if (deleteError) throw deleteError

      const { error: insertError } = await supabase
        .from('site_settings')
        .insert(upserts)

      if (insertError) throw insertError

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      alert('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  function updateField(key: keyof SettingsData, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function addGear() {
    const newGear: GearItem = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      price: 0,
      sort_order: gears.length + 1,
      is_active: true,
    }
    setGears([...gears, newGear])
  }

  function updateGear(id: string, field: keyof GearItem, value: string | number | boolean) {
    setGears(gears.map(g => g.id === id ? { ...g, [field]: value } : g))
  }

  function removeGear(id: string) {
    setGears(gears.filter(g => g.id !== id))
  }

  function moveGear(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= gears.length) return
    const updated = [...gears]
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    setGears(updated.map((g, i) => ({ ...g, sort_order: i + 1 })))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground animate-pulse">Memuat data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
          <p className="text-muted-foreground mt-1">Konfigurasi website</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      {saved && (
        <div className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg px-4 py-3 text-sm">
          Pengaturan berhasil disimpan!
        </div>
      )}

      {/* Settings Groups */}
      <div className="space-y-6">
        {fieldGroups.map((group) => (
          <div key={group.title} className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">{group.title}</h2>
            {(group as any).description && (
              <p className="text-sm text-muted-foreground mb-5">{(group as any).description}</p>
            )}
            <div className="space-y-4">
              {group.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={settings[field.key as keyof SettingsData]}
                      onChange={(e) => updateField(field.key as keyof SettingsData, e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors resize-none"
                      placeholder={field.placeholder}
                    />
                  ) : (field as any).type === 'select' ? (
                    <select
                      value={settings[field.key as keyof SettingsData]}
                      onChange={(e) => updateField(field.key as keyof SettingsData, e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors appearance-none"
                    >
                      {(field as any).options?.map((opt: { value: string; label: string }) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={settings[field.key as keyof SettingsData]}
                      onChange={(e) => updateField(field.key as keyof SettingsData, e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#171717] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-muted-foreground transition-colors"
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ───── STUDIO ADD-ON GEARS ───── */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Gear Tambahan Studio</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add-on yang muncul saat booking Rental Studio
            </p>
          </div>
          <button
            type="button"
            onClick={addGear}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-all"
          >
            <Plus size={16} />
            Tambah Gear
          </button>
        </div>

        {gears.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada gear tambahan. Klik &quot;Tambah Gear&quot; untuk mulai.
          </p>
        ) : (
          <div className="space-y-3">
            {gears.map((gear, index) => (
              <div
                key={gear.id}
                className="bg-[#171717] border border-[#262626] rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-muted-foreground cursor-grab shrink-0" />
                    <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveGear(index, -1)}
                      disabled={index === 0}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGear(index, 1)}
                      disabled={index === gears.length - 1}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGear(gear.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Nama Gear</label>
                    <input
                      type="text"
                      value={gear.name}
                      onChange={(e) => updateGear(gear.id, 'name', e.target.value)}
                      placeholder="Contoh: Microphone Condenser"
                      className="w-full px-3 py-2 bg-background border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-accent/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Harga (Rp)</label>
                    <input
                      type="number"
                      value={gear.price || ''}
                      onChange={(e) => updateGear(gear.id, 'price', parseInt(e.target.value) || 0)}
                      placeholder="200000"
                      className="w-full px-3 py-2 bg-background border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-accent/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Aktif</label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gear.is_active}
                        onChange={(e) => updateGear(gear.id, 'is_active', e.target.checked)}
                        className="accent-green-500"
                      />
                      <span className="text-sm text-foreground">
                        {gear.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Deskripsi (opsional)</label>
                  <input
                    type="text"
                    value={gear.description}
                    onChange={(e) => updateGear(gear.id, 'description', e.target.value)}
                    placeholder="Contoh: Mic kondensor untuk rekaman vokal"
                    className="w-full px-3 py-2 bg-background border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-accent/50"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  )
}