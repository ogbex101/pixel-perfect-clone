import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Reveal } from "@/components/reveal";
import { PageHero } from "@/components/page-hero";
import { SITE_ART } from "@/lib/page-media";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/debate/")({
  head: () => ({
    meta: [
      { title: "Debate Forum — DUMB 31 Community" },
      {
        name: "description",
        content:
          "Argue the hard questions from DUMB 31: who deserved the surface, who lied, and what you would have done.",
      },
      { property: "og:title", content: "Debate Forum — DUMB 31 Community" },
      {
        property: "og:description",
        content: "Reader debates on survival, secrecy, and the doors of DUMB 31.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DebateIndex,
});

function DebateIndex() {
  const { data, isLoading } = useQuery({
    queryKey: ["debate", "topics"],
    queryFn: async () => {
      const [topics, comments] = await Promise.all([
        supabase
          .from("debate_topics")
          .select("*")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("debate_comments")
          .select("topic_id, created_at")
          .or("is_hidden.is.null,is_hidden.eq.false"),
      ]);
      if (topics.error) throw topics.error;
      if (comments.error) throw comments.error;
      return (topics.data ?? []).map((t) => {
        const own = (comments.data ?? []).filter((c) => c.topic_id === t.id);
        const latest = own
          .map((c) => c.created_at)
          .filter(Boolean)
          .sort()
          .pop();
        return { ...t, commentCount: own.length, latest: latest ?? null };
      });
    },
  });

  return (
    <>
      <PageHero
        eyebrow="Community"
        title="Debate forum"
        subtitle="Some doors were never meant to be opened. Argue about who opened them anyway."
        imageUrl={SITE_ART.opie}
      />
      <div className="mx-auto max-w-4xl px-6 py-16">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading topics…</p>
      ) : !data || data.length === 0 ? (
        <div className="card-premium texture-paper p-10 text-center">
          <p className="eyebrow">Floor is empty</p>
          <p className="mt-3 font-serif text-2xl text-primary">No debate topics yet</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Topics open as the series unfolds. Sign in as a member to be first in the room.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {data.map((topic, i) => (
            <Reveal as="li" key={topic.id} delay={i * 60}>
              <Link
                to="/debate/$topicId"
                params={{ topicId: topic.id }}
                className="flex gap-5 border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                {topic.image_url && (
                  <img
                    src={topic.image_url}
                    alt=""
                    loading="lazy"
                    className="hidden h-24 w-32 shrink-0 object-cover sm:block"
                  />
                )}
                <div className="min-w-0">
                  {topic.is_pinned && <p className="eyebrow">Pinned</p>}
                  <h2 className="font-serif text-2xl text-primary">{topic.title}</h2>
                  {topic.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {topic.description}
                    </p>
                  )}
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {topic.commentCount} {topic.commentCount === 1 ? "comment" : "comments"}
                    {topic.latest &&
                      ` · last activity ${new Date(topic.latest).toLocaleDateString()}`}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
      </div>
    </>
  );
}
