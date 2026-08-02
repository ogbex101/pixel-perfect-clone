import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHero } from "@/components/page-hero";
import { CinematicSlideshow } from "@/components/cinematic-slideshow";
import { SITE_ART, pageMediaQuery, toSlides, type Slide } from "@/lib/page-media";

const pressQuery = queryOptions({
  queryKey: ["press_mentions"],
  queryFn: async () => {
    const { data } = await supabase
      .from("press_mentions")
      .select("*")
      .order("display_order", { ascending: true });
    return data ?? [];
  },
});

export const Route = createFileRoute("/press")({
  head: () => ({
    meta: [
      { title: "Press — Nik Nanoski" },
      { name: "description", content: "Press mentions and coverage of author Nik Nanoski's work." },
      { property: "og:title", content: "Press — Nik Nanoski" },
      { property: "og:description", content: "Press mentions and reviews." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(pressQuery);
    context.queryClient.ensureQueryData(pageMediaQuery("press"));
  },
  pendingComponent: PressSkeleton,
  pendingMs: 200,
  pendingMinMs: 300,
  component: Press,
});

function PressSkeleton() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <header className="border-b border-border pb-6 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-14 w-1/3" />
      </header>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border border-border p-6 space-y-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </section>
  );
}

function Press() {
  const { data } = useSuspenseQuery(pressQuery);
  const { data: media } = useSuspenseQuery(pageMediaQuery("press"));
  const managed = toSlides(media);
  const fallback: Slide[] = [
    ...data
      .filter((p) => p.logo_url)
      .map((p) => ({
        id: `press-${p.id}`,
        type: "image" as const,
        src: p.logo_url as string,
        caption: p.headline ?? p.source_name,
      })),
    { id: "art-cover", type: "image", src: SITE_ART.cover, caption: "DUMB 31" },
    { id: "art-betterauds", type: "image", src: SITE_ART.betterauds, caption: "Facility status" },
  ];
  const slides = managed.length > 0 ? managed : fallback;
  return (
    <>
      <PageHero
        eyebrow="The Clippings"
        title="Press"
        subtitle="Coverage, reviews, and conversations."
        imageUrl={SITE_ART.cover}
      />
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      {data.length === 0 ? (
        <p className="text-muted-foreground">No press mentions yet.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p, i) => (
            <Reveal
              as="li"
              key={p.id}
              variant="zoom"
              delay={Math.min(i, 5) * 90}
              className="card-premium texture-paper group p-6 flex flex-col"
            >
              <div className="h-10 flex items-center">
                {p.logo_url ? (
                  <img
                    src={p.logo_url}
                    alt={p.source_name}
                    className="max-h-10 max-w-[160px] object-contain opacity-80 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0"
                  />
                ) : (
                  <span className="font-serif text-xl text-primary">{p.source_name}</span>
                )}
              </div>
              <p className="mt-4 flex-1 font-serif italic text-foreground/80">
                {p.headline || "—"}
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <p className="eyebrow">{p.source_name}</p>
                {p.link && (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noreferrer"
                    className="eyebrow link-underline hover:text-[color:var(--brand-gold-bright)]"
                  >
                    Read →
                  </a>
                )}
              </div>
            </Reveal>
          ))}
        </ul>
      )}
      </section>
      <CinematicSlideshow slides={slides} eyebrow="In Frame" title="Press & Key Art" />
    </>
  );
}
