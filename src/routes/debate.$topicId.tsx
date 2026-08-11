import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { toast } from "sonner";
import { Reveal } from "@/components/reveal";
import { supabase } from "@/integrations/supabase/client";
import { postDebateComment, voteDebateComment } from "@/lib/member.functions";
import { getMemberToken } from "@/lib/member-session";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/debate/$topicId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Debate Topic — DUMB 31 Community" },
      {
        name: "description",
        content: "Read and join the discussion on this DUMB 31 debate topic.",
      },
      { property: "og:title", content: "Debate Topic — DUMB 31 Community" },
      { property: "og:description", content: "Join the discussion on this DUMB 31 debate topic." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DebateTopicPage,
});

type Comment = Tables<"debate_comments"> & { members: { full_name: string; avatar_url: string | null } | null };

function DebateTopicPage() {
  const { topicId } = Route.useParams();
  const queryClient = useQueryClient();
  const token = getMemberToken();
  const queryKey = ["debate", "topic", topicId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const [topic, comments] = await Promise.all([
        supabase.from("debate_topics").select("*").eq("id", topicId).maybeSingle(),
        supabase
          .from("debate_comments")
          .select("*, members(full_name, avatar_url)")
          .eq("topic_id", topicId)
          .eq("is_hidden", false)
          .order("created_at", { ascending: true }),
      ]);
      if (topic.error) throw topic.error;
      if (comments.error) throw comments.error;
      return { topic: topic.data, comments: (comments.data ?? []) as Comment[] };
    },
  });

  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [posting, setPosting] = useState(false);

  async function submit(text: string, parentId: string | null) {
    if (!token) return;
    if (!text.trim()) {
      toast.error("Write something first.");
      return;
    }
    setPosting(true);
    try {
      await postDebateComment({
        data: { token, topic_id: topicId, parent_id: parentId, content: text },
      });
      setContent("");
      setReplyContent("");
      setReplyTo(null);
      await queryClient.invalidateQueries({ queryKey });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post your comment.");
    } finally {
      setPosting(false);
    }
  }

  async function vote(commentId: string, direction: "up" | "down") {
    if (!token) {
      toast.error("Sign in to vote.");
      return;
    }
    try {
      await voteDebateComment({ data: { token, comment_id: commentId, direction } });
      await queryClient.invalidateQueries({ queryKey });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Vote failed.");
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-sm text-muted-foreground">
        Loading the thread…
      </div>
    );
  }

  if (!data?.topic) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl text-gradient-gold">Topic not found</h1>
        <Link to="/debate" className="mt-6 inline-block text-primary hover:underline">
          ← Back to the forum
        </Link>
      </div>
    );
  }

  const roots = data.comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => data.comments.filter((c) => c.parent_id === id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link to="/debate" className="text-sm text-muted-foreground hover:text-primary">
        ← Debate forum
      </Link>

      <Reveal className="mt-6">
        {data.topic.is_pinned && <p className="eyebrow">Pinned</p>}
        <h1 className="mt-1 font-serif text-3xl text-gradient-gold sm:text-4xl">
          {data.topic.title}
        </h1>
        {data.topic.description && (
          <p className="mt-4 leading-relaxed text-muted-foreground">{data.topic.description}</p>
        )}
        {data.topic.image_url && (
          <img
            src={data.topic.image_url}
            alt=""
            loading="lazy"
            className="mt-6 w-full border border-border object-cover"
          />
        )}
      </Reveal>

      <div className="rule-gold my-10" />

      {token ? (
        <div className="border border-border bg-card p-5">
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Make your case…"
            className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            disabled={posting}
            onClick={() => submit(content, null)}
            className="mt-3 bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)] disabled:opacity-50"
          >
            {posting ? "Posting…" : "Post comment"}
          </button>
        </div>
      ) : (
        <p className="border border-border bg-card p-5 text-sm text-muted-foreground">
          <Link to="/member/login" className="text-primary hover:underline">
            Sign in
          </Link>{" "}
          to join the debate.
        </p>
      )}

      <ul className="mt-10 space-y-6">
        {roots.length === 0 && (
          <li className="text-sm text-muted-foreground">No comments yet. Open the first door.</li>
        )}
        {roots.map((comment) => (
          <li key={comment.id}>
            <CommentCard comment={comment} onVote={vote} onReply={() => setReplyTo(comment.id)} />
            {replyTo === comment.id && token && (
              <div className="ml-6 mt-3 border-l border-border pl-4">
                <textarea
                  rows={2}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Reply…"
                  className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    disabled={posting}
                    onClick={() => submit(replyContent, comment.id)}
                    className="bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                  >
                    Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {repliesOf(comment.id).length > 0 && (
              <ul className="ml-6 mt-4 space-y-4 border-l border-border pl-4">
                {repliesOf(comment.id).map((reply) => (
                  <li key={reply.id}>
                    <CommentCard comment={reply} onVote={vote} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CommentCard({
  comment,
  onVote,
  onReply,
}: {
  comment: Comment;
  onVote: (id: string, direction: "up" | "down") => void;
  onReply?: () => void;
}) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 overflow-hidden rounded-full border border-border bg-background">
          {comment.members?.avatar_url ? (
            <img src={comment.members.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-primary">
              {(comment.members?.full_name ?? "?").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <p className="text-sm text-foreground/90">{comment.members?.full_name ?? "Member"}</p>
        <p className="text-xs text-muted-foreground">
          {comment.created_at ? new Date(comment.created_at).toLocaleString() : ""}
        </p>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
        {comment.content}
      </p>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => onVote(comment.id, "up")}
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <ArrowBigUp className="h-4 w-4" /> {comment.upvotes ?? 0}
        </button>
        <button
          type="button"
          onClick={() => onVote(comment.id, "down")}
          className="inline-flex items-center gap-1 hover:text-destructive"
        >
          <ArrowBigDown className="h-4 w-4" /> {comment.downvotes ?? 0}
        </button>
        {onReply && (
          <button type="button" onClick={onReply} className="hover:text-primary">
            Reply
          </button>
        )}
      </div>
    </div>
  );
}