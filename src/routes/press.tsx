import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const pressQuery = queryOptions({
  queryKey: ["press_mentions"],
  queryFn: async () => {
    const { data } = await supabase.from("press_mentions").select("*").order("display_order", { ascending: true });
    return data ?? [];
  },
});

export const Route = createFileRoute("/press")({
  head: () => ({
    meta: [
      { title: "Press — Nik Nanoski" },
      { name: "description", content: "Press mentions and coverage of author Nik Nanoski's work." },
      { property: "og:title", content: "Press — Nik Nanoski" },
      { property: "og:description", content: "Press mentions and reviews." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(pressQuery);
  },
  component: Press,
});

function Press() {
  const { data } = useSuspenseQuery(pressQuery);
  return (
    <div>
      <h1>Press</h1>
      {data.length === 0 ? <p>No press mentions yet.</p> : (
        <ul>
          {data.map((p) => (
            <li key={p.id}>
              <strong>{p.source_name}</strong>
              {p.headline ? `: ${p.headline}` : ""}
              {p.link && <> — <a href={p.link} target="_blank" rel="noreferrer">Read</a></>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}