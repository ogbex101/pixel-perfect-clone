ALTER TABLE public.author_profile ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
GRANT UPDATE ON public.author_profile TO authenticated;