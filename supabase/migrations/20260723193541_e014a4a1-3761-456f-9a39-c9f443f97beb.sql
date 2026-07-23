
-- author_profile (singleton)
CREATE TABLE public.author_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  bio TEXT,
  quotes TEXT[] NOT NULL DEFAULT '{}',
  background_facts TEXT[] NOT NULL DEFAULT '{}',
  location TEXT,
  contact_email TEXT,
  hero_photo_url TEXT,
  brand_accent_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.author_profile TO anon, authenticated;
GRANT ALL ON public.author_profile TO service_role;
ALTER TABLE public.author_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read author_profile" ON public.author_profile FOR SELECT USING (true);

-- books
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT,
  short_description TEXT,
  full_description TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('published','in_progress')),
  cover_image_url TEXT,
  video_url TEXT,
  purchase_link TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.books TO anon, authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read books" ON public.books FOR SELECT USING (true);
CREATE UNIQUE INDEX books_only_one_featured ON public.books ((is_featured)) WHERE is_featured = true;

-- characters
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  background TEXT,
  quote TEXT,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX characters_book_id_idx ON public.characters(book_id);
GRANT SELECT ON public.characters TO anon, authenticated;
GRANT ALL ON public.characters TO service_role;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read characters" ON public.characters FOR SELECT USING (true);

-- press_mentions
CREATE TABLE public.press_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL,
  headline TEXT,
  link TEXT,
  logo_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.press_mentions TO anon, authenticated;
GRANT ALL ON public.press_mentions TO service_role;
ALTER TABLE public.press_mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read press_mentions" ON public.press_mentions FOR SELECT USING (true);

-- testimonials
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_name TEXT NOT NULL,
  quote_text TEXT NOT NULL,
  rating INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (true);

-- contact_links
CREATE TABLE public.contact_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contact_links TO anon, authenticated;
GRANT ALL ON public.contact_links TO service_role;
ALTER TABLE public.contact_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read contact_links" ON public.contact_links FOR SELECT USING (true);

-- landing_page_sections
CREATE TABLE public.landing_page_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.landing_page_sections TO anon, authenticated;
GRANT ALL ON public.landing_page_sections TO service_role;
ALTER TABLE public.landing_page_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read landing_page_sections" ON public.landing_page_sections FOR SELECT USING (true);

INSERT INTO public.landing_page_sections (section_key, display_order, is_visible) VALUES
  ('hero', 1, true),
  ('featured_book', 2, true),
  ('author_intro', 3, true),
  ('quote_rotator', 4, true),
  ('books_preview_grid', 5, true),
  ('testimonials_preview', 6, true),
  ('press_preview', 7, true),
  ('contact_cta', 8, true);
