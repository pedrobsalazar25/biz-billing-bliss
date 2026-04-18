
-- 1. Add columns
ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_share_slug text;

-- 2. Slug generator trigger function
CREATE OR REPLACE FUNCTION public.generate_estimate_share_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  client_name text;
  est_suffix text;
  base_slug text;
BEGIN
  IF NEW.public_share_slug IS NOT NULL AND NEW.public_share_slug <> '' THEN
    RETURN NEW;
  END IF;

  IF NEW.client_id IS NOT NULL THEN
    SELECT name INTO client_name FROM public.clients WHERE id = NEW.client_id;
  END IF;

  est_suffix := lower(regexp_replace(COALESCE(NEW.estimate_number, ''), '[^a-zA-Z0-9]+', '-', 'g'));
  est_suffix := right(est_suffix, 4);

  IF client_name IS NOT NULL THEN
    base_slug := lower(regexp_replace(trim(client_name), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || est_suffix;
  ELSE
    base_slug := 'estimate-' || est_suffix;
  END IF;

  base_slug := trim(both '-' from base_slug);
  NEW.public_share_slug := base_slug;
  RETURN NEW;
END;
$$;

-- 3. Trigger (after estimate_number is generated)
DROP TRIGGER IF EXISTS trg_generate_estimate_share_slug ON public.estimates;
CREATE TRIGGER trg_generate_estimate_share_slug
  BEFORE INSERT ON public.estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_estimate_share_slug();

-- 4. Backfill slugs for existing estimates
UPDATE public.estimates e
SET public_share_slug =
  trim(both '-' from (
    COALESCE(
      lower(regexp_replace(trim(c.name), '[^a-zA-Z0-9]+', '-', 'g')),
      'estimate'
    )
    || '-' ||
    right(lower(regexp_replace(COALESCE(e.estimate_number,''), '[^a-zA-Z0-9]+','-','g')), 4)
  ))
FROM public.clients c
WHERE e.client_id = c.id AND (e.public_share_slug IS NULL OR e.public_share_slug = '');

UPDATE public.estimates
SET public_share_slug = 'estimate-' || right(lower(regexp_replace(COALESCE(estimate_number,''), '[^a-zA-Z0-9]+','-','g')), 4)
WHERE public_share_slug IS NULL OR public_share_slug = '';

-- 5. Unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS estimates_public_share_slug_key
  ON public.estimates (public_share_slug);

-- 6. RLS policies for public access
DROP POLICY IF EXISTS "Public can view shared estimates" ON public.estimates;
CREATE POLICY "Public can view shared estimates"
ON public.estimates
FOR SELECT
TO anon
USING (
  is_shared = true
  AND public_share_slug IS NOT NULL
  AND status IN ('sent','approved','converted')
);

DROP POLICY IF EXISTS "Public can view shared estimate line items" ON public.estimate_line_items;
CREATE POLICY "Public can view shared estimate line items"
ON public.estimate_line_items
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.estimates e
    WHERE e.id = estimate_line_items.estimate_id
      AND e.is_shared = true
      AND e.public_share_slug IS NOT NULL
  )
);

DROP POLICY IF EXISTS "Public can view business profiles of shared estimates" ON public.business_profiles;
CREATE POLICY "Public can view business profiles of shared estimates"
ON public.business_profiles
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.estimates e
    WHERE e.business_profile_id = business_profiles.id
      AND e.is_shared = true
      AND e.public_share_slug IS NOT NULL
      AND e.status IN ('sent','approved','converted')
  )
);

DROP POLICY IF EXISTS "Public can view clients of shared estimates" ON public.clients;
CREATE POLICY "Public can view clients of shared estimates"
ON public.clients
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.estimates e
    WHERE e.client_id = clients.id
      AND e.is_shared = true
      AND e.public_share_slug IS NOT NULL
      AND e.status IN ('sent','approved','converted')
  )
);
