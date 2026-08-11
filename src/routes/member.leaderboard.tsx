import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Reveal } from "@/components/reveal";
import { supabase } from "@/integrations/supabase/client";
import { getLeaderboard } from "@/lib/member.functions";
import { MemberGate, type MemberCtx } from "@/lib/member-session";

export const Route = createFileRoute("/member/leaderboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Leaderboard — DUMB 31 Community" },
      {
        name: "description",
        content: "Live rankings for the DUMB 31 seven-day reader challenge.",
      },
      { property: "og:title", content: "Leaderboard — DUMB 31 Community" },
      { property: "og:description", content: "Live rankings for the DUMB 31 reader challenge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <MemberGate>{(ctx) => <LeaderboardPage ctx={ctx} />}</MemberGate>,
});

function LeaderboardPage({ ctx }: { ctx: MemberCtx }) {
  const [challengeId, setChallengeId] = useState<string | undefined>(ctx.challenge?.id);

  const { data: challenges } = useQuery({
    queryKey: ["challenges", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("id, title, is_active, start_date")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", challengeId ?? "active"],
    queryFn: () => getLeaderboard({ data: challengeId ? { challenge_id: challengeId } : {} }),
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Reveal>
        <p className="eyebrow">Standings</p>
        <h1 className="mt-2 font-serif text-4xl text-gradient-gold">Leaderboard</h1>
      </Reveal>

      {challenges && challenges.length > 0 && (
        <div className="mt-8">
          <label className="mb-1 block text-sm text-muted-foreground">Challenge</label>
          <select
            value={challengeId ?? ""}
            onChange={(e) => setChallengeId(e.target.value || undefined)}
            className="w-full max-w-sm border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">Current challenge</option>
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
                {c.is_active ? " (active)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="rule-gold my-8" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Tallying answers…</p>
      ) : !data || data.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No answers recorded for this challenge yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <th className="py-3 pr-4">Rank</th>
                <th className="py-3 pr-4">Member</th>
                <th className="py-3 pr-4">Correct</th>
                <th className="py-3">Avg. time</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => {
                const isMe = row.member_id === ctx.member.id;
                return (
                  <tr
                    key={row.member_id}
                    className={`border-b border-border/60 ${
                      isMe ? "bg-primary/10 text-foreground" : "text-foreground/85"
                    }`}
                  >
                    <td className="py-3 pr-4 font-serif text-primary">{row.rank}</td>
                    <td className="py-3 pr-4">
                      {row.name}
                      {isMe && <span className="ml-2 text-xs text-primary">you</span>}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {row.correct} / {row.total}
                    </td>
                    <td className="py-3 tabular-nums">{row.average_time}s</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}