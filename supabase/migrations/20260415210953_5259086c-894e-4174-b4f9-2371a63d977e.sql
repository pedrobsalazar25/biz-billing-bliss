-- Add is_shared column
ALTER TABLE public.invoices ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT false;

-- Set existing invoices with slugs as shared (preserve existing behavior)
UPDATE public.invoices SET is_shared = true WHERE public_share_slug IS NOT NULL;

-- Drop and recreate anon policy on invoices
DROP POLICY IF EXISTS "Public can view shared invoices" ON public.invoices;
CREATE POLICY "Public can view shared invoices"
ON public.invoices
FOR SELECT
TO anon
USING (is_shared = true AND public_share_slug IS NOT NULL);

-- Drop and recreate anon policy on invoice_line_items
DROP POLICY IF EXISTS "Public can view shared invoice line items" ON public.invoice_line_items;
CREATE POLICY "Public can view shared invoice line items"
ON public.invoice_line_items
FOR SELECT
TO anon
USING (EXISTS (
  SELECT 1 FROM invoices
  WHERE invoices.id = invoice_line_items.invoice_id
    AND invoices.is_shared = true
    AND invoices.public_share_slug IS NOT NULL
));