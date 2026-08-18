// Server-only helpers for the DUMB 31 community member system.
// Members are NOT Supabase auth users: credentials live in public.members and
// sessions in public.member_sessions, so every read/write here goes through the
// service-role client after the caller's session token has been verified.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// The day rule is shared with the admin panel; see lib/challenge-day.ts.
export { currentDayNumber, isQuestionOpen } from "./challenge-day";

const PBKDF2_ITERATIONS = 100_000;
const SESSION_DAYS = 30;

export type Admin = SupabaseClient<Database>;

export async function admin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as Admin;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function derive(password: string, saltHex: string): Promise<string> {
  const salt = Uint8Array.from(saltHex.match(/.{2}/g)?.map((h) => parseInt(h, 16)) ?? []);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const saltHex = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const hash = await derive(password, saltHex);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const computed = await derive(password, parts[2]);
  if (computed.length !== parts[3].length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i += 1) {
    diff |= computed.charCodeAt(i) ^ parts[3].charCodeAt(i);
  }
  return diff === 0;
}

export async function createSession(memberId: string): Promise<string> {
  const db = await admin();
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)).buffer);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  const { error } = await db
    .from("member_sessions")
    .insert({ member_id: memberId, token, expires_at: expiresAt });
  if (error) throw new Error(error.message);
  return token;
}

export type MemberRecord = Database["public"]["Tables"]["members"]["Row"];

export type PublicMember = Omit<MemberRecord, "password_hash">;

export function stripMember(member: MemberRecord): PublicMember {
  const { password_hash: _ignored, ...rest } = member;
  return rest;
}

/** Resolves a session token to its member, or throws when it is invalid. */
export async function requireMember(token: string): Promise<PublicMember> {
  if (!token) throw new Error("Not signed in.");
  const db = await admin();
  const { data: session } = await db
    .from("member_sessions")
    .select("member_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!session || new Date(session.expires_at).getTime() < Date.now()) {
    throw new Error("Your session has expired. Please sign in again.");
  }
  const { data: member } = await db
    .from("members")
    .select("*")
    .eq("id", session.member_id!)
    .maybeSingle();
  if (!member) throw new Error("Member not found.");
  if (!member.is_active) throw new Error("This account has been suspended.");
  return stripMember(member as MemberRecord);
}

export async function activeChallenge() {
  const db = await admin();
  const { data } = await db
    .from("challenges")
    .select("*")
    .eq("is_active", true)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/** Day 1 starts on the challenge start date; capped to 7. */

export async function uploadDataUrl(dataUrl: string, folder: string): Promise<string> {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Unsupported image data.");
  const [, contentType, base64] = match;
  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  if (binary.byteLength > 5_000_000) throw new Error("Image must be under 5MB.");
  const ext = contentType.split("/")[1]?.replace(/[^a-z0-9]/g, "") || "png";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const db = await admin();
  const { error } = await db.storage.from("media").upload(path, binary, { contentType });
  if (error) throw new Error(error.message);
  return db.storage.from("media").getPublicUrl(path).data.publicUrl;
}
