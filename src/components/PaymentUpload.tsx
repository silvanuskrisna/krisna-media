'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, CheckCircle, Loader2, Building2, Copy } from 'lucide-react'

interface BankInfo {
  bank_name: string
  bank_account: string
  bank_holder: string
}

export default function PaymentUpload({ bookingId }: { bookingId: string }) {
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch bank info from site_settings
  useEffect(() => {
    async function fetchBankInfo() {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['bank_name', 'bank_account', 'bank_holder'])

      if (data) {
        const info: BankInfo = { bank_name: '', bank_account: '', bank_holder: '' }
        for (const row of data) {
          const val = typeof row.value === 'object' ? Object.values(row.value)[0] : row.value
          info[row.key as keyof BankInfo] = String(val ?? '')
        }
        // Only show if all fields are filled
        if (info.bank_name && info.bank_account && info.bank_holder) {
          setBankInfo(info)
        }
      }
    }
    fetchBankInfo()
  }, [])

  // Check if already uploaded
  useEffect(() => {
    async function checkProof() {
      const { data } = await supabase
        .from('bookings')
        .select('payment_proof')
        .eq('id', bookingId)
        .single()

      if (data?.payment_proof) {
        setUploaded(true)
      }
    }
    checkProof()
  }, [bookingId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Hanya file gambar yang diizinkan (jpg, png, dll)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Upload ke Supabase Storage
      const fileName = `proof-${bookingId}-${Date.now()}.${file.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw new Error(uploadError.message)

      // Dapatkan public URL
      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl

      // Update booking record
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_proof: publicUrl,
          payment_method: 'transfer',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      if (updateError) throw new Error(updateError.message)

      setUploaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengupload bukti')
    } finally {
      setUploading(false)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  if (!bankInfo) return null

  if (uploaded) {
    return (
      <div className="glass rounded-xl p-6 border border-green-500/20 bg-green-500/5">
        <div className="flex items-center gap-3">
          <CheckCircle size={20} className="text-green-400" />
          <div>
            <p className="text-sm font-medium text-green-300">Bukti Pembayaran Terkirim</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tim Krisna Media akan memverifikasi pembayaran Anda.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-6 border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Building2 size={18} />
        Pembayaran Transfer Bank
      </h3>

      {/* Bank Info */}
      <div className="bg-[#171717] rounded-lg p-4 mb-5 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Bank</p>
          <p className="text-sm font-medium text-foreground">{bankInfo.bank_name}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">No. Rekening</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-mono font-bold text-foreground">{bankInfo.bank_account}</p>
            <button
              onClick={() => handleCopy(bankInfo.bank_account)}
              className="p-1 rounded hover:bg-[#262626] transition-colors"
              title="Salin no. rekening"
            >
              <Copy size={14} className={copied ? 'text-green-400' : 'text-muted-foreground'} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Atas Nama</p>
          <p className="text-sm font-medium text-foreground">{bankInfo.bank_holder}</p>
        </div>
      </div>

      {/* Upload */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Setelah transfer, upload bukti pembayaran di sini:
        </p>

        <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors bg-[#171717]">
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-accent" />
              <span className="text-sm text-muted-foreground">Mengupload...</span>
            </div>
          ) : (
            <>
              <Upload size={24} className="text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                Klik untuk upload foto bukti transfer
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                Max 5MB (JPG, PNG)
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>

        {error && (
          <p className="text-sm text-red-400 mt-2">{error}</p>
        )}

        <p className="text-xs text-muted-foreground mt-3">
          * Pesanan akan dikonfirmasi setelah pembayaran diverifikasi oleh admin
        </p>
      </div>
    </div>
  )
}
