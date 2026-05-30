export interface Product {
  id: string
  name: string
  slug: string
  category: 'sound' | 'lighting' | 'studio' | 'senar-gitar'
  description: string | null
  price: number
  price_unit: string
  image_url: string | null
  stock: number | null
  is_active: boolean
  featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  product_id: string | null
  product_name: string | null
  booking_date: string
  start_time: string | null
  end_time: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  payment_method: string | null
  payment_proof: string | null
  total_price: number | null
  notes: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface Testimonial {
  id: string
  customer_name: string
  content: string
  rating: number
  image_url: string | null
  is_active: boolean
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: 'member' | 'admin' | 'superadmin'
  created_at: string
  updated_at: string
}

export interface SiteSetting {
  id: string
  key: string
  value: Record<string, any>
  updated_at: string
}

export interface GalleryItem {
  id: string
  title: string
  description: string | null
  image_url: string
  category: 'studio' | 'sound' | 'lighting' | 'event' | 'other'
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type GalleryCategory = GalleryItem['category']

export const galleryCategories: { value: GalleryCategory; label: string }[] = [
  { value: 'studio', label: 'Studio Musik' },
  { value: 'sound', label: 'Sound System' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Lainnya' },
]

export type ProductCategory = Product['category']
export type BookingStatus = Booking['status']
