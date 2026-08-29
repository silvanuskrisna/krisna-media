'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatDate, formatPrice } from '@/lib/utils'
import { ArrowLeft, Printer } from 'lucide-react'
import type { Booking } from '@/lib/types'

export default function AdminKwitansi() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [addons, setAddons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', params.id)
          .single()
        if (error) throw error
        setBooking(data)

        const { data: addonData } = await supabase
          .from('booking_addons')
          .select('*')
          .eq('booking_id', params.id)
        if (addonData) setAddons(addonData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Memuat...</div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Pesanan tidak ditemukan</h2>
          <Link href="/admin/bookings" className="text-accent hover:underline text-sm">Kembali</Link>
        </div>
      </div>
    )
  }

  const addonTotal = addons.reduce((sum, a) => sum + (a.subtotal || a.unit_price || 0), 0)

  return (
      <>
        {/* ─── TOOLBAR ─── */}
        <div className="max-w-2xl mx-auto px-4 py-4 no-print">
          <div className="flex items-center justify-between">
            <Link
              href={`/admin/bookings/${params.id}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              Kembali ke detail pesanan
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent rounded-lg text-sm font-medium hover:bg-accent/30 transition-colors"
            >
              <Printer size={16} />
              Cetak / Print
            </button>
          </div>
        </div>

        {/* ─── KWITANSI ─── */}
        <div className="max-w-2xl mx-auto px-4 pb-12">
          <div className="bg-white text-black rounded-xl p-8 md:p-10 shadow-lg border border-gray-200">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-300 pb-5 mb-6">
            <h1 className="text-xl font-bold uppercase tracking-wider">Krisna Media</h1>
            <p className="text-xs text-gray-500 mt-1">Banjarmasin</p>
            <p className="text-xs text-gray-500">WA: 0811-5191-097</p>
          </div>
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold uppercase">Kwitansi Pembayaran</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-xs text-gray-500">Kode Booking:</span>
              <span className="font-mono font-bold text-sm">{booking.booking_code || booking.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>

          {/* Info */}
          <table className="w-full text-sm mb-6">
            <tbody>
              <tr>
                <td className="py-1.5 text-gray-500 w-32 align-top">Telah diterima dari</td>
                <td className="py-1.5 font-medium">: {booking.customer_name}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-500">Uang sebesar</td>
                <td className="py-1.5 font-bold text-base">: {formatPrice(booking.total_price || 0)}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-500 align-top">Untuk pembayaran</td>
                <td className="py-1.5">: {booking.product_name || '-'}</td>
              </tr>
              {booking.booking_date && (
              <tr>
                <td className="py-1.5 text-gray-500">Tanggal</td>
                <td className="py-1.5">: {formatDate(booking.booking_date)}</td>
              </tr>
              )}
              {booking.start_time && (
              <tr>
                <td className="py-1.5 text-gray-500">Waktu</td>
                <td className="py-1.5">: {booking.start_time}{booking.end_time ? ` - ${booking.end_time}` : ''}</td>
              </tr>
              )}
              <tr>
                <td className="py-1.5 text-gray-500">Metode Bayar</td>
                <td className="py-1.5 capitalize">: {booking.payment_method === 'transfer' ? 'Transfer Bank' : booking.payment_method === 'cash' ? 'Tunai' : '-'}</td>
              </tr>
            </tbody>
          </table>

          {/* Add-ons */}
          {addons.length > 0 && (
            <div className="border-t border-gray-200 pt-4 mb-6">
              <p className="text-xs text-gray-500 mb-2">Rincian:</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1.5 text-gray-500 font-medium text-xs">Item</th>
                    <th className="text-right py-1.5 text-gray-500 font-medium text-xs">Harga</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1">{booking.product_name}</td>
                    <td className="py-1 text-right">{formatPrice((booking.total_price || 0) - addonTotal)}</td>
                  </tr>
                  {addons.map((a) => (
                    <tr key={a.id}>
                      <td className="py-1 text-gray-600">{a.addon_name}</td>
                      <td className="py-1 text-right text-gray-600">{formatPrice(a.subtotal || a.unit_price || 0)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200 font-bold">
                    <td className="py-1.5">Total</td>
                    <td className="py-1.5 text-right">{formatPrice(booking.total_price || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-gray-300 pt-5 mt-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-gray-500 mb-3">Terbilang:</p>
                <p className="text-sm italic">{terbilang(booking.total_price || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-8">Hormat Kami,</p>
                <p className="text-sm font-medium border-t border-gray-400 pt-1 w-32">X-Studio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Kwitansi ini adalah bukti pembayaran yang sah · Krisna Media © {new Date().getFullYear()}
        </p>
      </div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          footer, header, nav, aside { display: none !important; }
          @page { margin: 15mm; }
        }
      `}</style>
    </>
  )
}

// Simple number to words converter for Indonesian
function terbilang(amount: number): string {
  if (amount === 0) return 'Nol Rupiah'
  const angka: string[] = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas']
  const satuan: string[] = ['', 'Ribu', 'Juta', 'Miliar', 'Triliun']

  function sebut(n: number): string {
    if (n < 12) return angka[n]
    if (n < 20) return `${angka[n - 10]} Belas`
    if (n < 100) {
      const puluh = Math.floor(n / 10)
      const sisa = n % 10
      return `${angka[puluh]} Puluh${sisa > 0 ? ` ${angka[sisa]}` : ''}`
    }
    if (n < 200) return `Seratus${n > 100 ? ` ${sebut(n - 100)}` : ''}`
    if (n < 1000) {
      const ratus = Math.floor(n / 100)
      const sisa = n % 100
      return `${angka[ratus]} Ratus${sisa > 0 ? ` ${sebut(sisa)}` : ''}`
    }
    // Ribuan ke atas: handle recursive
    for (let i = satuan.length - 1; i >= 0; i--) {
      const step = i === 0 ? 1 : Math.pow(1000, i)
      if (n >= step) {
        const bagi = Math.floor(n / step)
        const sisa = n % step
        let prefix = bagi === 1 ? (i === 1 ? 'Se' : 'Satu ') : sebut(bagi) + ' '
        const suffix = sisa > 0 ? ` ${sebut(sisa)}` : ''
        return `${prefix}${satuan[i]}${suffix}`
      }
    }
    return ''
  }

  const result = sebut(amount)
  return `${result} Rupiah`
}