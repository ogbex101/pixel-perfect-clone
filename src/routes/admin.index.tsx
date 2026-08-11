import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Crown,
  Drama,
  Film,
  Home,
  Image,
  Link2,
  Megaphone,
  MessageSquare,
  Newspaper,
  Quote,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin — Nik Nanoski" }] }),
  component: AdminDashboard,
});

const RESOURCES = [
  {
    to: "/admin/homepage",
    icon: Home,
    label: "Homepage",
    description: "Show, hide, and reorder every section of the homepage.",
  },
  {
    to: "/admin/page-media",
    icon: Image,
    label: "Page Media",
    description: "Slideshow images and videos for every page of the site.",
  },
  {
    to: "/admin/profile",
    icon: User,
    label: "Author Profile",
    description: "Hero video, bio, tagline, photo, background facts, and quotes.",
  },
  {
    to: "/admin/books",
    icon: BookOpen,
    label: "Books",
    description: "Create, edit, reorder, and feature books.",
  },
  {
    to: "/admin/characters",
    icon: Drama,
    label: "Characters",
    description: "Manage each book's character roster.",
  },
  {
    to: "/admin/press",
    icon: Megaphone,
    label: "Press Mentions",
    description: "Outlets, headlines, and links.",
  },
  {
    to: "/admin/testimonials",
    icon: Quote,
    label: "Testimonials",
    description: "Reader quotes and star ratings.",
  },
  {
    to: "/admin/contact-links",
    icon: Link2,
    label: "Contact Links",
    description: "Social and storefront links shown on the Contact page.",
  },
  {
    to: "/admin/videos",
    icon: Film,
    label: "Cinematic",
    description: "Video uploads, thumbnails, and the featured showcase piece.",
  },
  {
    to: "/admin/challenges",
    icon: Trophy,
    label: "Challenges",
    description: "Manage DUMB 31 challenges, their dates, prizes, and questions.",
  },
  {
    to: "/admin/members",
    icon: Users,
    label: "Members",
    description: "Registered members, their challenge progress, and account status.",
  },
  {
    to: "/admin/debates",
    icon: MessageSquare,
    label: "Debates",
    description: "Community debate topics and comment moderation.",
  },
  {
    to: "/admin/news",
    icon: Newspaper,
    label: "News",
    description: "News and updates, with drafts and scheduled posts.",
  },
  {
    to: "/admin/winners",
    icon: Crown,
    label: "Winners",
    description: "Announce challenge winners and track prize fulfilment.",
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
            <p className="flex items-center gap-2.5 font-serif text-xl text-primary">
              <r.icon className="h-5 w-5 shrink-0" aria-hidden />
              {r.label}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
