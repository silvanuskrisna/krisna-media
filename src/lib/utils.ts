import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function getWhatsAppUrl(phone: string | unknown, message?: string): string {
  const cleaned = String(phone ?? '').replace(/[^0-9]/g, '')
  const phoneWithCode = cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned
  const url = `https://wa.me/${phoneWithCode}`
  return message ? `${url}?text=${encodeURIComponent(message)}` : url
}

export const categoryLabels: Record<string, { id: string; en: string }> = {
  sound: { id: 'Sound System', en: 'Sound System' },
  lighting: { id: 'Lighting', en: 'Lighting' },
  studio: { id: 'Studio Musik', en: 'Music Studio' },
  'senar-gitar': { id: 'Senar Gitar', en: 'Guitar Strings' },
  'kursus-musik': { id: 'Kursus Musik', en: 'Music Course' },
}

export const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}
