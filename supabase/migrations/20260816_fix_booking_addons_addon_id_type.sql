-- ================================================================
-- FIX: Change booking_addons.addon_id from UUID to TEXT
-- ================================================================
-- Root cause: Gear add-ons from site_settings use string IDs
-- (e.g. "dw-drums", "jazz-chorus"), not UUIDs. The booking_addons
-- table was created with addon_id as UUID, causing:
--   "invalid input syntax for type uuid: \"dw-drums\""
-- when the API route tries to insert the add-on.
-- ================================================================

ALTER TABLE booking_addons
  ALTER COLUMN addon_id TYPE TEXT USING addon_id::text;