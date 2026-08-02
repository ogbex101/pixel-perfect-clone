import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { QuoteRotator } from "@/components/quote-rotator";

const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [profile, featured, books, featuredVideo, press, testimonials, sections] =
      await Promise.all([
        supabase.from("author_profile").select("*").maybeSingle(),
        supabase.from("books").select("*").eq("is_featured", true).maybeSingle(),
        supabase.from("books").select("*").order("display_order", { ascending: true }),
        supabase.from("videos").select("*").eq("is_featured", true).maybeSingle(),
        supabase.from("press_mentions").select("*").order("display_order", { ascending: true }),
        supabase.from("testimonials").select("*").order("display_order", { ascending: true }),
        supabase
          .from("landing_page_sections")
          .select("*")
          .order("display_order", { ascending: true }),
      ]);
    return {
      profile: profile.data,
      featured: featured.data,
      books: books.data ?? [],
      featuredVideo: featuredVideo.data,
      press: press.data ?? [],
      testimonials: testimonials.data ?? [],
      sections: sections.data ?? [],
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
      <div className="min-h-[80vh] border-b border-border">
        <Skeleton className="h-[80vh] w-full rounded-none" />
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

/* --- Shared section furniture -------------------------------------------- */

function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <Reveal className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div>
        <p className="eyebrow track-in">{eyebrow}</p>
        <h2 className="text-gradient-gold mt-2 pb-1 font-serif text-3xl sm:text-4xl md:text-[2.75rem]">
          {title}
        </h2>
      </div>
      {action}
    </Reveal>
  );
}

/* --- Individual homepage sections ---------------------------------------- */

