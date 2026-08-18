import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { FileUploadField } from "@/components/admin/file-upload-field";
import { deleteMedia, uploadMedia } from "@/lib/media-upload";
import { CHALLENGE_DAYS, currentDayNumber, hasStarted, isQuestionOpen } from "@/lib/challenge-day";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

/**
 * Routed with a trailing underscore on "challenges" so this page does NOT nest
 * under the /admin/challenges list route. The URL is still
 * /admin/challenges/:challengeId/questions.
 */
export const Route = createFileRoute("/admin/challenges_/$challengeId/questions")({
  ssr: false,
  head: () => ({ meta: [{ title: "Edit Challenge — Admin" }] }),
  component: AdminChallengeQuestionsPage,
});

type Question = Tables<"questions">;

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
type OptionLetter = (typeof OPTION_LETTERS)[number];

/** A challenge runs one question per day, for at most a week. */
const MAX_QUESTIONS = 7;
const DAY_CHOICES = [1, 2, 3, 4, 5, 6, 7];

const inputClass =
  "w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary";

function truncate(text: string, max = 100) {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;
}

function AdminChallengeQuestionsPage() {
  const { challengeId } = Route.useParams();
  return (
    <AdminShell title="Edit Challenge">
      <QuestionsManager challengeId={challengeId} />
    </AdminShell>
  );
}

