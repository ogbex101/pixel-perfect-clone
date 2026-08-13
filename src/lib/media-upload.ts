import { supabase } from "@/integrations/supabase/client";

const BUCKET = "media";

/** Uploads are served straight from storage, so keep them a sane size. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB

function formatMb(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export async function uploadMedia(file: File, folder: string): Promise<string> {
  const isVideo = file.type.startsWith("video/");
  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    throw new Error(
      `That ${isVideo ? "video" : "image"} is ${formatMb(file.size)}. The limit is ${formatMb(limit)} — please compress it first.`,
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Turns a public URL from this bucket back into its storage path.
 * Returns null for anything that isn't one of our uploads (an external URL,
 * a blank field), so callers can safely pass whatever the row holds.
 */
export function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = url.slice(index + marker.length).split("?")[0];
  return path ? decodeURIComponent(path) : null;
}

/**
 * Removes uploaded files for a record that's being deleted or having its
 * media replaced. Failures are swallowed deliberately: an orphaned file is a
 * housekeeping problem, but a failed cleanup should never block the delete
 * the admin actually asked for.
 */
export async function deleteMedia(...urls: (string | null | undefined)[]): Promise<void> {
  const paths = urls.map(storagePathFromUrl).filter((p): p is string => Boolean(p));
  if (paths.length === 0) return;
  try {
    await supabase.storage.from(BUCKET).remove(paths);
  } catch {
    /* orphaned file; not worth failing the user's action over */
  }
}
