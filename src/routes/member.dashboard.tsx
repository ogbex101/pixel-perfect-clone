import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Circle,
  Flame,
  Lock,
  MessageSquare,
  Newspaper,
  Sparkles,
  Swords,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Reveal } from "@/components/reveal";
import { MemberShell } from "@/components/member/member-shell";
import { MemberGate, getMemberToken, memberContextKey, type MemberCtx } from "@/lib/member-session";
import { getMemberProgress, markNotificationsRead } from "@/lib/member.functions";

export const Route = createFileRoute("/member/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your Dashboard — DUMB 31 Community" },
      { name: "description", content: "Your DUMB 31 challenge progress, rank, and badges." },
      { property: "og:title", content: "Your Dashboard — DUMB 31 Community" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <MemberGate>
      {(ctx) => (
        <MemberShell ctx={ctx}>
          <Dashboard ctx={ctx} />
        </MemberShell>
      )}
    </MemberGate>
  ),
});

const DAY_STYLES = {
  correct: {
    cls: "border-[oklch(0.65_0.14_150)]/60 bg-[oklch(0.65_0.14_150)]/15 text-[oklch(0.76_0.13_150)]",
    Icon: CheckCircle2,
  },
  incorrect: { cls: "border-destructive/50 bg-destructive/10 text-destructive", Icon: XCircle },
  open: { cls: "border-primary/60 bg-primary/10 text-primary", Icon: Sparkles },
  missed: { cls: "border-border text-muted-foreground", Icon: Circle },
  locked: { cls: "border-border/60 text-muted-foreground/50", Icon: Lock },
} as const;

