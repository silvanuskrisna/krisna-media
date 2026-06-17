import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/studio-addon-gears
 * Fetch all active studio addon gears
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('studio_addon_gears')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [], { status: 200 })
  } catch (err: any) {
    console.error('Error fetching studio addon gears:', err)
    return NextResponse.json(
      { error: 'Failed to fetch addon gears', details: err.message },
      { status: 500 }
    )
  }
}
