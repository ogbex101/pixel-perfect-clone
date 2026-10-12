import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type PageMedia = Tables<"page_media">;

/** Slide shown by the cinematic slideshow. */
export type Slide = {
  id: string;
  type: "image" | "video";
  src: string;
  caption?: string | null;
};

/** Artwork shipped with the site, reused for page heroes and fallback slides. */
export const SITE_ART = {
  cover: "/art/DUMB_31_COVER.jpeg",
  betterauds: "/art/DUMB_31_BETTERAUDS.png",
  door: "/art/DUMB31_Day5_ReaderDilemma_Final.jpg",
  opie: "/art/DUMB31_Opie_Scene4_CloseUp.jpg",
  corridorVideo: "/art/corridor.mp4",
  bookOpensVideo: "/art/book-cover-opens.mp4",
} as const;

/** Pages that can hold their own media gallery. */
export const PAGE_KEYS = [
  { key: "home", label: "Home" },
  { key: "about", label: "About" },
  { key: "books", label: "Books" },
  { key: "press", label: "Press" },
  { key: "testimonials", label: "Testimonials" },
  { key: "contact", label: "Contact" },
  { key: "cinematic", label: "Cinematic" },
] as const;

export const pageMediaQuery = (pageKey: string) =>
  queryOptions({
    queryKey: ["page_media", pageKey],
    queryFn: async () => {
      const { data } = await supabase
        .from("page_media")
        .select("*")
        .eq("page_key", pageKey)
        .eq("is_visible", true)
        .order("display_order", { ascending: true });
      return data ?? [];
    },
  });

export function toSlides(rows: PageMedia[]): Slide[] {
  const slides: Slide[] = [];
  for (const r of rows) {
    const isVideo = r.media_type === "video" && r.video_url;
    const src = isVideo ? r.video_url : r.image_url;
    if (!src) continue;
    slides.push({
      id: r.id,
      type: isVideo ? "video" : "image",
      src,
      caption: r.caption,
    });
  }
  return slides;
}
