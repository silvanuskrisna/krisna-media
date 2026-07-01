-- Trigger function untuk notifikasi booking baru
CREATE OR REPLACE FUNCTION notify_booking_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://krisnamedia.id/api/webhooks/supabase',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'bookings',
      'schema', 'public',
      'record', row_to_json(NEW)::jsonb
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_insert ON bookings;
CREATE TRIGGER on_booking_insert
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_insert();

-- Trigger function untuk pendaftaran KMC baru
CREATE OR REPLACE FUNCTION notify_enrollment_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://krisnamedia.id/api/webhooks/supabase',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'enrollments',
      'schema', 'public',
      'record', row_to_json(NEW)::jsonb
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_enrollment_insert ON enrollments;
CREATE TRIGGER on_enrollment_insert
  AFTER INSERT ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION notify_enrollment_insert();

-- Trigger function untuk member baru
CREATE OR REPLACE FUNCTION notify_member_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://krisnamedia.id/api/webhooks/supabase',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'members',
      'schema', 'public',
      'record', row_to_json(NEW)::jsonb
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_member_insert ON members;
CREATE TRIGGER on_member_insert
  AFTER INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION notify_member_insert();

-- Trigger function untuk siswa baru
CREATE OR REPLACE FUNCTION notify_student_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://krisnamedia.id/api/webhooks/supabase',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'students',
      'schema', 'public',
      'record', row_to_json(NEW)::jsonb
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_student_insert ON students;
CREATE TRIGGER on_student_insert
  AFTER INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION notify_student_insert();

-- Trigger function untuk invoice (pembayaran)
CREATE OR REPLACE FUNCTION notify_invoice_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://krisnamedia.id/api/webhooks/supabase',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'invoices',
      'schema', 'public',
      'record', row_to_json(NEW)::jsonb
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_invoice_insert ON invoices;
CREATE TRIGGER on_invoice_insert
  AFTER INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_invoice_insert();