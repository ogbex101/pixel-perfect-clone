import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/members")({
  ssr: false,
  head: () => ({ meta: [{ title: "Members — Admin" }] }),
  component: AdminMembersPage,
});

type Member = Tables<"members">;

const queryKey = ["admin", "members"];

/** `is_active` is the suspend flag; null is treated as active. */
function isSuspended(m: Member) {
  return m.is_active === false;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function AdminMembersPage() {
  return (
    <AdminShell title="Member Management">
      <MembersManager />
    </AdminShell>
  );
}

function MembersManager() {
  const queryClient = useQueryClient();
  const { data: members, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Member | null>(null);

  const filtered = useMemo(() => {
    if (!members) return [];
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.facebook_username ?? "").toLowerCase().includes(q),
    );
  }, [members, search]);

  async function toggleSuspended(m: Member) {
    const next = !isSuspended(m); // next === true means "now suspended"
    const { error } = await supabase.from("members").update({ is_active: !next }).eq("id", m.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${m.full_name} ${next ? "suspended" : "reinstated"}.`);
    queryClient.invalidateQueries({ queryKey });
  }

  async function handleDelete(m: Member) {
    const { error } = await supabase.from("members").delete().eq("id", m.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${m.full_name} deleted.`);
    queryClient.invalidateQueries({ queryKey });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or Facebook"
            aria-label="Search members"
            className="w-full border border-border bg-card py-2 pl-9 pr-3 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {members?.length ?? 0} members
        </p>
      </div>

      {!members || members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members have registered yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members match that search.</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="bg-secondary/50 text-left">
                <th className="px-4 py-3 font-medium text-primary">Name</th>
                <th className="px-4 py-3 font-medium text-primary">Email</th>
                <th className="px-4 py-3 font-medium text-primary">Facebook</th>
                <th className="px-4 py-3 font-medium text-primary">Joined</th>
                <th className="px-4 py-3 font-medium text-primary">Status</th>
                <th className="px-4 py-3 text-right font-medium text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const suspended = isSuspended(m);
                return (
                  <tr
                    key={m.id}
                    onClick={() => setViewing(m)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setViewing(m);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${m.full_name}'s progress`}
                    className={`cursor-pointer border-t border-border transition-colors hover:bg-primary/5 focus:outline-none focus-visible:bg-primary/10 ${
                      i % 2 === 1 ? "bg-card/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{m.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.facebook_username || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(m.join_date ?? m.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${
                          suspended
                            ? "border-destructive/50 bg-destructive/10 text-destructive"
                            : "border-primary/50 bg-primary/10 text-primary"
                        }`}
                      >
                        {suspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => toggleSuspended(m)}
                          className="text-sm text-muted-foreground transition-colors hover:text-primary"
                        >
                          {suspended ? "Reinstate" : "Suspend"}
                        </button>
                        <ConfirmDeleteButton
                          itemLabel={m.full_name}
                          onConfirm={() => handleDelete(m)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewing && <MemberDetailDialog member={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function MemberDetailDialog({ member, onClose }: { member: Member; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "members", member.id, "detail"],
    queryFn: async () => {
      const [answers, badges] = await Promise.all([
        supabase
          .from("answers")
          .select(
            "*, questions(day_number, question_text, correct_option, challenge_id, challenges(title))",
          )
          .eq("member_id", member.id)
          .order("submitted_at", { ascending: false }),
        supabase
          .from("member_badges")
          .select("*, badges(name, description)")
          .eq("member_id", member.id),
      ]);
      if (answers.error) throw answers.error;
      if (badges.error) throw badges.error;
      return { answers: answers.data ?? [], badges: badges.data ?? [] };
    },
  });

  // Group answers by challenge so progress reads per-challenge, not as one list.
  const byChallenge = useMemo(() => {
    const groups = new Map<string, { title: string; correct: number; total: number }>();
    for (const a of data?.answers ?? []) {
      const q = a.questions as {
        challenge_id: string | null;
        challenges: { title: string } | null;
      } | null;
      const key = q?.challenge_id ?? "unknown";
      const title = q?.challenges?.title ?? "Unknown challenge";
      const entry = groups.get(key) ?? { title, correct: 0, total: 0 };
      entry.total += 1;
      if (a.is_correct) entry.correct += 1;
      groups.set(key, entry);
    }
    return [...groups.values()];
  }, [data?.answers]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-primary">{member.full_name}</DialogTitle>
        </DialogHeader>

        <section>
          <h3 className="eyebrow">Profile</h3>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Detail label="Email" value={member.email} />
            <Detail label="Facebook" value={member.facebook_username} />
            <Detail label="Joined" value={formatDate(member.join_date ?? member.created_at)} />
            <Detail label="Location" value={member.location} />
            <Detail label="Status" value={isSuspended(member) ? "Suspended" : "Active"} />
          </dl>
          {member.bio && <p className="mt-4 text-sm text-foreground/85">{member.bio}</p>}
        </section>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading activity…</p>
        ) : (
          <>
            <section className="mt-8">
              <h3 className="eyebrow">Challenge progress</h3>
              {byChallenge.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  This member hasn't answered any questions yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {byChallenge.map((c) => (
                    <li
                      key={c.title}
                      className="flex items-center justify-between gap-4 border border-border bg-card px-4 py-2.5 text-sm"
                    >
                      <span className="text-foreground">{c.title}</span>
                      <span className="tabular-nums text-muted-foreground">
                        <span className="text-primary">{c.correct}</span> / {c.total} correct
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-8">
              <h3 className="eyebrow">Answer history</h3>
              {(data?.answers.length ?? 0) === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No answers recorded.</p>
              ) : (
                <div className="mt-3 overflow-x-auto border border-border">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="bg-secondary/50 text-left">
                        <th className="px-3 py-2 font-medium text-primary">Day</th>
                        <th className="px-3 py-2 font-medium text-primary">Question</th>
                        <th className="px-3 py-2 font-medium text-primary">Picked</th>
                        <th className="px-3 py-2 font-medium text-primary">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.answers ?? []).map((a) => {
                        const q = a.questions as {
                          day_number: number;
                          question_text: string;
                        } | null;
                        return (
                          <tr key={a.id} className="border-t border-border">
                            <td className="px-3 py-2 tabular-nums text-muted-foreground">
                              {q?.day_number ?? "—"}
                            </td>
                            <td className="max-w-xs px-3 py-2 text-foreground">
                              {q ? truncate(q.question_text, 70) : "—"}
                            </td>
                            <td className="px-3 py-2 tabular-nums text-muted-foreground">
                              {a.selected_option}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={a.is_correct ? "text-primary" : "text-muted-foreground"}
                              >
                                {a.is_correct ? "Correct" : "Incorrect"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="mt-8">
              <h3 className="eyebrow">Badges</h3>
              {(data?.badges.length ?? 0) === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No badges earned yet.</p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {(data?.badges ?? []).map((b) => {
                    const badge = b.badges as { name: string; description: string | null } | null;
                    return (
                      <li
                        key={b.id}
                        title={badge?.description ?? undefined}
                        className="rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs text-primary"
                      >
                        {badge?.name ?? "Badge"}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function truncate(text: string, max = 100) {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value || "—"}</dd>
    </div>
  );
}
