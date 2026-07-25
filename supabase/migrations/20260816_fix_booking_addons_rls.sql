-- ============================================
-- FIX: RLS policies for booking_addons table
-- ============================================
-- Root cause: Customers select gear add-ons (e.g. DW Drums, Jazz Chorus)
-- in the booking form. The booking row inserts fine (bookings has INSERT
-- policy), but the booking_addons insert is blocked by RLS → add-ons
-- silently dropped, total_price already includes the add-on but the
-- individual line items are lost.

-- 1. Allow authenticated users to insert add-ons for their own bookings
CREATE POLICY "Users insert own booking addons" ON booking_addons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND b.customer_email = auth.jwt() ->> 'email'
    )
  );

-- 2. Allow authenticated users to read add-ons for their own bookings
--    (needed by booking confirmation / detail page)
CREATE POLICY "Users read own booking addons" ON booking_addons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND b.customer_email = auth.jwt() ->> 'email'
    )
  );

-- 3. Admin can insert add-ons for any booking (manual edit by admin)
CREATE POLICY "Admins insert booking addons" ON booking_addons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'superadmin')
    )
  );

-- 4. Admin can read add-ons for any booking
CREATE POLICY "Admins read all booking addons" ON booking_addons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'superadmin')
    )
  );