import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Reveal } from "@/components/reveal";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: "News & Dispatches — DUMB 31" },
      {
        name: "description",
        content:
          "Challenge announcements, lore drops, and author updates from the world of DUMB 31.",
      },
      { property: "og:title", content: "News & Dispatches — DUMB 31" },
      {
        property: "og:description",
        content: "Challenge announcements, lore drops, and author updates from DUMB 31.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewsIndex,
});

function NewsIndex() {
  const { data, isLoading } = useQuery({
    queryKey: ["news", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Reveal>
        <p className="eyebrow">Dispatches</p>
        <h1 className="mt-2 font-serif text-4xl text-gradient-gold sm:text-5xl">News</h1>
      </Reveal>

      <div className="rule-gold my-10" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading dispatches…</p>
      ) : !data || data.length === 0 ? (
        <p className="text-muted-foreground">No posts published yet.</p>
      ) : (
        <ul className="space-y-8">
          {data.map((post, i) => (
            <Reveal as="li" key={post.id} delay={i * 60}>
              <Link
                to="/news/$postId"
                params={{ postId: post.id }}
                className="block border-b border-border pb-8 transition-colors hover:border-primary"
              >
                <p className="eyebrow">
                  {post.category ?? "news"}
                  {post.published_at && ` · ${new Date(post.published_at).toLocaleDateString()}`}
                </p>
                <h2 className="mt-2 font-serif text-2xl text-primary sm:text-3xl">{post.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {post.content}
                </p>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}