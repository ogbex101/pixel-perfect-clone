import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Reveal } from "@/components/reveal";
import { PageHero } from "@/components/page-hero";
import { SITE_ART } from "@/lib/page-media";
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
    <>
      <PageHero
        eyebrow="Dispatches"
        title="News"
        subtitle="Challenge announcements, lore drops, and author updates."
        imageUrl={SITE_ART.door}
      />
      <div className="mx-auto max-w-4xl px-6 py-16">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading dispatches…</p>
      ) : !data || data.length === 0 ? (
        <div className="card-premium texture-paper p-10 text-center">
          <p className="eyebrow">Transmission silent</p>
          <p className="mt-3 font-serif text-2xl text-primary">No dispatches yet</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            New lore drops and challenge announcements land here first. In the meantime, the
            facility is waiting.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/books" className="btn-gold btn-sheen px-6 py-3 text-sm">
              Read the books
            </Link>
            <Link to="/debate" className="btn-outline-gold px-6 py-3 text-sm">
              Join the debate
            </Link>
          </div>
        </div>
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
    </>
  );
}
