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
    <section className="mx-auto max-w-6xl px-6 py-20">
      <header className="border-b border-border pb-6">
        <p className="eyebrow">The Clippings</p>
        <h1 className="mt-3 font-serif text-5xl md:text-6xl text-primary">Press</h1>
      </header>
      {data.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No press mentions yet.</p>
      ) : (
        <ul className="mt-12 divide-y divide-border">
          {data.map((p) => (
            <li key={p.id} className="py-6 grid md:grid-cols-[200px_minmax(0,1fr)_auto] gap-6 items-center">
              <div className="font-serif text-xl text-primary">{p.source_name}</div>
              <div className="min-w-0 font-serif italic text-foreground/80">{p.headline || "—"}</div>
              {p.link && (
                <a href={p.link} target="_blank" rel="noreferrer" className="eyebrow hover:text-accent border-b-2 border-accent pb-0.5 w-fit">
                  Read →
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}