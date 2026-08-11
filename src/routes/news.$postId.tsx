import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Reveal } from "@/components/reveal";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/news/$postId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dispatch — DUMB 31 News" },
      { name: "description", content: "A dispatch from the world of DUMB 31." },
      { property: "og:title", content: "Dispatch — DUMB 31 News" },
      { property: "og:description", content: "A dispatch from the world of DUMB 31." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewsPost,
});

function NewsPost() {
  const { postId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["news", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .eq("id", postId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-sm text-muted-foreground">
        Loading dispatch…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl text-gradient-gold">Post not found</h1>
        <Link to="/news" className="mt-6 inline-block text-primary hover:underline">
          ← Back to news
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link to="/news" className="text-sm text-muted-foreground hover:text-primary">
        ← News
      </Link>
      <Reveal className="mt-6">
        <p className="eyebrow">
          {data.category ?? "news"}
          {data.published_at && ` · ${new Date(data.published_at).toLocaleDateString()}`}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-gradient-gold sm:text-4xl">{data.title}</h1>
      </Reveal>
      {data.image_url && (
        <img
          src={data.image_url}
          alt=""
          loading="lazy"
          className="mt-8 w-full border border-border object-cover"
        />
      )}
      <div className="rule-gold my-8" />
      <p className="whitespace-pre-line leading-relaxed text-foreground/85">{data.content}</p>
    </article>
  );
}