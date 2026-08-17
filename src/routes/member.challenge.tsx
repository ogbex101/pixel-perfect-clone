import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Reveal } from "@/components/reveal";
import { getTodayQuestion, submitAnswer } from "@/lib/member.functions";
import { MemberGate, getMemberToken, memberContextKey } from "@/lib/member-session";
import { MemberShell } from "@/components/member/member-shell";

export const Route = createFileRoute("/member/challenge")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Today's Challenge — DUMB 31 Community" },
      {
        name: "description",
        content: "Answer today's DUMB 31 challenge question and track your 7-day progress.",
      },
      { property: "og:title", content: "Today's Challenge — DUMB 31 Community" },
      { property: "og:description", content: "Answer today's DUMB 31 challenge question." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <MemberGate>
      {(ctx) => (
        <MemberShell ctx={ctx}>
          <ChallengePage />
        </MemberShell>
      )}
    </MemberGate>
  ),
});

const OPTIONS = ["A", "B", "C", "D"] as const;

function ChallengePage() {
  const token = getMemberToken() as string;
  const queryClient = useQueryClient();
  const queryKey = ["member", "today-question"];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getTodayQuestion({ data: { token } }),
  });

  const [selected, setSelected] = useState<(typeof OPTIONS)[number] | null>(null);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());

  // The server hands back the oldest unanswered question, so refetching right
  // after a submit would skip straight past the result the member just earned.
  // Pin it locally instead, and only refetch when they ask for the next one.
  const [justAnswered, setJustAnswered] = useState<{
    question_id: string;
    selected_option: string;
    is_correct: boolean;
    correct_option: string | null;
    explanation: string | null;
  } | null>(null);

  const pinned = justAnswered?.question_id === data?.question?.id ? justAnswered : null;
  const answered = pinned ?? data?.answered ?? null;

  useEffect(() => {
    if (answered || !data?.question) return;
    startRef.current = Date.now();
    setElapsed(0);
    const id = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [answered, data?.question]);

  async function handleSubmit() {
    if (!selected || !data?.question) return;
    setSaving(true);
    try {
      const result = await submitAnswer({
        data: {
          token,
          question_id: data.question.id,
          selected_option: selected,
          time_taken_seconds: Math.floor((Date.now() - startRef.current) / 1000),
        },
      });
      setJustAnswered({
        question_id: data.question.id,
        selected_option: selected,
        is_correct: result.is_correct,
        correct_option: result.correct_option,
        explanation: result.explanation,
      });
      // Refreshes the sidebar and dashboard counts without disturbing the
      // question on screen, which is a different query.
      await queryClient.invalidateQueries({ queryKey: memberContextKey });

      for (const badge of result.badges_awarded) {
        toast.success(`Badge unlocked: ${badge}`, { duration: 6000 });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your answer.");
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    setJustAnswered(null);
    setSelected(null);
    await queryClient.invalidateQueries({ queryKey });
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-sm text-muted-foreground">
        Opening the terminal…
      </div>
    );
  }

  if (!data?.challenge) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl text-gradient-gold">No active challenge</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The next 7-day challenge hasn't opened yet. Check the news feed for the announcement.
        </p>
        <Link to="/news" className="mt-6 inline-block text-primary hover:underline">
          Read the latest news →
        </Link>
      </div>
    );
  }

  // The pinned answer isn't in the server counts yet, so add it back by hand.
  const progress = Math.min(7, (data.progress ?? 0) + (pinned ? 1 : 0));
  const remaining = Math.max(0, (data.openCount ?? 0) - (pinned ? 1 : 0));

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Reveal>
        <p className="eyebrow">Day {data.day} of 7</p>
        <h1 className="mt-2 font-serif text-3xl text-gradient-gold sm:text-4xl">
          {data.challenge.title}
        </h1>
        {data.challenge.prize_description && (
          <p className="mt-2 text-sm italic text-muted-foreground">
            Prize: {data.challenge.prize_description}
          </p>
        )}
      </Reveal>

      <div className="mt-8">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <span>Progress</span>
          <span>{progress}/7 answered</span>
        </div>
        <div className="mt-2 h-1.5 w-full bg-border">
          <div
            className="h-full bg-gradient-to-r from-[color:var(--brand-gold-deep)] to-[color:var(--brand-gold-bright)] transition-[width] duration-700"
            style={{ width: `${(progress / 7) * 100}%` }}
          />
        </div>
      </div>

      {!data.question ? (
        <div className="mt-12 border border-border bg-card p-6 text-sm text-muted-foreground">
          <p className="text-foreground">No questions have been posted for this challenge yet.</p>
          <p className="mt-2">
            The challenge is on Day {data.day} of 7. As soon as a question is posted for Day{" "}
            {data.day} or any earlier day, it will appear here.
          </p>
        </div>
      ) : (
        <Reveal className="mt-10 border border-border bg-card p-6 sm:p-8" variant="blur">
          {/* The served question is the oldest unanswered one, which is not
              necessarily today's — say so rather than letting the day number in
              the header contradict the question on screen. */}
          {data.question.day_number !== data.day && (
            <p className="mb-5 border-l-2 border-primary/60 bg-primary/5 px-4 py-2.5 text-sm text-muted-foreground">
              {answered ? (
                <>
                  Showing Day {data.question.day_number}.
                  {/* Only claim today is empty once the backlog is genuinely
                      clear — otherwise a later day may still be waiting. */}
                  {remaining === 0 && ` Nothing has been posted for Day ${data.day} yet.`}
                </>
              ) : (
                <>
                  Catching up on{" "}
                  <span className="text-primary">Day {data.question.day_number}</span>
                  {data.openCount > 1 && ` — ${data.openCount - 1} more open after this`}.
                </>
              )}
            </p>
          )}
          {data.question.image_url && (
            <div className="mb-6 overflow-hidden border border-border">
              <img
                src={data.question.image_url}
                alt="Challenge question illustration"
                className="w-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-serif text-xl text-foreground sm:text-2xl">
              {data.question.question_text}
            </h2>
            {!answered && (
              <span className="shrink-0 border border-border px-2 py-1 text-xs tabular-nums text-muted-foreground">
                {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
                {String(elapsed % 60).padStart(2, "0")}
              </span>
            )}
          </div>

          <ul className="mt-6 space-y-3">
            {OPTIONS.map((letter) => {
              const text = data.question![`option_${letter.toLowerCase()}` as "option_a"];
              const isPicked = answered ? answered.selected_option === letter : selected === letter;
              const isCorrect = answered?.correct_option === letter;
              return (
                <li key={letter}>
                  <button
                    type="button"
                    disabled={Boolean(answered)}
                    onClick={() => setSelected(letter)}
                    className={`flex w-full items-start gap-3 border px-4 py-3 text-left text-sm transition-colors ${
                      answered && isCorrect
                        ? "border-primary bg-primary/10 text-foreground"
                        : isPicked
                          ? "border-primary text-primary"
                          : "border-border text-foreground/85 hover:border-primary"
                    }`}
                  >
                    <span className="font-serif text-primary">{letter}</span>
                    <span>{text}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {answered ? (
            <div className="mt-6 border-t border-border pt-5">
              <p
                className={`font-serif text-xl ${
                  answered.is_correct ? "text-primary" : "text-destructive"
                }`}
              >
                {answered.is_correct ? "Correct." : "Incorrect."}
              </p>
              {!answered.is_correct && answered.correct_option && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Correct answer: {answered.correct_option}
                </p>
              )}
              {answered.explanation && (
                <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                  {answered.explanation}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-4">
                {remaining > 0 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
                  >
                    Next question ({remaining} left) →
                  </button>
                )}
                <Link to="/member/leaderboard" className="text-sm text-primary hover:underline">
                  See the leaderboard →
                </Link>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selected || saving}
              className="mt-6 bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)] disabled:opacity-50"
            >
              {saving ? "Submitting…" : "Submit answer"}
            </button>
          )}
        </Reveal>
      )}
    </div>
  );
}
