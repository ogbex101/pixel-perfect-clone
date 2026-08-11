import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Reveal } from "@/components/reveal";
import { getTodayQuestion, submitAnswer } from "@/lib/member.functions";
import { MemberGate, getMemberToken, memberContextKey } from "@/lib/member-session";

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
  component: () => <MemberGate>{() => <ChallengePage />}</MemberGate>,
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
  const answered = data?.answered ?? null;

  useEffect(() => {
    if (answered || !data?.question) return;
    startRef.current = Date.now();
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
      await submitAnswer({
        data: {
          token,
          question_id: data.question.id,
          selected_option: selected,
          time_taken_seconds: Math.floor((Date.now() - startRef.current) / 1000),
        },
      });
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: memberContextKey });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your answer.");
    } finally {
      setSaving(false);
    }
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

  const progress = Math.min(7, data.progress ?? 0);

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
        <p className="mt-12 text-sm text-muted-foreground">
          Today's question hasn't been posted yet. Come back shortly.
        </p>
      ) : (
        <Reveal className="mt-10 border border-border bg-card p-6 sm:p-8" variant="blur">
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
              <Link
                to="/member/leaderboard"
                className="mt-5 inline-block text-sm text-primary hover:underline"
              >
                See the leaderboard →
              </Link>
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