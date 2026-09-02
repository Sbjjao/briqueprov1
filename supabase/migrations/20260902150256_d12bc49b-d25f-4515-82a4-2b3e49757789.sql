CREATE TYPE public.item_category AS ENUM ('eletronicos','carros_pecas','games','celulares','informatica','colecionaveis','outros');
CREATE TYPE public.item_status AS ENUM ('em_negociacao','em_estoque','em_manutencao','anunciado','reservado','trocado','vendido','cancelado');
CREATE TYPE public.cost_kind AS ENUM ('frete','manutencao','pecas','taxas','outros');
CREATE TYPE public.event_kind AS ENUM ('compra','gasto','anuncio','proposta','troca','venda','nota');

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  phone TEXT,
  social TEXT,
  city TEXT,
  trust SMALLINT NOT NULL DEFAULT 3,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contacts" ON public.contacts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER contacts_updated BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  category public.item_category NOT NULL DEFAULT 'outros',
  description TEXT,
  brand TEXT,
  model TEXT,
  color TEXT,
  serial TEXT,
  photos TEXT[] NOT NULL DEFAULT '{}',
  acquired_at DATE,
  estimated_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.item_status NOT NULL DEFAULT 'em_estoque',
  purchase_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  seller_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  origin_trade_id UUID,
  parent_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own items" ON public.items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER items_updated BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.extra_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  kind public.cost_kind NOT NULL DEFAULT 'outros',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  spent_at DATE NOT NULL DEFAULT current_date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.extra_costs TO authenticated;
GRANT ALL ON public.extra_costs TO service_role;
ALTER TABLE public.extra_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own costs" ON public.extra_costs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  listed_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  sold_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  sold_at DATE NOT NULL DEFAULT current_date,
  payment_method TEXT,
  fees NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping NUMERIC(12,2) NOT NULL DEFAULT 0,
  buyer_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sales" ON public.sales FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  out_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  out_assigned_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  in_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  in_assigned_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  cash_received NUMERIC(12,2) NOT NULL DEFAULT 0,
  cash_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  traded_at DATE NOT NULL DEFAULT current_date,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trades TO authenticated;
GRANT ALL ON public.trades TO service_role;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trades" ON public.trades FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.item_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  kind public.event_kind NOT NULL DEFAULT 'nota',
  title TEXT NOT NULL,
  detail TEXT,
  amount NUMERIC(12,2),
  happened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_events TO authenticated;
GRANT ALL ON public.item_events TO service_role;
ALTER TABLE public.item_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events" ON public.item_events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX ON public.items (user_id, status);
CREATE INDEX ON public.extra_costs (item_id);
CREATE INDEX ON public.sales (item_id);
CREATE INDEX ON public.item_events (item_id);