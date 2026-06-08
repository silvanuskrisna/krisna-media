-- Allow members WITHOUT auth.users reference
-- So admin can create members manually (for non-tech-savvy users)
-- Existing auth-linked members remain unaffected

-- Drop the FK constraint that requires every member to have an auth.users
ALTER TABLE members
  DROP CONSTRAINT members_id_fkey;

-- Change default so new admin-created members get a UUID
ALTER TABLE members
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add email column (nullable, for future login linking)
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS email TEXT;
