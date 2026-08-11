import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Reveal } from "@/components/reveal";
import { changeMemberPassword, updateMemberProfile } from "@/lib/member.functions";
import {
  MemberGate,
  getMemberToken,
  memberContextKey,
  type MemberCtx,
} from "@/lib/member-session";

export const Route = createFileRoute("/member/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your Profile — DUMB 31 Community" },
      {
        name: "description",
        content: "Update your DUMB 31 community profile, avatar, and password.",
      },
      { property: "og:title", content: "Your Profile — DUMB 31 Community" },
      { property: "og:description", content: "Update your DUMB 31 community profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <MemberGate>{(ctx) => <ProfilePage ctx={ctx} />}</MemberGate>,
});

const inputClass =
  "w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

function ProfilePage({ ctx }: { ctx: MemberCtx }) {
  const token = getMemberToken() as string;
  const queryClient = useQueryClient();
  const { member } = ctx;

  const [form, setForm] = useState({
    full_name: member.full_name,
    facebook_username: member.facebook_username ?? "",
    bio: member.bio ?? "",
    location: member.location ?? "",
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [changing, setChanging] = useState(false);

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMemberProfile({
        data: {
          token,
          full_name: form.full_name,
          facebook_username: form.facebook_username || undefined,
          bio: form.bio || undefined,
          location: form.location || undefined,
          avatar_data_url: avatar ? await readAsDataUrl(avatar) : undefined,
        },
      });
      setAvatar(null);
      await queryClient.invalidateQueries({ queryKey: memberContextKey });
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    if (pw.next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    setChanging(true);
    try {
      await changeMemberPassword({
        data: { token, current_password: pw.current, new_password: pw.next },
      });
      setPw({ current: "", next: "", confirm: "" });
      toast.success("Password changed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change your password.");
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Reveal>
        <p className="eyebrow">Member record</p>
        <h1 className="mt-2 font-serif text-4xl text-gradient-gold">Your profile</h1>
      </Reveal>

      <form onSubmit={handleProfileSave} className="mt-10 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-card">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-primary">
                {member.full_name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Avatar</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
              className="text-sm text-muted-foreground"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Full name</label>
          <input
            required
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Facebook username</label>
          <input
            value={form.facebook_username}
            onChange={(e) => setForm((f) => ({ ...f, facebook_username: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Location</label>
          <input
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Bio</label>
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      <div className="rule-gold my-12" />

      <Reveal as="section" variant="blur">
        <h2 className="font-serif text-2xl text-primary">Change password</h2>
        <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Current password</label>
            <input
              type="password"
              required
              value={pw.current}
              onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">New password</label>
            <input
              type="password"
              required
              value={pw.next}
              onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Confirm new password</label>
            <input
              type="password"
              required
              value={pw.confirm}
              onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={changing}
            className="border border-border px-6 py-2.5 text-sm transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {changing ? "Updating…" : "Update password"}
          </button>
        </form>
      </Reveal>
    </div>
  );
}