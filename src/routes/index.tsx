import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { QuoteRotator } from "@/components/quote-rotator";

const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [profile, featured, books, featuredVideo, press] = await Promise.all([
      supabase.from("author_profile").select("*").maybeSingle(),
      supabase.from("books").select("*").eq("is_featured", true).maybeSingle(),
      supabase.from("books").select("*").order("display_order", { ascending: true }),
      supabase.from("videos").select("*").eq("is_featured", true).maybeSingle(),
      supabase.from("press_mentions").select("*").order("display_order", { ascending: true }),
    ]);
    return {
      profile: profile.data,
      featured: featured.data,
      books: books.data ?? [],
      featuredVideo: featuredVideo.data,
      press: press.data ?? [],
    };
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nik Nanoski — Science Fiction Author" },
      {
        name: "description",
        content:
          "Science fiction author Nik Nanoski. Author of DUMB 31, a post-apocalyptic novel about survival and inherited lies.",
      },
      { property: "og:title", content: "Nik Nanoski — Science Fiction Author" },
      {
        property: "og:description",
        content:
          "Science fiction author Nik Nanoski. Author of DUMB 31, a post-apocalyptic novel about survival and inherited lies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(homeQuery);
  },
  pendingComponent: HomeSkeleton,
  pendingMs: 200,
  pendingMinMs: 300,
  component: Home,
});

