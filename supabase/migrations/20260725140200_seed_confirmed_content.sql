-- Batch 4 content seed — confirmed real text from Nik_Final_Seed_Package.docx.
-- No images, photos, or video files are seeded; those asset fields are left
-- NULL and will be filled in later through the admin panel.
-- Each insert is guarded so re-running this file (or a table that was
-- already populated by hand) never creates duplicates.

INSERT INTO public.author_profile (name, bio, quotes, background_facts)
SELECT
  'Nik Nanoski',
  $bio$I spent 19 years as a nurse, and before that, as a combat medic. Most of my adult life has been about keeping people alive when everything around them was falling apart. The first notebooks for DUMB 31, character sheets, plot points I never ended up using, started ten years ago, back then it was whenever I had time, or remembered. The last two years is when it became real work: writing hours a day, consistently, until it was actually finished.

I believe hope survives even after the world doesn't. That's not a tagline I picked for marketing. It's the whole reason I write.$bio$,
  ARRAY[$q1$Writing has always been clearer for me than speaking. Less ambiguity than reading someone's face or tone in the moment. That's a real part of why I tell stories this way.$q1$],
  ARRAY[
    'Combat medic, Army veteran',
    '19 years as a nurse',
    'First notes on DUMB 31 started 10 years ago; the last 2 years were consistent daily writing'
  ]
WHERE NOT EXISTS (SELECT 1 FROM public.author_profile);

INSERT INTO public.books (title, status, display_order)
SELECT 'DUMB 31: Part 2 (Fault Lines)', 'in_progress', 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.books WHERE title = 'DUMB 31: Part 2 (Fault Lines)'
);

INSERT INTO public.testimonials (reviewer_name, quote_text, display_order)
SELECT
  'Verified Reader',
  'Post apocalyptic greatness. Outstanding character development, beautiful world building... You will not want to put this book down!',
  0
WHERE NOT EXISTS (
  SELECT 1 FROM public.testimonials
  WHERE quote_text = 'Post apocalyptic greatness. Outstanding character development, beautiful world building... You will not want to put this book down!'
);

INSERT INTO public.contact_links (platform_name, url, icon, display_order)
SELECT 'Amazon', 'https://a.co/d/07pTzJcG', 'amazon', 0
WHERE NOT EXISTS (SELECT 1 FROM public.contact_links WHERE url = 'https://a.co/d/07pTzJcG');

INSERT INTO public.contact_links (platform_name, url, icon, display_order)
SELECT 'Goodreads', 'https://www.goodreads.com/author/show/71192476.Nik_Nanoski', 'goodreads', 1
WHERE NOT EXISTS (
  SELECT 1 FROM public.contact_links WHERE url = 'https://www.goodreads.com/author/show/71192476.Nik_Nanoski'
);
