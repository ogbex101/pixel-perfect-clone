import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { memberSignup } from "@/lib/member.functions";

export const Route = createFileRoute("/member/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Join the DUMB 31 Community — Nik Nanoski" },
      {
        name: "description",
        content:
          "Create your DUMB 31 community account to take the 7-day challenge, join debates, and climb the leaderboard.",
      },
      { property: "og:title", content: "Join the DUMB 31 Community" },
      {
        property: "og:description",
        content: "Sign up for the DUMB 31 reader challenge, debates, and leaderboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MemberSignup,
});

const inputClass =
  "w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary";

function MemberSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    facebook_username: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await memberSignup({
        data: {
          full_name: form.full_name,
          email: form.email,
          facebook_username: form.facebook_username || undefined,
          password: form.password,
        },
      });
      toast.success("Account created. Sign in to begin.");
      navigate({ to: "/member/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-6 py-20">
      <p className="eyebrow text-center">DUMB 31 Community</p>
      <h1 className="mt-2 text-center font-serif text-4xl text-gradient-gold">Request access</h1>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Seven questions. Seven days. One survivor at the top of the board.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-4">
        <Field label="Full name">
          <input
            required
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
          />
        </Field>
        <Field label="Facebook username">
          <input
            value={form.facebook_username}
            onChange={(e) => setForm((f) => ({ ...f, facebook_username: e.target.value }))}
            className={inputClass}
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className={inputClass}
          />
        </Field>
        <Field label="Confirm password">
          <input
            type="password"
            required
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            className={inputClass}
          />
        </Field>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary py-2.5 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)] disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already a member?{" "}
        <Link to="/member/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}