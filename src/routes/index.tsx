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
  return (
    <div>
      <h1>{data.profile?.name ?? "Nik Nanoski"}</h1>
      {data.profile?.tagline && <p><strong>{data.profile.tagline}</strong></p>}
      {data.featured && (
        <section style={{ marginTop: "2rem" }}>
          <h2>Featured: {data.featured.title}</h2>
          <p>{data.featured.short_description}</p>
          <Link to="/books/$bookId" params={{ bookId: data.featured.id }}>Read more</Link>
        </section>
      )}
      <section style={{ marginTop: "2rem" }}>
        <h2>Books ({data.books.length})</h2>
        <ul>
          {data.books.map((b) => (
            <li key={b.id}>
              <Link to="/books/$bookId" params={{ bookId: b.id }}>{b.title}</Link> — {b.status}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
