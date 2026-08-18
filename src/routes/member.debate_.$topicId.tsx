import { createFileRoute } from "@tanstack/react-router";
import { DebateThread } from "@/components/debate/debate-thread";
import { MemberShell } from "@/components/member/member-shell";
import { MemberGate } from "@/lib/member-session";

export const Route = createFileRoute("/member/debate_/$topicId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Debate Topic — DUMB 31 Members" },
      { name: "description", content: "Join the discussion on this DUMB 31 debate topic." },
      { property: "og:title", content: "Debate Topic — DUMB 31 Members" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MemberDebateTopic,
});

function MemberDebateTopic() {
  const { topicId } = Route.useParams();
  return (
    <MemberGate>
      {(ctx) => (
        <MemberShell ctx={ctx}>
          <DebateThread topicId={topicId} backTo="/member/debate" />
        </MemberShell>
      )}
    </MemberGate>
  );
}
