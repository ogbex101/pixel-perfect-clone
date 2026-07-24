import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const bookQuery = (bookId: string) =>
  queryOptions({
    queryKey: ["book", bookId],
    queryFn: async () => {
      const [book, characters] = await Promise.all([
        supabase.from("books").select("*").eq("id", bookId).maybeSingle(),
        supabase.from("characters").select("*").eq("book_id", bookId).order("display_order", { ascending: true }),
      ]);
      return { book: book.data, characters: characters.data ?? [] };
    },
  });

export const Route = createFileRoute("/books/$bookId")({
  head: (ctx: { loaderData?: { book: { title: string; short_description: string | null; cover_image_url: string | null } | null } }) => {
    const book = ctx.loaderData?.book;
    const title = book?.title ?? "Book";
    return {
      meta: [
        { title: `${title} — Nik Nanoski` },
        { name: "description", content: book?.short_description ?? "A novel by Nik Nanoski." },
        { property: "og:title", content: `${title} — Nik Nanoski` },
        { property: "og:description", content: book?.short_description ?? "A novel by Nik Nanoski." },
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
  component: BookDetail,
});

function BookDetail() {
  const { bookId } = Route.useParams();
  const { data } = useSuspenseQuery(bookQuery(bookId));
  if (!data.book) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="eyebrow">Missing volume</p>
        <h1 className="mt-3 font-serif text-4xl text-primary">Book not found</h1>
        <Link to="/books" className="mt-6 inline-block border-b-2 border-accent pb-1 text-primary hover:text-accent">← Back to books</Link>
      </div>
    );
  }
  const { book, characters } = data;
  return (
    <article>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-16 grid gap-12 md:grid-cols-12 items-start">
          <div className="md:col-span-5">
            <Link to="/books" className="eyebrow hover:text-accent">← All books</Link>
            {book.cover_image_url ? (
              <img src={book.cover_image_url} alt={`${book.title} cover`} className="mt-4 w-full shadow-2xl rounded-sm" />
            ) : (
              <div className="mt-4 aspect-[2/3] bg-gradient-to-br from-primary to-[color:var(--brand-rust)] text-primary-foreground flex items-center justify-center p-10">
                <span className="font-serif text-4xl text-center">{book.title}</span>
              </div>
            )}
          </div>
          <div className="md:col-span-7">
            <p className="eyebrow">Volume · {book.status.replace("_", " ")}</p>
            <h1 className="mt-3 font-serif text-5xl md:text-6xl text-primary">{book.title}</h1>
            {book.genre && <p className="mt-2 italic text-muted-foreground">{book.genre}</p>}
            <hr className="rule-gold mt-6" />
            {book.short_description && (
              <p className="mt-6 font-serif italic text-xl text-foreground/80">{book.short_description}</p>
            )}
            <div className="mt-8 flex flex-wrap gap-4">
              {book.purchase_link && (
                <a href={book.purchase_link} target="_blank" rel="noreferrer" className="bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-[color:var(--brand-rust)] transition-colors">
                  Purchase
                </a>
              )}
              {book.video_url && (
                <a href={book.video_url} target="_blank" rel="noreferrer" className="border border-primary text-primary px-6 py-3 font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                  Watch trailer
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
      {book.full_description && (
        <section className="mx-auto max-w-3xl px-6 py-20">
          <p className="eyebrow">The Story</p>
          <div className="mt-4 font-serif text-lg leading-relaxed text-foreground/85 whitespace-pre-wrap drop-cap">
            {book.full_description}
          </div>
        </section>
      )}
      {characters.length > 0 && (
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="border-b border-border pb-4">
              <p className="eyebrow">The Cast</p>
              <h2 className="mt-2 font-serif text-4xl text-primary">Characters</h2>
            </div>
            <ul className="mt-10 grid gap-10 md:grid-cols-2">
              {characters.map((c) => (
                <li key={c.id} className="grid grid-cols-[80px_minmax(0,1fr)] gap-5">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-serif text-2xl text-primary bg-accent/30">
                        {c.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl text-primary">{c.name}</h3>
                    {c.role && <p className="italic text-sm text-muted-foreground">{c.role}</p>}
                    {c.background && <p className="mt-2 text-sm text-foreground/80">{c.background}</p>}
                    {c.quote && (
                      <blockquote className="mt-3 border-l-2 border-accent pl-3 font-serif italic text-foreground/75">
                        “{c.quote}”
                      </blockquote>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}