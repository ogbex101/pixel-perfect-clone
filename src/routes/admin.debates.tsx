import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Pin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { FileUploadField } from "@/components/admin/file-upload-field";
import { deleteMedia, uploadMedia } from "@/lib/media-upload";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/debates")({
  ssr: false,
  head: () => ({ meta: [{ title: "Debates — Admin" }] }),
  component: AdminDebatesPage,
});

type Topic = Tables<"debate_topics">;
type Comment = Tables<"debate_comments">;

const queryKey = ["admin", "debate_topics"];
const inputClass =
  "w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function AdminDebatesPage() {
  return (
    <AdminShell title="Debate Management">
      <DebatesManager />
    </AdminShell>
  );
}

function DebatesManager() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const [topics, comments] = await Promise.all([
        supabase
          .from("debate_topics")
          .select("*")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false }),
        // Counts include hidden comments — moderators need the real total.
        supabase.from("debate_comments").select("topic_id, is_hidden"),
      ]);
      if (topics.error) throw topics.error;
      if (comments.error) throw comments.error;

      const counts = new Map<string, { total: number; hidden: number }>();
      for (const c of comments.data ?? []) {
        if (!c.topic_id) continue;
        const entry = counts.get(c.topic_id) ?? { total: 0, hidden: 0 };
        entry.total += 1;
        if (c.is_hidden) entry.hidden += 1;
        counts.set(c.topic_id, entry);
      }
      return { topics: topics.data ?? [], counts };
    },
  });

  const [editing, setEditing] = useState<Topic | "new" | null>(null);
  const [moderating, setModerating] = useState<Topic | null>(null);

  async function togglePinned(t: Topic) {
    const next = !t.is_pinned;
    const { error } = await supabase
      .from("debate_topics")
      .update({ is_pinned: next })
      .eq("id", t.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`"${t.title}" ${next ? "pinned" : "unpinned"}.`);
    queryClient.invalidateQueries({ queryKey });
  }

  async function handleDelete(t: Topic) {
    const { error } = await supabase.from("debate_topics").delete().eq("id", t.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    // The row is gone; drop its uploaded files so the bucket doesn't grow orphans.
    await deleteMedia(t.image_url);
    toast.success(`"${t.title}" deleted.`);
    queryClient.invalidateQueries({ queryKey });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const topics = data?.topics ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Select a topic to moderate its comments.</p>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
        >
          Create New Debate
        </button>
      </div>

      {topics.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No debate topics yet. Create the first one to open the floor.
        </p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-secondary/50 text-left">
                <th className="px-4 py-3 font-medium text-primary">Title</th>
                <th className="px-4 py-3 font-medium text-primary">Pinned</th>
                <th className="px-4 py-3 font-medium text-primary">Comments</th>
                <th className="px-4 py-3 font-medium text-primary">Created</th>
                <th className="px-4 py-3 text-right font-medium text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t, i) => {
                const count = data?.counts.get(t.id) ?? { total: 0, hidden: 0 };
                return (
                  <tr
                    key={t.id}
                    onClick={() => setModerating(t)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setModerating(t);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Moderate comments on ${t.title}`}
                    className={`cursor-pointer border-t border-border transition-colors hover:bg-primary/5 focus:outline-none focus-visible:bg-primary/10 ${
                      i % 2 === 1 ? "bg-card/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        {t.is_pinned && (
                          <Pin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                        )}
                        {t.title}
                      </span>
                      {t.description && (
                        <span className="mt-0.5 block max-w-md truncate text-xs text-muted-foreground">
                          {t.description}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {t.is_pinned ? (
                        <span className="inline-block rounded-full border border-primary/50 bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                          Pinned
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full border border-border px-2.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                        {count.total}
                        {count.hidden > 0 && ` · ${count.hidden} hidden`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(t.created_at)}</td>
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => togglePinned(t)}
                          className="text-sm text-muted-foreground transition-colors hover:text-primary"
                        >
                          {t.is_pinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(t)}
                          className="text-sm text-muted-foreground transition-colors hover:text-primary"
                        >
                          Edit
                        </button>
                        <ConfirmDeleteButton
                          itemLabel={`"${t.title}"`}
                          onConfirm={() => handleDelete(t)}
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
        <TopicDialog
          topic={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            queryClient.invalidateQueries({ queryKey });
          }}
        />
      )}

      {moderating && (
        <ModerationDialog
          topic={moderating}
          onClose={() => setModerating(null)}
          onChanged={() => queryClient.invalidateQueries({ queryKey })}
        />
      )}
    </div>
  );
}

function TopicDialog({
  topic,
  onClose,
  onSaved,
}: {
  topic: Topic | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: topic?.title ?? "",
    description: topic?.description ?? "",
    is_pinned: topic?.is_pinned ?? false,
  });
  const [imageFile, setImageFile] = useState<File | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setSaving(true);
    try {
      let imageUrl = topic?.image_url ?? null;
      if (imageFile instanceof File) {
        imageUrl = await uploadMedia(imageFile, "debates");
      } else if (imageFile === null) {
        imageUrl = null;
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        is_pinned: form.is_pinned,
        image_url: imageUrl,
      };

      const { error } = topic
        ? await supabase.from("debate_topics").update(payload).eq("id", topic.id)
        : await supabase.from("debate_topics").insert(payload);
      if (error) throw error;

      toast.success(topic ? "Topic updated." : "Topic created.");
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
            {topic ? "Edit Debate" : "New Debate"}
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

          <FileUploadField
            label="Topic image"
            accept="image/*"
            currentUrl={topic?.image_url}
            onFileChange={setImageFile}
          />

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.is_pinned}
              onChange={(e) => setForm((f) => ({ ...f, is_pinned: e.target.checked }))}
              className="mt-1 h-4 w-4 accent-[color:var(--brand-gold)]"
            />
            <span>
              <span className="block text-sm text-foreground">Pinned</span>
              <span className="block text-xs text-muted-foreground">
                Pinned topics sit at the top of the debate list.
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

function ModerationDialog({
  topic,
  onClose,
  onChanged,
}: {
  topic: Topic;
  onClose: () => void;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const commentsKey = ["admin", "debate_topics", topic.id, "comments"];

  const { data, isLoading } = useQuery({
    queryKey: commentsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("debate_comments")
        .select("*, members(full_name)")
        .eq("topic_id", topic.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const comments = data ?? [];
  const roots = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: commentsKey });
    onChanged();
  }

  async function toggleHidden(c: Comment) {
    // Write an explicit boolean — the public page filters on is_hidden = false,
    // so a null would keep the comment off the site.
    const next = !c.is_hidden;
    const { error } = await supabase
      .from("debate_comments")
      .update({ is_hidden: next })
      .eq("id", c.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? "Comment hidden." : "Comment restored.");
    refresh();
  }

  async function deleteComment(c: Comment) {
    const { error } = await supabase.from("debate_comments").delete().eq("id", c.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Comment deleted.");
    refresh();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-primary">{topic.title}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Hidden comments stay in the database but disappear from the public page.
        </p>

        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading comments…</p>
        ) : roots.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No comments on this topic yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {roots.map((c) => (
              <li key={c.id}>
                <CommentRow comment={c} onToggleHidden={toggleHidden} onDelete={deleteComment} />
                {repliesOf(c.id).length > 0 && (
                  <ul className="mt-3 space-y-3 border-l border-border pl-4">
                    {repliesOf(c.id).map((r) => (
                      <li key={r.id}>
                        <CommentRow
                          comment={r}
                          onToggleHidden={toggleHidden}
                          onDelete={deleteComment}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CommentRow({
  comment,
  onToggleHidden,
  onDelete,
}: {
  comment: Comment & { members?: { full_name: string } | null };
  onToggleHidden: (c: Comment) => void;
  onDelete: (c: Comment) => void;
}) {
  const hidden = Boolean(comment.is_hidden);
  return (
    <div className={`border border-border bg-card p-4 ${hidden ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          <span className="font-medium text-foreground">
            {comment.members?.full_name ?? "Unknown member"}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {formatDate(comment.created_at)}
          </span>
          {hidden && (
            <span className="ml-2 rounded-full border border-destructive/50 bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
              Hidden
            </span>
          )}
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onToggleHidden(comment)}
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {hidden ? "Unhide" : "Hide"}
          </button>
          <ConfirmDeleteButton itemLabel="this comment" onConfirm={() => onDelete(comment)} />
        </div>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/85">{comment.content}</p>
    </div>
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
