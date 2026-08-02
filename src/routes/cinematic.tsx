import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHero } from "@/components/page-hero";
import { CinematicSlideshow } from "@/components/cinematic-slideshow";
import { SITE_ART, pageMediaQuery, toSlides, type Slide } from "@/lib/page-media";

const videosQuery = queryOptions({
  queryKey: ["videos"],
  queryFn: async () => {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .order("display_order", { ascending: true });
    return data ?? [];
  },
});

export const Route = createFileRoute("/cinematic")({
  head: () => ({
    meta: [
      { title: "Cinematic — Nik Nanoski" },
      { name: "description", content: "Video content from author Nik Nanoski." },
      { property: "og:title", content: "Cinematic — Nik Nanoski" },
      { property: "og:description", content: "Video content and trailers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(videosQuery);
    context.queryClient.ensureQueryData(pageMediaQuery("cinematic"));
  },
  pendingComponent: CinematicSkeleton,
  pendingMs: 200,
  pendingMinMs: 300,
  component: Cinematic,
});

function CinematicSkeleton() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <header className="border-b border-border pb-6 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-14 w-1/3" />
      </header>
      <Skeleton className="mt-12 aspect-video w-full" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="aspect-video w-full" />
        ))}
      </div>
    </section>
  );
}

function Cinematic() {
  const { data } = useSuspenseQuery(videosQuery);
  const { data: media } = useSuspenseQuery(pageMediaQuery("cinematic"));
  const featured = data.find((v) => v.is_featured);
  const rest = data.filter((v) => v.id !== featured?.id);

  const managed = toSlides(media);
  const fallback: Slide[] = [
    ...data
      .filter((v) => v.video_url || v.thumbnail_url)
      .map((v) =>
        v.video_url
          ? { id: `v-${v.id}`, type: "video" as const, src: v.video_url, caption: v.title }
          : {
              id: `v-${v.id}`,
              type: "image" as const,
              src: v.thumbnail_url as string,
              caption: v.title,
            },
      ),
    { id: "art-corridor", type: "video", src: SITE_ART.corridorVideo, caption: "The corridor" },
    { id: "art-book", type: "video", src: SITE_ART.bookOpensVideo, caption: "The manual opens" },
  ];
  const slides = managed.length > 0 ? managed : fallback;

  return (
    <>
      <PageHero
        eyebrow="The Cinematic"
        title="Cinematic"
        subtitle="Trailers, scenes, and moving pieces of the world."
        videoUrl={SITE_ART.corridorVideo}
      />
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      {data.length === 0 ? (
        <p className="text-muted-foreground">No videos yet.</p>
      ) : (
        <>
          {featured && (
            <Reveal variant="zoom">
              <p className="eyebrow">Featured</p>
              <div className="frame-gold mt-5 aspect-video w-full overflow-hidden bg-muted texture-metal">
                {featured.video_url ? (
                  <video
                    src={featured.video_url}
                    controls
                    poster={featured.thumbnail_url ?? undefined}
                    className="h-full w-full"
                  />
                ) : featured.thumbnail_url ? (
                  <img
                    src={featured.thumbnail_url}
                    alt={featured.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-serif text-2xl text-primary">{featured.title}</span>
                  </div>
                )}
              </div>
              <h2 className="text-gradient-gold mt-6 font-serif text-2xl md:text-3xl pb-1">
                {featured.title}
              </h2>
              {featured.description && (
                <p className="mt-2 text-foreground/80 max-w-3xl">{featured.description}</p>
              )}
            </Reveal>
          )}

          {rest.length > 0 && (
            <div className="mt-20">
              <Reveal className="ornament pb-4">
                <span className="eyebrow">{featured ? "More" : "All videos"}</span>
              </Reveal>
              <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((v, i) => (
                  <Reveal
                    as="li"
                    key={v.id}
                    variant="zoom"
                    delay={(i % 3) * 110}
                    className="group card-premium overflow-hidden"
                  >
                    <div className="aspect-video w-full overflow-hidden border-b border-border bg-muted">
                      {v.video_url ? (
                        <video
                          src={v.video_url}
                          controls
                          poster={v.thumbnail_url ?? undefined}
                          className="h-full w-full"
                        />
                      ) : v.thumbnail_url ? (
                        <img
                          src={v.thumbnail_url}
                          alt={v.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-4">
                          <span className="font-serif text-lg text-primary text-center">
                            {v.title}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-lg text-primary group-hover:text-[color:var(--brand-gold-bright)] transition-colors duration-300">
                        {v.title}
                      </h3>
                      {v.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {v.description}
                        </p>
                      )}
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      </section>
      <CinematicSlideshow slides={slides} eyebrow="Reel" title="Continuous Play" />
    </>
  );
}
