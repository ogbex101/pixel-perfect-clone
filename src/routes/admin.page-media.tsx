import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { SortableList } from "@/components/admin/sortable-list";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { FileUploadField } from "@/components/admin/file-upload-field";
import { uploadMedia } from "@/lib/media-upload";
import { PAGE_KEYS, type PageMedia } from "@/lib/page-media";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/page-media")({
  ssr: false,
  head: () => ({ meta: [{ title: "Page Media — Admin" }] }),
  component: AdminPageMediaPage,
});

const inputClass =
  "w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary";

function AdminPageMediaPage() {
  return (
    <AdminShell title="Page Media">
      <PageMediaManager />
    </AdminShell>
  );
}

function PageMediaManager() {
  const queryClient = useQueryClient();
  const [pageKey, setPageKey] = useState<string>("home");
  const queryKey = ["admin", "page_media", pageKey];

  const { data: items, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_media")
        .select("*")
        .eq("page_key", pageKey)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [editing, setEditing] = useState<PageMedia | "new" | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ["page_media", pageKey] });
  }

  async function persistOrder(next: PageMedia[]) {
    queryClient.setQueryData(queryKey, next);
    try {
      const results = await Promise.all(
        next.map((m, i) =>
          supabase.from("page_media").update({ display_order: i }).eq("id", m.id),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
      toast.success("Order saved.");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save order.");
      queryClient.invalidateQueries({ queryKey });
    }
  }

  async function toggleVisible(item: PageMedia) {
    const { error } = await supabase
      .from("page_media")
      .update({ is_visible: !item.is_visible })
      .eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate();
  }

  async function handleDelete(item: PageMedia) {
    const { error } = await supabase.from("page_media").delete().eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Slide deleted.");
    invalidate();
  }

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Every page shows a cinematic slideshow. Add images or videos here to control exactly what a
        page shows — when a page has no media of its own, it automatically uses your books, covers,
        press logos, and videos instead.
      </p>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {PAGE_KEYS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPageKey(p.key)}
              aria-pressed={pageKey === p.key}
              className={`border px-4 py-2 text-sm transition-colors ${
                pageKey === p.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
        >
          + Add slide
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !items || items.length === 0 ? (
        <p className="text-muted-foreground">
          No media for this page yet — it currently falls back to your existing content.
        </p>
      ) : (
        <SortableList
          items={items}
          onReorder={persistOrder}
          renderItem={(item) => (
            <div className="flex items-center gap-4">
              <div className="h-16 w-24 shrink-0 overflow-hidden border border-border bg-muted">
                {item.media_type === "video" ? (
                  <div className="flex h-full w-full items-center justify-center text-[10px] tracking-widest text-primary">
                    VIDEO
                  </div>
                ) : (
                  item.image_url && (
                    <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                  )
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-foreground">{item.caption || "(no caption)"}</p>
                <p className="text-xs text-muted-foreground">{item.media_type}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <button
                  type="button"
                  onClick={() => toggleVisible(item)}
                  aria-label={item.is_visible ? "Hide slide" : "Show slide"}
                  className="text-muted-foreground hover:text-primary"
                >
                  {item.is_visible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className="text-sm text-primary hover:text-[color:var(--brand-gold-bright)]"
                >
                  Edit
                </button>
                <ConfirmDeleteButton itemLabel="this slide" onConfirm={() => handleDelete(item)} />
              </div>
            </div>
          )}
        />
      )}

      {editing && (
        <SlideFormDialog
          item={editing === "new" ? null : editing}
          pageKey={pageKey}
          nextDisplayOrder={items?.length ?? 0}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function SlideFormDialog({
  item,
  pageKey,
  nextDisplayOrder,
  onClose,
  onSaved,
}: {
  item: PageMedia | null;
  pageKey: string;
  nextDisplayOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mediaType, setMediaType] = useState<"image" | "video">(
    item?.media_type === "video" ? "video" : "image",
  );
  const [caption, setCaption] = useState(item?.caption ?? "");
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [videoUrl, setVideoUrl] = useState(item?.video_url ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let nextImage = imageUrl.trim() || null;
      let nextVideo = videoUrl.trim() || null;
      if (imageFile) nextImage = await uploadMedia(imageFile, "page-media");
      if (videoFile) nextVideo = await uploadMedia(videoFile, "page-media");

      if (mediaType === "image" && !nextImage) {
        toast.error("Upload an image or paste an image address.");
        setSaving(false);
        return;
      }
      if (mediaType === "video" && !nextVideo) {
        toast.error("Upload a video or paste a video address.");
        setSaving(false);
        return;
      }

      const payload = {
        page_key: pageKey,
        media_type: mediaType,
        image_url: nextImage,
        video_url: nextVideo,
        caption: caption.trim() || null,
      };

      const { error } = item
        ? await supabase.from("page_media").update(payload).eq("id", item.id)
        : await supabase
            .from("page_media")
            .insert({ ...payload, display_order: nextDisplayOrder });
      if (error) throw error;
      toast.success(item ? "Slide updated." : "Slide added.");
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
          <DialogTitle>{item ? "Edit slide" : "Add slide"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Type">
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as "image" | "video")}
              className={inputClass}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </Field>

          {mediaType === "image" ? (
            <>
              <FileUploadField
                label="Image"
                accept="image/*"
                currentUrl={imageUrl || null}
                onFileChange={(f) => {
                  setImageFile(f);
                  if (!f) setImageUrl("");
                }}
              />
              <Field label="Or image address" hint="Paste a link instead of uploading.">
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </>
          ) : (
            <>
              <FileUploadField
                label="Video"
                accept="video/*"
                kind="video"
                currentUrl={videoUrl || null}
                onFileChange={(f) => {
                  setVideoFile(f);
                  if (!f) setVideoUrl("");
                }}
              />
              <Field label="Or video address">
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </>
          )}

          <Field label="Caption" hint="Optional line shown over the slide.">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className={inputClass}
            />
          </Field>

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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}