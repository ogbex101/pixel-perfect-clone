import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const setupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

// Guards against ever creating a second admin: both the GET check and the
// POST handler re-verify against Supabase Auth itself (via the service-role
// client, imported dynamically so its key never reaches the client bundle),
// not against any client-supplied flag.
const checkAdminExists = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) throw new Error(error.message);
  return { exists: (data?.users?.length ?? 0) > 0 };
});

const createFirstAdmin = createServerFn({ method: "POST" })
  .validator((input: unknown) => setupSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw new Error(listError.message);
    if ((existing?.users?.length ?? 0) > 0) {
      throw new Error("An admin account already exists. Go to /admin/login instead.");
    }
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const Route = createFileRoute("/admin/setup")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Admin Setup — Nik Nanoski" }],
  }),
  component: AdminSetup,
});

function AdminSetup() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [alreadySetUp, setAlreadySetUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAdminExists()
      .then((res) => setAlreadySetUp(res.exists))
      .catch(() => setAlreadySetUp(false))
      .finally(() => setChecking(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await createFirstAdmin({ data: { email, password } });
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      navigate({ to: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking setup status…</p>
      </div>
    );
  }

  if (alreadySetUp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center">
          <p className="eyebrow">Admin</p>
          <h1 className="mt-2 font-serif text-2xl text-primary">Already set up</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            An admin account already exists for this site.
          </p>
          <Link
            to="/admin/login"
            className="mt-6 inline-block border-b-2 border-accent pb-1 text-primary hover:text-[color:var(--brand-gold-bright)]"
          >
            Go to sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-center">One-time setup</p>
        <h1 className="mt-2 font-serif text-3xl text-primary text-center">
          Create the admin account
        </h1>
        <p className="mt-3 text-sm text-muted-foreground text-center">
          This only works once. After the first account is created, this page will refuse to create
          another — sign in at /admin/login from then on.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-2.5 font-medium hover:bg-[color:var(--brand-gold-bright)] transition-colors disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create admin account"}
          </button>
        </form>
      </div>
    </div>
  );
}
