
-- Create recurring frequency enum
CREATE TYPE public.recurring_frequency AS ENUM ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly');

-- Create recurring invoices table
CREATE TABLE public.recurring_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  frequency recurring_frequency NOT NULL DEFAULT 'monthly',
  next_run_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  notes text,
  terms text,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create recurring invoice line items table
CREATE TABLE public.recurring_invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_invoice_id uuid NOT NULL REFERENCES public.recurring_invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_invoice_line_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for recurring_invoices
CREATE POLICY "Users manage own recurring invoices"
  ON public.recurring_invoices FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS policies for recurring_invoice_line_items
CREATE POLICY "Users manage own recurring invoice line items"
  ON public.recurring_invoice_line_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.recurring_invoices
    WHERE recurring_invoices.id = recurring_invoice_line_items.recurring_invoice_id
    AND recurring_invoices.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.recurring_invoices
    WHERE recurring_invoices.id = recurring_invoice_line_items.recurring_invoice_id
    AND recurring_invoices.user_id = auth.uid()
  ));

-- Updated_at trigger
CREATE TRIGGER set_recurring_invoices_updated_at
  BEFORE UPDATE ON public.recurring_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
