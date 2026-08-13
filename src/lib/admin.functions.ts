// Admin-only server functions.
//
// Every handler here is gated by `requireSupabaseAuth` — the caller must present
// a valid Supabase Auth bearer token, which in this project only admins hold
// (community members use the hand-built session system in member-auth.server).
// The actual work then runs through the service-role client so it is not
// subject to RLS, exactly like the member functions.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { admin, hashPassword } from "./member-auth.server";

/**
 * Rebuilds `challenge_leaderboard` for one challenge, re-awards badges whose
 * rules depend on relative standing, and notifies members. Same Postgres
 * function the Wednesday/Friday/Sunday cron job calls.
 */
export const runAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ challenge_id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: ranked, error } = await db.rpc("run_assessment", {
      p_challenge_id: data.challenge_id,
    });
    if (error) throw new Error(error.message);
    return { ranked: ranked ?? 0 };
  });

/**
 * Runs a fresh assessment, records the top three as winners, awards Ultimate
 * Fan to first place and announces it. Idempotent: a challenge that already has
 * winners is returned untouched with `inserted: 0`.
 */
export const selectWinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ challenge_id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: inserted, error } = await db.rpc("select_challenge_winner", {
      p_challenge_id: data.challenge_id,
    });
    if (error) throw new Error(error.message);
    return { inserted: inserted ?? 0 };
  });

/**
 * Sends a notification to one member, or to every active member when
 * `member_id` is omitted. Suspended members are skipped on broadcasts.
 */
export const sendNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        member_id: z.string().uuid().optional(),
        type: z.string().trim().min(1).max(50),
        content: z.string().trim().min(1).max(500),
        link: z.string().trim().max(300).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const link = data.link || undefined;

    if (data.member_id) {
      const { error } = await db.rpc("notify_member", {
        p_member_id: data.member_id,
        p_type: data.type,
        p_content: data.content,
        p_link: link,
      });
      if (error) throw new Error(error.message);
      return { sent: 1 };
    }

    const { data: sent, error } = await db.rpc("notify_all_members", {
      p_type: data.type,
      p_content: data.content,
      p_link: link,
    });
    if (error) throw new Error(error.message);
    return { sent: sent ?? 0 };
  });

/** Re-evaluates the badge rules for one member in one challenge. */
export const awardBadges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ member_id: z.string().uuid(), challenge_id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: awarded, error } = await db.rpc("award_badges", {
      p_member_id: data.member_id,
      p_challenge_id: data.challenge_id,
    });
    if (error) throw new Error(error.message);
    return { awarded: awarded ?? [] };
  });

/**
 * Sets a new password for a member. Nothing in this project sends email, so a
 * self-serve reset is not possible yet; this is the admin-side stand-in.
 * All existing sessions are revoked so a stolen token cannot outlive the reset.
 */
export const setMemberPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ member_id: z.string().uuid(), password: z.string().min(8).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db
      .from("members")
      .update({ password_hash: await hashPassword(data.password) })
      .eq("id", data.member_id);
    if (error) throw new Error(error.message);

    await db.from("member_sessions").delete().eq("member_id", data.member_id);
    return { ok: true };
  });
