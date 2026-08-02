import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/page-hero";
import { CinematicSlideshow } from "@/components/cinematic-slideshow";
import { SITE_ART, pageMediaQuery, toSlides, type Slide } from "@/lib/page-media";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "in_progress", label: "In Progress" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["key"];

const booksQuery = queryOptions({
  queryKey: ["books"],
  queryFn: async () => {
    const { data } = await supabase
      .from("books")
      .select("*")
      .order("display_order", { ascending: true });
    return data ?? [];
  },
});

export const Route = createFileRoute("/books/")({
  head: () => ({
    meta: [
      { title: "Books — Nik Nanoski" },
      {
        name: "description",
        content: "All books by Nik Nanoski, including DUMB 31 and works in progress.",
      },
      { property: "og:title", content: "Books — Nik Nanoski" },
      { property: "og:description", content: "Sci-fi novels by Nik Nanoski." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(booksQuery);
    context.queryClient.ensureQueryData(pageMediaQuery("books"));
  },
  pendingComponent: BooksSkeleton,
  pendingMs: 200,
  pendingMinMs: 300,
  component: BooksIndex,
});

function BooksSkeleton() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <header className="border-b border-border pb-6 space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-14 w-1/3" />
      </header>
      <div className="mt-12 grid gap-12 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="grid grid-cols-[minmax(0,1fr)_2fr] gap-6">
            <Skeleton className="aspect-[2/3] w-full" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BooksIndex() {
  const { data: books } = useSuspenseQuery(booksQuery);
  const { data: media } = useSuspenseQuery(pageMediaQuery("books"));
  const [filter, setFilter] = useState<StatusFilter>("all");
  const filtered = filter === "all" ? books : books.filter((b) => b.status === filter);

  const managed = toSlides(media);
  const fallback: Slide[] = [
    ...books
      .filter((b) => b.cover_image_url)
      .map((b) => ({
        id: `book-${b.id}`,
        type: "image" as const,
        src: b.cover_image_url as string,
        caption: b.title,
      })),
    { id: "art-cover", type: "image", src: SITE_ART.cover, caption: "DUMB 31" },
    { id: "art-betterauds", type: "image", src: SITE_ART.betterauds, caption: "Facility status" },
  ];
  const slides = managed.length > 0 ? managed : fallback;

  return (
    <>
      <PageHero
        eyebrow="The Catalogue"
        title="Books"
        subtitle="Every volume, finished and in progress."
        imageUrl={SITE_ART.betterauds}
      />
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      {books.length > 0 && (
        <Reveal
          delay={150}
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter books by status"
        >
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={cn(
                "eyebrow btn-sheen rounded-full px-5 py-2 border transition-all duration-300",
                filter === f.key
                  ? "border-primary text-primary bg-primary/10 shadow-[0_0_18px_-6px_oklch(0.79_0.115_85/0.5)]"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </Reveal>
      )}
      {books.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No books yet.</p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No books match this filter.</p>
      ) : (
        <ul className="mt-12 grid gap-10 md:gap-12 md:grid-cols-2">
          {filtered.map((b, i) => (
            <Reveal
              as="li"
              key={b.id}
              variant={i % 2 === 0 ? "left" : "right"}
              delay={(i % 2) * 100}
              className="group grid grid-cols-[minmax(0,120px)_1fr] sm:grid-cols-[minmax(0,1fr)_2fr] gap-5 sm:gap-6"
            >
              <Link
                to="/books/$bookId"
                params={{ bookId: b.id }}
                className="card-premium img-shine block overflow-hidden"
              >
                <div className="aspect-[2/3] bg-muted overflow-hidden">
                  {b.cover_image_url ? (
                    <img
                      src={b.cover_image_url}
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3 bg-gradient-to-br from-primary to-[color:var(--brand-rust)] text-primary-foreground">
                      <span className="font-serif text-xl text-center">{b.title}</span>
                    </div>
                  )}
                </div>
              </Link>
              <div className="min-w-0">
                <p className="eyebrow">{b.status.replace("_", " ")}</p>
                <h2 className="mt-1 font-serif text-xl sm:text-2xl md:text-3xl text-primary">
                  <Link
                    to="/books/$bookId"
                    params={{ bookId: b.id }}
                    className="hover:text-[color:var(--brand-gold-bright)] transition-colors duration-300"
                  >
                    {b.title}
                  </Link>
                </h2>
                {b.genre && <p className="mt-1 italic text-muted-foreground text-sm">{b.genre}</p>}
                {b.short_description && (
                  <p className="mt-3 text-foreground/80 line-clamp-5">{b.short_description}</p>
                )}
                <Link
                  to="/books/$bookId"
                  params={{ bookId: b.id }}
                  className="mt-4 inline-block border-b-2 border-accent pb-0.5 text-sm font-medium text-primary link-underline hover:text-[color:var(--brand-gold-bright)] transition-colors"
                >
                  Read more →
                </Link>
              </div>
            </Reveal>
          ))}
        </ul>
      )}
      </section>
      <CinematicSlideshow slides={slides} eyebrow="Covers & Key Art" title="The Library in Frames" />
    </>
  );
}
