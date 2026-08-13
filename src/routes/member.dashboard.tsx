import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Flame, Lock, Target, Trophy, XCircle } from "lucide-react";
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
  const todayDone = progress?.days.some(
    (d) => d.day_number === progress.day && (d.status === "correct" || d.status === "incorrect"),
  );

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
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      {/* Greeting */}
      <Reveal variant="blur">
        <p className="eyebrow track-in">Bunker resident</p>
        <h1 className="text-gradient-gold mt-2 pb-1 font-serif text-3xl sm:text-4xl">
          Welcome back, {member.full_name.split(" ")[0]}
        </h1>
        {member.location && <p className="mt-1 text-sm text-muted-foreground">{member.location}</p>}
      </Reveal>

      {/* Headline stats */}
      <Reveal className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Target}
          label="Answered"
          value={`${answeredCount}${totalQuestions ? ` / ${totalQuestions}` : ""}`}
        />
        <Stat icon={CheckCircle2} label="Correct" value={String(correctCount)} />
        <Stat icon={Trophy} label="Accuracy" value={`${accuracy}%`} />
        <Stat
          icon={Flame}
          label="Best streak"
          value={progress ? `${progress.streak} day${progress.streak === 1 ? "" : "s"}` : "—"}
        />
      </Reveal>

      {/* Rank */}
      {progress?.rank != null && (
        <Reveal variant="zoom" className="card-premium mt-6 flex flex-wrap items-center gap-4 p-6">
          <span className="font-serif text-4xl text-gradient-gold">#{progress.rank}</span>
          <div className="min-w-0">
            <p className="text-sm text-foreground">
              You're ranked {progress.rank} of {progress.totalPlayers} in this challenge.
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Most correct answers wins; fastest average time breaks ties.
            </p>
          </div>
          <Link
            to="/member/leaderboard"
            className="ml-auto shrink-0 border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Full board →
          </Link>
        </Reveal>
      )}

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
                {todayDone ? "Today answered" : "Today is open"}
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
                  const map = {
                    correct: {
                      cls: "border-[oklch(0.65_0.14_150)]/60 bg-[oklch(0.65_0.14_150)]/15 text-[oklch(0.76_0.13_150)]",
                      Icon: CheckCircle2,
                    },
                    incorrect: {
                      cls: "border-destructive/50 bg-destructive/10 text-destructive",
                      Icon: XCircle,
                    },
                    missed: { cls: "border-border text-muted-foreground", Icon: Circle },
                    locked: { cls: "border-border/60 text-muted-foreground/50", Icon: Lock },
                  }[d.status];
                  return (
                    <li
                      key={d.day_number}
                      title={`Day ${d.day_number}: ${d.status}`}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${map.cls}`}
                    >
                      <map.Icon className="h-3.5 w-3.5" aria-hidden />
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
              {todayDone ? "Review today's question →" : "Answer today's question →"}
            </Link>
          </>
        ) : (
          <>
            <p className="eyebrow">No challenge running</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing is live right now. The next challenge will be announced in the news feed.
            </p>
            <Link
              to="/news"
              className="mt-5 inline-block border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Read the news →
            </Link>
          </>
        )}
      </Reveal>

      {/* Notifications */}
      <Reveal className="mt-10">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
          <h2 className="font-serif text-xl text-primary">
            Notifications
            {unread.length > 0 && (
              <span className="ml-2 rounded-full border border-primary/50 bg-primary/10 px-2 py-0.5 text-xs text-primary">
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
            {notifications.slice(0, 6).map((n) => (
              <li
                key={n.id}
                className={`border border-border px-4 py-3 text-sm ${n.is_read ? "bg-transparent text-muted-foreground" : "bg-card text-foreground"}`}
              >
                {n.content}
              </li>
            ))}
          </ul>
        )}
      </Reveal>

      {/* Badges */}
      <Reveal className="mt-10">
        <h2 className="border-b border-border pb-3 font-serif text-xl text-primary">Badges</h2>
        {badges.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No badges yet.</p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {badges.map((b, i) => {
              const badge = b.badges as { name: string; description: string | null } | null;
              return (
                <li
                  key={i}
                  title={badge?.description ?? undefined}
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
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div className="card-premium p-5">
      <Icon className="h-4 w-4 text-primary" aria-hidden />
      <p className="mt-3 font-serif text-2xl text-foreground tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
