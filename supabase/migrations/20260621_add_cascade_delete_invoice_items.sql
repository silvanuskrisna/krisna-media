-- Add ON DELETE CASCADE to invoice_items.enrollment_id
-- So deleting an enrollment also removes its invoice_items

ALTER TABLE invoice_items
DROP CONSTRAINT IF EXISTS invoice_items_enrollment_id_fkey,
ADD CONSTRAINT invoice_items_enrollment_id_fkey
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE;