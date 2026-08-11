import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/winners")({
  ssr: false,
  head: () => ({ meta: [{ title: "Winners — Admin" }] }),
  component: AdminWinnersPage,
});

type Challenge = Tables<"challenges">;

type WinnerRow = Tables<"challenge_winners"> & {
  challenge: { id: string; title: string; prize_description: string | null } | null;
  member: { id: string; full_name: string; email: string } | null;
};

type LeaderboardRow = Tables<"challenge_leaderboard"> & {
  member: { id: string; full_name: string } | null;
};

const winnersKey = ["admin", "challenge_winners"];

/** A challenge is over once it's switched off or its end date has passed. */
function hasEnded(c: Challenge) {
  if (!c.is_active) return true;
  return c.end_date != null && new Date(c.end_date).getTime() < Date.now();
}

function rankLabel(rank: number) {
  if (rank === 1) return "🥇 1st";
  if (rank === 2) return "🥈 2nd";
  if (rank === 3) return "🥉 3rd";
  const suffix = rank === 21 || rank === 31 ? "st" : rank % 10 === 2 ? "nd" : "th";
  return `${rank}${suffix}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Post copied to clipboard.");
  } catch {
    // Clipboard API needs a secure context; fall back to a manual selection.
    toast.error("Couldn't copy automatically — select the text and copy it manually.");
  }
}

function buildFacebookPost(
  challenge: { title: string; prize_description: string | null },
  winners: { rank: number; name: string }[],
) {
  const podium = [...winners]
    .sort((a, b) => a.rank - b.rank)
    .map((w) => `${rankLabel(w.rank)} — ${w.name}`)
    .join("\n");

  return [
    "🏆 DUMB 31 CHALLENGE WINNERS 🏆",
    "",
    `"${challenge.title}" has ended, and the results are in.`,
    "",
    podium,
    "",
    challenge.prize_description ? `Prize: ${challenge.prize_description}` : null,
    challenge.prize_description ? "" : null,
    "Thank you to everyone who played. Another challenge is on the way.",
    "",
    "#DUMB31 #NikNanoski",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function AdminWinnersPage() {
  return (
    <AdminShell title="Winner Management">
      <WinnersManager />
    </AdminShell>
  );
}

function WinnersManager() {
  const queryClient = useQueryClient();
  const [announcing, setAnnouncing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: winnersKey,
    queryFn: async () => {
      const [winners, challenges] = await Promise.all([
        supabase
          .from("challenge_winners")
          .select(
            "*, challenge:challenge_id(id, title, prize_description), member:member_id(id, full_name, email)",
          )
          .order("announced_at", { ascending: false, nullsFirst: true })
          .order("rank", { ascending: true }),
        supabase.from("challenges").select("*"),
      ]);
      if (winners.error) throw winners.error;
      if (challenges.error) throw challenges.error;
      return {
        winners: (winners.data ?? []) as unknown as WinnerRow[],
        challenges: challenges.data ?? [],
      };
    },
  });

  async function toggleFulfilled(w: WinnerRow) {
    const next = !w.prize_fulfilled;
    const { error } = await supabase
      .from("challenge_winners")
      .update({ prize_fulfilled: next })
      .eq("id", w.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? "Prize marked as fulfilled." : "Prize marked as pending.");
    queryClient.invalidateQueries({ queryKey: winnersKey });
  }

  async function handleDelete(w: WinnerRow) {
    const { error } = await supabase.from("challenge_winners").delete().eq("id", w.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Winner record removed.");
    queryClient.invalidateQueries({ queryKey: winnersKey });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const winners = data?.winners ?? [];
  const endedChallenges = (data?.challenges ?? []).filter(hasEnded);

  // Group by challenge so a whole podium can be copied as one post.
  const byChallenge = new Map<string, WinnerRow[]>();
  for (const w of winners) {
    const key = w.challenge_id ?? "unknown";
    byChallenge.set(key, [...(byChallenge.get(key) ?? []), w]);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {endedChallenges.length === 0
            ? "No challenges have ended yet."
            : `${endedChallenges.length} challenge${endedChallenges.length === 1 ? " has" : "s have"} ended.`}
        </p>
        <button
          type="button"
          onClick={() => setAnnouncing(true)}
          disabled={endedChallenges.length === 0}
          title={
            endedChallenges.length === 0
              ? "A challenge has to end before its winners can be announced."
              : undefined
          }
          className="bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Announce Winner
        </button>
      </div>

      {winners.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No winners recorded yet. Once a challenge ends, announce its winners from the leaderboard.
        </p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="bg-secondary/50 text-left">
                <th className="px-4 py-3 font-medium text-primary">Challenge</th>
                <th className="px-4 py-3 font-medium text-primary">Winner</th>
                <th className="px-4 py-3 font-medium text-primary">Rank</th>
                <th className="px-4 py-3 font-medium text-primary">Prize</th>
                <th className="px-4 py-3 font-medium text-primary">Announced</th>
                <th className="px-4 py-3 text-right font-medium text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((w, i) => (
                <tr
                  key={w.id}
                  className={`border-t border-border ${i % 2 === 1 ? "bg-card/40" : ""}`}
                >
                  <td className="px-4 py-3 text-foreground">
                    {w.challenge?.title ?? "Unknown challenge"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">
                      {w.member?.full_name ?? "Unknown member"}
                    </span>
                    {w.member?.email && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {w.member.email}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground">
                    {rankLabel(w.rank)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs ${
                        w.prize_fulfilled
                          ? "border-[oklch(0.65_0.14_150)]/60 bg-[oklch(0.65_0.14_150)]/15 text-[oklch(0.76_0.13_150)]"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {w.prize_fulfilled ? "✅ Fulfilled" : "⏳ Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(w.announced_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (!w.challenge) {
                            toast.error("That challenge no longer exists.");
                            return;
                          }
                          const group = byChallenge.get(w.challenge_id ?? "") ?? [w];
                          copyText(
                            buildFacebookPost(
                              w.challenge,
                              group.map((g) => ({
                                rank: g.rank,
                                name: g.member?.full_name ?? "Unknown member",
                              })),
                            ),
                          );
                        }}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                        Copy post
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFulfilled(w)}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {w.prize_fulfilled ? "Mark pending" : "Mark fulfilled"}
                      </button>
                      <ConfirmDeleteButton
                        itemLabel={`${w.member?.full_name ?? "this winner"}'s record`}
                        onConfirm={() => handleDelete(w)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {announcing && (
        <AnnounceDialog
          challenges={endedChallenges}
          existingWinners={winners}
          onClose={() => setAnnouncing(false)}
          onRecorded={() => queryClient.invalidateQueries({ queryKey: winnersKey })}
        />
      )}
    </div>
  );
}

