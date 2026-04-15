-- Update anon policy on invoices to exclude drafts
DROP POLICY IF EXISTS "Public can view shared invoices" ON public.invoices;
CREATE POLICY "Public can view shared invoices"
ON public.invoices
FOR SELECT
TO anon
USING (is_shared = true AND public_share_slug IS NOT NULL AND status IN ('sent', 'paid'));