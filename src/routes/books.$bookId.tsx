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
  head: ({ loaderData }) => {
    const title = loaderData?.book?.title ?? "Book";
    return {
      meta: [
        { title: `${title} — Nik Nanoski` },
        { name: "description", content: loaderData?.book?.short_description ?? "A novel by Nik Nanoski." },
        { property: "og:title", content: `${title} — Nik Nanoski` },
        { property: "og:description", content: loaderData?.book?.short_description ?? "A novel by Nik Nanoski." },
        { property: "og:type", content: "book" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData?.book?.cover_image_url
          ? [
              { property: "og:image", content: loaderData.book.cover_image_url },
              { name: "twitter:image", content: loaderData.book.cover_image_url },
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
      <div>
        <p>Book not found.</p>
        <Link to="/books">Back to books</Link>
      </div>
    );
  }
  const { book, characters } = data;
  return (
    <div>
      <Link to="/books">← All books</Link>
      <h1>{book.title}</h1>
      {book.genre && <p><em>{book.genre}</em></p>}
      {book.full_description && <p style={{ whiteSpace: "pre-wrap" }}>{book.full_description}</p>}
      {book.purchase_link && (
        <p><a href={book.purchase_link} target="_blank" rel="noreferrer">Purchase</a></p>
      )}
      {book.video_url && <p><a href={book.video_url} target="_blank" rel="noreferrer">Watch trailer</a></p>}
      {characters.length > 0 && (
        <section>
          <h2>Characters</h2>
          <ul>
            {characters.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong>{c.role ? `, "${c.role}"` : ""}
                {c.background && <p>{c.background}</p>}
                {c.quote && <blockquote>{c.quote}</blockquote>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}