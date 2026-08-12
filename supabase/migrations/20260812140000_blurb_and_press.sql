-- Content update.
--
-- 1. The homepage "Now Available" blurb is the featured book's
--    short_description, so this is a data change rather than a code change.
--    The same text also drives the pull-quote banner on the book detail page.
-- 2. Two new press mentions, appended after whatever is already there so the
--    existing ordering is untouched.

UPDATE public.books
SET short_description =
  'A facility sealed for 317 years. A surface declared dead. When the doors finally open, they discover the truth: the world never ended. It changed.',
    updated_at = now()
WHERE is_featured = true;

INSERT INTO public.press_mentions (source_name, link, display_order)
SELECT
  v.source_name,
  v.link,
  COALESCE((SELECT MAX(display_order) FROM public.press_mentions), 0) + v.ord
FROM (VALUES
  ('Betterauds', 'https://betterauds.com/books/fiction/science/nik-nanoski-dumb-31/', 1),
  ('Rich Books Magazine', 'https://richbooksmagazine.com/article/dumb-31-review-nik-nanoski', 2)
) AS v(source_name, link, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM public.press_mentions p WHERE p.source_name = v.source_name
);
