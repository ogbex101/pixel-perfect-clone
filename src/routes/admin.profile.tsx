import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { FileUploadField } from "@/components/admin/file-upload-field";
import { StringListEditor } from "@/components/admin/string-list-editor";
import { uploadMedia } from "@/lib/media-upload";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/profile")({
  ssr: false,
  head: () => ({ meta: [{ title: "Author Profile — Admin" }] }),
  component: AdminProfilePage,
});

type Profile = Tables<"author_profile">;

const profileQueryKey = ["admin", "author_profile"];

function AdminProfilePage() {
  return (
    <AdminShell title="Author Profile">
      <ProfileForm />
    </AdminShell>
  );
}

function ProfileForm() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: profileQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase.from("author_profile").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    name: "",
    tagline: "",
    bio: "",
    location: "",
    contact_email: "",
    quotes: [] as string[],
    background_facts: [] as string[],
  });
  const [heroPhotoFile, setHeroPhotoFile] = useState<File | null | undefined>(undefined);
  const [heroVideoFile, setHeroVideoFile] = useState<File | null | undefined>(undefined);
  const [heroImageFile, setHeroImageFile] = useState<File | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name ?? "",
      tagline: data.tagline ?? "",
      bio: data.bio ?? "",
      location: data.location ?? "",
      contact_email: data.contact_email ?? "",
      quotes: data.quotes ?? [],
      background_facts: data.background_facts ?? [],
    });
  }, [data]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    try {
      let heroPhotoUrl = data?.hero_photo_url ?? null;
      if (heroPhotoFile instanceof File) {
        heroPhotoUrl = await uploadMedia(heroPhotoFile, "author");
      } else if (heroPhotoFile === null) {
        heroPhotoUrl = null;
      }

      let heroVideoUrl = data?.hero_video_url ?? null;
      if (heroVideoFile instanceof File) {
        heroVideoUrl = await uploadMedia(heroVideoFile, "hero");
      } else if (heroVideoFile === null) {
        heroVideoUrl = null;
      }

      let heroImageUrl = data?.hero_image_url ?? null;
      if (heroImageFile instanceof File) {
        heroImageUrl = await uploadMedia(heroImageFile, "hero");
      } else if (heroImageFile === null) {
        heroImageUrl = null;
      }

      const payload = {
        name: form.name.trim(),
        tagline: form.tagline.trim() || null,
        bio: form.bio.trim() || null,
        location: form.location.trim() || null,
        contact_email: form.contact_email.trim() || null,
        quotes: form.quotes.map((q) => q.trim()).filter(Boolean),
        background_facts: form.background_facts.map((f) => f.trim()).filter(Boolean),
        hero_photo_url: heroPhotoUrl,
        hero_video_url: heroVideoUrl,
        hero_image_url: heroImageUrl,
      };

      const { error } = data?.id
        ? await supabase.from("author_profile").update(payload).eq("id", data.id)
        : await supabase.from("author_profile").insert(payload);

      if (error) throw error;

      toast.success("Author profile saved.");
      setHeroPhotoFile(undefined);
      setHeroVideoFile(undefined);
      setHeroImageFile(undefined);
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <FileUploadField
        label="Homepage hero video"
        accept="video/*"
        kind="video"
        currentUrl={data?.hero_video_url}
        onFileChange={setHeroVideoFile}
      />
      <p className="-mt-4 text-xs text-muted-foreground">
        Plays full-screen behind the homepage headline (muted, looped, no controls). Leave empty and
        the hero falls back to the hero image below, then to a clean dark gradient.
      </p>

      <FileUploadField
        label="Hero image"
        accept="image/*"
        currentUrl={data?.hero_image_url}
        onFileChange={setHeroImageFile}
      />
      <p className="-mt-4 text-xs text-muted-foreground">
        Shown full-screen behind the homepage headline when no hero video is uploaded.
      </p>

      <FileUploadField
        label="Author photo"
        accept="image/*"
        currentUrl={data?.hero_photo_url}
        onFileChange={setHeroPhotoFile}
      />

      <Field label="Name" required>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          className={inputClass}
        />
      </Field>

      <Field label="Tagline">
        <input
          value={form.tagline}
          onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
          className={inputClass}
        />
      </Field>

      <Field label="Bio">
        <textarea
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          rows={8}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <Field label="Location">
        <input
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          className={inputClass}
        />
      </Field>

      <Field label="Contact email">
        <input
          type="email"
          value={form.contact_email}
          onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
          className={inputClass}
        />
      </Field>

      <StringListEditor
        label="Background facts"
        values={form.background_facts}
        onChange={(v) => setForm((f) => ({ ...f, background_facts: v }))}
        placeholder="e.g. Combat medic, Army veteran"
      />

      <StringListEditor
        label="Quotes"
        values={form.quotes}
        onChange={(v) => setForm((f) => ({ ...f, quotes: v }))}
        placeholder="A pull-quote in the author's own words"
      />

      <button
        type="submit"
        disabled={saving}
        className="bg-primary text-primary-foreground px-6 py-2.5 font-medium hover:bg-[color:var(--brand-gold-bright)] transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-muted-foreground mb-1">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
