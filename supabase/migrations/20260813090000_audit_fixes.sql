-- Audit fixes.
--
-- 1. debate_comments.is_hidden is nullable, and the public forum filters on
--    is_hidden = false. In Postgres that does NOT match NULL, so a comment
--    stored with a null flag is invisible to readers even though nobody hid
--    it. Give the column a default and backfill the existing nulls.
--
-- 2. challenge_winners has no uniqueness, so announcing the same challenge
--    twice silently creates a duplicate podium.

-- --- 1. Debate comment visibility ------------------------------------------

ALTER TABLE public.debate_comments ALTER COLUMN is_hidden SET DEFAULT false;

UPDATE public.debate_comments
SET is_hidden = false
WHERE is_hidden IS NULL;

ALTER TABLE public.debate_comments ALTER COLUMN is_hidden SET NOT NULL;

-- --- 2. One winner record per member per challenge --------------------------

-- Clear any duplicates that already exist, keeping the earliest record.
DELETE FROM public.challenge_winners a
USING public.challenge_winners b
WHERE a.challenge_id = b.challenge_id
  AND a.member_id = b.member_id
  AND a.member_id IS NOT NULL
  AND a.ctid > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS challenge_winners_unique_member
  ON public.challenge_winners (challenge_id, member_id);
