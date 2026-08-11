import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_NAV = [
  { to: "/admin/homepage", label: "Homepage" },
  { to: "/admin/page-media", label: "Page Media" },
  { to: "/admin/profile", label: "Author Profile" },
  { to: "/admin/books", label: "Books" },
  { to: "/admin/characters", label: "Characters" },
  { to: "/admin/press", label: "Press" },
  { to: "/admin/testimonials", label: "Testimonials" },
  { to: "/admin/contact-links", label: "Contact Links" },
  { to: "/admin/videos", label: "Cinematic" },
  { to: "/admin/challenges", label: "Challenges" },
] as const;

export function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  const [session, setSession] = useState<Session | null | "loading">("loading");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (!data.session) navigate({ to: "/admin/login" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) navigate({ to: "/admin/login" });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (session === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking session…</p>
      </div>
    );
  }

  if (!session) {
    // onAuthStateChange / getSession already triggered the redirect.
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/admin" className="font-serif text-lg text-primary">
              Admin
            </Link>
            <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {ADMIN_NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  activeProps={{ className: "text-primary" }}
                  className="hover:text-primary transition-colors"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              View site →
            </Link>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/admin/login" });
              }}
              className="border border-border px-3 py-1.5 text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-serif text-3xl text-primary mb-8">{title}</h1>
        {children}
      </main>
    </div>
  );
}
