
-- Add waived column to invoice_line_items
ALTER TABLE public.invoice_line_items ADD COLUMN waived boolean NOT NULL DEFAULT false;

-- Update compute_line_item_amount to respect waived flag
CREATE OR REPLACE FUNCTION public.compute_line_item_amount()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.waived THEN
    NEW.amount := 0;
  ELSE
    NEW.amount := ROUND(NEW.quantity * NEW.unit_price, 2);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for compute_line_item_amount (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_compute_line_item_amount') THEN
    CREATE TRIGGER trg_compute_line_item_amount
      BEFORE INSERT OR UPDATE ON public.invoice_line_items
      FOR EACH ROW
      EXECUTE FUNCTION public.compute_line_item_amount();
  END IF;
END $$;

-- Create slug generation function from client name + last 2 digits of invoice number
CREATE OR REPLACE FUNCTION public.generate_public_share_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  client_name text;
  inv_suffix text;
  base_slug text;
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    SELECT name INTO client_name FROM public.clients WHERE id = NEW.client_id;
  END IF;

  inv_suffix := RIGHT(NEW.invoice_number, 2);

  IF client_name IS NOT NULL THEN
    base_slug := lower(regexp_replace(trim(client_name), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || inv_suffix;
  ELSE
    base_slug := 'invoice-' || inv_suffix;
  END IF;

  base_slug := trim(both '-' from base_slug);
  NEW.public_share_slug := base_slug;
  RETURN NEW;
END;
$$;

-- Create trigger that runs after invoice number generation (name 'h_' to run after 'generate_invoice_number')
CREATE TRIGGER h_generate_public_share_slug
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_public_share_slug();
