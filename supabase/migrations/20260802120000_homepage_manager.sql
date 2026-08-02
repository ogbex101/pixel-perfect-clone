-- Homepage manager batch:
-- 1. Cinematic video hero — author_profile gains a hero_video_url slot the
--    admin can fill from the profile editor.
-- 2. landing_page_sections becomes admin-writable so every homepage section
--    can be toggled and reordered from the admin panel.
-- 3. Register the cinematic preview section (added after the original seed).

ALTER TABLE public.author_profile ADD COLUMN IF NOT EXISTS hero_video_url TEXT;

GRANT INSERT, UPDATE, DELETE ON public.landing_page_sections TO authenticated;
CREATE POLICY "Admin write landing_page_sections" ON public.landing_page_sections
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.landing_page_sections (section_key, display_order, is_visible)
VALUES ('cinematic_preview', 6, true)
ON CONFLICT (section_key) DO NOTHING;
