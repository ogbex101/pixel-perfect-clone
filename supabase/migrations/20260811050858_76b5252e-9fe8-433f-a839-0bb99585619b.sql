-- Admin (authenticated) full access via Data API
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.answers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debate_topics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debate_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.badges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_badges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_leaderboard TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_winners TO authenticated;

GRANT ALL ON public.challenges TO service_role;
GRANT ALL ON public.questions TO service_role;
GRANT ALL ON public.members TO service_role;
GRANT ALL ON public.answers TO service_role;
GRANT ALL ON public.member_sessions TO service_role;
GRANT ALL ON public.debate_topics TO service_role;
GRANT ALL ON public.debate_comments TO service_role;
GRANT ALL ON public.news_posts TO service_role;
GRANT ALL ON public.badges TO service_role;
GRANT ALL ON public.member_badges TO service_role;
GRANT ALL ON public.member_notifications TO service_role;
GRANT ALL ON public.challenge_leaderboard TO service_role;
GRANT ALL ON public.challenge_winners TO service_role;

-- Public (anon) read-only surfaces. Questions/answers/members stay server-only
-- because they contain correct answers and credentials.
GRANT SELECT ON public.challenges TO anon;
GRANT SELECT ON public.debate_topics TO anon;
GRANT SELECT ON public.debate_comments TO anon;
GRANT SELECT ON public.news_posts TO anon;
GRANT SELECT ON public.badges TO anon;
GRANT SELECT ON public.challenge_leaderboard TO anon;
GRANT SELECT ON public.challenge_winners TO anon;

-- Lock down the two tables that were left without row-level security.
ALTER TABLE public.member_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access member_badges" ON public.member_badges
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.member_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access member_notifications" ON public.member_notifications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);