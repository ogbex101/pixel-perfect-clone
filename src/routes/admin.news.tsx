import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/admin/news")({
  ssr: false,
  head: () => ({ meta: [{ title: "News — Admin" }] }),
  component: AdminNewsPage,
});

type Post = Tables<"news_posts">;

const queryKey = ["admin", "news_posts"];
const inputClass =
  "w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary";

const CATEGORIES = ["news", "challenge", "lore", "author"] as const;

/** Category tints. News rides the brand gold; the rest are muted so no badge
 *  ever out-shouts the gold accent used everywhere else in the admin. */
const CATEGORY_CLASS: Record<string, string> = {
  news: "border-primary/50 bg-primary/10 text-primary",
  challenge:
    "border-[color:var(--brand-rust)]/60 bg-[color:var(--brand-rust)]/15 text-[color:var(--brand-rust)]",
  lore: "border-[oklch(0.62_0.13_305)]/60 bg-[oklch(0.62_0.13_305)]/15 text-[oklch(0.74_0.11_305)]",
  author:
    "border-[oklch(0.62_0.10_245)]/60 bg-[oklch(0.62_0.10_245)]/15 text-[oklch(0.74_0.09_245)]",
};

/**
 * There is no status column — `published_at` carries it, and the public news
 * page shows only posts whose published_at is set and not in the future. These
 * three states mirror that exactly, so the badge tells the truth about what
 * readers can actually see.
 */
function statusOf(post: Post): { label: string; className: string } {
  if (!post.published_at) {
    return { label: "Draft", className: "border-border text-muted-foreground" };
  }
  const when = new Date(post.published_at).getTime();
  if (Number.isNaN(when)) {
    return { label: "Draft", className: "border-border text-muted-foreground" };
  }
  if (when > Date.now()) {
    return {
      label: "Scheduled",
      className: "border-primary/50 bg-primary/10 text-primary",
    };
  }
  return {
    label: "Published",
    className:
      "border-[oklch(0.65_0.14_150)]/60 bg-[oklch(0.65_0.14_150)]/15 text-[oklch(0.76_0.13_150)]",
  };
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

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

function AdminNewsPage() {
  return (
    <AdminShell title="News Management">
      <NewsManager />
    </AdminShell>
  );
}

function NewsManager() {
  const queryClient = useQueryClient();
  const { data: posts, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .order("published_at", { ascending: false, nullsFirst: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [editing, setEditing] = useState<Post | "new" | null>(null);

  async function handleDelete(post: Post) {
    const { error } = await supabase.from("news_posts").delete().eq("id", post.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`"${post.title}" deleted.`);
    queryClient.invalidateQueries({ queryKey });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Drafts and scheduled posts stay off the public news page until their date passes.
        </p>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
        >
          Create New Post
        </button>
      </div>

      {!posts || posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No news posts yet.</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-secondary/50 text-left">
                <th className="px-4 py-3 font-medium text-primary">Title</th>
                <th className="px-4 py-3 font-medium text-primary">Category</th>
                <th className="px-4 py-3 font-medium text-primary">Published</th>
                <th className="px-4 py-3 font-medium text-primary">Status</th>
                <th className="px-4 py-3 text-right font-medium text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, i) => {
                const status = statusOf(post);
                const category = post.category ?? "news";
                return (
                  <tr
                    key={post.id}
                    className={`border-t border-border ${i % 2 === 1 ? "bg-card/40" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{post.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs capitalize ${
                          CATEGORY_CLASS[category] ?? CATEGORY_CLASS.news
                        }`}
                      >
                        {category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(post.published_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => setEditing(post)}
                          className="text-sm text-muted-foreground transition-colors hover:text-primary"
                        >
                          Edit
                        </button>
                        <ConfirmDeleteButton
                          itemLabel={`"${post.title}"`}
                          onConfirm={() => handleDelete(post)}
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
        <PostDialog
          post={editing === "new" ? null : editing}
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

function PostDialog({
  post,
  onClose,
  onSaved,
}: {
  post: Post | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: post?.title ?? "",
    content: post?.content ?? "",
    category: post?.category ?? "news",
    published_at: toLocalInput(post?.published_at ?? null),
    published: Boolean(post?.published_at),
  });
  const [imageFile, setImageFile] = useState<File | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!form.content.trim()) {
      toast.error("Content is required.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = post?.image_url ?? null;
      if (imageFile instanceof File) {
        imageUrl = await uploadMedia(imageFile, "news");
      } else if (imageFile === null) {
        imageUrl = null;
      }

      // Published with no date means "publish now". Unpublished clears the date,
      // which is what makes it a draft.
      const publishedAt = form.published
        ? (fromLocalInput(form.published_at) ?? new Date().toISOString())
        : null;

      const payload = {
        title: form.title.trim(),
        content: form.content,
        category: form.category,
        published_at: publishedAt,
        image_url: imageUrl,
      };

      const { error } = post
        ? await supabase.from("news_posts").update(payload).eq("id", post.id)
        : await supabase.from("news_posts").insert(payload);
      if (error) throw error;

      toast.success(post ? "Post updated." : "Post created.");
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
            {post ? "Edit Post" : "New Post"}
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

          <Field label="Content" required hint="Line breaks are preserved exactly as typed.">
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={12}
              required
              className={`${inputClass} resize-y whitespace-pre-wrap font-mono text-sm`}
            />
          </Field>

          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className={`${inputClass} capitalize`}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <FileUploadField
            label="Post image"
            accept="image/*"
            currentUrl={post?.image_url}
            onFileChange={setImageFile}
          />

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="mt-1 h-4 w-4 accent-[color:var(--brand-gold)]"
            />
            <span>
              <span className="block text-sm text-foreground">Published</span>
              <span className="block text-xs text-muted-foreground">
                Off keeps this a draft. On with a future date schedules it.
              </span>
            </span>
          </label>

          {form.published && (
            <Field label="Publish date" hint="Leave blank to publish immediately.">
              <input
                type="datetime-local"
                value={form.published_at}
                onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
                className={inputClass}
              />
            </Field>
          )}

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
