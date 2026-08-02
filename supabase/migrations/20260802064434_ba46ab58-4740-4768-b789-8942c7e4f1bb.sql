CREATE TABLE public.page_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  image_url text,
  video_url text,
  caption text,
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.page_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_media TO authenticated;
GRANT ALL ON public.page_media TO service_role;

ALTER TABLE public.page_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read page_media" ON public.page_media FOR SELECT USING (true);
CREATE POLICY "Admin write page_media" ON public.page_media FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_page_media_updated_at BEFORE UPDATE ON public.page_media
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX page_media_page_key_idx ON public.page_media (page_key, display_order);