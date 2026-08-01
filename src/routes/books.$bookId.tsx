import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";

const bookQuery = (bookId: string) =>
  queryOptions({
    queryKey: ["book", bookId],
    queryFn: async () => {
      const [book, characters] = await Promise.all([
        supabase.from("books").select("*").eq("id", bookId).maybeSingle(),
        supabase
          .from("characters")
          .select("*")
          .eq("book_id", bookId)
          .order("display_order", { ascending: true }),
      ]);
      return { book: book.data, characters: characters.data ?? [] };
    },
  });

export const Route = createFileRoute("/books/$bookId")({
  head: (ctx: {
    loaderData?: {
      book: {
        title: string;
        short_description: string | null;
        cover_image_url: string | null;
      } | null;
    };
  }) => {
    const book = ctx.loaderData?.book;
    const title = book?.title ?? "Book";
    return {
      meta: [
        { title: `${title} — Nik Nanoski` },
        { name: "description", content: book?.short_description ?? "A novel by Nik Nanoski." },
        { property: "og:title", content: `${title} — Nik Nanoski` },
        {
          property: "og:description",
          content: book?.short_description ?? "A novel by Nik Nanoski.",
        },
        { property: "og:type", content: "book" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(book?.cover_image_url
          ? [
              { property: "og:image", content: book.cover_image_url },
              { name: "twitter:image", content: book.cover_image_url },
            ]
          : []),
      ],
    };
  },
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData(bookQuery(params.bookId));
  },
  pendingComponent: BookDetailSkeleton,
  pendingMs: 200,
  pendingMinMs: 300,
  component: BookDetail,
});

function BookDetailSkeleton() {
  return (
    <article>
      <div className="min-h-[60vh] md:min-h-[80vh] border-b border-border">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    </article>
  );
}

function BookDetail() {
  const { bookId } = Route.useParams();
  const { data } = useSuspenseQuery(bookQuery(bookId));
  if (!data.book) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="eyebrow">Missing volume</p>
        <h1 className="mt-3 font-serif text-4xl text-primary">Book not found</h1>
        <Link
          to="/books"
          className="mt-6 inline-block border-b-2 border-accent pb-1 text-primary hover:text-[color:var(--brand-gold-bright)]"
        >
          ← Back to books
        </Link>
      </div>
    );
  }
  const { book, characters } = data;
  return (
    <article>
      {/* Cover dominates the top of the page: full-bleed hero */}
      <section className="relative border-b border-border texture-metal">
        <div className="relative min-h-[65vh] md:min-h-[92vh]">
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={`${book.title} cover`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary to-[color:var(--brand-rust)] p-10">
              <span className="font-serif text-4xl md:text-6xl text-primary-foreground text-center">
                {book.title}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-6xl px-6 pb-12 md:pb-16">
              <Reveal>
                <Link
                  to="/books"
                  className="eyebrow hover:text-[color:var(--brand-gold-bright)] link-underline"
                >
                  ← All books
                </Link>
                <p className="eyebrow mt-4">Volume · {book.status.replace("_", " ")}</p>
                <h1 className="mt-3 max-w-3xl font-serif text-5xl sm:text-6xl md:text-7xl leading-[1.02] text-primary">
                  {book.title}
                </h1>
                {book.genre && (
                  <p className="mt-3 italic text-foreground/80 md:text-lg">{book.genre}</p>
                )}
                <div className="mt-8 flex flex-wrap gap-4">
                  {book.purchase_link && (
                    <a
                      href={book.purchase_link}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-primary text-primary-foreground px-7 py-3.5 font-medium hover:bg-[color:var(--brand-gold-bright)] transition-colors"
                    >
                      Purchase
                    </a>
                  )}
                  {book.video_url && (
                    <a
                      href={book.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-primary text-primary px-7 py-3.5 font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      Watch trailer
                    </a>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {book.short_description && (
        <Reveal as="section" className="border-b border-border py-14 md:py-20 texture-paper">
          <p className="mx-auto max-w-3xl px-6 font-serif text-xl italic text-foreground/80 md:text-2xl">
            “{book.short_description}”
          </p>
        </Reveal>
      )}

      {book.full_description && (
        <Reveal as="section" className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <p className="eyebrow">The Story</p>
          <div className="mt-4 font-serif text-lg leading-relaxed text-foreground/85 whitespace-pre-wrap drop-cap">
            {book.full_description}
          </div>
        </Reveal>
      )}

      {characters.length > 0 && (
        <section className="border-t border-border bg-secondary/30 texture-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <Reveal className="border-b border-border pb-4">
              <p className="eyebrow">The Cast</p>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">Characters</h2>
            </Reveal>
            <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6">
              {characters.map((c, i) => (
                <Reveal
                  as="li"
                  key={c.id}
                  delay={(i % 4) * 80}
                  className="group relative aspect-[3/4] overflow-hidden border border-border bg-muted card-lift"
                >
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={c.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-accent/20 font-serif text-4xl text-primary">
                      {c.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                    <h3 className="font-serif text-base leading-tight text-primary md:text-lg">
                      {c.name}
                    </h3>
                    {c.role && (
                      <p className="mt-0.5 text-xs italic text-foreground/75 md:text-sm">
                        {c.role}
                      </p>
                    )}
                  </div>

                  {c.quote && (
                    <div className="absolute inset-0 flex items-center bg-background/95 p-4 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                      <blockquote className="font-serif text-sm italic leading-snug text-foreground/90 md:text-base">
                        “{c.quote}”
                      </blockquote>
                    </div>
                  )}
                </Reveal>
              ))}
            </ul>
            {characters.some((c) => c.background) && (
              <div className="mt-16 grid gap-10 sm:grid-cols-2">
                {characters
                  .filter((c) => c.background)
                  .map((c, i) => (
                    <Reveal
                      key={c.id}
                      delay={(i % 2) * 100}
                      className="border-l-2 border-accent pl-4"
                    >
                      <p className="eyebrow">{c.name}</p>
                      <p className="mt-2 text-sm text-foreground/80">{c.background}</p>
                    </Reveal>
                  ))}
              </div>
            )}
          </div>
        </section>
      )}
    </article>
  );
}
