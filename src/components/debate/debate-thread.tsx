// The full debate thread UI, shared by the public /debate/$topicId route and
// the signed-in /member/debate/$topicId route so members keep their sidebar.
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { toast } from "sonner";
import { Reveal } from "@/components/reveal";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteDebateComment,
  editDebateComment,
  postDebateComment,
  voteDebateComment,
} from "@/lib/member.functions";
import { getMemberToken, useMemberContext } from "@/lib/member-session";
import type { Tables } from "@/integrations/supabase/types";

export type DebateBackTo = "/debate" | "/member/debate";

type Comment = Tables<"debate_comments"> & {
  members: { full_name: string; avatar_url: string | null } | null;
};

type SortMode = "newest" | "top";

function score(c: Comment) {
  return (c.upvotes ?? 0) - (c.downvotes ?? 0);
}

export function DebateThread({ topicId, backTo }: { topicId: string; backTo: DebateBackTo }) {
  const queryClient = useQueryClient();
  const token = getMemberToken();
  const { data: me } = useMemberContext();
  const myId = me?.member.id ?? null;
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
          .or("is_hidden.is.null,is_hidden.eq.false")
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
  const [sort, setSort] = useState<SortMode>("newest");

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

  async function saveEdit(commentId: string, text: string) {
    if (!token) return;
    try {
      await editDebateComment({ data: { token, comment_id: commentId, content: text } });
      toast.success("Comment updated.");
      await queryClient.invalidateQueries({ queryKey });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your edit.");
      throw err;
    }
  }

  async function removeComment(commentId: string) {
    if (!token) return;
    try {
      const result = await deleteDebateComment({ data: { token, comment_id: commentId } });
      toast.success(
        result.blanked ? "Comment removed — its replies were kept." : "Comment deleted.",
      );
      await queryClient.invalidateQueries({ queryKey });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete your comment.");
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
        <Link to={backTo} className="mt-6 inline-block text-primary hover:underline">
          ← Back to the forum
        </Link>
      </div>
    );
  }

  // Only root comments re-order; replies always stay in the order they were written.
  const roots = data.comments
    .filter((c) => !c.parent_id)
    .sort((a, b) =>
      sort === "top"
        ? score(b) - score(a) ||
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        : new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
    );
  const repliesOf = (id: string) => data.comments.filter((c) => c.parent_id === id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link to={backTo} className="text-sm text-muted-foreground hover:text-primary">
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

      {roots.length > 0 && (
        <div className="mt-8 flex items-center justify-between gap-4 border-b border-border pb-3">
          <p className="text-sm text-muted-foreground">
            {roots.length} {roots.length === 1 ? "comment" : "comments"}
          </p>
          <div className="flex items-center gap-1" role="group" aria-label="Sort comments">
            {(
              [
                ["newest", "Newest"],
                ["top", "Most upvoted"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSort(value)}
                aria-pressed={sort === value}
                className={`border px-3 py-1.5 text-xs transition-colors ${
                  sort === value
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="mt-8 space-y-6">
        {roots.length === 0 && (
          <li className="text-sm text-muted-foreground">No comments yet. Open the first door.</li>
        )}
        {roots.map((comment) => (
          <li key={comment.id}>
            <CommentCard
              comment={comment}
              isMine={Boolean(myId) && comment.member_id === myId}
              onVote={vote}
              onReply={token ? () => setReplyTo(comment.id) : undefined}
              onSaveEdit={saveEdit}
              onDelete={removeComment}
            />
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
                    <CommentCard
                      comment={reply}
                      isMine={Boolean(myId) && reply.member_id === myId}
                      onVote={vote}
                      onSaveEdit={saveEdit}
                      onDelete={removeComment}
                    />
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
  isMine,
  onVote,
  onReply,
  onSaveEdit,
  onDelete,
}: {
  comment: Comment;
  isMine: boolean;
  onVote: (id: string, direction: "up" | "down") => void;
  onReply?: () => void;
  onSaveEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleSave() {
    if (!draft.trim()) {
      toast.error("A comment can't be empty.");
      return;
    }
    setSaving(true);
    try {
      await onSaveEdit(comment.id, draft);
      setEditing(false);
    } catch {
      /* the handler already reported it */
    } finally {
      setSaving(false);
    }
  }

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
        {isMine && (
          <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-primary">
            You
          </span>
        )}
      </div>

      {editing ? (
        <div className="mt-3">
          <textarea
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(comment.content);
                setEditing(false);
              }}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
          {comment.content}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
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
        {onReply && !editing && (
          <button type="button" onClick={onReply} className="hover:text-primary">
            Reply
          </button>
        )}
        {isMine && !editing && (
          <>
            <button type="button" onClick={() => setEditing(true)} className="hover:text-primary">
              Edit
            </button>
            {confirmingDelete ? (
              <span className="inline-flex items-center gap-2">
                <span>Delete?</span>
                <button
                  type="button"
                  onClick={() => onDelete(comment.id)}
                  className="text-destructive hover:underline"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="hover:text-primary"
                >
                  No
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="hover:text-destructive"
              >
                Delete
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
