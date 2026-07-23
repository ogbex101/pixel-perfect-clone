# Nik Nanoski Author Platform — Batch 1 Plan

Your brief explicitly splits the build into 6 sequential batches and says to run them one at a time. This plan covers **Batch 1 only** (foundation, data model, routing). Design (Batch 2), full page composition (Batch 3), admin (4–5), and importers (6) come after each batch is verified.

Stack note: this template is TanStack Start + Lovable Cloud (Supabase under the hood). I'll enable Lovable Cloud first — that provisions Postgres, storage, and auth without you needing a Supabase account.

## Scope of Batch 1

1. Enable Lovable Cloud.
2. Create the 7 tables via a single migration, with GRANTs, RLS enabled, and public-read policies (writes locked down until Batch 4 adds admin auth):
   - `author_profile` (singleton row): name, tagline, bio, quotes (text[]), background_facts (text[]), location, contact_email, hero_photo_url, brand_accent_color
   - `books`: id, title, genre, short_description, full_description, status ('published'|'in_progress'), cover_image_url, video_url, purchase_link, is_featured (bool), display_order
   - `characters`: id, book_id (FK → books, cascade), name, role, background, quote, image_url, display_order
   - `press_mentions`: id, source_name, headline, link, logo_url, display_order
   - `testimonials`: id, reviewer_name, quote_text, rating (nullable), display_order
   - `contact_links`: id, platform_name, url, icon, display_order
   - `landing_page_sections`: section_key (unique), display_order, is_visible
   - Partial unique index enforcing only one `is_featured = true` book.
   - Seed `landing_page_sections` with the 8 keys from the brief in order.
3. Generate typed Supabase client bindings for these tables.
4. Build the 7 routes as **separate route files** (not hash anchors), each with its own `head()` metadata:
   - `/` (index) — replaces placeholder
   - `/about`
   - `/books`
   - `/books/$bookId`
   - `/press`
   - `/testimonials`
   - `/contact`
5. Each page fetches its data via TanStack Query (`ensureQueryData` in loader + `useSuspenseQuery` in component) from Supabase, and renders minimally-styled output that proves the read path works (lists, titles, IDs). No design system yet — that's Batch 2.
6. A shared minimal top nav in `__root.tsx` linking the 7 routes so navigation is testable.
7. Book detail page reads `books` + `characters` filtered by `book_id`; hides character section when empty (per brief).

## Explicitly out of scope for Batch 1

- Visual design, animations, hover states, skeletons, responsive polish (Batch 2)
- Featured hero, quote rotator, homepage composition (Batch 3 / 5)
- Admin panel, auth, image uploads, drag-reorder, featured toggle validation UI (Batch 4)
- Landing page section toggling UI (Batch 5)
- Document / asset importers (Batch 6)
- Seeding real content — brief says seed only after end-to-end functions

## Verification before ending the batch

Per your brief's "before moving on" checklist:
- Confirm all 7 tables exist.
- Insert one throwaway row into each table via a quick admin-less path (I'll use a temporary SQL insert during the batch), navigate all 7 routes, confirm data renders, then remove the throwaway rows.

## Technical notes

- Route files use flat dot notation: `books.tsx`, `books.$bookId.tsx`.
- RLS: `SELECT` allowed to `anon` + `authenticated` on all 7 tables in Batch 1; INSERT/UPDATE/DELETE restricted to `service_role` for now. Batch 4 will introduce an admin role + policies.
- One book featured at a time enforced at DB level with `CREATE UNIQUE INDEX ... WHERE is_featured`.
- No hardcoded book/character content anywhere in components.

Approve to proceed with Batch 1.
