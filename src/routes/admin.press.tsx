import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/admin-shell";
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

export const Route = createFileRoute("/admin/press")({
  ssr: false,
  head: () => ({ meta: [{ title: "Press — Admin" }] }),
  component: AdminPressPage,
});

type PressMention = Tables<"press_mentions">;
const queryKey = ["admin", "press_mentions"];
const inputClass =
  "w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary";

function AdminPressPage() {
  return (
    <AdminShell title="Press Mentions">
      <PressManager />
    </AdminShell>
  );
}

function PressManager() {
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("press_mentions")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [editing, setEditing] = useState<PressMention | "new" | null>(null);

  async function handleDelete(item: PressMention) {
    const { error } = await supabase.from("press_mentions").delete().eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`"${item.source_name}" deleted.`);
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
          + Add press mention
        </button>
      </div>

      {!items || items.length === 0 ? (
        <p className="text-muted-foreground">No press mentions yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 border border-border bg-card p-3">
              <div className="flex h-12 w-24 shrink-0 items-center justify-center overflow-hidden border border-border bg-muted">
                {item.logo_url ? (
                  <img
                    src={item.logo_url}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">No logo</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-lg text-primary">{item.source_name}</p>
                {item.headline && (
                  <p className="truncate text-sm italic text-muted-foreground">{item.headline}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className="text-sm text-primary hover:text-[color:var(--brand-gold-bright)]"
                >
                  Edit
                </button>
                <ConfirmDeleteButton
                  itemLabel={item.source_name}
                  onConfirm={() => handleDelete(item)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <PressFormDialog
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

function PressFormDialog({
  item,
  nextDisplayOrder,
  onClose,
  onSaved,
}: {
  item: PressMention | null;
  nextDisplayOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    source_name: item?.source_name ?? "",
    headline: item?.headline ?? "",
    link: item?.link ?? "",
  });
  const [logoFile, setLogoFile] = useState<File | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.source_name.trim()) {
      toast.error("Source name is required.");
      return;
    }
    setSaving(true);
    try {
      let logoUrl = item?.logo_url ?? null;
      if (logoFile instanceof File) {
        logoUrl = await uploadMedia(logoFile, "press");
      } else if (logoFile === null) {
        logoUrl = null;
      }

      const payload = {
        source_name: form.source_name.trim(),
        headline: form.headline.trim() || null,
        link: form.link.trim() || null,
        logo_url: logoUrl,
      };

      const { error } = item
        ? await supabase.from("press_mentions").update(payload).eq("id", item.id)
        : await supabase
            .from("press_mentions")
            .insert({ ...payload, display_order: nextDisplayOrder });

      if (error) throw error;
      toast.success(item ? "Press mention updated." : "Press mention created.");
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
          <DialogTitle>{item ? "Edit press mention" : "Add press mention"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FileUploadField
            label="Logo"
            accept="image/*"
            currentUrl={item?.logo_url}
            onFileChange={setLogoFile}
          />

          <FormField label="Source name" required>
            <input
              value={form.source_name}
              onChange={(e) => setForm((f) => ({ ...f, source_name: e.target.value }))}
              required
              className={inputClass}
            />
          </FormField>

          <FormField label="Headline">
            <input
              value={form.headline}
              onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              className={inputClass}
            />
          </FormField>

          <FormField label="Link">
            <input
              value={form.link}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
              className={inputClass}
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
