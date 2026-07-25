import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/testimonials")({
  ssr: false,
  head: () => ({ meta: [{ title: "Testimonials — Admin" }] }),
  component: AdminTestimonialsPage,
});

type Testimonial = Tables<"testimonials">;
const queryKey = ["admin", "testimonials"];
const inputClass =
  "w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary";

function AdminTestimonialsPage() {
  return (
    <AdminShell title="Testimonials">
      <TestimonialsManager />
    </AdminShell>
  );
}

function TestimonialsManager() {
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [editing, setEditing] = useState<Testimonial | "new" | null>(null);

  async function handleDelete(item: Testimonial) {
    const { error } = await supabase.from("testimonials").delete().eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Testimonial from "${item.reviewer_name}" deleted.`);
    queryClient.invalidateQueries({ queryKey });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
        >
          + Add testimonial
        </button>
      </div>

      {!items || items.length === 0 ? (
        <p className="text-muted-foreground">No testimonials yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="border border-border bg-card p-4">
              <blockquote className="font-serif italic text-foreground/85">
                “{item.quote_text}”
              </blockquote>
              <div className="mt-3 flex items-center justify-between">
                <p className="eyebrow">
                  — {item.reviewer_name}
                  {item.rating != null && <span className="ml-2">{"★".repeat(item.rating)}</span>}
                </p>
                <div className="flex shrink-0 items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className="text-sm text-primary hover:text-[color:var(--brand-gold-bright)]"
                  >
                    Edit
                  </button>
                  <ConfirmDeleteButton
                    itemLabel={`this testimonial`}
                    onConfirm={() => handleDelete(item)}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <TestimonialFormDialog
          item={editing === "new" ? null : editing}
          nextDisplayOrder={items?.length ?? 0}
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

function TestimonialFormDialog({
  item,
  nextDisplayOrder,
  onClose,
  onSaved,
}: {
  item: Testimonial | null;
  nextDisplayOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    reviewer_name: item?.reviewer_name ?? "",
    quote_text: item?.quote_text ?? "",
    rating: item?.rating != null ? String(item.rating) : "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.reviewer_name.trim() || !form.quote_text.trim()) {
      toast.error("Reviewer name and quote are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        reviewer_name: form.reviewer_name.trim(),
        quote_text: form.quote_text.trim(),
        rating: form.rating ? Number(form.rating) : null,
      };

      const { error } = item
        ? await supabase.from("testimonials").update(payload).eq("id", item.id)
        : await supabase
            .from("testimonials")
            .insert({ ...payload, display_order: nextDisplayOrder });

      if (error) throw error;
      toast.success(item ? "Testimonial updated." : "Testimonial created.");
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
          <DialogTitle>{item ? "Edit testimonial" : "Add testimonial"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Reviewer name" required>
            <input
              value={form.reviewer_name}
              onChange={(e) => setForm((f) => ({ ...f, reviewer_name: e.target.value }))}
              required
              className={inputClass}
            />
          </FormField>

          <FormField label="Quote" required>
            <textarea
              value={form.quote_text}
              onChange={(e) => setForm((f) => ({ ...f, quote_text: e.target.value }))}
              rows={4}
              required
              className={`${inputClass} resize-y`}
            />
          </FormField>

          <FormField label="Rating (1–5)" hint="Optional — leave blank to hide stars.">
            <select
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
              className={inputClass}
            >
              <option value="">No rating</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
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
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
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
