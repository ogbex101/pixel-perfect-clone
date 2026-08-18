import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import {
  BookOpen,
  Crown,
  Drama,
  Film,
  Home,
  Image,
  Link2,
  Megaphone,
  MessageSquare,
  Newspaper,
  Quote,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const ADMIN_NAV_GROUPS = [
  {
    label: "Site",
    items: [
      { to: "/admin/homepage", label: "Homepage", icon: Home },
      { to: "/admin/page-media", label: "Page Media", icon: Image },
      { to: "/admin/profile", label: "Author Profile", icon: User },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/admin/books", label: "Books", icon: BookOpen },
      { to: "/admin/characters", label: "Characters", icon: Drama },
      { to: "/admin/videos", label: "Cinematic", icon: Film },
    ],
  },
  {
    label: "Reception",
    items: [
      { to: "/admin/press", label: "Press", icon: Megaphone },
      { to: "/admin/testimonials", label: "Testimonials", icon: Quote },
      { to: "/admin/contact-links", label: "Contact Links", icon: Link2 },
    ],
  },
  {
    label: "Challenge",
    items: [
      { to: "/admin/challenges", label: "Challenges", icon: Trophy },
      { to: "/admin/winners", label: "Winners", icon: Crown },
    ],
  },
  {
    label: "Community",
    items: [
      { to: "/admin/members", label: "Members", icon: Users },
      { to: "/admin/debates", label: "Debates", icon: MessageSquare },
      { to: "/admin/news", label: "News", icon: Newspaper },
    ],
  },
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
                  className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <n.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
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