function HeroSection({
  videoUrl,
  title,
  tagline,
  ctaBookId,
  ctaBookTitle,
  purchaseLink,
}: {
  videoUrl: string | null;
  title: string;
  tagline: string | null;
  ctaBookId: string | null;
  ctaBookTitle: string | null;
  purchaseLink: string | null;
}) {
  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden border-b border-border md:min-h-screen">
      {videoUrl ? (
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 texture-metal bg-gradient-to-br from-[color:var(--brand-ink)] via-background to-[color:var(--brand-ink)]" />
      )}

      {/* Cinematic grading: darkened edges keep the type legible over any footage */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/75" />
      <div className="absolute inset-0 vignette" />

      <div className="relative mx-auto w-full max-w-4xl px-6 py-24 text-center">
        <Reveal variant="blur">
          <p className="eyebrow track-in">Science Fiction Author</p>
        </Reveal>
        <Reveal variant="blur" delay={140}>
          <h1 className="text-gradient-gold mt-6 pb-2 font-serif text-5xl leading-[1.04] sm:text-6xl md:text-7xl lg:text-8xl">
            {title}
          </h1>
        </Reveal>
        {tagline && (
          <Reveal variant="blur" delay={280}>
            <p className="mx-auto mt-7 max-w-2xl font-serif text-lg italic text-foreground/80 md:text-2xl">
              “{tagline}”
            </p>
          </Reveal>
        )}
        <Reveal variant="blur" delay={400}>
          <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
            {ctaBookId && ctaBookTitle ? (
              <>
                <Link
                  to="/books/$bookId"
                  params={{ bookId: ctaBookId }}
                  className="btn-sheen inline-flex items-center bg-primary px-8 py-4 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
                >
                  Read {ctaBookTitle} →
                </Link>
                {purchaseLink && (
                  <a
                    href={purchaseLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-sheen inline-flex items-center border border-primary px-8 py-4 font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    Purchase
                  </a>
                )}
              </>
            ) : (
              <Link
                to="/books"
                className="btn-sheen inline-flex items-center bg-primary px-8 py-4 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
              >
                Explore the books →
              </Link>
            )}
          </div>
        </Reveal>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <span className="eyebrow text-[0.6rem] opacity-70">Scroll</span>
        <span className="scroll-cue block h-7 w-px bg-gradient-to-b from-[color:var(--brand-gold)] to-transparent" />
      </div>
    </section>
  );
}

function FeaturedBookSection({
  book,
}: {
  book: {
    id: string;
    title: string;
    genre: string | null;
    status: string;
    short_description: string | null;
    cover_image_url: string | null;
    purchase_link: string | null;
  };
}) {
  return (
    <section className="border-b border-border overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <SectionHeading eyebrow="The Feature" title="Now Available" />
        <div className="mt-12 grid items-center gap-10 md:grid-cols-12 md:gap-16">
          <Reveal variant="left" className="md:col-span-5">
            <Link
              to="/books/$bookId"
              params={{ bookId: book.id }}
              className="card-premium img-shine group block aspect-[2/3] overflow-hidden"
            >
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt={`${book.title} cover`}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-[color:var(--brand-rust)] p-6">
                  <span className="text-center font-serif text-3xl text-primary-foreground">
                    {book.title}
                  </span>
                </div>
              )}
            </Link>
          </Reveal>

          <Reveal variant="right" delay={140} className="md:col-span-7">
            <p className="eyebrow">{book.status.replace("_", " ")}</p>
            <h3 className="text-gradient-gold mt-3 pb-1 font-serif text-4xl leading-[1.08] md:text-5xl">
              {book.title}
            </h3>
            {book.genre && (
              <p className="mt-3 italic text-foreground/75 md:text-lg">{book.genre}</p>
            )}
            <hr className="rule-gold rule-draw mt-7" />
            {book.short_description && (
              <p className="mt-7 max-w-xl font-serif text-lg leading-relaxed text-foreground/85 md:text-xl">
                {book.short_description}
              </p>
            )}
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/books/$bookId"
                params={{ bookId: book.id }}
                className="btn-sheen inline-flex items-center bg-primary px-7 py-3.5 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
              >
                Read more →
              </Link>
              {book.purchase_link && (
                <a
                  href={book.purchase_link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-sheen inline-flex items-center border border-primary px-7 py-3.5 font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  Purchase
                </a>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function AuthorIntroSection({
  name,
  bio,
  photoUrl,
}: {
  name: string;
  bio: string;
  photoUrl: string | null;
}) {
  return (
    <section className="border-b border-border overflow-hidden">
      <div className="grid md:grid-cols-12">
        <Reveal
          variant="left"
          className="img-shine relative order-1 min-h-[380px] overflow-hidden md:col-span-5 md:min-h-[600px]"
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.8s] ease-out hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-accent/15 texture-paper font-serif text-8xl text-primary">
              {name.charAt(0)}
            </div>
          )}
        </Reveal>
        <Reveal variant="right" delay={150} className="order-2 flex items-center md:col-span-7">
          <div className="max-w-2xl px-6 py-16 md:px-16 md:py-24">
            <p className="eyebrow track-in">The Author</p>
            <h2 className="text-gradient-gold mt-3 pb-1 font-serif text-3xl md:text-4xl">{name}</h2>
            <hr className="rule-gold rule-draw mt-6" />
            <p className="mt-8 font-serif text-xl leading-relaxed text-foreground/90 md:text-2xl">
              {bio}
            </p>
            <Link
              to="/about"
              className="mt-9 inline-flex w-fit items-center gap-2 border-b-2 border-accent pb-1 font-medium text-primary transition-all hover:gap-3 hover:text-[color:var(--brand-gold-bright)]"
            >
              More about {name} →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function QuoteSection({ quotes }: { quotes: string[] }) {
  return (
    <section className="overflow-hidden border-b border-border bg-secondary/40 texture-metal py-24 md:py-36">
      <Reveal variant="zoom" className="px-6 text-center md:px-16">
        <div className="ornament mx-auto mb-12 max-w-md">
          <span aria-hidden className="text-xs tracking-[0.3em]">
            ✦
          </span>
        </div>
        <QuoteRotator quotes={quotes} size="display" />
      </Reveal>
    </section>
  );
}

function LibrarySection({
  books,
}: {
  books: Array<{
    id: string;
    title: string;
    status: string;
    short_description: string | null;
    cover_image_url: string | null;
  }>;
}) {
  return (
    <section className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="The Catalogue"
          title="The Library"
          action={
            <Link
              to="/books"
              className="eyebrow link-underline text-sm hover:text-[color:var(--brand-gold-bright)]"
            >
              All books →
            </Link>
          }
        />
      </div>
      <ul className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-6 md:gap-8 md:px-14">
        {books.map((b, i) => (
          <Reveal
            as="li"
            key={b.id}
            variant="zoom"
            delay={(i % 3) * 110}
            className="w-60 shrink-0 snap-start sm:w-72 md:w-80"
          >
            <Link to="/books/$bookId" params={{ bookId: b.id }} className="group block">
              <div className="card-premium img-shine relative aspect-[2/3] overflow-hidden">
                {b.cover_image_url ? (
                  <img
                    src={b.cover_image_url}
                    alt={b.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-[color:var(--brand-rust)] p-4 text-primary-foreground">
                    <span className="text-center font-serif text-2xl">{b.title}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                {b.short_description && (
                  <div className="absolute inset-x-0 bottom-0 translate-y-full border-t border-primary/30 bg-background/95 p-4 backdrop-blur-sm transition-transform duration-500 ease-out group-hover:translate-y-0">
                    <p className="line-clamp-4 text-xs text-foreground/85">{b.short_description}</p>
                  </div>
                )}
              </div>
              <p className="eyebrow mt-4">{b.status.replace("_", " ")}</p>
              <h3 className="mt-1 font-serif text-xl text-primary transition-colors duration-300 group-hover:text-[color:var(--brand-gold-bright)]">
                {b.title}
              </h3>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function CinematicSection({
  video,
}: {
  video: { title: string; description: string | null; thumbnail_url: string | null };
}) {
  return (
    <section className="overflow-hidden border-b border-border">
      <div className="grid md:grid-cols-12">
        <Reveal
          variant="left"
          delay={100}
          className="order-2 flex items-center bg-secondary/30 md:order-1 md:col-span-5"
        >
          <div className="px-6 py-16 md:px-14 md:py-20">
            <p className="eyebrow track-in">Cinematic</p>
            <h2 className="text-gradient-gold mt-3 pb-1 font-serif text-3xl md:text-4xl">
              {video.title}
            </h2>
            <hr className="rule-gold rule-draw mt-6" />
            {video.description && (
              <p className="mt-6 leading-relaxed text-foreground/80">{video.description}</p>
            )}
            <Link
              to="/cinematic"
              className="mt-9 inline-flex w-fit items-center gap-2 border-b-2 border-accent pb-1 font-medium text-primary transition-all hover:gap-3 hover:text-[color:var(--brand-gold-bright)]"
            >
              Watch on Cinematic →
            </Link>
          </div>
        </Reveal>
        <Reveal
          variant="clip"
          className="img-shine group relative order-1 min-h-[320px] overflow-hidden texture-metal md:order-2 md:col-span-7 md:min-h-[540px]"
        >
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <span className="text-center font-serif text-3xl text-primary">{video.title}</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="play-pulse flex h-16 w-16 items-center justify-center rounded-full border border-primary/60 bg-background/70 backdrop-blur transition-transform duration-500 group-hover:scale-110 md:h-20 md:w-20">
              <div className="ml-1 h-0 w-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-primary" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function TestimonialsSection({
  testimonials,
}: {
  testimonials: Array<{
    id: string;
    quote_text: string;
    reviewer_name: string;
    rating: number | null;
  }>;
}) {
  return (
    <section className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Reader Praise"
          title="What Readers Say"
          action={
            <Link
              to="/testimonials"
              className="eyebrow link-underline text-sm hover:text-[color:var(--brand-gold-bright)]"
            >
              All praise →
            </Link>
          }
        />
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.slice(0, 3).map((t, i) => (
            <Reveal
              as="li"
              key={t.id}
              variant="zoom"
              delay={(i % 3) * 110}
              className="card-premium texture-paper relative p-7"
            >
              <span
                aria-hidden
                className="text-gradient-gold absolute -top-5 left-5 font-serif text-6xl leading-none opacity-80"
              >
                “
              </span>
              <blockquote className="font-serif text-base italic leading-relaxed text-foreground/85">
                {t.quote_text}
              </blockquote>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <p className="eyebrow">— {t.reviewer_name}</p>
                {t.rating != null && (
                  <p className="tracking-widest text-[color:var(--brand-gold)]">
                    {"★".repeat(t.rating)}
                    <span className="text-muted-foreground/40">
                      {"★".repeat(Math.max(0, 5 - t.rating))}
                    </span>
                  </p>
                )}
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PressSection({
  press,
}: {
  press: Array<{ id: string; source_name: string; logo_url: string | null; link: string | null }>;
}) {
  return (
    <section className="overflow-hidden border-b border-border py-16 md:py-20">
      <Reveal as="p" className="eyebrow track-in text-center">
        As Seen In
      </Reveal>
      <Reveal delay={150} className="relative mt-10">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
        <div className="marquee-track items-center gap-16 pr-16 md:gap-24 md:pr-24">
          {[...press, ...press].map((p, i) =>
            p.logo_url ? (
              <a
                key={`${p.id}-${i}`}
                href={p.link ?? undefined}
                target={p.link ? "_blank" : undefined}
                rel="noreferrer"
                className="shrink-0 opacity-60 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0"
              >
                <img
                  src={p.logo_url}
                  alt={p.source_name}
                  className="h-8 w-auto object-contain md:h-10"
                />
              </a>
            ) : (
              <span
                key={`${p.id}-${i}`}
                className="shrink-0 font-serif text-lg text-muted-foreground transition-colors duration-500 hover:text-primary"
              >
                {p.source_name}
              </span>
            ),
          )}
        </div>
      </Reveal>
    </section>
  );
}

function ContactCtaSection() {
  return (
    <section className="texture-paper py-20 md:py-28">
      <Reveal
        variant="blur"
        className="mx-auto flex max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p className="eyebrow track-in">Get in touch</p>
          <h2 className="text-gradient-gold mt-3 max-w-xl pb-1 font-serif text-3xl sm:text-4xl md:text-5xl">
            For interviews, appearances, and reader letters.
          </h2>
        </div>
        <Link
          to="/contact"
          className="btn-sheen inline-flex w-fit shrink-0 items-center bg-primary px-8 py-4 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
        >
          Contact →
        </Link>
      </Reveal>
    </section>
  );
}

/* --- Page ----------------------------------------------------------------- */

/**
 * Fallback order used when the landing_page_sections table hasn't been
 * populated yet, so the homepage never renders blank.
 */
const DEFAULT_SECTION_ORDER = [
  "hero",
  "featured_book",
  "author_intro",
  "quote_rotator",
  "books_preview_grid",
  "cinematic_preview",
  "testimonials_preview",
  "press_preview",
  "contact_cta",
];

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { profile, featured, books, featuredVideo, press, testimonials, sections } = data;

  // Each section renders only when the admin has it visible AND it has content.
  const renderers: Record<string, () => ReactNode> = {
    hero: () => (
      <HeroSection
        key="hero"
        videoUrl={profile?.hero_video_url ?? null}
        title={profile?.name ?? "Nik Nanoski"}
        tagline={profile?.tagline ?? null}
        ctaBookId={featured?.id ?? null}
        ctaBookTitle={featured?.title ?? null}
        purchaseLink={featured?.purchase_link ?? null}
      />
    ),
    featured_book: () =>
      featured ? <FeaturedBookSection key="featured_book" book={featured} /> : null,
    author_intro: () =>
      profile?.bio ? (
        <AuthorIntroSection
          key="author_intro"
          name={profile.name}
          bio={profile.bio}
          photoUrl={profile.hero_photo_url}
        />
      ) : null,
    quote_rotator: () =>
      profile?.quotes && profile.quotes.length > 0 ? (
        <QuoteSection key="quote_rotator" quotes={profile.quotes} />
      ) : null,
    books_preview_grid: () =>
      books.length > 0 ? <LibrarySection key="books_preview_grid" books={books} /> : null,
    cinematic_preview: () =>
      featuredVideo ? <CinematicSection key="cinematic_preview" video={featuredVideo} /> : null,
    testimonials_preview: () =>
      testimonials.length > 0 ? (
        <TestimonialsSection key="testimonials_preview" testimonials={testimonials} />
      ) : null,
    press_preview: () =>
      press.length > 0 ? <PressSection key="press_preview" press={press} /> : null,
    contact_cta: () => <ContactCtaSection key="contact_cta" />,
  };

  const order =
    sections.length > 0
      ? sections.filter((s) => s.is_visible).map((s) => s.section_key)
      : DEFAULT_SECTION_ORDER;

  return <>{order.map((key) => renderers[key]?.() ?? null)}</>;
}
