import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Newspaper,
  Swords,
  Trophy,
  User,
  X,
} from "lucide-react";
import { useMemberSignOut, type MemberCtx } from "@/lib/member-session";

const NAV = [
  { to: "/member/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/member/challenge", label: "Today's Challenge", icon: Swords },
  { to: "/member/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/member/debate", label: "Debate Forum", icon: MessageSquare },
  { to: "/member/news", label: "News", icon: Newspaper },
  { to: "/member/profile", label: "Profile", icon: User },
] as const;

const COLLAPSE_KEY = "dumb31_sidebar_collapsed";

/**
 * Shared chrome for the signed-in member area: a sidebar that collapses to
 * icons on desktop and slides away entirely on mobile. The collapsed state is
 * remembered so it doesn't reset on every navigation.
 */
export function MemberShell({ ctx, children }: { ctx: MemberCtx; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const signOut = useMemberSignOut();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const member = ctx.member;
  const unread = ctx.notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex min-h-screen">
      {/* Mobile scrim */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`texture-ink fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-border transition-[transform,width] duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-64 md:w-[76px]" : "w-64"}`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
          <Link
            to="/member/dashboard"
            className={`font-serif text-lg text-gradient-gold ${collapsed ? "md:hidden" : ""}`}
          >
            DUMB 31
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-8 w-8 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary md:inline-flex"
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="inline-flex h-8 w-8 items-center justify-center border border-border text-muted-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Member identity */}
        <div
          className={`flex items-center gap-3 border-b border-border px-4 py-4 ${collapsed ? "md:justify-center md:px-2" : ""}`}
        >
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-primary/40 bg-card">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-sm text-primary">
                {member.full_name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
            <p className="truncate text-sm font-medium text-foreground">{member.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "Signed in"}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 border px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    } ${collapsed ? "md:justify-center md:px-2" : ""}`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={signOut}
            title={collapsed ? "Sign out" : undefined}
            className={`flex w-full items-center gap-3 border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive ${
              collapsed ? "md:justify-center md:px-2" : ""
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            <span className={collapsed ? "md:hidden" : ""}>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-9 w-9 items-center justify-center border border-border text-foreground"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="font-serif text-lg text-gradient-gold">DUMB 31</span>
        </div>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