function AnnounceDialog({
  challenges,
  existingWinners,
  onClose,
  onRecorded,
}: {
  challenges: Challenge[];
  existingWinners: WinnerRow[];
  onClose: () => void;
  onRecorded: () => void;
}) {
  const [challengeId, setChallengeId] = useState(challenges[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const challenge = challenges.find((c) => c.id === challengeId) ?? null;
  const alreadyRecorded = existingWinners.filter((w) => w.challenge_id === challengeId);

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["admin", "challenge_leaderboard", challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_leaderboard")
        .select("*, member:member_id(id, full_name)")
        .eq("challenge_id", challengeId)
        .order("rank", { ascending: true })
        .limit(3);
      if (error) throw error;
      return (data ?? []) as unknown as LeaderboardRow[];
    },
    enabled: Boolean(challengeId),
  });

  // Default to the whole podium whenever a different challenge is picked.
  useEffect(() => {
    setSelected(new Set((leaderboard ?? []).map((r) => r.id)));
  }, [leaderboard]);

  const top3 = leaderboard ?? [];

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleRecord() {
    if (!challenge) return;
    const chosen = top3.filter((r) => selected.has(r.id));
    if (chosen.length === 0) {
      toast.error("Select at least one member to announce.");
      return;
    }
    if (chosen.some((r) => !r.member_id)) {
      toast.error("A selected leaderboard entry has no member attached.");
      return;
    }

    setSaving(true);
    try {
      const announcedAt = new Date().toISOString();
      const rows = chosen.map((r, i) => ({
        challenge_id: challenge.id,
        member_id: r.member_id,
        // Fall back to podium position when the leaderboard has no explicit rank.
        rank: r.rank ?? i + 1,
        announced_at: announcedAt,
        prize_fulfilled: false,
      }));
      const { error } = await supabase.from("challenge_winners").insert(rows);
      if (error) throw error;

      toast.success(`${rows.length} winner${rows.length === 1 ? "" : "s"} recorded.`);
      onRecorded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record winners.");
    } finally {
      setSaving(false);
    }
  }

  const postPreview = challenge
    ? buildFacebookPost(
        challenge,
        (alreadyRecorded.length > 0
          ? alreadyRecorded.map((w) => ({
              rank: w.rank,
              name: w.member?.full_name ?? "Unknown member",
            }))
          : top3
              .filter((r) => selected.has(r.id))
              .map((r, i) => ({
                rank: r.rank ?? i + 1,
                name: r.member?.full_name ?? "Unknown member",
              }))
        ).filter(Boolean),
      )
    : "";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-primary">Announce Winners</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Ended challenge</label>
            <select
              value={challengeId}
              onChange={(e) => setChallengeId(e.target.value)}
              className="w-full border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none"
            >
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {challenge?.prize_description && (
            <div className="border border-border bg-card p-4">
              <p className="eyebrow">Prize</p>
              <p className="mt-1 text-sm text-foreground/85">{challenge.prize_description}</p>
            </div>
          )}

          <div>
            <p className="eyebrow mb-3">Top 3 from the leaderboard</p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading leaderboard…</p>
            ) : top3.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                This challenge has no leaderboard entries, so there is nobody to announce yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {top3.map((r, i) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-4 border border-border bg-card px-4 py-3"
                  >
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggle(r.id)}
                        className="h-4 w-4 accent-[color:var(--brand-gold)]"
                      />
                      <span className="whitespace-nowrap text-sm text-primary">
                        {rankLabel(r.rank ?? i + 1)}
                      </span>
                      <span className="text-sm text-foreground">
                        {r.member?.full_name ?? "Unknown member"}
                      </span>
                    </label>
                    <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {r.correct_count ?? 0}/{r.total_answered ?? 0} correct
                      {r.average_time != null && ` · ${Math.round(r.average_time)}s avg`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {alreadyRecorded.length > 0 && (
            <p className="border border-border bg-card p-4 text-sm text-muted-foreground">
              This challenge already has {alreadyRecorded.length} recorded winner
              {alreadyRecorded.length === 1 ? "" : "s"}. Recording again will add duplicates — copy
              the post below instead, or remove the old records first.
            </p>
          )}

          {postPreview && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <p className="eyebrow">Facebook post</p>
                <button
                  type="button"
                  onClick={() => copyText(postPreview)}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  Copy
                </button>
              </div>
              <textarea
                readOnly
                value={postPreview}
                rows={12}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full border border-border bg-card px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="border border-border px-5 py-2.5 text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleRecord}
            disabled={saving || top3.length === 0}
            className="bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Recording…" : "Record winners"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
