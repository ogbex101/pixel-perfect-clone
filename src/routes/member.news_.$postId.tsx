import { createFileRoute } from "@tanstack/react-router";
import { NewsArticle } from "@/components/news/news-article";
import { MemberShell } from "@/components/member/member-shell";
import { MemberGate } from "@/lib/member-session";

export const Route = createFileRoute("/member/news_/$postId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dispatch — DUMB 31 Members" },
      { name: "description", content: "A dispatch from the world of DUMB 31." },
      { property: "og:title", content: "Dispatch — DUMB 31 Members" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MemberNewsPost,
});

function MemberNewsPost() {
  const { postId } = Route.useParams();
  return (
    <MemberGate>
      {(ctx) => (
        <MemberShell ctx={ctx}>
          <NewsArticle postId={postId} backTo="/member/news" />
        </MemberShell>
      )}
    </MemberGate>
  );
}
