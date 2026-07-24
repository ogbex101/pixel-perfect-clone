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
    <article className="mx-auto max-w-6xl px-6 py-20 grid gap-12 md:grid-cols-12">
      <header className="md:col-span-12 border-b border-border pb-8">
        <p className="eyebrow">The Profile</p>
        <h1 className="mt-3 font-serif text-5xl md:text-6xl text-primary">About {data.name}</h1>
        {data.tagline && (
          <p className="mt-4 font-serif italic text-2xl text-foreground/75 max-w-3xl">“{data.tagline}”</p>
        )}
      </header>
      <div className="md:col-span-8">
        {data.bio && (
          <div className="font-serif text-lg leading-relaxed text-foreground/85 whitespace-pre-wrap drop-cap">
            {data.bio}
          </div>
        )}
      </div>
      <aside className="md:col-span-4 md:border-l md:border-border md:pl-8 space-y-8">
        {data.location && (
          <div>
            <p className="eyebrow">Based in</p>
            <p className="mt-1 text-foreground">{data.location}</p>
          </div>
        )}
        {data.background_facts.length > 0 && (
          <div>
            <p className="eyebrow">Background</p>
            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
              {data.background_facts.map((f, i) => (
                <li key={i} className="pl-4 border-l-2 border-accent">{f}</li>
              ))}
            </ul>
          </div>
        )}
        {data.quotes.length > 0 && (
          <div>
            <p className="eyebrow">In his words</p>
            <div className="mt-3 space-y-4">
              {data.quotes.slice(0, 3).map((q, i) => (
                <blockquote key={i} className="font-serif italic text-foreground/80 border-l-2 border-primary pl-4">
                  “{q}”
                </blockquote>
              ))}
            </div>
          </div>
        )}
      </aside>
    </article>
  );
}