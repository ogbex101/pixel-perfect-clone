import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { FileUploadField } from "@/components/admin/file-upload-field";
import { uploadMedia } from "@/lib/media-upload";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/challenges")({
  ssr: false,
  head: () => ({ meta: [{ title: "Challenges — Admin" }] }),
  component: AdminChallengesPage,
});

type Challenge = Tables<"challenges">;

const queryKey = ["admin", "challenges"];
const inputClass =
  "w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary";

/**
 * A challenge reads as "Ended" once it's switched off or its end date has
 * passed, so the badge never claims a lapsed challenge is still running.
 */
function isEnded(c: Challenge) {
  if (!c.is_active) return true;
  return c.end_date != null && new Date(c.end_date).getTime() < Date.now();
}

/** timestamptz -> value for <input type="datetime-local">, in local time. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/** <input type="datetime-local"> value -> timestamptz, or null when blank. */
function fromLocalInput(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminChallengesPage() {
  return (
    <AdminShell title="Challenge Management">
      <ChallengesManager />
    </AdminShell>
  );
}

function ChallengesManager() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: items, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [editing, setEditing] = useState<Challenge | "new" | null>(null);

  async function handleDelete(item: Challenge) {
    const { error } = await supabase.from("challenges").delete().eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`"${item.title}" deleted.`);
    queryClient.invalidateQueries({ queryKey });
  }

  function openQuestions(item: Challenge) {
    navigate({
      to: "/admin/challenges/$challengeId/questions",
      params: { challengeId: item.id },
    });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Select a challenge to manage its questions.</p>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
        >
          Create New Challenge
        </button>
      </div>

      {!items || items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No challenges yet. Create your first one to get started.
        </p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-secondary/50 text-left">
                <th className="px-4 py-3 font-medium text-primary">Title</th>
                <th className="px-4 py-3 font-medium text-primary">Status</th>
                <th className="px-4 py-3 font-medium text-primary">Start Date</th>
                <th className="px-4 py-3 font-medium text-primary">End Date</th>
                <th className="px-4 py-3 font-medium text-primary">Prize</th>
                <th className="px-4 py-3 text-right font-medium text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c, i) => {
                const ended = isEnded(c);
                return (
                  <tr
                    key={c.id}
                    onClick={() => openQuestions(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openQuestions(c);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label={`Manage questions for ${c.title}`}
                    className={`cursor-pointer border-t border-border transition-colors hover:bg-primary/5 focus:outline-none focus-visible:bg-primary/10 ${
                      i % 2 === 1 ? "bg-card/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{c.title}</span>
                      {c.description && (
                        <span className="mt-0.5 block max-w-md truncate text-xs text-muted-foreground">
                          {c.description}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${
                          ended
                            ? "border-border text-muted-foreground"
                            : "border-primary/50 bg-primary/10 text-primary"
                        }`}
                      >
                        {ended ? "Ended" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.start_date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.end_date)}</td>
                    <td className="px-4 py-3">
                      <span className="block max-w-[220px] truncate text-muted-foreground">
                        {c.prize_description || "—"}
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
                          onClick={() => setEditing(c)}
                          className="text-sm text-muted-foreground transition-colors hover:text-primary"
                        >
                          Edit
                        </button>
                        <ConfirmDeleteButton
                          itemLabel={`"${c.title}"`}
                          onConfirm={() => handleDelete(c)}
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

      {editing && (
        <ChallengeDialog
          challenge={editing === "new" ? null : editing}
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

function ChallengeDialog({
  challenge,
  onClose,
  onSaved,
}: {
  challenge: Challenge | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: challenge?.title ?? "",
    description: challenge?.description ?? "",
    start_date: toLocalInput(challenge?.start_date ?? null),
    end_date: toLocalInput(challenge?.end_date ?? null),
    prize_description: challenge?.prize_description ?? "",
    is_active: challenge?.is_active ?? false,
  });
  const [imageFile, setImageFile] = useState<File | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    const start = fromLocalInput(form.start_date);
    const end = fromLocalInput(form.end_date);
    if (start && end && new Date(end) < new Date(start)) {
      toast.error("End date must be after the start date.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = challenge?.image_url ?? null;
      if (imageFile instanceof File) {
        imageUrl = await uploadMedia(imageFile, "challenges");
      } else if (imageFile === null) {
        imageUrl = null;
      }

      const payload = {
        image_url: imageUrl,
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_date: start,
        end_date: end,
        prize_description: form.prize_description.trim() || null,
        is_active: form.is_active,
      };

      const { error } = challenge
        ? await supabase.from("challenges").update(payload).eq("id", challenge.id)
        : await supabase.from("challenges").insert(payload);
      if (error) throw error;

      toast.success(challenge ? "Challenge updated." : "Challenge created.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-primary">
            {challenge ? "Edit Challenge" : "New Challenge"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Title" required>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              className={inputClass}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              className={`${inputClass} resize-y`}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Start date">
              <input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="End date">
              <input
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Prize description">
            <textarea
              value={form.prize_description}
              onChange={(e) => setForm((f) => ({ ...f, prize_description: e.target.value }))}
              rows={3}
              className={`${inputClass} resize-y`}
            />
          </Field>

          <FileUploadField
            label="Preview thumbnail"
            accept="image/*"
            currentUrl={challenge?.image_url}
            onFileChange={setImageFile}
          />

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="mt-1 h-4 w-4 accent-[color:var(--brand-gold)]"
            />
            <span>
              <span className="block text-sm text-foreground">Active</span>
              <span className="block text-xs text-muted-foreground">
                Inactive challenges, and any whose end date has passed, show as Ended.
              </span>
            </span>
          </label>

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
  required,
  children,
}: {
  label: string;
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
    </div>
  );
}
