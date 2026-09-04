ALTER TABLE public.items ADD COLUMN quantity integer NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION public.items_quantity_check()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity < 1 THEN
    NEW.quantity := 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER items_quantity_check_trg
BEFORE INSERT OR UPDATE ON public.items
FOR EACH ROW EXECUTE FUNCTION public.items_quantity_check();