import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { SortableList } from "@/components/admin/sortable-list";
import { FileUploadField } from "@/components/admin/file-upload-field";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteMedia, uploadMedia } from "@/lib/media-upload";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/characters")({
  ssr: false,
  head: () => ({ meta: [{ title: "Characters — Admin" }] }),
  component: AdminCharactersPage,
});

type Book = Tables<"books">;
type Character = Tables<"characters">;
const inputClass =
  "w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary";

function AdminCharactersPage() {
  return (
    <AdminShell title="Characters">
      <CharactersManager />
    </AdminShell>
  );
}

function CharactersManager() {
  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ["admin", "books-for-characters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [bookId, setBookId] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId && books && books.length > 0) setBookId(books[0].id);
  }, [books, bookId]);

  if (booksLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  if (!books || books.length === 0) {
    return <p className="text-muted-foreground">Add a book first — characters belong to a book.</p>;
  }

  return (
    <div>
      <div className="mb-8">
        <label className="mb-1 block text-sm text-muted-foreground" htmlFor="book-select">
          Book
        </label>
        <select
          id="book-select"
          value={bookId ?? ""}
          onChange={(e) => setBookId(e.target.value)}
          className={`${inputClass} max-w-sm`}
        >
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
      </div>
      {bookId && <CharacterList bookId={bookId} />}
    </div>
  );
}

function CharacterList({ bookId }: { bookId: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["admin", "characters", bookId];
  const { data: characters, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("book_id", bookId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [editing, setEditing] = useState<Character | "new" | null>(null);

  async function persistOrder(next: Character[]) {
    queryClient.setQueryData(queryKey, next);
    try {
      await Promise.all(
        next.map((c, i) => supabase.from("characters").update({ display_order: i }).eq("id", c.id)),
      );
    } catch {
      toast.error("Failed to save new order.");
      queryClient.invalidateQueries({ queryKey });
    }
  }

  async function handleDelete(character: Character) {
    const { error } = await supabase.from("characters").delete().eq("id", character.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    // The row is gone; drop its uploaded files so the bucket doesn't grow orphans.
    await deleteMedia(character.image_url);
    toast.success(`"${character.name}" deleted.`);
    queryClient.invalidateQueries({ queryKey });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Drag to reorder.</p>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="shrink-0 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
        >
          + Add character
        </button>
      </div>

      {!characters || characters.length === 0 ? (
        <p className="text-muted-foreground">No characters for this book yet.</p>
      ) : (
        <SortableList
          items={characters}
          onReorder={persistOrder}
          renderItem={(c) => (
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                {c.image_url ? (
                  <img src={c.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-serif text-primary">
                    {c.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-lg text-primary">{c.name}</p>
                {c.role && <p className="text-sm text-muted-foreground">{c.role}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  className="text-sm text-primary hover:text-[color:var(--brand-gold-bright)]"
                >
                  Edit
                </button>
                <ConfirmDeleteButton itemLabel={c.name} onConfirm={() => handleDelete(c)} />
              </div>
            </div>
          )}
        />
      )}

      {editing && (
        <CharacterFormDialog
          character={editing === "new" ? null : editing}
          bookId={bookId}
          nextDisplayOrder={characters?.length ?? 0}
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

function CharacterFormDialog({
  character,
  bookId,
  nextDisplayOrder,
  onClose,
  onSaved,
}: {
  character: Character | null;
  bookId: string;
  nextDisplayOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: character?.name ?? "",
    role: character?.role ?? "",
    background: character?.background ?? "",
    quote: character?.quote ?? "",
  });
  const [imageFile, setImageFile] = useState<File | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    try {
      let imageUrl = character?.image_url ?? null;
      if (imageFile instanceof File) {
        imageUrl = await uploadMedia(imageFile, "characters");
      } else if (imageFile === null) {
        imageUrl = null;
      }

      const payload = {
        name: form.name.trim(),
        role: form.role.trim() || null,
        background: form.background.trim() || null,
        quote: form.quote.trim() || null,
        image_url: imageUrl,
      };

      const { error } = character
        ? await supabase.from("characters").update(payload).eq("id", character.id)
        : await supabase
            .from("characters")
            .insert({ ...payload, book_id: bookId, display_order: nextDisplayOrder });

      if (error) throw error;
      toast.success(character ? "Character updated." : "Character created.");
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
          <DialogTitle>{character ? "Edit character" : "Add character"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FileUploadField
            label="Character image"
            accept="image/*"
            currentUrl={character?.image_url}
            onFileChange={setImageFile}
          />

          <FormField label="Name" required>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className={inputClass}
            />
          </FormField>

          <FormField label="Role">
            <input
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className={inputClass}
            />
          </FormField>

          <FormField label="Background">
            <textarea
              value={form.background}
              onChange={(e) => setForm((f) => ({ ...f, background: e.target.value }))}
              rows={4}
              className={`${inputClass} resize-y`}
            />
          </FormField>

          <FormField label="Quote">
            <textarea
              value={form.quote}
              onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
              rows={2}
              className={`${inputClass} resize-y`}
            />
          </FormField>

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
