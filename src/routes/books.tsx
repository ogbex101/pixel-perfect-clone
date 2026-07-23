import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const booksQuery = queryOptions({
  queryKey: ["books"],
  queryFn: async () => {
    const { data } = await supabase.from("books").select("*").order("display_order", { ascending: true });
    return data ?? [];
  },
});

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "Books — Nik Nanoski" },
      { name: "description", content: "All books by Nik Nanoski, including DUMB 31 and works in progress." },
      { property: "og:title", content: "Books — Nik Nanoski" },
      { property: "og:description", content: "Sci-fi novels by Nik Nanoski." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(booksQuery);
  },
  component: BooksLayout,
});

function BooksLayout() {
  const matches = useMatches();
  const isDetail = matches.some((m) => m.routeId === "/books/$bookId");
  if (isDetail) return <Outlet />;
  return <BooksIndex />;
}

function BooksIndex() {
  const { data: books } = useSuspenseQuery(booksQuery);
  return (
    <div>
      <h1>Books</h1>
      {books.length === 0 ? (
        <p>No books yet.</p>
      ) : (
        <ul>
          {books.map((b) => (
            <li key={b.id}>
              <Link to="/books/$bookId" params={{ bookId: b.id }}>{b.title}</Link>
              {" — "}{b.status}
              {b.short_description && <p>{b.short_description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}