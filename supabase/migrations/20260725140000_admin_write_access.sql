-- Batch 4: establish admin write access.
-- Single-admin model: exactly one Supabase Auth user (Nik) will ever exist,
-- there is no public sign-up flow, so "authenticated" == "the admin".

GRANT INSERT, UPDATE, DELETE ON public.author_profile TO authenticated;
CREATE POLICY "Admin write author_profile" ON public.author_profile
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT INSERT, UPDATE, DELETE ON public.books TO authenticated;
CREATE POLICY "Admin write books" ON public.books
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT INSERT, UPDATE, DELETE ON public.characters TO authenticated;
CREATE POLICY "Admin write characters" ON public.characters
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT INSERT, UPDATE, DELETE ON public.press_mentions TO authenticated;
CREATE POLICY "Admin write press_mentions" ON public.press_mentions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
CREATE POLICY "Admin write testimonials" ON public.testimonials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT INSERT, UPDATE, DELETE ON public.contact_links TO authenticated;
CREATE POLICY "Admin write contact_links" ON public.contact_links
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Single public storage bucket for all site media (author photos, book
-- covers, character images, press logos, video files, video thumbnails).
-- Folder prefixes keep it organized; one bucket keeps the policy set small.
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Admin write media" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'media')
  WITH CHECK (bucket_id = 'media');