function QuestionsManager({ challengeId }: { challengeId: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["admin", "challenges", challengeId, "questions"];

  const { data, isLoading } = useQuery({
    queryKey,
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

  const [editing, setEditing] = useState<Question | "new" | null>(null);

  async function handleDelete(q: Question) {
    const { error } = await supabase.from("questions").delete().eq("id", q.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    // The row is gone; drop its uploaded files so the bucket doesn't grow orphans.
    await deleteMedia(q.image_url);
    toast.success(`Day ${q.day_number} question deleted.`);
    queryClient.invalidateQueries({ queryKey });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  if (!data?.challenge) {
    return (
      <div>
        <BackLink />
        <p className="mt-6 text-sm text-muted-foreground">That challenge no longer exists.</p>
      </div>
    );
  }

  const questions = data.questions;
  const atCapacity = questions.length >= MAX_QUESTIONS;
  const usedDays = questions.map((q) => q.day_number);
  const liveDay = currentDayNumber(data.challenge.start_date);

  /** Unlocks a question ahead of its day, or puts it back on schedule. */
  async function toggleUnlock(q: Question, unlock: boolean) {
    const { error } = await supabase
      .from("questions")
      .update({ published_at: unlock ? new Date().toISOString() : null })
      .eq("id", q.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      unlock
        ? `Day ${q.day_number} is now open to members.`
        : `Day ${q.day_number} is back on schedule.`,
    );
    queryClient.invalidateQueries({ queryKey });
  }

  return (
    <div>
      <BackLink />

      <LiveDayNotice
        challenge={data.challenge}
        usedDays={usedDays}
        onAdd={() => setEditing("new")}
      />

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <h2 className="font-serif text-2xl text-primary">{data.challenge.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {questions.length} of {MAX_QUESTIONS} questions
            {atCapacity && " — this challenge is full."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          disabled={atCapacity}
          title={
            atCapacity ? `A challenge can have at most ${MAX_QUESTIONS} questions.` : undefined
          }
          className="bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add Question
        </button>
      </div>

      {questions.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No questions yet. Add the first one to get this challenge started.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto border border-border">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="bg-secondary/50 text-left">
                <th className="px-4 py-3 font-medium text-primary">Day</th>
                <th className="px-4 py-3 font-medium text-primary">Status</th>
                <th className="px-4 py-3 font-medium text-primary">Question</th>
                <th className="px-4 py-3 font-medium text-primary">Options</th>
                <th className="px-4 py-3 font-medium text-primary">Correct</th>
                <th className="px-4 py-3 text-right font-medium text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr
                  key={q.id}
                  className={`border-t border-border ${i % 2 === 1 ? "bg-card/40" : ""}`}
                >
                  <td className="px-4 py-3 align-top">
                    <span className="inline-block whitespace-nowrap rounded-full border border-primary/50 bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                      Day {q.day_number}
                    </span>
                  </td>
                  <td className="max-w-sm px-4 py-3 align-top text-foreground">
                    {truncate(q.question_text)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <ul className="space-y-0.5">
                      {OPTION_LETTERS.map((letter) => {
                        const text = q[`option_${letter.toLowerCase()}` as "option_a"];
                        const isCorrect = q.correct_option === letter;
                        return (
                          <li
                            key={letter}
                            className={
                              isCorrect ? "font-medium text-primary" : "text-muted-foreground"
                            }
                          >
                            <span className="tabular-nums">{letter}.</span>{" "}
                            {truncate(text ?? "", 40)}
                          </li>
                        );
                      })}
                    </ul>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="inline-block rounded-full border border-primary/50 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {q.correct_option}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => setEditing(q)}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        Edit
                      </button>
                      <ConfirmDeleteButton
                        itemLabel={`the Day ${q.day_number} question`}
                        onConfirm={() => handleDelete(q)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <QuestionDialog
          challengeId={challengeId}
          question={editing === "new" ? null : editing}
          usedDays={usedDays}
          questionCount={questions.length}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            queryClient.invalidateQueries({ queryKey });
          }}
        />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/admin/challenges"
      className="text-sm text-muted-foreground transition-colors hover:text-primary"
    >
      ← All challenges
    </Link>
  );
}

function QuestionDialog({
  challengeId,
  question,
  usedDays,
  questionCount,
  onClose,
  onSaved,
}: {
  challengeId: string;
  question: Question | null;
  usedDays: number[];
  questionCount: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  // Days already taken by *other* questions are unavailable.
  const takenDays = usedDays.filter((d) => d !== question?.day_number);
  const firstFreeDay = DAY_CHOICES.find((d) => !takenDays.includes(d)) ?? 1;

  const [form, setForm] = useState({
    day_number: question?.day_number ?? firstFreeDay,
    question_text: question?.question_text ?? "",
    option_a: question?.option_a ?? "",
    option_b: question?.option_b ?? "",
    option_c: question?.option_c ?? "",
    option_d: question?.option_d ?? "",
    correct_option: (question?.correct_option as OptionLetter | undefined) ?? "A",
    explanation: question?.explanation ?? "",
  });
  const [imageFile, setImageFile] = useState<File | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!question && questionCount >= MAX_QUESTIONS) {
      toast.error(`A challenge can have at most ${MAX_QUESTIONS} questions.`);
      return;
    }
    if (!DAY_CHOICES.includes(form.day_number)) {
      toast.error("Day number must be between 1 and 7.");
      return;
    }
    if (takenDays.includes(form.day_number)) {
      toast.error(`Day ${form.day_number} already has a question.`);
      return;
    }
    if (!form.question_text.trim()) {
      toast.error("Question text is required.");
      return;
    }
    const options = {
      option_a: form.option_a.trim(),
      option_b: form.option_b.trim(),
      option_c: form.option_c.trim(),
      option_d: form.option_d.trim(),
    };
    if (Object.values(options).some((v) => !v)) {
      toast.error("All four options are required.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = question?.image_url ?? null;
      if (imageFile instanceof File) {
        imageUrl = await uploadMedia(imageFile, "questions");
      } else if (imageFile === null) {
        imageUrl = null;
      }

      const payload = {
        challenge_id: challengeId,
        day_number: form.day_number,
        question_text: form.question_text.trim(),
        ...options,
        correct_option: form.correct_option,
        explanation: form.explanation.trim() || null,
        image_url: imageUrl,
      };

      const { error } = question
        ? await supabase.from("questions").update(payload).eq("id", question.id)
        : await supabase.from("questions").insert(payload);
      if (error) throw error;

      toast.success(question ? "Question updated." : "Question added.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-primary">
            {question ? `Edit Day ${question.day_number} Question` : "New Question"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Day number" required>
            <select
              value={form.day_number}
              onChange={(e) => setForm((f) => ({ ...f, day_number: Number(e.target.value) }))}
              className={inputClass}
            >
              {DAY_CHOICES.map((d) => (
                <option key={d} value={d} disabled={takenDays.includes(d)}>
                  Day {d}
                  {takenDays.includes(d) ? " — already used" : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Question text" required>
            <textarea
              value={form.question_text}
              onChange={(e) => setForm((f) => ({ ...f, question_text: e.target.value }))}
              rows={3}
              required
              className={`${inputClass} resize-y`}
            />
          </Field>

          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm text-muted-foreground">
              Options<span className="text-destructive"> *</span>
            </legend>
            {OPTION_LETTERS.map((letter) => {
              const key = `option_${letter.toLowerCase()}` as
                "option_a" | "option_b" | "option_c" | "option_d";
              const isCorrect = form.correct_option === letter;
              return (
                <div key={letter} className="flex items-center gap-3">
                  <span
                    className={`w-5 shrink-0 text-sm ${isCorrect ? "font-medium text-primary" : "text-muted-foreground"}`}
                  >
                    {letter}
                  </span>
                  <input
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    required
                    placeholder={`Option ${letter}`}
                    className={`${inputClass} ${isCorrect ? "border-primary/60" : ""}`}
                  />
                </div>
              );
            })}
          </fieldset>

          <Field label="Correct option" required hint="The option marked here is the right answer.">
            <select
              value={form.correct_option}
              onChange={(e) =>
                setForm((f) => ({ ...f, correct_option: e.target.value as OptionLetter }))
              }
              required
              className={inputClass}
            >
              {OPTION_LETTERS.map((letter) => {
                const key = `option_${letter.toLowerCase()}` as
                  "option_a" | "option_b" | "option_c" | "option_d";
                const preview = form[key].trim();
                return (
                  <option key={letter} value={letter}>
                    {letter}
                    {preview ? ` — ${truncate(preview, 60)}` : ""}
                  </option>
                );
              })}
            </select>
          </Field>

          <Field label="Explanation" hint="Shown to members after they answer.">
            <textarea
              value={form.explanation}
              onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
              rows={3}
              className={`${inputClass} resize-y`}
            />
          </Field>

          <FileUploadField
            label="Question image"
            accept="image/*"
            currentUrl={question?.image_url}
            onFileChange={setImageFile}
          />

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="border border-border px-5 py-2.5 text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * Which day members are actually on, and which open days have no question.
 *
 * Visibility is driven entirely by the challenge's start date: a member sees
 * every question from Day 1 up to today. Without this panel an author can post
 * Day 1, look at a member account showing "Day 6", and have no way to tell why
 * the two disagree.
 */
function LiveDayNotice({
  challenge,
  usedDays,
  onAdd,
}: {
  challenge: Tables<"challenges">;
  usedDays: number[];
  onAdd: () => void;
}) {
  const started = hasStarted(challenge.start_date);
  const day = currentDayNumber(challenge.start_date);
  const openDays = Array.from({ length: day }, (_, i) => i + 1);
  const missing = started ? openDays.filter((d) => !usedDays.includes(d)) : [];

  if (!challenge.start_date) {
    return (
      <p className="mt-5 border-l-2 border-destructive/60 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground">
        This challenge has no start date, so members will always see Day 1. Set one on the challenge
        to move the days along.
      </p>
    );
  }

  if (!started) {
    return (
      <p className="mt-5 border-l-2 border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Hasn't started yet — opens{" "}
        <span className="text-foreground">
          {new Date(challenge.start_date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        . Members see nothing until then.
      </p>
    );
  }

  return (
    <div
      className={`mt-5 border-l-2 px-4 py-3 text-sm ${
        missing.length > 0
          ? "border-destructive/60 bg-destructive/5"
          : "border-primary/60 bg-primary/5"
      }`}
    >
      <p className="text-foreground">
        Members are on <span className="text-primary">Day {day}</span> of {CHALLENGE_DAYS}, so Day
        {day === 1 ? " 1 is" : `s 1–${day} are`} open to answer.
      </p>
      {missing.length > 0 ? (
        <p className="mt-1.5 text-muted-foreground">
          No question posted for{" "}
          <span className="text-destructive">
            Day{missing.length === 1 ? " " : "s "}
            {missing.join(", ")}
          </span>
          .{" "}
          <button
            type="button"
            onClick={onAdd}
            className="text-primary underline underline-offset-2 hover:no-underline"
          >
            Add one now
          </button>
          , or change the challenge's start date so the days line up with your writing.
        </p>
      ) : (
        <p className="mt-1.5 text-muted-foreground">
          Every open day has a question. Day {Math.min(day + 1, CHALLENGE_DAYS)}
          {day < CHALLENGE_DAYS ? " opens tomorrow." : " is the last day."}
        </p>
      )}
    </div>
  );
}
