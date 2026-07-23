import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const testimonialsQuery = queryOptions({
  queryKey: ["testimonials"],
  queryFn: async () => {
    const { data } = await supabase.from("testimonials").select("*").order("display_order", { ascending: true });
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
  component: Testimonials,
});

function Testimonials() {
  const { data } = useSuspenseQuery(testimonialsQuery);
  return (
    <div>
      <h1>Testimonials</h1>
      {data.length === 0 ? <p>No testimonials yet.</p> : (
        <ul>
          {data.map((t) => (
            <li key={t.id}>
              <blockquote>{t.quote_text}</blockquote>
              <p>— {t.reviewer_name}{t.rating != null ? ` (${t.rating}/5)` : ""}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}