-- Batch 4 seed fix: the real, published novel (DUMB 31) was never inserted —
-- only its unfinished sequel was. Add it as the featured book, and correct
-- the sequel's display_order/is_featured now that it's no longer first.
--
-- Un-feature the sequel BEFORE inserting the new featured row: the partial
-- unique index books_only_one_featured is checked immediately per-statement,
-- so if the sequel already had is_featured = true, inserting another
-- is_featured = true row first would violate it.

UPDATE public.books
SET is_featured = false, display_order = 1
WHERE title = 'DUMB 31: Part 2 (Fault Lines)';

INSERT INTO public.books (
  title, status, genre, short_description, full_description, purchase_link,
  is_featured, display_order
)
SELECT
  'DUMB 31',
  'published',
  'Post-apocalyptic science fiction',
  'A facility sealed for 317 years. A surface everyone was told was dead. They were wrong about that, and that''s just the beginning.',
  $desc$For over three centuries, DUMB 31 kept its people alive underground, safe, sealed, and told the surface above them was a wasteland. They were wrong about that. When the facility's systems begin failing and the truth can no longer stay buried, Jake Trotter and the people he calls family are forced to face what's actually waiting for them above. What they find isn't the ruin they were taught to expect. It's something stranger, and far more dangerous to the story they've always believed. DUMB 31 is a post-apocalyptic science fiction novel about survival, inherited lies, and what's left of humanity when hope becomes the only resource still worth protecting.$desc$,
  'https://a.co/d/07pTzJcG',
  true,
  0
WHERE NOT EXISTS (SELECT 1 FROM public.books WHERE title = 'DUMB 31');
