import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  activeChallenge,
  admin,
  createSession,
  currentDayNumber,
  hashPassword,
  requireMember,
  stripMember,
  uploadDataUrl,
  verifyPassword,
  type MemberRecord,
} from "./member-auth.server";

export const memberSignup = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        full_name: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(255),
        facebook_username: z.string().trim().max(100).optional(),
        password: z.string().min(8).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const email = data.email.toLowerCase();
    const { data: existing } = await db
      .from("members")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing) throw new Error("An account with that email already exists.");

    const { error } = await db.from("members").insert({
      email,
      full_name: data.full_name,
      facebook_username: data.facebook_username || null,
      password_hash: await hashPassword(data.password),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const memberLogin = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ email: z.string().trim().email(), password: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: member } = await db
      .from("members")
      .select("*")
      .eq("email", data.email.toLowerCase())
      .maybeSingle();
    const record = member as MemberRecord | null;
    if (!record || !(await verifyPassword(data.password, record.password_hash))) {
      throw new Error("Incorrect email or password.");
    }
    if (!record.is_active) throw new Error("This account has been suspended.");
    const token = await createSession(record.id);
    return { token, member: stripMember(record) };
  });

export const memberLogout = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ token: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const db = await admin();
    await db.from("member_sessions").delete().eq("token", data.token);
    return { ok: true };
  });

export const getMemberContext = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ token: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const member = await requireMember(data.token);
    const db = await admin();
    const challenge = await activeChallenge();

    const [answersRes, notificationsRes, badgesRes] = await Promise.all([
      db.from("answers").select("*").eq("member_id", member.id),
      db
        .from("member_notifications")
        .select("*")
        .eq("member_id", member.id)
        .order("created_at", { ascending: false })
        .limit(20),
      db
        .from("member_badges")
        .select("earned_at, badges(id, name, description, icon_url)")
        .eq("member_id", member.id),
    ]);

    let questionIds: string[] = [];
    let day = 1;
    if (challenge) {
      day = currentDayNumber(challenge.start_date);
      const { data: questions } = await db
        .from("questions")
        .select("id")
        .eq("challenge_id", challenge.id);
      questionIds = (questions ?? []).map((q) => q.id);
    }

    const answers = (answersRes.data ?? []).filter(
      (a) => !a.question_id || questionIds.includes(a.question_id),
    );

    return {
      member,
      challenge,
      day,
      answeredCount: answers.length,
      correctCount: answers.filter((a) => a.is_correct).length,
      totalQuestions: questionIds.length,
      notifications: notificationsRes.data ?? [],
      badges: badgesRes.data ?? [],
    };
  });

export const getTodayQuestion = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ token: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const member = await requireMember(data.token);
    const db = await admin();
    const challenge = await activeChallenge();
    if (!challenge) return { challenge: null, question: null, answered: null, progress: 0 };

    const day = currentDayNumber(challenge.start_date);
    const { data: question } = await db
      .from("questions")
      .select("*")
      .eq("challenge_id", challenge.id)
      .eq("day_number", day)
      .maybeSingle();

    const { data: answers } = await db
      .from("answers")
      .select("*, questions!inner(challenge_id)")
      .eq("member_id", member.id)
      .eq("questions.challenge_id", challenge.id);

    const existing = (answers ?? []).find((a) => a.question_id === question?.id) ?? null;

    return {
      challenge,
      day,
      progress: (answers ?? []).length,
      answered: existing
        ? {
            selected_option: existing.selected_option,
            is_correct: existing.is_correct,
            correct_option: question?.correct_option ?? null,
            explanation: question?.explanation ?? null,
          }
        : null,
      question: question
        ? {
            id: question.id,
            day_number: question.day_number,
            question_text: question.question_text,
            option_a: question.option_a,
            option_b: question.option_b,
            option_c: question.option_c,
            option_d: question.option_d,
            image_url: question.image_url,
          }
        : null,
    };
  });

