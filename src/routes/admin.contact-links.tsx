import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { resolveContactIcon } from "@/components/contact-icon";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/contact-links")({
  ssr: false,
  head: () => ({ meta: [{ title: "Contact Links — Admin" }] }),
  component: AdminContactLinksPage,
});

type ContactLink = Tables<"contact_links">;
const queryKey = ["admin", "contact_links"];
const inputClass =
  "w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary";
const ICON_HINT =
  "Recognized: mail, phone, twitter, instagram, facebook, linkedin, youtube, github, tiktok, threads, bluesky, mastodon, website, amazon, goodreads. Anything else falls back to a generic link icon.";

function AdminContactLinksPage() {
  return (
    <AdminShell title="Contact Links">
      <ContactLinksManager />
    </AdminShell>
  );
}

function ContactLinksManager() {
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_links")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [editing, setEditing] = useState<ContactLink | "new" | null>(null);

  async function handleDelete(item: ContactLink) {
    const { error } = await supabase.from("contact_links").delete().eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`"${item.platform_name}" deleted.`);
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
          + Add contact link
        </button>
      </div>

      {!items || items.length === 0 ? (
        <p className="text-muted-foreground">No contact links yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const Icon = resolveContactIcon(item.icon);
            return (
              <li
                key={item.id}
                className="flex items-center gap-4 border border-border bg-card p-3"
              >
                <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{item.platform_name}</p>
                  <p className="truncate text-sm text-muted-foreground">{item.url}</p>
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
                    itemLabel={item.platform_name}
                    onConfirm={() => handleDelete(item)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <ContactLinkFormDialog
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

function ContactLinkFormDialog({
  item,
  nextDisplayOrder,
  onClose,
  onSaved,
}: {
  item: ContactLink | null;
  nextDisplayOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    platform_name: item?.platform_name ?? "",
    url: item?.url ?? "",
    icon: item?.icon ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.platform_name.trim() || !form.url.trim()) {
      toast.error("Platform name and URL are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        platform_name: form.platform_name.trim(),
        url: form.url.trim(),
        icon: form.icon.trim() || null,
      };

      const { error } = item
        ? await supabase.from("contact_links").update(payload).eq("id", item.id)
        : await supabase
            .from("contact_links")
            .insert({ ...payload, display_order: nextDisplayOrder });

      if (error) throw error;
      toast.success(item ? "Contact link updated." : "Contact link created.");
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
          <DialogTitle>{item ? "Edit contact link" : "Add contact link"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Platform name" required>
            <input
              value={form.platform_name}
              onChange={(e) => setForm((f) => ({ ...f, platform_name: e.target.value }))}
              required
              className={inputClass}
            />
          </FormField>

          <FormField label="URL" required>
            <input
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              required
              className={inputClass}
            />
          </FormField>

          <FormField label="Icon" hint={ICON_HINT}>
            <input
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
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
