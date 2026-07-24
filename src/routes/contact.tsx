import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const contactQuery = queryOptions({
  queryKey: ["contact"],
  queryFn: async () => {
    const [links, profile] = await Promise.all([
      supabase.from("contact_links").select("*").order("display_order", { ascending: true }),
      supabase.from("author_profile").select("contact_email").maybeSingle(),
    ]);
    return { links: links.data ?? [], email: profile.data?.contact_email ?? null };
  },
});

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Nik Nanoski" },
      { name: "description", content: "Get in touch with author Nik Nanoski." },
      { property: "og:title", content: "Contact — Nik Nanoski" },
      { property: "og:description", content: "Contact information and social links for Nik Nanoski." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(contactQuery);
  },
  component: Contact,
});

function Contact() {
  const { data } = useSuspenseQuery(contactQuery);
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <p className="eyebrow">Correspondence</p>
      <h1 className="mt-3 font-serif text-5xl md:text-6xl text-primary">Contact</h1>
      <hr className="rule-gold mt-6" />
      <p className="mt-8 font-serif italic text-xl text-foreground/80">
        For interviews, appearances, and reader letters.
      </p>
      {data.email && (
        <a
          href={`mailto:${data.email}`}
          className="mt-8 inline-block font-serif text-2xl md:text-3xl text-primary border-b-2 border-accent pb-1 hover:text-accent transition-colors"
        >
          {data.email}
        </a>
      )}
      {data.links.length > 0 && (
        <div className="mt-12">
          <p className="eyebrow">Elsewhere</p>
          <ul className="mt-4 flex flex-wrap gap-3">
            {data.links.map((l) => (
              <li key={l.id}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {l.platform_name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}