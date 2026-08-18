import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Reveal } from "@/components/reveal";
import { MemberShell } from "@/components/member/member-shell";
import { MemberGate } from "@/lib/member-session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/member/news")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dispatches — DUMB 31 Members" },
      { name: "description", content: "Challenge announcements and lore drops for members." },
      { property: "og:title", content: "Dispatches — DUMB 31 Members" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <MemberGate>
      {(ctx) => (
        <MemberShell ctx={ctx}>
          <MemberNews />
        </MemberShell>
      )}
    </MemberGate>
  ),
});

function MemberNews() {
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
    <div className="mx-auto max-w-4xl px-6 py-10 md:py-14">
      <Reveal variant="blur">
        <p className="eyebrow">Dispatches</p>
        <h1 className="text-gradient-gold mt-2 pb-1 font-serif text-3xl sm:text-4xl">News</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Challenge announcements, lore drops, and author updates.
        </p>
      </Reveal>

      <div className="rule-gold my-8" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading dispatches…</p>
      ) : !data || data.length === 0 ? (
        <div className="card-premium p-10 text-center">
          <p className="eyebrow">Transmission silent</p>
          <p className="mt-3 font-serif text-2xl text-primary">No dispatches yet</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {data.map((post, i) => (
            <Reveal as="li" key={post.id} delay={i * 60}>
              <Link
                to="/member/news/$postId"
                params={{ postId: post.id }}
                className="card-premium flex items-start gap-4 p-5 transition-colors hover:border-primary"
              >
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt=""
                    loading="lazy"
                    className="h-20 w-28 shrink-0 border border-border object-cover"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="eyebrow block">
                    {post.category ?? "news"}
                    {post.published_at &&
                      ` · ${new Date(post.published_at).toLocaleDateString()}`}
                  </span>
                  <span className="mt-1 block font-serif text-xl text-foreground">
                    {post.title}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                    {post.content}
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}