export const submitAnswer = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        token: z.string().min(1),
        question_id: z.string().uuid(),
        selected_option: z.enum(["A", "B", "C", "D"]),
        time_taken_seconds: z.number().int().min(0).max(86_400),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const member = await requireMember(data.token);
    const db = await admin();
    const { data: question } = await db
      .from("questions")
      .select("*")
      .eq("id", data.question_id)
      .maybeSingle();
    if (!question) throw new Error("That question is no longer available.");

    const { data: existing } = await db
      .from("answers")
      .select("id")
      .eq("member_id", member.id)
      .eq("question_id", question.id)
      .maybeSingle();
    if (existing) throw new Error("You already answered this question.");

    const isCorrect = question.correct_option.toUpperCase() === data.selected_option;
    const { error } = await db.from("answers").insert({
      member_id: member.id,
      question_id: question.id,
      selected_option: data.selected_option,
      is_correct: isCorrect,
      time_taken_seconds: data.time_taken_seconds,
    });
    if (error) throw new Error(error.message);

    return {
      is_correct: isCorrect,
      correct_option: question.correct_option.toUpperCase(),
      explanation: question.explanation,
    };
  });

export const updateMemberProfile = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        token: z.string().min(1),
        full_name: z.string().trim().min(2).max(100),
        facebook_username: z.string().trim().max(100).optional(),
        bio: z.string().trim().max(1000).optional(),
        location: z.string().trim().max(120).optional(),
        avatar_data_url: z.string().max(8_000_000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const member = await requireMember(data.token);
    const db = await admin();
    const avatarUrl = data.avatar_data_url
      ? await uploadDataUrl(data.avatar_data_url, "avatars")
      : undefined;
    const { error } = await db
      .from("members")
      .update({
        full_name: data.full_name,
        facebook_username: data.facebook_username || null,
        bio: data.bio || null,
        location: data.location || null,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })
      .eq("id", member.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const changeMemberPassword = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        token: z.string().min(1),
        current_password: z.string().min(1),
        new_password: z.string().min(8).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const member = await requireMember(data.token);
    const db = await admin();
    const { data: row } = await db
      .from("members")
      .select("password_hash")
      .eq("id", member.id)
      .maybeSingle();
    if (!row || !(await verifyPassword(data.current_password, row.password_hash))) {
      throw new Error("Current password is incorrect.");
    }
    const { error } = await db
      .from("members")
      .update({ password_hash: await hashPassword(data.new_password) })
      .eq("id", member.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getLeaderboard = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ challenge_id: z.string().uuid().optional() }).parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    let challengeId = data.challenge_id;
    if (!challengeId) {
      const challenge = await activeChallenge();
      challengeId = challenge?.id;
    }
    if (!challengeId) return { challenge_id: null, rows: [] };

    const { data: questions } = await db
      .from("questions")
      .select("id")
      .eq("challenge_id", challengeId);
    const ids = (questions ?? []).map((q) => q.id);
    if (ids.length === 0) return { challenge_id: challengeId, rows: [] };

    const { data: answers } = await db
      .from("answers")
      .select("member_id, is_correct, time_taken_seconds, members(full_name, avatar_url)")
      .in("question_id", ids);

    const byMember = new Map<
      string,
      { name: string; avatar_url: string | null; correct: number; total: number; time: number }
    >();
    for (const row of answers ?? []) {
      if (!row.member_id) continue;
      const entry = byMember.get(row.member_id) ?? {
        name: row.members?.full_name ?? "Member",
        avatar_url: row.members?.avatar_url ?? null,
        correct: 0,
        total: 0,
        time: 0,
      };
      entry.total += 1;
      if (row.is_correct) entry.correct += 1;
      entry.time += row.time_taken_seconds ?? 0;
      byMember.set(row.member_id, entry);
    }

    const rows = [...byMember.entries()]
      .map(([member_id, e]) => ({
        member_id,
        name: e.name,
        avatar_url: e.avatar_url,
        correct: e.correct,
        total: e.total,
        average_time: e.total ? Math.round((e.time / e.total) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.correct - a.correct || a.average_time - b.average_time)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    return { challenge_id: challengeId, rows };
  });

export const postDebateComment = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        token: z.string().min(1),
        topic_id: z.string().uuid(),
        parent_id: z.string().uuid().nullable().optional(),
        content: z.string().trim().min(1).max(4000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const member = await requireMember(data.token);
    const db = await admin();
    const { error } = await db.from("debate_comments").insert({
      topic_id: data.topic_id,
      member_id: member.id,
      parent_id: data.parent_id ?? null,
      content: data.content,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const voteDebateComment = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        token: z.string().min(1),
        comment_id: z.string().uuid(),
        direction: z.enum(["up", "down"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireMember(data.token);
    const db = await admin();
    const { data: comment } = await db
      .from("debate_comments")
      .select("upvotes, downvotes")
      .eq("id", data.comment_id)
      .maybeSingle();
    if (!comment) throw new Error("Comment not found.");
    const patch =
      data.direction === "up"
        ? { upvotes: (comment.upvotes ?? 0) + 1 }
        : { downvotes: (comment.downvotes ?? 0) + 1 };
    const { error } = await db.from("debate_comments").update(patch).eq("id", data.comment_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ token: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const member = await requireMember(data.token);
    const db = await admin();
    await db
      .from("member_notifications")
      .update({ is_read: true })
      .eq("member_id", member.id)
      .eq("is_read", false);
    return { ok: true };
  });
/**
 * Everything the dashboard needs beyond the shared member context: where the
 * member sits on the board, and how each day of the running challenge went.
 */
export const getMemberProgress = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ token: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const member = await requireMember(data.token);
    const db = await admin();
    const challenge = await activeChallenge();
    if (!challenge) {
      return { challenge: null, day: 1, days: [], rank: null, totalPlayers: 0, streak: 0 };
    }

    const day = currentDayNumber(challenge.start_date);
    const { data: questions } = await db
      .from("questions")
      .select("id, day_number")
      .eq("challenge_id", challenge.id)
      .order("day_number", { ascending: true });
    const ids = (questions ?? []).map((q) => q.id);

    const { data: answers } = ids.length
      ? await db
          .from("answers")
          .select("member_id, question_id, is_correct, time_taken_seconds")
          .in("question_id", ids)
      : { data: [] };

    const mine = (answers ?? []).filter((a) => a.member_id === member.id);
    const byQuestion = new Map(mine.map((a) => [a.question_id, a]));

    const days = (questions ?? []).map((q) => {
      const answer = byQuestion.get(q.id);
      return {
        day_number: q.day_number,
        status: answer
          ? answer.is_correct
            ? ("correct" as const)
            : ("incorrect" as const)
          : q.day_number <= day
            ? ("missed" as const)
            : ("locked" as const),
      };
    });

    // Same ordering the public leaderboard uses: correct desc, avg time asc.
    const tally = new Map<string, { correct: number; total: number; time: number }>();
    for (const a of answers ?? []) {
      if (!a.member_id) continue;
      const e = tally.get(a.member_id) ?? { correct: 0, total: 0, time: 0 };
      e.total += 1;
      if (a.is_correct) e.correct += 1;
      e.time += a.time_taken_seconds ?? 0;
      tally.set(a.member_id, e);
    }
    const standings = [...tally.entries()]
      .map(([id, e]) => ({ id, correct: e.correct, avg: e.total ? e.time / e.total : 0 }))
      .sort((a, b) => b.correct - a.correct || a.avg - b.avg);
    const index = standings.findIndex((s) => s.id === member.id);

    // Longest run of consecutive correct days, counting from day 1.
    let streak = 0;
    let best = 0;
    for (const d of days) {
      if (d.status === "correct") {
        streak += 1;
        best = Math.max(best, streak);
      } else if (d.status !== "locked") {
        streak = 0;
      }
    }

    return {
      challenge,
      day,
      days,
      rank: index >= 0 ? index + 1 : null,
      totalPlayers: standings.length,
      streak: best,
    };
  });
