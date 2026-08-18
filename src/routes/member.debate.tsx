import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Pin } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { MemberShell } from "@/components/member/member-shell";
import { MemberGate, type MemberCtx } from "@/lib/member-session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/member/debate")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Debate Forum — DUMB 31 Members" },
      { name: "description", content: "Member debate threads for the DUMB 31 community." },
      { property: "og:title", content: "Debate Forum — DUMB 31 Members" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <MemberGate>
      {(ctx) => (
        <MemberShell ctx={ctx}>
          <MemberDebate />
        </MemberShell>
      )}
    </MemberGate>
  ),
});

function MemberDebate() {
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
      return (topics.data ?? []).map((t) => ({
        ...t,
        commentCount: (comments.data ?? []).filter((c) => c.topic_id === t.id).length,
      }));
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:py-14">
      <Reveal variant="blur">
        <p className="eyebrow">Community floor</p>
        <h1 className="text-gradient-gold mt-2 pb-1 font-serif text-3xl sm:text-4xl">
          Debate forum
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Argue the hard questions: who deserved the surface, who lied, and what you would have
          done.
        </p>
      </Reveal>

      <div className="rule-gold my-8" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading topics…</p>
      ) : !data || data.length === 0 ? (
        <div className="card-premium p-10 text-center">
          <p className="eyebrow">Floor is empty</p>
          <p className="mt-3 font-serif text-2xl text-primary">No debate topics yet</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Topics open as the series unfolds. Check back after the next dispatch.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {data.map((topic, i) => (
            <Reveal as="li" key={topic.id} delay={i * 60}>
              <Link
                to="/member/debate/$topicId"
                params={{ topicId: topic.id }}
                className="card-premium flex items-start gap-4 p-5 transition-colors hover:border-primary"
              >
                {topic.image_url ? (
                  <img
                    src={topic.image_url}
                    alt=""
                    loading="lazy"
                    className="h-20 w-20 shrink-0 border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-border bg-secondary/40">
                    <MessageSquare className="h-6 w-6 text-primary/70" aria-hidden />
                  </div>
                )}
                <span className="min-w-0 flex-1">
                  {topic.is_pinned && (
                    <span className="mb-1 inline-flex items-center gap-1 text-xs text-primary">
                      <Pin className="h-3 w-3" aria-hidden />
                      Pinned
                    </span>
                  )}
                  <span className="block font-serif text-xl text-foreground">{topic.title}</span>
                  {topic.description && (
                    <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                      {topic.description}
                    </span>
                  )}
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {topic.commentCount} {topic.commentCount === 1 ? "comment" : "comments"}
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
