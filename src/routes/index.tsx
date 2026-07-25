import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { QuoteRotator } from "@/components/quote-rotator";

const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [profile, featured, books] = await Promise.all([
      supabase.from("author_profile").select("*").maybeSingle(),
      supabase.from("books").select("*").eq("is_featured", true).maybeSingle(),
      supabase.from("books").select("*").order("display_order", { ascending: true }),
    ]);
    return {
      profile: profile.data,
      featured: featured.data,
      books: books.data ?? [],
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
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-8 space-y-5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-16 w-full max-w-md" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { profile, featured, books } = data;
  return (
    <>
      {/* Magazine masthead */}
      <section className="border-b border-border texture-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-8">
            <Reveal>
              <p className="eyebrow">Issue Nº 01 · Science Fiction</p>
              <h1 className="mt-4 font-serif text-4xl sm:text-5xl md:text-7xl leading-[1.02] text-primary">
                {profile?.name ?? "Nik Nanoski"}
              </h1>
              {profile?.tagline && (
                <p className="mt-6 font-serif italic text-xl md:text-3xl text-foreground/80 max-w-2xl">
                  “{profile.tagline}”
                </p>
              )}
              <hr className="rule-gold mt-8" />
            </Reveal>
          </div>
          <aside className="md:col-span-4 md:border-l md:border-border md:pl-8 flex flex-col justify-end">
            <Reveal delay={150}>
              {profile?.location && (
                <p className="text-sm text-muted-foreground">
                  <span className="eyebrow block mb-1">Dispatch from</span>
                  {profile.location}
                </p>
              )}
              <Link
                to="/about"
                className="mt-6 inline-flex w-fit items-center gap-2 border-b-2 border-accent pb-1 font-medium text-primary hover:text-[color:var(--brand-gold-bright)] hover:gap-3 transition-all"
              >
                Read the profile →
              </Link>
            </Reveal>
          </aside>
        </div>
      </section>

      {/* Featured book: editorial spread */}
      {featured && (
        <section className="border-b border-border bg-secondary/40 texture-metal vignette">
          <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-20 grid gap-12 md:grid-cols-12 items-center">
            <Reveal className="md:col-span-5 order-2 md:order-1">
              {featured.cover_image_url ? (
                <img
                  src={featured.cover_image_url}
                  alt={`${featured.title} cover`}
                  className="w-full max-w-sm mx-auto shadow-2xl rounded-sm border border-border/60"
                />
              ) : (
                <div className="aspect-[2/3] max-w-sm mx-auto bg-primary text-primary-foreground flex items-center justify-center p-8 border border-border/60">
                  <span className="font-serif text-3xl text-center">{featured.title}</span>
                </div>
              )}
            </Reveal>
            <Reveal delay={150} className="md:col-span-7 order-1 md:order-2">
              <p className="eyebrow">The Feature</p>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl text-primary">
                {featured.title}
              </h2>
              {featured.genre && (
                <p className="mt-2 italic text-muted-foreground">{featured.genre}</p>
              )}
              {featured.short_description && (
                <p className="mt-6 text-lg leading-relaxed text-foreground/85 drop-cap">
                  {featured.short_description}
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/books/$bookId"
                  params={{ bookId: featured.id }}
                  className="inline-flex items-center bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-[color:var(--brand-gold-bright)] transition-colors"
                >
                  Read more
                </Link>
                {featured.purchase_link && (
                  <a
                    href={featured.purchase_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center border border-primary px-6 py-3 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    Purchase
                  </a>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Author intro */}
      {profile?.bio && (
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20 grid gap-10 md:grid-cols-12 items-center">
            <Reveal className="md:col-span-4">
              <div className="aspect-square w-full max-w-xs mx-auto md:mx-0 rounded-full overflow-hidden border border-border bg-muted">
                {profile.hero_photo_url ? (
                  <img
                    src={profile.hero_photo_url}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-serif text-5xl text-primary bg-accent/20">
                    {profile.name?.charAt(0) ?? "N"}
                  </div>
                )}
              </div>
            </Reveal>
            <Reveal delay={150} className="md:col-span-8">
              <p className="eyebrow">The Author</p>
              <p className="mt-4 font-serif text-xl md:text-2xl leading-relaxed text-foreground/85 line-clamp-6 drop-cap">
                {profile.bio}
              </p>
              <Link
                to="/about"
                className="mt-6 inline-flex w-fit items-center gap-2 border-b-2 border-accent pb-1 font-medium text-primary hover:text-[color:var(--brand-gold-bright)] hover:gap-3 transition-all"
              >
                More about {profile.name} →
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* Quote rotator */}
      {profile?.quotes && profile.quotes.length > 0 && (
        <section className="border-b border-border bg-secondary/40 texture-paper">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <Reveal className="flex flex-col items-center text-center">
              <p className="eyebrow">In His Words</p>
              <div className="mt-6 w-full">
                <QuoteRotator quotes={profile.quotes} />
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Grid of remaining works */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <Reveal className="flex items-baseline justify-between border-b border-border pb-4">
          <h2 className="font-serif text-2xl sm:text-3xl text-primary">The Library</h2>
          <Link
            to="/books"
            className="text-sm eyebrow link-underline hover:text-[color:var(--brand-gold-bright)]"
          >
            All books →
          </Link>
        </Reveal>
        <ul className="mt-10 grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          {books.map((b, i) => (
            <Reveal as="li" key={b.id} delay={(i % 3) * 100} className="group">
              <Link
                to="/books/$bookId"
                params={{ bookId: b.id }}
                className="block card-lift border border-transparent p-2 -m-2 rounded-sm"
              >
                <div className="aspect-[3/4] bg-muted overflow-hidden mb-4 border border-border">
                  {b.cover_image_url ? (
                    <img
                      src={b.cover_image_url}
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-primary to-[color:var(--brand-rust)] text-primary-foreground">
                      <span className="font-serif text-2xl text-center">{b.title}</span>
                    </div>
                  )}
                </div>
                <p className="eyebrow">{b.status.replace("_", " ")}</p>
                <h3 className="mt-1 font-serif text-xl text-primary group-hover:text-[color:var(--brand-gold-bright)] transition-colors">
                  {b.title}
                </h3>
                {b.short_description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                    {b.short_description}
                  </p>
                )}
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>
    </>
  );
}
