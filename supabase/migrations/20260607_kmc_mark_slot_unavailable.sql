-- Function to mark a kmc_schedule slot as unavailable (bypasses RLS for members)
-- Runs with SECURITY DEFINER so members can call it without direct UPDATE access
-- Admin still manages kmc_schedules directly (toggle availability, CRUD)
CREATE OR REPLACE FUNCTION public.mark_slot_unavailable(
  p_day TEXT,
  p_start_time TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.kmc_schedules
  SET is_available = false
  WHERE day = p_day AND start_time = p_start_time;
END;
$$;