function Dashboard({ ctx }: { ctx: MemberCtx }) {
  const queryClient = useQueryClient();
  const { member, challenge, answeredCount, correctCount, totalQuestions, notifications, badges } =
    ctx;
  const token = getMemberToken();

  const { data: progress } = useQuery({
    queryKey: ["member", "progress"],
    enabled: Boolean(token),
    queryFn: () => getMemberProgress({ data: { token: token as string } }),
  });

  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const unread = notifications.filter((n) => !n.is_read);
  const completion = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const openDay = progress?.days.find((d) => d.status === "open");
  const todayDone = Boolean(challenge) && !openDay;

  async function handleMarkRead() {
    if (!token) return;
    try {
      await markNotificationsRead({ data: { token } });
      queryClient.invalidateQueries({ queryKey: memberContextKey });
      toast.success("Notifications cleared.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update notifications.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:py-14">
      {/* Hero banner */}
      <Reveal variant="blur">
        <div className="card-premium texture-ink relative overflow-hidden p-6 md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-5">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-primary/50 bg-card">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-primary">
                  {member.full_name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="eyebrow track-in">Bunker resident</p>
              <h1 className="text-gradient-gold mt-1 pb-1 font-serif text-3xl sm:text-4xl">
                Welcome back, {member.full_name.split(" ")[0]}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {challenge
                  ? `${challenge.title} · Day ${ctx.day} of 7`
                  : member.location || "No challenge running right now"}
              </p>
            </div>
            <div className="ml-auto flex flex-wrap gap-3">
              {challenge && (
                <Link
                  to="/member/challenge"
                  className="btn-sheen inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
                >
                  {openDay ? `Answer Day ${openDay.day_number}` : "Review today"}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
              <Link
                to="/member/leaderboard"
                className="inline-flex items-center gap-2 border border-border px-5 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Trophy className="h-4 w-4" aria-hidden />
                Leaderboard
              </Link>
            </div>
          </div>

          {/* Completion bar */}
          {totalQuestions > 0 && (
            <div className="relative mt-7">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Challenge progress</span>
                <span className="tabular-nums text-foreground">
                  {answeredCount} / {totalQuestions} answered
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-[color:var(--brand-gold-bright)] transition-[width] duration-700"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Reveal>

      {/* Headline stats */}
      <Reveal className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Target} label="Answered" value={String(answeredCount)} hint={`of ${totalQuestions || 0}`} />
        <Stat icon={CheckCircle2} label="Correct" value={String(correctCount)} hint={`${accuracy}% accuracy`} />
        <Stat
          icon={Trophy}
          label="Rank"
          value={progress?.rank != null ? `#${progress.rank}` : "—"}
          hint={progress?.totalPlayers ? `of ${progress.totalPlayers} players` : "unranked"}
        />
        <Stat
          icon={Flame}
          label="Best streak"
          value={progress ? String(progress.streak) : "—"}
          hint={progress?.streak === 1 ? "day" : "days"}
        />
      </Reveal>

      {/* Active challenge + day trail */}
      <Reveal variant="blur" className="card-premium mt-6 p-6 md:p-8">
        {challenge ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Active challenge · Day {ctx.day}</p>
                <h2 className="text-gradient-gold mt-1 pb-1 font-serif text-2xl">
                  {challenge.title}
                </h2>
              </div>
              <span
                className={`inline-block rounded-full border px-3 py-1 text-xs ${
                  todayDone
                    ? "border-[oklch(0.65_0.14_150)]/60 bg-[oklch(0.65_0.14_150)]/15 text-[oklch(0.76_0.13_150)]"
                    : "border-primary/50 bg-primary/10 text-primary"
                }`}
              >
                {todayDone ? "All open days answered" : "A question is waiting"}
              </span>
            </div>

            {challenge.description && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {challenge.description}
              </p>
            )}

            {(progress?.days.length ?? 0) > 0 && (
              <ol className="mt-6 flex flex-wrap gap-2">
                {progress?.days.map((d) => {
                  const style = DAY_STYLES[d.status] ?? DAY_STYLES.locked;
                  return (
                    <li
                      key={d.day_number}
                      title={`Day ${d.day_number}: ${d.status}`}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${style.cls}`}
                    >
                      <style.Icon className="h-3.5 w-3.5" aria-hidden />
                      Day {d.day_number}
                    </li>
                  );
                })}
              </ol>
            )}

            <Link
              to="/member/challenge"
              className="btn-sheen mt-7 inline-block bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
            >
              {todayDone ? "Review your answers →" : "Answer now →"}
            </Link>
          </>
        ) : (
          <>
            <p className="eyebrow">No challenge running</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing is live right now. The next challenge will be announced in the news feed.
            </p>
            <Link
              to="/member/news"
              className="mt-5 inline-block border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Read the news →
            </Link>
          </>
        )}
      </Reveal>

      {/* Quick links */}
      <Reveal className="mt-6 grid gap-4 sm:grid-cols-3">
        <QuickLink
          to="/member/challenge"
          icon={Swords}
          title="Today's challenge"
          copy="One question a day, seven days, one winner."
        />
        <QuickLink
          to="/member/debate"
          icon={MessageSquare}
          title="Debate forum"
          copy="Argue who deserved the surface."
        />
        <QuickLink
          to="/member/news"
          icon={Newspaper}
          title="Dispatches"
          copy="Lore drops and announcements."
        />
      </Reveal>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        {/* Notifications */}
        <Reveal>
          <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
            <h2 className="flex items-center gap-2 font-serif text-xl text-primary">
              <Bell className="h-4 w-4" aria-hidden />
              Notifications
              {unread.length > 0 && (
                <span className="rounded-full border border-primary/50 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {unread.length} new
                </span>
              )}
            </h2>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={handleMarkRead}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {notifications.slice(0, 6).map((n) => {
                const body = (
                  <>
                    <span className="flex-1">{n.content}</span>
                    <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </span>
                  </>
                );
                const cls = `flex items-start gap-3 border px-4 py-3 text-sm ${
                  n.is_read
                    ? "border-border bg-transparent text-muted-foreground"
                    : "border-primary/40 bg-card text-foreground"
                }`;
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <a href={n.link} className={`${cls} transition-colors hover:border-primary`}>
                        {body}
                      </a>
                    ) : (
                      <div className={cls}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Reveal>

        {/* Badges */}
        <Reveal>
          <h2 className="border-b border-border pb-3 font-serif text-xl text-primary">Badges</h2>
          {badges.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No badges yet — answer correctly and quickly to start collecting.
            </p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-2">
              {badges.map((b, i) => {
                const badge = b.badges as { name: string; description: string | null } | null;
                const earned = b.earned_at ? ` · earned ${timeAgo(b.earned_at)}` : "";
                return (
                  <li
                    key={i}
                    title={`${badge?.description ?? ""}${earned}`.trim() || undefined}
                    className="rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs text-primary"
                  >
                    {badge?.name ?? "Badge"}
                  </li>
                );
              })}
            </ul>
          )}
        </Reveal>
      </div>
    </div>
  );
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card-premium p-5">
      <Icon className="h-4 w-4 text-primary" aria-hidden />
      <p className="mt-3 font-serif text-2xl text-foreground tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  copy,
}: {
  to: "/member/challenge" | "/member/debate" | "/member/news";
  icon: typeof Target;
  title: string;
  copy: string;
}) {
  return (
    <Link
      to={to}
      className="card-premium group flex items-start gap-3 p-5 transition-colors hover:border-primary"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0">
        <span className="block font-serif text-lg text-foreground group-hover:text-primary">
          {title}
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">{copy}</span>
      </span>
    </Link>
  );
}
