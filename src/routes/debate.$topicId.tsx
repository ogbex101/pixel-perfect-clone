import { createFileRoute } from "@tanstack/react-router";
import { DebateThread } from "@/components/debate/debate-thread";

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

function DebateTopicPage() {
  const { topicId } = Route.useParams();
  return <DebateThread topicId={topicId} backTo="/debate" />;
}