function HomeSkeleton() {
  return (
    <>
      <div className="grid md:grid-cols-12 border-b border-border">
        <div className="md:col-span-7 min-h-[50vh] md:min-h-[85vh]">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
        <div className="md:col-span-5 flex items-center px-6 py-16 md:px-14">
          <div className="w-full space-y-5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        </div>
      </div>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex gap-8 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="aspect-[2/3] w-72 shrink-0" />
          ))}
        </div>
      </section>
    </>
  );
}

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { profile, featured, books, featuredVideo, press } = data;
  return (
    <>
      {/* Hero: full-bleed asymmetric split — featured book cover dominant */}
      <section className="border-b border-border">
        <div className="grid md:grid-cols-12 md:min-h-[85vh]">
          <Reveal className="md:col-span-7 order-1 relative min-h-[55vh] md:min-h-0">
            {featured?.cover_image_url ? (
              <img
                src={featured.cover_image_url}
                alt={`${featured.title} cover`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : profile?.hero_photo_url ? (
              <img
                src={profile.hero_photo_url}
                alt={profile.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary to-[color:var(--brand-rust)] texture-metal p-10">
                <span className="font-serif text-4xl md:text-5xl text-primary-foreground text-center">
                  {featured?.title ?? profile?.name ?? "Nik Nanoski"}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-background/30" />
          </Reveal>

          <div className="md:col-span-5 order-2 flex items-center texture-paper">
            <Reveal delay={150} className="w-full px-6 py-16 md:px-14 md:py-0">
              <p className="eyebrow">{featured ? "The Feature" : "Science Fiction Author"}</p>
              <h1 className="mt-4 font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.03] text-primary">
                {featured?.title ?? profile?.name ?? "Nik Nanoski"}
              </h1>
              {(featured?.short_description || profile?.tagline) && (
                <p className="mt-6 font-serif italic text-lg md:text-xl text-foreground/80">
                  “{featured?.short_description ?? profile?.tagline}”
                </p>
              )}
              <hr className="rule-gold mt-8" />
              <div className="mt-8 flex flex-wrap gap-4">
                {featured ? (
                  <>
                    <Link
                      to="/books/$bookId"
                      params={{ bookId: featured.id }}
                      className="inline-flex items-center bg-primary px-7 py-3.5 text-primary-foreground font-medium hover:bg-[color:var(--brand-gold-bright)] transition-colors"
                    >
                      Read {featured.title} →
                    </Link>
                    {featured.purchase_link && (
                      <a
                        href={featured.purchase_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center border border-primary px-7 py-3.5 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        Purchase
                      </a>
                    )}
                  </>
                ) : (
                  <Link
                    to="/about"
                    className="inline-flex items-center bg-primary px-7 py-3.5 text-primary-foreground font-medium hover:bg-[color:var(--brand-gold-bright)] transition-colors"
                  >
                    Read the profile →
                  </Link>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Author intro — asymmetric, text carries more visual weight */}
      {profile?.bio && (
        <section className="border-b border-border">
          <div className="grid md:grid-cols-12">
            <Reveal className="md:col-span-5 relative min-h-[360px] md:min-h-[560px] order-1">
              {profile.hero_photo_url ? (
                <img
                  src={profile.hero_photo_url}
                  alt={profile.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center font-serif text-8xl text-primary bg-accent/15 texture-paper">
                  {profile.name?.charAt(0) ?? "N"}
                </div>
              )}
            </Reveal>
            <Reveal delay={150} className="md:col-span-7 order-2 flex items-center">
              <div className="px-6 py-16 md:px-16 md:py-20 max-w-2xl">
                <p className="eyebrow">The Author</p>
                <p className="mt-4 font-serif text-2xl md:text-3xl leading-relaxed text-foreground/90 drop-cap">
                  {profile.bio}
                </p>
                <Link
                  to="/about"
                  className="mt-8 inline-flex w-fit items-center gap-2 border-b-2 border-accent pb-1 font-medium text-primary hover:text-[color:var(--brand-gold-bright)] hover:gap-3 transition-all"
                >
                  More about {profile.name} →
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Full-bleed pull-quote: a deliberate pause between blocks */}
      {profile?.quotes && profile.quotes.length > 0 && (
        <section className="border-b border-border bg-secondary/40 texture-metal py-20 md:py-32">
          <Reveal className="px-6 md:px-16 text-center">
            <p className="eyebrow mb-8">In His Words</p>
            <QuoteRotator quotes={profile.quotes} size="display" />
          </Reveal>
        </section>
      )}

      {/* Books preview: horizontal showcase, large covers */}
      {books.length > 0 && (
        <section className="border-b border-border py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal className="flex items-baseline justify-between border-b border-border pb-4">
              <h2 className="font-serif text-3xl md:text-4xl text-primary">The Library</h2>
              <Link
                to="/books"
                className="text-sm eyebrow link-underline hover:text-[color:var(--brand-gold-bright)]"
              >
                All books →
              </Link>
            </Reveal>
          </div>
          <ul className="mt-10 flex gap-6 md:gap-8 overflow-x-auto px-6 md:px-14 pb-4 snap-x snap-mandatory">
            {books.map((b, i) => (
              <Reveal
                as="li"
                key={b.id}
                delay={(i % 3) * 80}
                className="shrink-0 snap-start w-60 sm:w-72 md:w-80"
              >
                <Link to="/books/$bookId" params={{ bookId: b.id }} className="group block">
                  <div className="relative aspect-[2/3] overflow-hidden border border-border bg-muted card-lift">
                    {b.cover_image_url ? (
                      <img
                        src={b.cover_image_url}
                        alt={b.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-4 bg-gradient-to-br from-primary to-[color:var(--brand-rust)] text-primary-foreground">
                        <span className="font-serif text-2xl text-center">{b.title}</span>
                      </div>
                    )}
                    {b.short_description && (
                      <div className="absolute inset-x-0 bottom-0 translate-y-full border-t border-border bg-background/95 p-4 backdrop-blur-sm transition-transform duration-400 group-hover:translate-y-0">
                        <p className="line-clamp-4 text-xs text-foreground/85">
                          {b.short_description}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="mt-4 eyebrow">{b.status.replace("_", " ")}</p>
                  <h3 className="mt-1 font-serif text-xl text-primary group-hover:text-[color:var(--brand-gold-bright)] transition-colors">
                    {b.title}
                  </h3>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {/* Cinematic preview: featured video, large and prominent */}
      {featuredVideo && (
        <section className="border-b border-border">
          <div className="grid md:grid-cols-12">
            <Reveal
              delay={100}
              className="md:col-span-5 order-2 md:order-1 flex items-center bg-secondary/30"
            >
              <div className="px-6 py-16 md:px-14">
                <p className="eyebrow">Cinematic</p>
                <h2 className="mt-3 font-serif text-3xl md:text-4xl text-primary">
                  {featuredVideo.title}
                </h2>
                {featuredVideo.description && (
                  <p className="mt-4 text-foreground/80 leading-relaxed">
                    {featuredVideo.description}
                  </p>
                )}
                <Link
                  to="/cinematic"
                  className="mt-8 inline-flex w-fit items-center gap-2 border-b-2 border-accent pb-1 font-medium text-primary hover:text-[color:var(--brand-gold-bright)] hover:gap-3 transition-all"
                >
                  Watch on Cinematic →
                </Link>
              </div>
            </Reveal>
            <Reveal className="md:col-span-7 order-1 md:order-2 relative min-h-[320px] md:min-h-[520px] texture-metal">
              {featuredVideo.thumbnail_url ? (
                <img
                  src={featuredVideo.thumbnail_url}
                  alt={featuredVideo.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center px-6">
                  <span className="font-serif text-3xl text-primary text-center">
                    {featuredVideo.title}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full border border-primary/60 bg-background/70 backdrop-blur">
                  <div className="ml-1 h-0 w-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-primary" />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Press: clean horizontal row of logos */}
      {press.length > 0 && (
        <section className="border-b border-border py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal as="p" className="eyebrow text-center md:text-left">
              As Seen In
            </Reveal>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8 md:justify-between">
              {press.map((p) =>
                p.logo_url ? (
                  <a
                    key={p.id}
                    href={p.link ?? undefined}
                    target={p.link ? "_blank" : undefined}
                    rel="noreferrer"
                    className="opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0"
                  >
                    <img
                      src={p.logo_url}
                      alt={p.source_name}
                      className="h-8 w-auto object-contain md:h-10"
                    />
                  </a>
                ) : (
                  <span
                    key={p.id}
                    className="font-serif text-lg text-muted-foreground transition-colors hover:text-primary"
                  >
                    {p.source_name}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* Close: confident contact CTA */}
      <section className="texture-paper py-20 md:py-28">
        <Reveal className="mx-auto flex max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Get in touch</p>
            <h2 className="mt-3 max-w-xl font-serif text-3xl text-primary sm:text-4xl md:text-5xl">
              For interviews, appearances, and reader letters.
            </h2>
          </div>
          <Link
            to="/contact"
            className="inline-flex w-fit shrink-0 items-center bg-primary px-8 py-4 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
          >
            Contact →
          </Link>
        </Reveal>
      </section>
    </>
  );
}
