import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";

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
  const featured = data.find((v) => v.is_featured);
  const rest = data.filter((v) => v.id !== featured?.id);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <Reveal as="header" className="border-b border-border pb-6">
        <p className="eyebrow">The Cinematic</p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl md:text-6xl text-primary">Cinematic</h1>
      </Reveal>

      {data.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No videos yet.</p>
      ) : (
        <>
          {featured && (
            <Reveal className="mt-12">
              <p className="eyebrow">Featured</p>
              <div className="mt-3 aspect-video w-full overflow-hidden border border-border bg-muted texture-metal">
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
              <h2 className="mt-4 font-serif text-2xl md:text-3xl text-primary">
                {featured.title}
              </h2>
              {featured.description && (
                <p className="mt-2 text-foreground/80 max-w-3xl">{featured.description}</p>
              )}
            </Reveal>
          )}

          {rest.length > 0 && (
            <div className="mt-16">
              <Reveal as="p" className="eyebrow border-b border-border pb-4">
                {featured ? "More" : "All videos"}
              </Reveal>
              <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((v, i) => (
                  <Reveal
                    as="li"
                    key={v.id}
                    delay={(i % 3) * 100}
                    className="group card-lift border border-transparent"
                  >
                    <div className="aspect-video w-full overflow-hidden border border-border bg-muted">
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
                    <h3 className="mt-3 font-serif text-lg text-primary group-hover:text-[color:var(--brand-gold-bright)] transition-colors">
                      {v.title}
                    </h3>
                    {v.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {v.description}
                      </p>
                    )}
                  </Reveal>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
