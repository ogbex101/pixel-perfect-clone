import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarDays, MessageSquare, Newspaper, ShieldCheck, Swords, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/reveal";
import { getLeaderboard } from "@/lib/member.functions";
import { getMemberToken } from "@/lib/member-session";

export const Route = createFileRoute("/home")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Join the DUMB 31 Community" },
      {
        name: "description",
        content:
          "Take the seven-day DUMB 31 challenge, climb the leaderboard, join the debate, and win prizes. Create your free member account.",
      },
      { property: "og:title", content: "Join the DUMB 31 Community" },
      {
        property: "og:description",
        content: "Seven days. Seven questions. One survivor at the top of the board.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommunityLanding,
});

const communityQuery = {
  queryKey: ["community", "landing"],
  queryFn: async () => {
    const [challengeRes, newsRes, topicsRes, leaderboard] = await Promise.all([
      supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("news_posts")
        .select("*")
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(3),
      supabase
        .from("debate_topics")
        .select("id, title, description")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3),
      getLeaderboard({ data: {} }).catch(() => ({ rows: [] as never[] })),
    ]);
    return {
      challenge: challengeRes.data,
      news: newsRes.data ?? [],
      topics: topicsRes.data ?? [],
      top: (leaderboard.rows ?? []).slice(0, 5),
    };
  },
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function CommunityLanding() {
  const { data } = useQuery(communityQuery);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(Boolean(getMemberToken()));
  }, []);

  const challenge = data?.challenge ?? null;

  return (
    <>
      {/* --- Hero ---------------------------------------------------------- */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden border-b border-border">
        {challenge?.image_url ? (
          <img
            src={challenge.image_url}
            alt=""
            aria-hidden
            className="kenburns absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="texture-metal absolute inset-0 bg-gradient-to-br from-[color:var(--brand-ink)] via-background to-[color:var(--brand-ink)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/80" />
        <div className="vignette absolute inset-0" />

        <div className="relative mx-auto w-full max-w-5xl px-6 py-24 text-center">
          <Reveal variant="blur">
            <p className="eyebrow track-in">The DUMB 31 Community</p>
          </Reveal>
          <Reveal variant="blur" delay={140}>
            <h1 className="text-gradient-gold mt-6 pb-2 font-serif text-5xl leading-[1.04] sm:text-6xl md:text-7xl">
              Seven days. Seven questions.
            </h1>
          </Reveal>
          <Reveal variant="blur" delay={280}>
            <p className="mx-auto mt-7 max-w-2xl text-lg text-foreground/80 md:text-xl">
              Prove how well you really know the world of DUMB 31. Answer one question a day, climb
              the leaderboard, argue it out in the forum, and win the prize.
            </p>
          </Reveal>
          <Reveal variant="blur" delay={420}>
            <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
              {signedIn ? (
                <Link
                  to="/member/dashboard"
                  className="btn-sheen inline-flex items-center bg-primary px-8 py-4 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
                >
                  Go to your dashboard →
                </Link>
              ) : (
                <>
                  <Link
                    to="/member/signup"
                    className="btn-sheen inline-flex items-center bg-primary px-8 py-4 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
                  >
                    Create your free account
                  </Link>
                  <Link
                    to="/member/login"
                    className="btn-sheen inline-flex items-center border border-primary px-8 py-4 font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* --- Live challenge ------------------------------------------------ */}
      {challenge && (
        <section className="border-b border-border py-20 md:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <Reveal variant="zoom" className="card-premium p-8 md:p-12">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-block rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs text-primary">
                  Running now
                </span>
                {challenge.end_date && (
                  <span className="text-xs text-muted-foreground">
                    Ends {formatDate(challenge.end_date)}
                  </span>
                )}
              </div>
              <h2 className="text-gradient-gold mt-5 pb-1 font-serif text-3xl md:text-4xl">
                {challenge.title}
              </h2>
              {challenge.description && (
                <p className="mt-4 max-w-2xl leading-relaxed text-foreground/85">
                  {challenge.description}
                </p>
              )}
              {challenge.prize_description && (
                <div className="mt-6 border-l-2 border-accent pl-4">
                  <p className="eyebrow">The prize</p>
                  <p className="mt-1 text-foreground/85">{challenge.prize_description}</p>
                </div>
              )}
              <Link
                to={signedIn ? "/member/challenge" : "/member/signup"}
                className="btn-sheen mt-8 inline-flex items-center bg-primary px-7 py-3.5 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
              >
                {signedIn ? "Answer today's question →" : "Join and play →"}
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* --- How it works -------------------------------------------------- */}
      <section className="border-b border-border bg-secondary/30 texture-metal py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center">
            <p className="eyebrow track-in">How it works</p>
            <h2 className="text-gradient-gold mt-3 pb-1 font-serif text-3xl md:text-5xl">
              Four steps to the top of the board
            </h2>
          </Reveal>
          <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Create an account",
                body: "Name, email, a password. That's it — you're in straight away.",
              },
              {
                title: "Answer daily",
                body: "One question unlocks each day of the challenge. You get one shot at each.",
              },
              {
                title: "Climb the board",
                body: "Most correct answers wins. Fastest average time breaks the tie.",
              },
              {
                title: "Win the prize",
                body: "The podium is announced at the end of the run, here and on Facebook.",
              },
            ].map((step, i) => (
              <Reveal
                as="li"
                key={step.title}
                variant="zoom"
                delay={i * 110}
                className="card-premium p-6"
              >
                <span className="text-gradient-gold font-serif text-4xl opacity-70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-serif text-xl text-primary">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* --- What you get -------------------------------------------------- */}
      <section className="border-b border-border py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="border-b border-border pb-5">
            <p className="eyebrow track-in">Inside the community</p>
            <h2 className="text-gradient-gold mt-2 pb-1 font-serif text-3xl md:text-[2.75rem]">
              What your account unlocks
            </h2>
          </Reveal>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Swords,
                title: "The daily challenge",
                body: "A new question each day, graded the moment you answer, with the reasoning revealed.",
              },
              {
                icon: Trophy,
                title: "Live leaderboard",
                body: "See exactly where you stand against every other reader, updated as answers land.",
              },
              {
                icon: MessageSquare,
                title: "Debate forum",
                body: "Argue theories, reply to other readers, and vote the sharpest takes up.",
              },
              {
                icon: Newspaper,
                title: "News and lore",
                body: "Announcements, background on the world, and updates straight from the author.",
              },
              {
                icon: CalendarDays,
                title: "Your progress",
                body: "Every answer you've given, kept on your profile with your running score.",
              },
              {
                icon: ShieldCheck,
                title: "Your own profile",
                body: "Avatar, bio, and location — your identity in the bunker.",
              },
            ].map((f, i) => (
              <Reveal
                as="li"
                key={f.title}
                variant="zoom"
                delay={(i % 3) * 110}
                className="card-premium p-6"
              >
                <f.icon className="h-6 w-6 text-primary" aria-hidden />
                <h3 className="mt-4 font-serif text-xl text-primary">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">{f.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* --- Leaderboard preview ------------------------------------------- */}
      {(data?.top.length ?? 0) > 0 && (
        <section className="border-b border-border bg-secondary/30 texture-metal py-20 md:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <Reveal className="text-center">
              <p className="eyebrow track-in">Standing right now</p>
              <h2 className="text-gradient-gold mt-3 pb-1 font-serif text-3xl md:text-4xl">
                Current leaders
              </h2>
            </Reveal>
            <ul className="mt-10 space-y-2">
              {(data?.top ?? []).map((row, i) => (
                <Reveal
                  as="li"
                  key={row.member_id}
                  delay={i * 80}
                  className="card-premium flex items-center gap-4 px-5 py-3.5"
                >
                  <span className="w-8 shrink-0 font-serif text-lg text-primary">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-card">
                    {row.avatar_url ? (
                      <img src={row.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-serif text-sm text-primary">
                        {row.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-foreground">{row.name}</span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {row.correct}/{row.total}
                  </span>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* --- Debate + News -------------------------------------------------- */}
      {((data?.topics.length ?? 0) > 0 || (data?.news.length ?? 0) > 0) && (
        <section className="border-b border-border py-20 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2">
            {(data?.topics.length ?? 0) > 0 && (
              <Reveal variant="left">
                <p className="eyebrow track-in">In the forum</p>
                <h2 className="text-gradient-gold mt-2 pb-1 font-serif text-2xl md:text-3xl">
                  Open debates
                </h2>
                <ul className="mt-6 space-y-3">
                  {(data?.topics ?? []).map((t) => (
                    <li key={t.id} className="card-premium p-4">
                      <Link
                        to="/debate/$topicId"
                        params={{ topicId: t.id }}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {t.title}
                      </Link>
                      {t.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {t.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {(data?.news.length ?? 0) > 0 && (
              <Reveal variant="right" delay={120}>
                <p className="eyebrow track-in">Latest</p>
                <h2 className="text-gradient-gold mt-2 pb-1 font-serif text-2xl md:text-3xl">
                  From the desk
                </h2>
                <ul className="mt-6 space-y-3">
                  {(data?.news ?? []).map((p) => (
                    <li key={p.id} className="card-premium p-4">
                      <Link
                        to="/news/$postId"
                        params={{ postId: p.id }}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {p.title}
                      </Link>
                      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                        {p.category ?? "news"}
                        {formatDate(p.published_at) && ` · ${formatDate(p.published_at)}`}
                      </p>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* --- Closing CTA ---------------------------------------------------- */}
      <section className="texture-paper py-20 md:py-28">
        <Reveal variant="blur" className="mx-auto max-w-3xl px-6 text-center">
          <p className="eyebrow track-in">Ready?</p>
          <h2 className="text-gradient-gold mt-3 pb-1 font-serif text-3xl sm:text-4xl md:text-5xl">
            The bunker door is open.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-foreground/80">
            Free to join, one question a day, and the leaderboard resets with every challenge.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            {signedIn ? (
              <Link
                to="/member/dashboard"
                className="btn-sheen inline-flex items-center bg-primary px-8 py-4 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
              >
                Go to your dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/member/signup"
                  className="btn-sheen inline-flex items-center bg-primary px-8 py-4 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
                >
                  Create your free account
                </Link>
                <Link
                  to="/member/login"
                  className="link-underline text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  I already have an account
                </Link>
              </>
            )}
          </div>
        </Reveal>
      </section>
    </>
  );
}
