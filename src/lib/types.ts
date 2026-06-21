export interface AdminTemplate {
  id: string
  name: string
  category: string
  content: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  category: 'sound' | 'lighting' | 'studio' | 'senar-gitar' | 'kursus-musik'
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
  booking_code: string
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
  promo_id: string | null
  promo_name: string | null
  notes: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface StudioAddonGear {
  id: string
  name: string
  price: number
  category: 'microphone' | 'headphone' | 'cable' | 'effect' | 'other'
  description: string | null
  stock: number | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface BookingAddon {
  id: string
  booking_id: string
  addon_type: 'hour' | 'gear'
  addon_id: string | null
  addon_name: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export interface Promo {
  id: string
  name: string
  description: string | null
  price_per_2hour: number
  quota: number
  used: number
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HappyHourSettings {
  enabled: boolean
  start_time: string
  end_time: string
  days: string[]
  price_1hour: number
  price_2hour: number
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

// --- KMC New Schema ---

export interface Member {
  id: string
  full_name: string
  phone: string | null
  whatsapp: string | null
  address: string | null
  referral_source: string | null
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  member_id: string
  name: string
  age: number | null
  whatsapp: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  instrument: 'Gitar' | 'Piano' | 'Drum'
  age_group: 'kids' | 'teen' | 'adult' | null
  experience_level: 'beginner' | 'intermediate' | 'advanced' | null
  status: 'pending' | 'active' | 'cuti' | 'inactive'
  tuition_fee: number | null
  sessions_per_month: number
  start_date: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface LessonSchedule {
  id: string
  enrollment_id: string
  day: string
  start_time: string
  end_time: string
  created_at: string
}

export interface Invoice {
  id: string
  member_id: string
  period: string
  total: number
  status: 'pending' | 'paid' | 'cancelled'
  due_date: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  enrollment_id: string
  student_name: string
  instrument: string
  amount: number
  created_at: string
}

// Enrollment with student info (for display)
export interface EnrollmentWithStudent extends Enrollment {
  student: Pick<Student, 'id' | 'name' | 'age'>
  lesson_schedules?: LessonSchedule[]
}

// Member with children and enrollments (for admin)
export interface MemberWithDetails extends Member {
  students: (Student & {
    enrollments: (Enrollment & {
      lesson_schedules: LessonSchedule[]
    })[]
  })[]
}

export type ProductCategory = Product['category']
export type BookingStatus = Booking['status']
export type EnrollmentStatus = Enrollment['status']
export type InvoiceStatus = Invoice['status']
