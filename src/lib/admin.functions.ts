// Admin-only server functions.
//
// Two gates, and both are needed. `requireSupabaseAuth` proves the caller holds
// a valid Supabase Auth bearer token; `assertAdmin` then proves that account
// actually carries the admin role. The token alone is not enough — anyone who
// can sign up through the Auth API would otherwise be able to reset a member's
// password or broadcast a notification to the whole community.
//
// Past the gates the work runs through the service-role client, which is not
// subject to RLS, exactly like the member functions.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { admin, hashPassword, type Admin } from "./member-auth.server";

/**
 * Throws unless `userId` holds the admin role, checked against user_roles via
 * the same `has_role` function the RLS policies use, so the panel and the
 * database agree on who counts as an admin.
 */
async function assertAdmin(db: Admin, userId: string): Promise<void> {
  const { data: isAdmin, error } = await db.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(`Could not verify admin access: ${error.message}`);
  if (!isAdmin) throw new Error("Admin access required.");
}

/**
 * Rebuilds `challenge_leaderboard` for one challenge, re-awards badges whose
 * rules depend on relative standing, and notifies members. Same Postgres
 * function the Wednesday/Friday/Sunday cron job calls.
 */
export const runAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ challenge_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const db = await admin();
    await assertAdmin(db, context.userId);
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
  .handler(async ({ data, context }) => {
    const db = await admin();
    await assertAdmin(db, context.userId);
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
  .handler(async ({ data, context }) => {
    const db = await admin();
    await assertAdmin(db, context.userId);
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
  .handler(async ({ data, context }) => {
    const db = await admin();
    await assertAdmin(db, context.userId);
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
  .handler(async ({ data, context }) => {
    const db = await admin();
    await assertAdmin(db, context.userId);
    const { error } = await db
      .from("members")
      .update({ password_hash: await hashPassword(data.password) })
      .eq("id", data.member_id);
    if (error) throw new Error(error.message);

    await db.from("member_sessions").delete().eq("member_id", data.member_id);
    return { ok: true };
  });
