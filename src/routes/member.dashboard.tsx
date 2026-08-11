import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/reveal";
import { MemberGate, useMemberSignOut, type MemberCtx } from "@/lib/member-session";

export const Route = createFileRoute("/member/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Member Dashboard — DUMB 31 Community" },
      {
        name: "description",
        content: "Your DUMB 31 challenge progress, badges, notifications, and community links.",
      },
      { property: "og:title", content: "Member Dashboard — DUMB 31 Community" },
      { property: "og:description", content: "Track your DUMB 31 challenge progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <MemberGate>{(ctx) => <Dashboard ctx={ctx} />}</MemberGate>,
});

function Dashboard({ ctx }: { ctx: MemberCtx }) {
  const signOut = useMemberSignOut();
  const { member, challenge, answeredCount, correctCount, totalQuestions, notifications, badges } =
    ctx;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Reveal className="flex flex-wrap items-center gap-5">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[color:oklch(0.79_0.115_85_/_40%)] bg-card">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={`${member.full_name}'s avatar`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-primary">
              {member.full_name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="eyebrow">Bunker resident</p>
          <h1 className="font-serif text-3xl text-gradient-gold sm:text-4xl">
            {member.full_name}
          </h1>
          {member.location && (
            <p className="text-sm text-muted-foreground">{member.location}</p>
          )}
        </div>
        <button
          type="button"
          onClick={signOut}
          className="ml-auto border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Sign out
        </button>
      </Reveal>

      <div className="rule-gold my-10" />

      <Reveal className="grid gap-4 sm:grid-cols-3">
        <Stat label="Questions answered" value={`${answeredCount}${totalQuestions ? ` / ${totalQuestions}` : ""}`} />
        <Stat label="Correct" value={String(correctCount)} />
        <Stat label="Incorrect" value={String(Math.max(0, answeredCount - correctCount))} />
      </Reveal>

      <Reveal className="mt-10 border border-border bg-card p-6" variant="blur">
        {challenge ? (
          <>
            <p className="eyebrow">Active challenge · Day {ctx.day}</p>
            <h2 className="mt-1 font-serif text-2xl text-primary">{challenge.title}</h2>
            {challenge.description && (
              <p className="mt-2 text-sm text-muted-foreground">{challenge.description}</p>
            )}
            <Link
              to="/member/challenge"
              className="mt-5 inline-block bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
            >
              Today's question →
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No challenge is running right now. Watch the news feed for the next one.
          </p>
        )}
      </Reveal>

      <Reveal className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink to="/member/leaderboard" label="Leaderboard" />
        <QuickLink to="/debate" label="Debate forum" />
        <QuickLink to="/news" label="News" />
        <QuickLink to="/member/profile" label="Profile" />
      </Reveal>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <Reveal variant="left">
          <h2 className="font-serif text-2xl text-primary">Notifications</h2>
          <div className="rule-gold my-4" />
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing new from the facility.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li key={n.id} className="border border-border bg-card p-4">
                  <p className="text-sm text-foreground/90">{n.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                    {n.is_read ? "" : " · new"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        <Reveal variant="right">
          <h2 className="font-serif text-2xl text-primary">Badges earned</h2>
          <div className="rule-gold my-4" />
          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No badges yet — answer a question to start earning them.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3">
              {badges.map((b, i) => (
                <li key={i} className="border border-border bg-card p-4 text-center">
                  {b.badges?.icon_url && (
                    <img
                      src={b.badges.icon_url}
                      alt=""
                      className="mx-auto mb-2 h-10 w-10 object-contain"
                    />
                  )}
                  <p className="font-serif text-primary">{b.badges?.name ?? "Badge"}</p>
                  {b.badges?.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{b.badges.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card p-5 text-center">
      <p className="font-serif text-3xl text-gradient-gold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to as never}
      className="border border-border bg-card px-4 py-3 text-center text-sm text-foreground/90 transition-colors hover:border-primary hover:text-primary"
    >
      {label}
    </Link>
  );
}