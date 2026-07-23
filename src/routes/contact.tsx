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
    <div>
      <h1>Contact</h1>
      {data.email && <p><a href={`mailto:${data.email}`}>{data.email}</a></p>}
      {data.links.length === 0 ? <p>No contact links yet.</p> : (
        <ul>
          {data.links.map((l) => (
            <li key={l.id}>
              <a href={l.url} target="_blank" rel="noreferrer">{l.platform_name}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}