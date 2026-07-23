import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const aboutQuery = queryOptions({
  queryKey: ["author_profile"],
  queryFn: async () => {
    const { data } = await supabase.from("author_profile").select("*").maybeSingle();
    return data;
  },
});

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Nik Nanoski" },
      { name: "description", content: "About Nik Nanoski: nurse, former combat medic, and science fiction novelist." },
      { property: "og:title", content: "About — Nik Nanoski" },
      { property: "og:description", content: "The story behind the author of DUMB 31." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(aboutQuery);
  },
  component: About,
});

function About() {
  const { data } = useSuspenseQuery(aboutQuery);
  if (!data) return <p>No author profile yet.</p>;
  return (
    <div>
      <h1>About {data.name}</h1>
      {data.bio && <p style={{ whiteSpace: "pre-wrap" }}>{data.bio}</p>}
      {data.background_facts.length > 0 && (
        <>
          <h2>Background</h2>
          <ul>{data.background_facts.map((f, i) => <li key={i}>{f}</li>)}</ul>
        </>
      )}
      {data.location && <p><strong>Location:</strong> {data.location}</p>}
    </div>
  );
}