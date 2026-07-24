import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";

const pressQuery = queryOptions({
  queryKey: ["press_mentions"],
  queryFn: async () => {
    const { data } = await supabase
      .from("press_mentions")
      .select("*")
      .order("display_order", { ascending: true });
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
  pendingComponent: PressSkeleton,
  pendingMs: 200,
  pendingMinMs: 300,
  component: Press,
});

function PressSkeleton() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <header className="border-b border-border pb-6 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-14 w-1/3" />
      </header>
      <div className="mt-12 divide-y divide-border">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="py-6 grid md:grid-cols-[200px_minmax(0,1fr)_auto] gap-4 md:gap-6 items-center"
          >
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </section>
  );
}

function Press() {
  const { data } = useSuspenseQuery(pressQuery);
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <Reveal as="header" className="border-b border-border pb-6">
        <p className="eyebrow">The Clippings</p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl md:text-6xl text-primary">Press</h1>
      </Reveal>
      {data.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No press mentions yet.</p>
      ) : (
        <ul className="mt-12 divide-y divide-border">
          {data.map((p, i) => (
            <Reveal
              as="li"
              key={p.id}
              delay={Math.min(i, 4) * 60}
              className="py-6 grid gap-2 md:grid-cols-[200px_minmax(0,1fr)_auto] md:gap-6 md:items-center transition-colors hover:bg-secondary/30 -mx-4 px-4 rounded-sm"
            >
              <div className="font-serif text-xl text-primary">{p.source_name}</div>
              <div className="min-w-0 font-serif italic text-foreground/80">
                {p.headline || "—"}
              </div>
              {p.link && (
                <a
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                  className="eyebrow link-underline hover:text-[color:var(--brand-gold-bright)] border-b-2 border-accent pb-0.5 w-fit"
                >
                  Read →
                </a>
              )}
            </Reveal>
          ))}
        </ul>
      )}
    </section>
  );
}
