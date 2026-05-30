'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ImageIcon, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import type { GalleryItem, GalleryCategory } from '@/lib/types'
import { galleryCategories } from '@/lib/types'

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    fetchGallery()
  }, [])

  async function fetchGallery() {
    try {
      let query = supabase
        .from('gallery')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      setItems(data ?? [])
    } catch (err) {
      console.error('Failed to fetch gallery:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter((item) => item.category === activeCategory)

  const categories = [
    { value: 'all', label: 'Semua' },
    ...galleryCategories,
  ]

  function openLightbox(index: number) {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  function closeLightbox() {
    setLightboxOpen(false)
  }

  function prevImage() {
    setLightboxIndex((prev) =>
      prev === 0 ? filteredItems.length - 1 : prev - 1
    )
  }

  function nextImage() {
    setLightboxIndex((prev) =>
      prev === filteredItems.length - 1 ? 0 : prev + 1
    )
  }

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxOpen, lightboxIndex])

  return (
    <>
      <div className="fixed top-0 right-0 w-1/2 h-1/2 bg-accent/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-1/3 h-1/3 bg-accent/3 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-grid opacity-40 bg-noise" />
        <div className="absolute inset-0 bg-gradient-radial from-accent/8 via-background/90 to-background" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="animate-fade-in">
            <p className="inline-flex items-center gap-2 text-sm text-accent font-medium tracking-wider uppercase mb-4 border border-accent/20 rounded-full px-4 py-1.5 glass">
              <ImageIcon size={14} />
              Dokumentasi
            </p>
          </div>
          <h1 className="animate-fade-in delay-100 text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
            Galeri
          </h1>
          <p className="animate-fade-in delay-200 text-muted text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Dokumentasi kegiatan, studio, dan momen-momen bersama Krisna Media.
          </p>
        </div>
      </section>

      <div className="section-divider mx-6 md:mx-12" />

      {/* ===== FILTER ===== */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.value
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                    isActive
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/25'
                      : 'glass text-muted-foreground hover:text-foreground border-border hover:border-muted-foreground'
                  }`}
                >
                  {cat.value === 'all' ? (
                    <span className="flex items-center gap-1.5">
                      <Filter size={14} />
                      {cat.label}
                    </span>
                  ) : (
                    cat.label
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== GALLERY GRID ===== */}
      <section className="pb-24 md:pb-40">
        <div className="max-w-6xl mx-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-muted-foreground animate-pulse">Memuat foto...</div>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredItems.map((item, i) => (
                <div
                  key={item.id}
                  onClick={() => openLightbox(i)}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden glass border border-border cursor-pointer hover-card animate-fade-in-up"
                  style={{ animationDelay: `${(i % 6) * 100}ms` }}
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                      {item.description && (
                        <p className="text-white/70 text-xs mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 animate-fade-in">
              <ImageIcon size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Belum ada foto
              </h3>
              <p className="text-muted text-sm max-w-md mx-auto">
                {activeCategory !== 'all'
                  ? 'Belum ada foto untuk kategori ini.'
                  : 'Galeri masih kosong. Nantikan update terbaru!'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ===== LIGHTBOX ===== */}
      {lightboxOpen && filteredItems.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <X size={24} />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prevImage() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft size={28} />
          </button>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); nextImage() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight size={28} />
          </button>

          {/* Image */}
          <div
            className="max-w-5xl max-h-[85vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={filteredItems[lightboxIndex].image_url}
              alt={filteredItems[lightboxIndex].title}
              className="w-full h-full object-contain rounded-xl"
            />
            <div className="text-center mt-4">
              <h3 className="text-white font-semibold">
                {filteredItems[lightboxIndex].title}
              </h3>
              {filteredItems[lightboxIndex].description && (
                <p className="text-white/60 text-sm mt-1">
                  {filteredItems[lightboxIndex].description}
                </p>
              )}
              <p className="text-white/40 text-xs mt-2">
                {lightboxIndex + 1} / {filteredItems.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
