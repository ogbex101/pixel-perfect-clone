import { createFileRoute } from "@tanstack/react-router";
import { NewsArticle } from "@/components/news/news-article";

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
  return <NewsArticle postId={postId} backTo="/news" />;
}
