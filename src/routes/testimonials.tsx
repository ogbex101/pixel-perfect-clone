import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";

const testimonialsQuery = queryOptions({
  queryKey: ["testimonials"],
  queryFn: async () => {
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .order("display_order", { ascending: true });
    return data ?? [];
  },
});

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Testimonials — Nik Nanoski" },
      { name: "description", content: "What readers are saying about Nik Nanoski's novels." },
      { property: "og:title", content: "Testimonials — Nik Nanoski" },
      { property: "og:description", content: "Reader testimonials." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(testimonialsQuery);
  },
  pendingComponent: TestimonialsSkeleton,
  pendingMs: 200,
  pendingMinMs: 300,
  component: Testimonials,
});

function TestimonialsSkeleton() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <header className="border-b border-border pb-6 space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-14 w-1/3" />
      </header>
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border border-border p-8 space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const { data } = useSuspenseQuery(testimonialsQuery);
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <Reveal as="header" className="border-b border-border pb-6">
        <p className="eyebrow">Reader Praise</p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl md:text-6xl text-primary">
          Testimonials
        </h1>
      </Reveal>
      {data.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No testimonials yet.</p>
      ) : (
        <ul className="mt-12 grid gap-8 md:grid-cols-2">
          {data.map((t, i) => (
            <Reveal
              as="li"
              key={t.id}
              delay={(i % 2) * 100}
              className="texture-paper border border-border p-8 relative card-lift"
            >
              <span
                aria-hidden
                className="absolute -top-4 left-6 font-serif text-6xl text-accent leading-none"
              >
                “
              </span>
              <blockquote className="font-serif italic text-lg text-foreground/85 leading-relaxed">
                {t.quote_text}
              </blockquote>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <p className="eyebrow">— {t.reviewer_name}</p>
                {t.rating != null && (
                  <p className="text-[color:var(--brand-gold)] text-lg tracking-widest">
                    {"★".repeat(t.rating)}
                    <span className="text-muted-foreground/40">
                      {"★".repeat(Math.max(0, 5 - t.rating))}
                    </span>
                  </p>
                )}
              </div>
            </Reveal>
          ))}
        </ul>
      )}
    </section>
  );
}
