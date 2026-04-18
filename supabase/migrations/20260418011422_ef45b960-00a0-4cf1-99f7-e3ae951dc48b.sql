-- Trigger function: auto-set business_profile_id on insert when missing
CREATE OR REPLACE FUNCTION public.set_business_profile_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.business_profile_id IS NULL THEN
    SELECT id INTO NEW.business_profile_id
    FROM public.business_profiles
    WHERE user_id = NEW.user_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoices_set_business_profile ON public.invoices;
CREATE TRIGGER trg_invoices_set_business_profile
BEFORE INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_business_profile_id();

DROP TRIGGER IF EXISTS trg_estimates_set_business_profile ON public.estimates;
CREATE TRIGGER trg_estimates_set_business_profile
BEFORE INSERT ON public.estimates
FOR EACH ROW EXECUTE FUNCTION public.set_business_profile_id();

DROP TRIGGER IF EXISTS trg_recurring_invoices_set_business_profile ON public.recurring_invoices;
CREATE TRIGGER trg_recurring_invoices_set_business_profile
BEFORE INSERT ON public.recurring_invoices
FOR EACH ROW EXECUTE FUNCTION public.set_business_profile_id();

-- Backfill existing rows
UPDATE public.invoices i
SET business_profile_id = b.id
FROM public.business_profiles b
WHERE i.business_profile_id IS NULL
  AND b.user_id = i.user_id;

UPDATE public.estimates e
SET business_profile_id = b.id
FROM public.business_profiles b
WHERE e.business_profile_id IS NULL
  AND b.user_id = e.user_id;

UPDATE public.recurring_invoices r
SET business_profile_id = b.id
FROM public.business_profiles b
WHERE r.business_profile_id IS NULL
  AND b.user_id = r.user_id;