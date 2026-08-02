import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { SortableList } from "@/components/admin/sortable-list";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/homepage")({
  ssr: false,
  head: () => ({ meta: [{ title: "Homepage — Admin" }] }),
  component: AdminHomepagePage,
});

type Section = Tables<"landing_page_sections">;

const sectionsQueryKey = ["admin", "landing_page_sections"];

/**
 * Human-readable copy for each known section_key. Unknown keys still render
 * (using the raw key) so a section added directly in SQL never disappears
 * from this manager.
 */
const SECTION_META: Record<
  string,
  { label: string; description: string; editTo?: string; editLabel?: string }
> = {
  hero: {
    label: "Hero",
    description: "Full-screen cinematic video (or fallback) with the headline and main buttons.",
    editTo: "/admin/profile",
    editLabel: "Edit hero video & headline",
  },
  featured_book: {
    label: "Featured Book",
    description: "The spotlighted book — cover, description, and purchase links.",
    editTo: "/admin/books",
    editLabel: "Edit books",
  },
  author_intro: {
    label: "Author Introduction",
    description: "Your photo alongside the short bio and a link to the About page.",
    editTo: "/admin/profile",
    editLabel: "Edit bio & photo",
  },
  quote_rotator: {
    label: "Pull Quote",
    description: "Large rotating quotes in your own words.",
    editTo: "/admin/profile",
    editLabel: "Edit quotes",
  },
  books_preview_grid: {
    label: "The Library",
    description: "Horizontal showcase of all your books.",
    editTo: "/admin/books",
    editLabel: "Edit books",
  },
  cinematic_preview: {
    label: "Cinematic Preview",
    description: "Your featured video with a link to the Cinematic page.",
    editTo: "/admin/videos",
    editLabel: "Edit videos",
  },
  testimonials_preview: {
    label: "Reader Praise",
    description: "A few reader testimonials.",
    editTo: "/admin/testimonials",
    editLabel: "Edit testimonials",
  },
  press_preview: {
    label: "Press Logos",
    description: "Scrolling row of publication logos.",
    editTo: "/admin/press",
    editLabel: "Edit press mentions",
  },
  contact_cta: {
    label: "Contact Call-to-Action",
    description: "Closing invitation to get in touch.",
    editTo: "/admin/contact-links",
    editLabel: "Edit contact links",
  },
};

function metaFor(key: string) {
  return SECTION_META[key] ?? { label: key.replace(/_/g, " "), description: "Custom section." };
}

function AdminHomepagePage() {
  return (
    <AdminShell title="Homepage">
      <HomepageManager />
    </AdminShell>
  );
}

function HomepageManager() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: sectionsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_page_sections")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [sections, setSections] = useState<Section[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setSections(data);
  }, [data]);

  async function persistOrder(next: Section[]) {
    setSections(next);
    setSaving(true);
    try {
      const updates = next.map((s, i) =>
        supabase
          .from("landing_page_sections")
          .update({ display_order: i + 1 })
          .eq("id", s.id),
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
      toast.success("Section order saved.");
      queryClient.invalidateQueries({ queryKey: sectionsQueryKey });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save order.");
      if (data) setSections(data);
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisible(section: Section) {
    const next = !section.is_visible;
    setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, is_visible: next } : s)));
    try {
      const { error } = await supabase
        .from("landing_page_sections")
        .update({ is_visible: next })
        .eq("id", section.id);
      if (error) throw error;
      toast.success(`${metaFor(section.section_key).label} ${next ? "shown" : "hidden"}.`);
      queryClient.invalidateQueries({ queryKey: sectionsQueryKey });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update.");
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, is_visible: section.is_visible } : s)),
      );
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No homepage sections found. Run the latest database migration to create them.
      </p>
    );
  }

  return (
    <div className="max-w-3xl">
      <p className="mb-6 text-sm text-muted-foreground">
        Drag to reorder how sections appear on the homepage, and use the eye button to show or hide
        any section. To change the words, photos, or videos inside a section, use its “Edit content”
        link — that opens the screen where you can add, edit, and delete that content. Changes go
        live immediately.
      </p>

      <SortableList
        items={sections}
        onReorder={persistOrder}
        renderItem={(section, index) => {
          const meta = metaFor(section.section_key);
          return (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <span className="text-xs text-muted-foreground tabular-nums">{index + 1}.</span>
                  <span className={section.is_visible ? "" : "text-muted-foreground line-through"}>
                    {meta.label}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{meta.description}</p>
                {meta.editTo && (
                  <Link
                    to={meta.editTo}
                    className="mt-2 inline-block text-xs text-primary hover:text-[color:var(--brand-gold-bright)]"
                  >
                    {meta.editLabel ?? "Edit content"} →
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleVisible(section)}
                aria-pressed={section.is_visible}
                aria-label={section.is_visible ? "Hide section" : "Show section"}
                className={`shrink-0 inline-flex items-center gap-2 border px-3 py-1.5 text-xs transition-colors ${
                  section.is_visible
                    ? "border-primary/50 text-primary hover:bg-primary/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {section.is_visible ? (
                  <>
                    <Eye className="h-3.5 w-3.5" /> Visible
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5" /> Hidden
                  </>
                )}
              </button>
            </div>
          );
        }}
      />

      {saving && <p className="mt-4 text-xs text-muted-foreground">Saving order…</p>}
    </div>
  );
}
