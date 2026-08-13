-- Badges, notifications, assessment and winner selection.
--
-- The logic lives in Postgres functions rather than application code for one
-- reason: pg_cron can call them directly. The TanStack server functions call
-- these same functions over RPC, so the scheduled run and the admin's
-- "Run now" button execute identical code.
--
-- Requires 20260813090000_audit_fixes.sql first: select_challenge_winner uses
-- ON CONFLICT (challenge_id, member_id), which needs the unique index that
-- migration adds.

-- --- Badge catalogue --------------------------------------------------------

-- Awarding is idempotent, which needs a key to conflict on. Any duplicate rows
-- already in the table would block the index, so collapse them first, keeping
-- the earliest award of each badge.
DELETE FROM public.member_badges a
USING public.member_badges b
WHERE a.member_id = b.member_id
  AND a.badge_id = b.badge_id
  AND a.badge_id IS NOT NULL
  AND (a.earned_at, a.id) > (b.earned_at, b.id);

CREATE UNIQUE INDEX IF NOT EXISTS member_badges_unique
  ON public.member_badges (member_id, badge_id);

INSERT INTO public.badges (name, description)
SELECT v.name, v.description
FROM (VALUES
  ('First Answer',        'Answered a challenge question correctly.'),
  ('Perfect Week',        'Answered all seven questions of a challenge correctly.'),
  ('Speed Demon',         'Fastest average answer time in a challenge.'),
  ('Community Champion',  'Posted five or more debate comments during a challenge.'),
  ('Ultimate Fan',        'Won a challenge.')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM public.badges b WHERE b.name = v.name);

