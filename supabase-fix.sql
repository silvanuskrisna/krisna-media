-- Fix: New signups get role 'member' instead of 'admin'
-- Jalankan SQL ini di Supabase SQL Editor

-- 1. Update CHECK constraint di tabel profiles agar menerima role 'member'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('member', 'admin', 'superadmin'));

-- 2. Update trigger function: default role = member
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url', 'member');
  RETURN NEW;
END;$$;

-- 3. Update your existing profile to superadmin (ganti email sesuai akun Kak Ivan)
UPDATE public.profiles
SET role = 'superadmin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'silvanuskrisna@gmail.com' LIMIT 1);
