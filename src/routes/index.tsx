import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      { name: "description", content: "Science fiction author Nik Nanoski. Author of DUMB 31, a post-apocalyptic novel about survival and inherited lies." },
      { property: "og:title", content: "Nik Nanoski — Science Fiction Author" },
      { property: "og:description", content: "Sci-fi author exploring what remains after civilization ends." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(homeQuery);
  },
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { profile, featured, books } = data;
  return (
    <>
      {/* Magazine masthead */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-8">
            <p className="eyebrow">Issue Nº 01 · Science Fiction</p>
            <h1 className="mt-4 font-serif text-5xl md:text-7xl leading-[1.02] text-primary">
              {profile?.name ?? "Nik Nanoski"}
            </h1>
            {profile?.tagline && (
              <p className="mt-6 font-serif italic text-2xl md:text-3xl text-foreground/80 max-w-2xl">
                “{profile.tagline}”
              </p>
            )}
            <hr className="rule-gold mt-8" />
          </div>
          <aside className="md:col-span-4 md:border-l md:border-border md:pl-8 flex flex-col justify-end">
            {profile?.location && (
              <p className="text-sm text-muted-foreground">
                <span className="eyebrow block mb-1">Dispatch from</span>
                {profile.location}
              </p>
            )}
            <Link
              to="/about"
              className="mt-6 inline-flex w-fit items-center gap-2 border-b-2 border-accent pb-1 font-medium text-primary hover:text-accent transition-colors"
            >
              Read the profile →
            </Link>
          </aside>
        </div>
      </section>

      {/* Featured book: editorial spread */}
      {featured && (
        <section className="border-b border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-6 py-20 grid gap-12 md:grid-cols-12 items-center">
            <div className="md:col-span-5 order-2 md:order-1">
              {featured.cover_image_url ? (
                <img
                  src={featured.cover_image_url}
                  alt={`${featured.title} cover`}
                  className="w-full max-w-sm mx-auto shadow-2xl rounded-sm"
                />
              ) : (
                <div className="aspect-[2/3] max-w-sm mx-auto bg-primary text-primary-foreground flex items-center justify-center p-8">
                  <span className="font-serif text-3xl text-center">{featured.title}</span>
                </div>
              )}
            </div>
            <div className="md:col-span-7 order-1 md:order-2">
              <p className="eyebrow">The Feature</p>
              <h2 className="mt-3 font-serif text-4xl md:text-5xl text-primary">{featured.title}</h2>
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
                  className="inline-flex items-center bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-[color:var(--brand-rust)] transition-colors"
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
            </div>
          </div>
        </section>
      )}

      {/* Grid of remaining works */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-baseline justify-between border-b border-border pb-4">
          <h2 className="font-serif text-3xl text-primary">The Library</h2>
          <Link to="/books" className="text-sm eyebrow hover:text-accent">All books →</Link>
        </div>
        <ul className="mt-10 grid gap-10 md:grid-cols-3">
          {books.map((b) => (
            <li key={b.id} className="group">
              <Link to="/books/$bookId" params={{ bookId: b.id }} className="block">
                <div className="aspect-[3/4] bg-muted overflow-hidden mb-4 border border-border">
                  {b.cover_image_url ? (
                    <img src={b.cover_image_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-primary to-[color:var(--brand-rust)] text-primary-foreground">
                      <span className="font-serif text-2xl text-center">{b.title}</span>
                    </div>
                  )}
                </div>
                <p className="eyebrow">{b.status.replace("_", " ")}</p>
                <h3 className="mt-1 font-serif text-xl text-primary group-hover:text-accent transition-colors">{b.title}</h3>
                {b.short_description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{b.short_description}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
