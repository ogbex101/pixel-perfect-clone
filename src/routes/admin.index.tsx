import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin — Nik Nanoski" }] }),
  component: AdminDashboard,
});

const RESOURCES = [
  {
    to: "/admin/homepage",
    label: "Homepage",
    description: "Show, hide, and reorder every section of the homepage.",
  },
  {
    to: "/admin/page-media",
    label: "Page Media",
    description: "Slideshow images and videos for every page of the site.",
  },
  {
    to: "/admin/profile",
    label: "Author Profile",
    description: "Hero video, bio, tagline, photo, background facts, and quotes.",
  },
  {
    to: "/admin/books",
    label: "Books",
    description: "Create, edit, reorder, and feature books.",
  },
  {
    to: "/admin/characters",
    label: "Characters",
    description: "Manage each book's character roster.",
  },
  {
    to: "/admin/press",
    label: "Press Mentions",
    description: "Outlets, headlines, and links.",
  },
  {
    to: "/admin/testimonials",
    label: "Testimonials",
    description: "Reader quotes and star ratings.",
  },
  {
    to: "/admin/contact-links",
    label: "Contact Links",
    description: "Social and storefront links shown on the Contact page.",
  },
  {
    to: "/admin/videos",
    label: "Cinematic",
    description: "Video uploads, thumbnails, and the featured showcase piece.",
  },
  {
    to: "/admin/challenges",
    label: "Challenges",
    description: "Manage DUMB 31 challenges, their dates, prizes, and questions.",
  },
] as const;

function AdminDashboard() {
  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2">
        {RESOURCES.map((r) => (
          <Link
            key={r.to}
            to={r.to}
            className="block border border-border bg-card p-5 transition-colors hover:border-primary"
          >
            <p className="font-serif text-xl text-primary">{r.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
