
-- Create expense categories enum
CREATE TYPE public.expense_category AS ENUM (
  'office_supplies', 'travel', 'utilities', 'rent', 'software',
  'marketing', 'insurance', 'professional_services', 'meals', 'equipment', 'other'
);

-- Create expenses table
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category expense_category NOT NULL DEFAULT 'other',
  description text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  vendor text,
  receipt_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users manage own expenses"
  ON public.expenses FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
