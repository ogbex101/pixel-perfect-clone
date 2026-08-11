-- Two fixes.
--
-- 1. The community tables were created outside the migration history and got
--    table-level GRANTs, but no row level security policies. With RLS enabled
--    and no policy, every admin query returns zero rows instead of an error —
--    which is why newly registered members never showed up in the admin panel.
--    Policies below are written idempotently since the live state is unknown.
--
--    Member-facing reads/writes go through server functions on the service-role
--    key, which bypasses RLS entirely, so these policies only govern the admin
--    panel (authenticated) and the public site (anon).
--
-- 2. Challenges gain a thumbnail image.

-- --- 1. Row level security -------------------------------------------------

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debate_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debate_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_winners ENABLE ROW LEVEL SECURITY;

-- Admin (the single authenticated Supabase user) gets full access everywhere.
DROP POLICY IF EXISTS "Admin full access members" ON public.members;
CREATE POLICY "Admin full access members" ON public.members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access member_sessions" ON public.member_sessions;
CREATE POLICY "Admin full access member_sessions" ON public.member_sessions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access challenges" ON public.challenges;
CREATE POLICY "Admin full access challenges" ON public.challenges
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access questions" ON public.questions;
CREATE POLICY "Admin full access questions" ON public.questions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access answers" ON public.answers;
CREATE POLICY "Admin full access answers" ON public.answers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access debate_topics" ON public.debate_topics;
CREATE POLICY "Admin full access debate_topics" ON public.debate_topics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access debate_comments" ON public.debate_comments;
CREATE POLICY "Admin full access debate_comments" ON public.debate_comments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access news_posts" ON public.news_posts;
CREATE POLICY "Admin full access news_posts" ON public.news_posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access badges" ON public.badges;
CREATE POLICY "Admin full access badges" ON public.badges
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access challenge_leaderboard" ON public.challenge_leaderboard;
CREATE POLICY "Admin full access challenge_leaderboard" ON public.challenge_leaderboard
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access challenge_winners" ON public.challenge_winners;
CREATE POLICY "Admin full access challenge_winners" ON public.challenge_winners
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public read only where the public site actually needs it. members,
-- member_sessions, questions and answers stay closed to anon: they hold
-- password hashes, session tokens, correct answers and other people's results.
DROP POLICY IF EXISTS "Public read challenges" ON public.challenges;
CREATE POLICY "Public read challenges" ON public.challenges
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read debate_topics" ON public.debate_topics;
CREATE POLICY "Public read debate_topics" ON public.debate_topics
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read debate_comments" ON public.debate_comments;
CREATE POLICY "Public read debate_comments" ON public.debate_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read news_posts" ON public.news_posts;
CREATE POLICY "Public read news_posts" ON public.news_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read badges" ON public.badges;
CREATE POLICY "Public read badges" ON public.badges
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read challenge_leaderboard" ON public.challenge_leaderboard;
CREATE POLICY "Public read challenge_leaderboard" ON public.challenge_leaderboard
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read challenge_winners" ON public.challenge_winners;
CREATE POLICY "Public read challenge_winners" ON public.challenge_winners
  FOR SELECT USING (true);

-- --- 2. Challenge thumbnail -------------------------------------------------

ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS image_url TEXT;