-- --- Notifications ----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_member(
  p_member_id UUID,
  p_type TEXT,
  p_content TEXT,
  p_link TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.member_notifications (member_id, type, content, link, is_read)
  VALUES (p_member_id, p_type, p_content, p_link, false);
$$;

/** Notifies every active member. Used for challenge-wide announcements. */
CREATE OR REPLACE FUNCTION public.notify_all_members(
  p_type TEXT,
  p_content TEXT,
  p_link TEXT DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INTEGER;
BEGIN
  INSERT INTO public.member_notifications (member_id, type, content, link, is_read)
  SELECT id, p_type, p_content, p_link, false
  FROM public.members
  WHERE is_active IS DISTINCT FROM false;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

-- --- Badge awarding ---------------------------------------------------------

/**
 * Evaluates every badge rule for one member in one challenge and awards any
 * they now qualify for. Safe to call repeatedly: already-earned badges are
 * skipped, and each new award raises a notification.
 */
CREATE OR REPLACE FUNCTION public.award_badges(p_member_id UUID, p_challenge_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  awarded TEXT[] := '{}';
  v_badge_id UUID;
  v_name TEXT;
  v_correct INTEGER;
  v_total_questions INTEGER;
  v_comments INTEGER;
  v_is_fastest BOOLEAN;
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  candidate TEXT;
BEGIN
  SELECT start_date, end_date INTO v_start, v_end
  FROM public.challenges WHERE id = p_challenge_id;

  SELECT COUNT(*) INTO v_total_questions
  FROM public.questions WHERE challenge_id = p_challenge_id;

  SELECT COUNT(*) FILTER (WHERE a.is_correct) INTO v_correct
  FROM public.answers a
  JOIN public.questions q ON q.id = a.question_id
  WHERE a.member_id = p_member_id AND q.challenge_id = p_challenge_id;

  SELECT COUNT(*) INTO v_comments
  FROM public.debate_comments c
  WHERE c.member_id = p_member_id
    AND (v_start IS NULL OR c.created_at >= v_start)
    AND (v_end IS NULL OR c.created_at <= v_end);

  -- Fastest average among everyone who answered in this challenge.
  SELECT p_member_id = (
    SELECT a.member_id
    FROM public.answers a
    JOIN public.questions q ON q.id = a.question_id
    WHERE q.challenge_id = p_challenge_id AND a.member_id IS NOT NULL
    GROUP BY a.member_id
    ORDER BY AVG(COALESCE(a.time_taken_seconds, 0)) ASC, COUNT(*) DESC
    LIMIT 1
  ) INTO v_is_fastest;

  FOREACH candidate IN ARRAY ARRAY[
    'First Answer', 'Perfect Week', 'Speed Demon', 'Community Champion'
  ] LOOP
    IF (candidate = 'First Answer'       AND v_correct >= 1)
    OR (candidate = 'Perfect Week'       AND v_total_questions > 0 AND v_correct >= v_total_questions AND v_total_questions >= 7)
    OR (candidate = 'Speed Demon'        AND COALESCE(v_is_fastest, false))
    OR (candidate = 'Community Champion' AND v_comments >= 5)
    THEN
      SELECT id, name INTO v_badge_id, v_name FROM public.badges WHERE name = candidate;
      IF v_badge_id IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM public.member_badges
           WHERE member_id = p_member_id AND badge_id = v_badge_id
         )
      THEN
        INSERT INTO public.member_badges (member_id, badge_id, earned_at)
        VALUES (p_member_id, v_badge_id, now())
        ON CONFLICT (member_id, badge_id) DO NOTHING;

        PERFORM public.notify_member(
          p_member_id, 'badge',
          format('Congratulations! You''ve earned the %s badge.', v_name),
          '/member/dashboard'
        );
        awarded := array_append(awarded, v_name);
      END IF;
    END IF;
  END LOOP;

  RETURN awarded;
END;
$$;

-- --- Assessment -------------------------------------------------------------

/**
 * Recomputes the leaderboard for a challenge and notifies members.
 * Ranking matches the site: most correct wins, fastest average breaks ties.
 */
CREATE OR REPLACE FUNCTION public.run_assessment(p_challenge_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ranked INTEGER;
BEGIN
  DELETE FROM public.challenge_leaderboard WHERE challenge_id = p_challenge_id;

  INSERT INTO public.challenge_leaderboard
    (challenge_id, member_id, correct_count, total_answered, average_time, rank, assessed_at)
  SELECT
    p_challenge_id,
    s.member_id,
    s.correct_count,
    s.total_answered,
    s.average_time,
    ROW_NUMBER() OVER (ORDER BY s.correct_count DESC, s.average_time ASC),
    now()
  FROM (
    SELECT
      a.member_id,
      COUNT(*) FILTER (WHERE a.is_correct)::int AS correct_count,
      COUNT(*)::int AS total_answered,
      ROUND(AVG(COALESCE(a.time_taken_seconds, 0))::numeric, 1) AS average_time
    FROM public.answers a
    JOIN public.questions q ON q.id = a.question_id
    WHERE q.challenge_id = p_challenge_id AND a.member_id IS NOT NULL
    GROUP BY a.member_id
  ) s;

  GET DIAGNOSTICS ranked = ROW_COUNT;

  -- Re-evaluate badges now that relative standings (Speed Demon) have moved.
  PERFORM public.award_badges(member_id, p_challenge_id)
  FROM public.challenge_leaderboard WHERE challenge_id = p_challenge_id;

  -- Announce, but not twice in one sitting: the admin's "Run now" button and
  -- the cron job both land here, and a double-click should not put two
  -- identical notices in everybody's feed.
  IF ranked > 0 AND NOT EXISTS (
    SELECT 1 FROM public.member_notifications
    WHERE type = 'assessment' AND created_at > now() - interval '6 hours'
  ) THEN
    PERFORM public.notify_all_members(
      'assessment',
      'The leaderboard has been updated. Check your rank now.',
      '/member/leaderboard'
    );
  END IF;

  RETURN ranked;
END;
$$;

-- --- Winner selection -------------------------------------------------------

/**
 * Picks the podium from the freshly assessed leaderboard, records the winners,
 * awards Ultimate Fan to first place and announces it. Idempotent — a
 * challenge that already has winners is left alone.
 */
CREATE OR REPLACE FUNCTION public.select_challenge_winner(p_challenge_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inserted INTEGER;
  v_winner UUID;
  v_badge_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.challenge_winners WHERE challenge_id = p_challenge_id) THEN
    RETURN 0;
  END IF;

  PERFORM public.run_assessment(p_challenge_id);

  INSERT INTO public.challenge_winners
    (challenge_id, member_id, rank, announced_at, prize_fulfilled)
  SELECT p_challenge_id, l.member_id, l.rank, now(), false
  FROM public.challenge_leaderboard l
  WHERE l.challenge_id = p_challenge_id AND l.rank <= 3 AND l.member_id IS NOT NULL
  ON CONFLICT (challenge_id, member_id) DO NOTHING;

  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF inserted = 0 THEN RETURN 0; END IF;

  SELECT member_id INTO v_winner
  FROM public.challenge_winners
  WHERE challenge_id = p_challenge_id AND rank = 1;

  IF v_winner IS NOT NULL THEN
    SELECT id INTO v_badge_id FROM public.badges WHERE name = 'Ultimate Fan';
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO public.member_badges (member_id, badge_id, earned_at)
      VALUES (v_winner, v_badge_id, now())
      ON CONFLICT (member_id, badge_id) DO NOTHING;

      PERFORM public.notify_member(
        v_winner, 'badge',
        'Congratulations! You''ve earned the Ultimate Fan badge.',
        '/member/dashboard'
      );
    END IF;
  END IF;

  PERFORM public.notify_all_members(
    'winner', 'The winner has been announced! See who won.', '/member/leaderboard'
  );

  RETURN inserted;
END;
$$;

-- --- Scheduled announcements ------------------------------------------------

/** Announces a challenge on its start date. Fires once per challenge. */
CREATE OR REPLACE FUNCTION public.announce_challenge_starts()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c RECORD; total INTEGER := 0;
BEGIN
  FOR c IN
    SELECT id, title FROM public.challenges
    WHERE is_active
      AND start_date IS NOT NULL
      AND start_date::date = (now() AT TIME ZONE 'UTC')::date
      AND NOT EXISTS (
        SELECT 1 FROM public.member_notifications n
        WHERE n.type = 'challenge_start' AND n.content LIKE '%' || title || '%'
      )
  LOOP
    total := total + public.notify_all_members(
      'challenge_start',
      format('The %s has begun! Answer today''s question now.', c.title),
      '/member/challenge'
    );
  END LOOP;
  RETURN total;
END;
$$;

/** Announces the day's question for every running challenge. */
CREATE OR REPLACE FUNCTION public.announce_daily_question()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c RECORD; d INTEGER; total INTEGER := 0;
BEGIN
  FOR c IN
    SELECT id, start_date FROM public.challenges
    WHERE is_active AND start_date IS NOT NULL AND start_date <= now()
      AND (end_date IS NULL OR end_date >= now())
  LOOP
    d := LEAST(7, GREATEST(1, (EXTRACT(DAY FROM now() - c.start_date)::int + 1)));
    IF EXISTS (SELECT 1 FROM public.questions WHERE challenge_id = c.id AND day_number = d) THEN
      total := total + public.notify_all_members(
        'daily_question',
        format('Day %s question is now live! Answer before the day ends.', d),
        '/member/challenge'
      );
    END IF;
  END LOOP;
  RETURN total;
END;
$$;

/** Runs an assessment for every challenge that is currently live. */
CREATE OR REPLACE FUNCTION public.run_scheduled_assessments()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c RECORD; total INTEGER := 0;
BEGIN
  FOR c IN SELECT id FROM public.challenges WHERE is_active LOOP
    total := total + public.run_assessment(c.id);
  END LOOP;
  RETURN total;
END;
$$;

/** Closes out any challenge whose end date has passed and has no winners. */
CREATE OR REPLACE FUNCTION public.select_scheduled_winners()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c RECORD; total INTEGER := 0;
BEGIN
  FOR c IN
    SELECT id FROM public.challenges
    WHERE (end_date IS NOT NULL AND end_date <= now())
      AND NOT EXISTS (SELECT 1 FROM public.challenge_winners w WHERE w.challenge_id = id)
  LOOP
    total := total + public.select_challenge_winner(c.id);
  END LOOP;
  RETURN total;
END;
$$;

-- --- Access -----------------------------------------------------------------

-- Postgres grants EXECUTE on new functions to PUBLIC by default, and every
-- Supabase role inherits that — so revoking from `anon` alone would leave the
-- functions wide open. Revoke from PUBLIC and grant back explicitly.
--
-- Only `service_role` gets EXECUTE: every caller in the app goes through a
-- TanStack server function that uses the service-role key, and pg_cron runs as
-- the database owner. Nothing needs to be callable from the browser.
DO $grants$
DECLARE fn TEXT;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.notify_member(UUID, TEXT, TEXT, TEXT)',
    'public.notify_all_members(TEXT, TEXT, TEXT)',
    'public.award_badges(UUID, UUID)',
    'public.run_assessment(UUID)',
    'public.select_challenge_winner(UUID)',
    'public.announce_challenge_starts()',
    'public.announce_daily_question()',
    'public.run_scheduled_assessments()',
    'public.select_scheduled_winners()'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END;
$grants$;

-- --- Schedule ---------------------------------------------------------------

-- IMPORTANT: pg_cron evaluates every expression in UTC. The times below are
-- therefore 18:00 and 20:00 UTC. If "6:00 PM" means 6pm in a different zone,
-- change the hour field: subtract the zone's UTC offset (e.g. US Eastern in
-- summer is UTC-4, so 6pm ET = '0 22 * * 3,5,0' and 8pm ET = '0 0 * * 1').
--
-- The whole block is guarded: if pg_cron is not enabled on the project the
-- migration still succeeds, and the admin "Run now" buttons remain the way to
-- drive assessment and winner selection by hand.
DO $cron$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron is not enabled; skipping schedule. Enable it under Database > Extensions and re-run this block.';
    RETURN;
  END IF;

  PERFORM cron.unschedule(jobname)
  FROM cron.job
  WHERE jobname IN (
    'dumb31_assessment', 'dumb31_winner',
    'dumb31_challenge_start', 'dumb31_daily_question'
  );

  -- Assessment: Wednesday, Friday and Sunday at 18:00.
  PERFORM cron.schedule(
    'dumb31_assessment', '0 18 * * 3,5,0',
    $job$SELECT public.run_scheduled_assessments();$job$
  );

  -- Winner selection: Sunday at 20:00, two hours after the final assessment.
  PERFORM cron.schedule(
    'dumb31_winner', '0 20 * * 0',
    $job$SELECT public.select_scheduled_winners();$job$
  );

  -- Announcements: challenge starts and the day's question, each morning.
  PERFORM cron.schedule(
    'dumb31_challenge_start', '0 9 * * *',
    $job$SELECT public.announce_challenge_starts();$job$
  );
  PERFORM cron.schedule(
    'dumb31_daily_question', '5 9 * * *',
    $job$SELECT public.announce_daily_question();$job$
  );
END;
$cron$;
