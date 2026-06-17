import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/bookings/[bookingId]/addons
 * Save add-ons for a booking (hours + gears)
 * 
 * Request body:
 * {
 *   addons: [
 *     { addon_type: 'hour', addon_name: '1 Hour Add-On', quantity: 1, unit_price: 85000, subtotal: 85000 },
 *     { addon_type: 'gear', addon_id: 'uuid', addon_name: 'Microphone', quantity: 1, unit_price: 200000, subtotal: 200000 }
 *   ]
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params
    const body = await request.json()
    const { addons } = body

    if (!addons || !Array.isArray(addons)) {
      return NextResponse.json(
        { error: 'Invalid addons format' },
        { status: 400 }
      )
    }

    // Insert each addon
    const addonRecords = addons.map((addon: any) => ({
      booking_id: bookingId,
      addon_type: addon.addon_type,
      addon_id: addon.addon_id || null,
      addon_name: addon.addon_name,
      quantity: addon.quantity || 1,
      unit_price: addon.unit_price,
      subtotal: addon.subtotal,
    }))

    const { data, error } = await supabase
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
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params

    const { data, error } = await supabase
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
