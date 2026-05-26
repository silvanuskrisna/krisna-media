-- Fix: New users get role 'member', not 'admin'
-- Jalankan SQL ini di Supabase SQL Editor

-- 1. Update trigger function: default role = member
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url', 'member');
  RETURN NEW;
END;$$;

-- 2. Update your existing profile to superadmin (ganti dengan email Kak Ivan)
-- Cari dulu user ID-nya: SELECT id, email FROM auth.users WHERE email = 'silvanuskrisna@gmail.com';
-- Lalu jalankan: UPDATE profiles SET role = 'superadmin' WHERE id = 'user-id-dari-query-di-atas';

-- Atau gabungin jadi satu query:
UPDATE public.profiles
SET role = 'superadmin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'silvanuskrisna@gmail.com' LIMIT 1);
