import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHero } from "@/components/page-hero";
import { CinematicSlideshow } from "@/components/cinematic-slideshow";
import { SITE_ART, pageMediaQuery, toSlides, type Slide } from "@/lib/page-media";

const aboutQuery = queryOptions({
  queryKey: ["author_profile"],
  queryFn: async () => {
    const { data } = await supabase.from("author_profile").select("*").maybeSingle();
    return data;
  },
});

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Nik Nanoski" },
      {
        name: "description",
        content: "About Nik Nanoski: nurse, former combat medic, and science fiction novelist.",
      },
      { property: "og:title", content: "About — Nik Nanoski" },
      { property: "og:description", content: "The story behind the author of DUMB 31." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(aboutQuery);
    context.queryClient.ensureQueryData(pageMediaQuery("about"));
  },
  pendingComponent: AboutSkeleton,
  pendingMs: 200,
  pendingMinMs: 300,
  component: About,
});

function AboutSkeleton() {
  return (
    <article>
      <header className="border-b border-border px-6 py-16 md:px-14 md:py-24">
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-14 w-2/3" />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-16 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-7 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="md:col-span-5 space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </article>
  );
}

function About() {
  const { data } = useSuspenseQuery(aboutQuery);
  const { data: media } = useSuspenseQuery(pageMediaQuery("about"));
  if (!data)
    return (
      <p className="mx-auto max-w-6xl px-6 py-20 text-muted-foreground">No author profile yet.</p>
    );

  const managed = toSlides(media);
  const fallback: Slide[] = [
    ...(data.hero_photo_url
      ? [
          {
            id: "portrait",
            type: "image" as const,
            src: data.hero_photo_url,
            caption: data.name,
          },
        ]
      : []),
    { id: "art-door", type: "image", src: SITE_ART.door, caption: data.tagline ?? "DUMB 31" },
    { id: "art-opie", type: "image", src: SITE_ART.opie, caption: "Inside the facility" },
    { id: "art-betterauds", type: "image", src: SITE_ART.betterauds, caption: "The field manual" },
  ];
  const slides = managed.length > 0 ? managed : fallback;

  return (
    <article>
      <PageHero
        eyebrow="The Profile"
        title={`About ${data.name}`}
        subtitle={data.tagline ? `“${data.tagline}”` : null}
        imageUrl={data.hero_photo_url ?? SITE_ART.door}
        focalPoint="center 30%"
      />

      {/* Bio: text carries the weight, location tucked beside it */}
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-12 md:py-20 overflow-hidden">
        <Reveal variant="left" as="div" className="md:col-span-8">
          {data.bio && (
            <div className="font-serif text-lg leading-relaxed text-foreground/85 whitespace-pre-wrap drop-cap">
              {data.bio}
            </div>
          )}
        </Reveal>
        <Reveal
          variant="right"
          delay={150}
          className="md:col-span-4 md:border-l md:border-border md:pl-8"
        >
          {/* Sticky context rail: orienting facts stay in view while the bio scrolls */}
          <div className="md:sticky md:top-28">
            {data.location && (
              <>
                <p className="eyebrow">Based in</p>
                <p className="mt-1 text-foreground">{data.location}</p>
              </>
            )}
            <p className="eyebrow mt-8">Start here</p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <Link to="/books" className="link-underline text-primary hover:opacity-80">
                  Read the books →
                </Link>
              </li>
              <li>
                <Link to="/cinematic" className="link-underline text-primary hover:opacity-80">
                  Watch the cinematics →
                </Link>
              </li>
              <li>
                <Link to="/contact" className="link-underline text-primary hover:opacity-80">
                  Get in touch →
                </Link>
              </li>
            </ul>
          </div>
        </Reveal>
      </div>

      {/* Background facts: staggered timeline, not a bullet list */}
      {data.background_facts.length > 0 && (
        <section className="border-t border-border bg-secondary/30 texture-metal overflow-hidden">
          <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
            <Reveal className="ornament mb-12">
              <span className="eyebrow">Background</span>
            </Reveal>
            <ol className="space-y-10 md:space-y-14">
              {data.background_facts.map((f, i) => (
                <Reveal
                  as="li"
                  key={i}
                  variant={i % 2 === 1 ? "right" : "left"}
                  delay={(i % 3) * 100}
                  className={`flex flex-col gap-3 md:flex-row md:items-baseline md:gap-8 ${
                    i % 2 === 1 ? "md:pl-16" : ""
                  }`}
                >
                  <span className="text-gradient-gold font-serif text-5xl leading-none opacity-60 md:text-6xl">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="max-w-xl text-lg text-foreground/85 md:text-xl">{f}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* In his words: the largest, most prominent voice on the page */}
      {data.quotes.length > 0 && (
        <section className="border-t border-border py-16 md:py-24 overflow-hidden">
          <div className="mx-auto max-w-5xl space-y-16 px-6 md:space-y-24">
            {data.quotes.slice(0, 3).map((q, i) => (
              <Reveal
                key={i}
                variant="blur"
                delay={(i % 3) * 100}
                className="text-center md:text-left"
              >
                {i === 0 && <p className="eyebrow mb-6 text-center md:text-left">In His Words</p>}
                <blockquote className="text-gradient-gold pb-1 font-serif text-3xl italic leading-[1.18] sm:text-4xl md:text-5xl">
                  “{q}”
                </blockquote>
              </Reveal>
            ))}
            <Reveal className="ornament">
              <span aria-hidden className="text-xs tracking-[0.3em]">
                ✦
              </span>
            </Reveal>
          </div>
        </section>
      )}

      <CinematicSlideshow slides={slides} eyebrow="Visuals" title="The World He Writes" />
    </article>
  );
}
