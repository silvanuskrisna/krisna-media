import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase-service'

/**
 * POST /api/bookings/[bookingId]/addons
 * Save add-ons for a booking (hours + gears) — uses service role to bypass RLS
 * Supports both English and Indonesian field name formats
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params
    const body = await request.json()
    const { addons } = body

    if (!addons || !Array.isArray(addons)) {
      return NextResponse.json(
        { error: 'Invalid addons format' },
        { status: 400 }
      )
    }

    // Map client field names → database field names.
    // Supports both English and Indonesian naming formats.
    const addonRecords = addons.map((addon: any) => {
      const record: any = {
        booking_id: bookingId,
        addon_type: addon.addon_type || addon.tipe || null,
        addon_id: addon.addon_id || addon.gear_id || addon.id || null,
        addon_name: addon.addon_name || addon.nama || addon.name || '(no name)',
        quantity: addon.quantity || 1,
        unit_price: addon.unit_price || addon.harga || addon.price || 0,
        subtotal: addon.subtotal || (addon.quantity || 1) * (addon.unit_price || addon.harga || addon.price || 0),
      }

      // Auto-detect addon_type if not provided
      if (!record.addon_type) {
        record.addon_type = record.addon_id && record.addon_id !== 'null' ? 'gear' : 'hour'
      }

      return record
    })

    const { data, error } = await supabaseService
      .from('booking_addons')
      .insert(addonRecords)
      .select()

    if (error) throw error

    return NextResponse.json(
      { success: true, addons: data },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('Error saving booking addons:', err)
    return NextResponse.json(
      { error: 'Failed to save addons', details: err.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/bookings/[bookingId]/addons
 * Fetch all addons for a booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params

    const { data, error } = await supabaseService
      .from('booking_addons')
      .select('*')
      .eq('booking_id', bookingId)

    if (error) throw error

    return NextResponse.json(data || [], { status: 200 })
  } catch (err: any) {
    console.error('Error fetching booking addons:', err)
    return NextResponse.json(
      { error: 'Failed to fetch addons', details: err.message },
      { status: 500 }
    )
  }
}