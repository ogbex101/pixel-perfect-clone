import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Landing page for a single challenge's questions.
 *
 * The challenges list links here, so the route has to exist. The full question
 * editor is not specced yet, so this reads the existing questions and shows
 * them, rather than pretending the data isn't there.
 *
 * Named with a trailing underscore on "challenges" so it does NOT nest under
 * the /admin/challenges list route (which would turn that page into a layout).
 */
export const Route = createFileRoute("/admin/challenges_/$challengeId/questions")({
  ssr: false,
  head: () => ({ meta: [{ title: "Challenge Questions — Admin" }] }),
  component: AdminChallengeQuestionsPage,
});

function AdminChallengeQuestionsPage() {
  const { challengeId } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "challenges", challengeId, "questions"],
    queryFn: async () => {
      const [challenge, questions] = await Promise.all([
        supabase.from("challenges").select("*").eq("id", challengeId).maybeSingle(),
        supabase
          .from("questions")
          .select("*")
          .eq("challenge_id", challengeId)
          .order("day_number", { ascending: true }),
      ]);
      if (challenge.error) throw challenge.error;
      if (questions.error) throw questions.error;
      return { challenge: challenge.data, questions: questions.data ?? [] };
    },
  });

  return (
    <AdminShell title="Challenge Questions">
      <Link
        to="/admin/challenges"
        className="text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        ← All challenges
      </Link>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : !data?.challenge ? (
        <p className="mt-6 text-sm text-muted-foreground">That challenge no longer exists.</p>
      ) : (
        <div className="mt-6">
          <h2 className="font-serif text-2xl text-primary">{data.challenge.title}</h2>
          {data.challenge.description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {data.challenge.description}
            </p>
          )}

          <div className="mt-8 border border-border bg-card p-5">
            <p className="text-sm text-foreground">
              {data.questions.length === 0
                ? "This challenge has no questions yet."
                : `${data.questions.length} question${data.questions.length === 1 ? "" : "s"} in this challenge.`}
            </p>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Adding and editing questions isn't built yet — send that spec and this becomes the
              full editor.
            </p>
          </div>

          {data.questions.length > 0 && (
            <ol className="mt-6 space-y-3">
              {data.questions.map((q) => (
                <li key={q.id} className="border border-border bg-card px-4 py-3">
                  <p className="text-xs text-muted-foreground">Day {q.day_number}</p>
                  <p className="mt-1 text-sm text-foreground">{q.question_text}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </AdminShell>
  );
}
