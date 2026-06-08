'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DollarSign, Search, Plus, Download, Check, X, Loader2, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export default function AdminKMCInvoices() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('invoices')
        .select('*, member:members!inner(full_name, phone), invoice_items(*)')
        .order('period', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (err: any) {
      console.error('Failed to fetch invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateMonthly() {
    // Find all active enrollments and generate invoices for current period
    const now = new Date()
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    if (!confirm(`Generate invoice untuk periode ${period}?`)) return
    setGenerating(true)

    try {
      // Get all active enrollments with their student info
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('*, student:students!inner(member_id, name)')
        .eq('status', 'active')

      if (enrollError) throw enrollError

      // Group by member_id
      const memberGroups: Record<string, any[]> = {}
      for (const e of enrollments || []) {
        const mid = e.student?.member_id
        if (!mid) continue
        if (!memberGroups[mid]) memberGroups[mid] = []
        memberGroups[mid].push(e)
      }

      let created = 0
      let skipped = 0

      for (const [memberId, items] of Object.entries(memberGroups)) {
        // Check if invoice already exists for this period
        const { data: existing } = await supabase
          .from('invoices')
          .select('id')
          .eq('member_id', memberId)
          .eq('period', period)
          .single()

        if (existing) {
          skipped++
          continue
        }

        const total = items.reduce((sum, e) => sum + (e.tuition_fee || 0), 0)
        if (total === 0) continue

        // Create invoice
        const { data: invoice, error: invError } = await supabase
          .from('invoices')
          .insert({
            member_id: memberId,
            period,
            total,
            status: 'pending',
            due_date: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
          })
          .select()
          .single()

        if (invError) throw invError

        // Create invoice items
        const invoiceItems = items.map((e: any) => ({
          invoice_id: invoice.id,
          enrollment_id: e.id,
          student_name: e.student?.name || '-',
          instrument: e.instrument,
          amount: e.tuition_fee || 0,
        }))

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems)

        if (itemsError) throw itemsError
        created++
      }

      alert(`Selesai! ${created} invoice baru, ${skipped} sudah ada sebelumnya.`)
      await fetchInvoices()
    } catch (err: any) {
      alert('Gagal generate invoice: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleMarkPaid(invoiceId: string) {
    if (!confirm('Tandai invoice ini sebagai LUNAS?')) return
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)

      if (error) throw error
      await fetchInvoices()
    } catch (err: any) {
      alert('Gagal update: ' + err.message)
    }
  }

  async function handleCancel(invoiceId: string) {
    if (!confirm('Batalkan invoice ini?')) return
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', invoiceId)

      if (error) throw error
      await fetchInvoices()
    } catch (err: any) {
      alert('Gagal: ' + err.message)
    }
  }

  const filtered = invoices.filter(inv => {
    const member = inv.member
    const matchesSearch = member?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.period?.includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const pendingTotal = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + (i.total || 0), 0)
  const paidTotal = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0)

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
          <h1 className="text-2xl font-bold text-foreground">KMC Tagihan</h1>
          <p className="text-muted-foreground mt-1">Kelola invoice kursus musik</p>
        </div>
        <button
          onClick={handleGenerateMonthly}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {generating ? 'Generate...' : 'Generate Bulan Ini'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Belum Dibayar</p>
          <p className="text-2xl font-bold text-yellow-400">
            Rp {pendingTotal.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {invoices.filter(i => i.status === 'pending').length} invoice
          </p>
        </div>
        <div className="glass rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Sudah Dibayar</p>
          <p className="text-2xl font-bold text-green-400">
            Rp {paidTotal.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {invoices.filter(i => i.status === 'paid').length} invoice
          </p>
        </div>
        <div className="glass rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Total Invoice</p>
          <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama member atau periode..."
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
          <option value="paid">Lunas</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <DollarSign size={48} className="mx-auto mb-4 opacity-40 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-1">Belum ada invoice</h3>
          <p className="text-sm text-muted-foreground">
            Klik "Generate Bulan Ini" untuk membuat invoice dari enrollment aktif
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => (
            <div key={invoice.id} className="glass rounded-xl p-4 border border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={16} className="text-accent shrink-0" />
                    <span className="font-semibold text-foreground">
                      {invoice.member?.full_name || '-'}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                      invoice.status === 'paid'
                        ? 'text-green-400 bg-green-500/10 border-green-500/30'
                        : invoice.status === 'cancelled'
                        ? 'text-gray-400 bg-gray-500/10 border-gray-500/30'
                        : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                    }`}>
                      {invoice.status === 'paid' ? 'Lunas' : invoice.status === 'cancelled' ? 'Batal' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {MONTHS[parseInt(invoice.period.split('-')[1]) - 1]} {invoice.period.split('-')[0]}
                    {invoice.due_date && ` · Jatuh tempo ${formatDate(invoice.due_date)}`}
                    {invoice.paid_at && ` · Dibayar ${formatDate(invoice.paid_at)}`}
                  </p>
                  {/* Invoice items */}
                  {invoice.invoice_items?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {invoice.invoice_items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {item.student_name} ({item.instrument})
                          </span>
                          <span className="text-foreground">Rp {item.amount.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  {invoice.status === 'pending' && (
                    <button
                      onClick={() => handleMarkPaid(invoice.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Check size={14} />
                      Tandai Lunas
                    </button>
                  )}
                  {invoice.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(invoice.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors"
                    >
                      <X size={14} />
                      Batalkan
                    </button>
                  )}
                  {invoice.status === 'paid' && (
                    <button
                      onClick={() => handleMarkPaid(invoice.id)}
                      disabled
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-xs font-medium opacity-50 cursor-default"
                    >
                      ✓ Lunas
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
