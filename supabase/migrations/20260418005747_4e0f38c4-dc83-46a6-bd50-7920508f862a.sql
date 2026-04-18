CREATE POLICY "Public can view business profiles of shared invoices"
ON public.business_profiles
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.business_profile_id = business_profiles.id
      AND i.is_shared = true
      AND i.public_share_slug IS NOT NULL
      AND i.status IN ('sent'::invoice_status, 'paid'::invoice_status)
  )
);