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

export const Route = createFileRoute("/admin/videos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Cinematic — Admin" }] }),
  component: AdminVideosPage,
});

type Video = Tables<"videos">;
const queryKey = ["admin", "videos"];
const inputClass =
  "w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary";

function AdminVideosPage() {
  return (
    <AdminShell title="Cinematic">
      <VideosManager />
    </AdminShell>
  );
}

function VideosManager() {
  const queryClient = useQueryClient();
  const { data: videos, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [editing, setEditing] = useState<Video | "new" | null>(null);

  async function persistOrder(next: Video[]) {
    queryClient.setQueryData(queryKey, next);
    try {
      await Promise.all(
        next.map((v, i) => supabase.from("videos").update({ display_order: i }).eq("id", v.id)),
      );
    } catch {
      toast.error("Failed to save new order.");
      queryClient.invalidateQueries({ queryKey });
    }
  }

  async function handleDelete(video: Video) {
    const { error } = await supabase.from("videos").delete().eq("id", video.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`"${video.title}" deleted.`);
    queryClient.invalidateQueries({ queryKey });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Drag to reorder. Only one video can be featured at a time.
        </p>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="shrink-0 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
        >
          + Add video
        </button>
      </div>

      {!videos || videos.length === 0 ? (
        <p className="text-muted-foreground">No videos yet.</p>
      ) : (
        <SortableList
          items={videos}
          onReorder={persistOrder}
          renderItem={(video) => (
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden border border-border bg-muted">
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] text-muted-foreground">No thumbnail</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-serif text-lg text-primary">{video.title}</p>
                  {video.is_featured && (
                    <span className="eyebrow border border-primary px-1.5 py-0.5 text-[10px]">
                      Featured
                    </span>
                  )}
                </div>
                {!video.video_url && (
                  <p className="text-xs text-destructive">No video file uploaded yet</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <button
                  type="button"
                  onClick={() => setEditing(video)}
                  className="text-sm text-primary hover:text-[color:var(--brand-gold-bright)]"
                >
                  Edit
                </button>
                <ConfirmDeleteButton
                  itemLabel={video.title}
                  onConfirm={() => handleDelete(video)}
                />
              </div>
            </div>
          )}
        />
      )}

      {editing && (
        <VideoFormDialog
          video={editing === "new" ? null : editing}
          nextDisplayOrder={videos?.length ?? 0}
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

function VideoFormDialog({
  video,
  nextDisplayOrder,
  onClose,
  onSaved,
}: {
  video: Video | null;
  nextDisplayOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: video?.title ?? "",
    description: video?.description ?? "",
    is_featured: video?.is_featured ?? false,
  });
  const [videoFile, setVideoFile] = useState<File | null | undefined>(undefined);
  const [thumbnailFile, setThumbnailFile] = useState<File | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setSaving(true);
    try {
      let videoUrl = video?.video_url ?? null;
      if (videoFile instanceof File) {
        videoUrl = await uploadMedia(videoFile, "videos");
      } else if (videoFile === null) {
        videoUrl = null;
      }

      let thumbnailUrl = video?.thumbnail_url ?? null;
      if (thumbnailFile instanceof File) {
        thumbnailUrl = await uploadMedia(thumbnailFile, "video-thumbnails");
      } else if (thumbnailFile === null) {
        thumbnailUrl = null;
      }

      if (form.is_featured) {
        const unsetBuilder = supabase
          .from("videos")
          .update({ is_featured: false })
          .eq("is_featured", true);
        const { error: unsetError } = video
          ? await unsetBuilder.neq("id", video.id)
          : await unsetBuilder;
        if (unsetError) throw unsetError;
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        is_featured: form.is_featured,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
      };

      const { error } = video
        ? await supabase.from("videos").update(payload).eq("id", video.id)
        : await supabase.from("videos").insert({ ...payload, display_order: nextDisplayOrder });

      if (error) throw error;
      toast.success(video ? "Video updated." : "Video created.");
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
          <DialogTitle>{video ? "Edit video" : "Add video"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FileUploadField
            label="Video file"
            accept="video/*"
            kind="video"
            currentUrl={video?.video_url}
            onFileChange={setVideoFile}
          />

          <FileUploadField
            label="Thumbnail image"
            accept="image/*"
            currentUrl={video?.thumbnail_url}
            onFileChange={setThumbnailFile}
          />

          <FormField label="Title" required>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              className={inputClass}
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              className={`${inputClass} resize-y`}
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
              className="h-4 w-4"
            />
            Featured video (only one can be featured at a time)
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
