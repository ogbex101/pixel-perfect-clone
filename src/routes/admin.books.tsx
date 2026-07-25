import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { SortableList } from "@/components/admin/sortable-list";
import { FileUploadField } from "@/components/admin/file-upload-field";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { uploadMedia } from "@/lib/media-upload";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/books")({
  ssr: false,
  head: () => ({ meta: [{ title: "Books — Admin" }] }),
  component: AdminBooksPage,
});

type Book = Tables<"books">;
const booksQueryKey = ["admin", "books"];
const inputClass =
  "w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary";

function AdminBooksPage() {
  return (
    <AdminShell title="Books">
      <BooksManager />
    </AdminShell>
  );
}

function BooksManager() {
  const queryClient = useQueryClient();
  const { data: books, isLoading } = useQuery({
    queryKey: booksQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [editing, setEditing] = useState<Book | "new" | null>(null);

  async function persistOrder(next: Book[]) {
    queryClient.setQueryData(booksQueryKey, next);
    try {
      await Promise.all(
        next.map((b, i) => supabase.from("books").update({ display_order: i }).eq("id", b.id)),
      );
    } catch {
      toast.error("Failed to save new order.");
      queryClient.invalidateQueries({ queryKey: booksQueryKey });
    }
  }

  async function handleDelete(book: Book) {
    const { error } = await supabase.from("books").delete().eq("id", book.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`"${book.title}" deleted.`);
    queryClient.invalidateQueries({ queryKey: booksQueryKey });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Drag to reorder. Only one book can be featured at a time.
        </p>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="shrink-0 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
        >
          + Add book
        </button>
      </div>

      {!books || books.length === 0 ? (
        <p className="text-muted-foreground">No books yet.</p>
      ) : (
        <SortableList
          items={books}
          onReorder={persistOrder}
          renderItem={(book) => (
            <div className="flex items-center gap-4">
              <div className="h-16 w-12 shrink-0 overflow-hidden border border-border bg-muted">
                {book.cover_image_url && (
                  <img src={book.cover_image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-serif text-lg text-primary">{book.title}</p>
                  {book.is_featured && (
                    <span className="eyebrow border border-primary px-1.5 py-0.5 text-[10px]">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{book.status.replace("_", " ")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <button
                  type="button"
                  onClick={() => setEditing(book)}
                  className="text-sm text-primary hover:text-[color:var(--brand-gold-bright)]"
                >
                  Edit
                </button>
                <ConfirmDeleteButton itemLabel={book.title} onConfirm={() => handleDelete(book)} />
              </div>
            </div>
          )}
        />
      )}

      {editing && (
        <BookFormDialog
          book={editing === "new" ? null : editing}
          nextDisplayOrder={books?.length ?? 0}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: booksQueryKey });
          }}
        />
      )}
    </div>
  );
}

function BookFormDialog({
  book,
  nextDisplayOrder,
  onClose,
  onSaved,
}: {
  book: Book | null;
  nextDisplayOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: book?.title ?? "",
    genre: book?.genre ?? "",
    short_description: book?.short_description ?? "",
    full_description: book?.full_description ?? "",
    status: book?.status ?? "in_progress",
    purchase_link: book?.purchase_link ?? "",
    video_url: book?.video_url ?? "",
    is_featured: book?.is_featured ?? false,
  });
  const [coverFile, setCoverFile] = useState<File | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setSaving(true);
    try {
      let coverUrl = book?.cover_image_url ?? null;
      if (coverFile instanceof File) {
        coverUrl = await uploadMedia(coverFile, "books");
      } else if (coverFile === null) {
        coverUrl = null;
      }

      if (form.is_featured) {
        const unsetBuilder = supabase
          .from("books")
          .update({ is_featured: false })
          .eq("is_featured", true);
        const { error: unsetError } = book
          ? await unsetBuilder.neq("id", book.id)
          : await unsetBuilder;
        if (unsetError) throw unsetError;
      }

      const payload = {
        title: form.title.trim(),
        genre: form.genre.trim() || null,
        short_description: form.short_description.trim() || null,
        full_description: form.full_description.trim() || null,
        status: form.status,
        purchase_link: form.purchase_link.trim() || null,
        video_url: form.video_url.trim() || null,
        is_featured: form.is_featured,
        cover_image_url: coverUrl,
      };

      const { error } = book
        ? await supabase.from("books").update(payload).eq("id", book.id)
        : await supabase.from("books").insert({ ...payload, display_order: nextDisplayOrder });

      if (error) throw error;
      toast.success(book ? "Book updated." : "Book created.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{book ? "Edit book" : "Add book"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FileUploadField
            label="Cover image"
            accept="image/*"
            currentUrl={book?.cover_image_url}
            onFileChange={setCoverFile}
          />

          <FormField label="Title" required>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              className={inputClass}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Genre">
              <input
                value={form.genre}
                onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
                className={inputClass}
              />
            </FormField>
            <FormField label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className={inputClass}
              >
                <option value="published">Published</option>
                <option value="in_progress">In Progress</option>
              </select>
            </FormField>
          </div>

          <FormField label="Short description">
            <textarea
              value={form.short_description}
              onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
              rows={2}
              className={`${inputClass} resize-y`}
            />
          </FormField>

          <FormField label="Full description">
            <textarea
              value={form.full_description}
              onChange={(e) => setForm((f) => ({ ...f, full_description: e.target.value }))}
              rows={5}
              className={`${inputClass} resize-y`}
            />
          </FormField>

          <FormField label="Purchase link">
            <input
              value={form.purchase_link}
              onChange={(e) => setForm((f) => ({ ...f, purchase_link: e.target.value }))}
              className={inputClass}
            />
          </FormField>

          <FormField label="Trailer / video URL">
            <input
              value={form.video_url}
              onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
              className={inputClass}
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
              className="h-4 w-4"
            />
            Featured book (only one can be featured at a time)
          </label>

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="border border-border px-4 py-2 text-sm transition-colors hover:border-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
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
