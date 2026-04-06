
-- Create estimate status enum
CREATE TYPE public.estimate_status AS ENUM ('draft', 'sent', 'approved', 'rejected', 'converted');

-- Create estimates table
CREATE TABLE public.estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_profile_id uuid REFERENCES public.business_profiles(id),
  client_id uuid REFERENCES public.clients(id),
  estimate_number text NOT NULL,
  status public.estimate_status NOT NULL DEFAULT 'draft',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  notes text,
  terms text,
  converted_invoice_id uuid REFERENCES public.invoices(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create estimate line items table
CREATE TABLE public.estimate_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_line_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for estimates
CREATE POLICY "Users manage own estimates" ON public.estimates FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS policies for estimate line items
CREATE POLICY "Users manage own estimate line items" ON public.estimate_line_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.estimates WHERE estimates.id = estimate_line_items.estimate_id AND estimates.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.estimates WHERE estimates.id = estimate_line_items.estimate_id AND estimates.user_id = auth.uid()));

-- Auto-generate estimate number
CREATE OR REPLACE FUNCTION public.generate_estimate_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  prefix text;
  next_num integer;
BEGIN
  IF NEW.estimate_number IS NULL OR NEW.estimate_number = '' THEN
    SELECT bp.invoice_prefix INTO prefix FROM public.business_profiles bp WHERE bp.id = NEW.business_profile_id;
    SELECT COALESCE(MAX(CAST(RIGHT(estimate_number, 5) AS integer)), 0) + 1 INTO next_num FROM public.estimates WHERE user_id = NEW.user_id;
    NEW.estimate_number := COALESCE(prefix, 'EST') || '-Q' || lpad(next_num::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_estimate_number BEFORE INSERT ON public.estimates
  FOR EACH ROW EXECUTE FUNCTION public.generate_estimate_number();

-- Compute line item amount
CREATE TRIGGER trg_compute_estimate_line_item_amount BEFORE INSERT OR UPDATE ON public.estimate_line_items
  FOR EACH ROW EXECUTE FUNCTION public.compute_line_item_amount();

-- Recompute estimate totals
CREATE OR REPLACE FUNCTION public.recompute_estimate_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  est_id uuid;
  new_subtotal numeric(12,2);
BEGIN
  est_id := COALESCE(NEW.estimate_id, OLD.estimate_id);
  SELECT COALESCE(SUM(amount), 0) INTO new_subtotal FROM public.estimate_line_items WHERE estimate_id = est_id;
  UPDATE public.estimates SET
    subtotal = new_subtotal,
    tax_amount = ROUND(new_subtotal * tax_rate / 100, 2),
    total = new_subtotal + ROUND(new_subtotal * tax_rate / 100, 2) - discount_amount,
    updated_at = now()
  WHERE id = est_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_recompute_estimate_totals AFTER INSERT OR UPDATE OR DELETE ON public.estimate_line_items
  FOR EACH ROW EXECUTE FUNCTION public.recompute_estimate_totals();

-- Updated_at trigger
CREATE TRIGGER set_estimates_updated_at BEFORE UPDATE ON public.estimates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
