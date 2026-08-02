import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveContactIcon } from "@/components/contact-icon";
import { PageHero } from "@/components/page-hero";
import { CinematicSlideshow } from "@/components/cinematic-slideshow";
import { SITE_ART, pageMediaQuery, toSlides, type Slide } from "@/lib/page-media";

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
      {
        property: "og:description",
        content: "Contact information and social links for Nik Nanoski.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(contactQuery);
    context.queryClient.ensureQueryData(pageMediaQuery("contact"));
  },
  pendingComponent: ContactSkeleton,
  pendingMs: 200,
  pendingMinMs: 300,
  component: Contact,
});

function ContactSkeleton() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 space-y-6">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-14 w-1/2" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-8 w-1/3 mt-4" />
    </section>
  );
}

function Contact() {
  const { data } = useSuspenseQuery(contactQuery);
  const { data: media } = useSuspenseQuery(pageMediaQuery("contact"));
  const managed = toSlides(media);
  const fallback: Slide[] = [
    { id: "art-door", type: "image", src: SITE_ART.door, caption: "Some doors open both ways." },
    { id: "art-cover", type: "image", src: SITE_ART.cover, caption: "DUMB 31" },
    { id: "art-opie", type: "image", src: SITE_ART.opie, caption: "Inside the facility" },
  ];
  const slides = managed.length > 0 ? managed : fallback;
  return (
    <>
      <PageHero
        eyebrow="Correspondence"
        title="Contact"
        subtitle="For interviews, appearances, and reader letters."
        imageUrl={SITE_ART.door}
      />
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <Reveal variant="blur">
        <p className="eyebrow">Write to Nik</p>
        {data.email && (
          <a
            href={`mailto:${data.email}`}
            className="mt-4 inline-block font-serif text-xl sm:text-2xl md:text-3xl text-primary border-b-2 border-accent pb-1 hover:text-[color:var(--brand-gold-bright)] transition-colors duration-300 break-all"
          >
            {data.email}
          </a>
        )}
      </Reveal>
      {data.links.length > 0 && (
        <Reveal variant="blur" delay={200} className="mt-14">
          <div className="ornament mb-6">
            <span className="eyebrow">Elsewhere</span>
          </div>
          <ul className="flex flex-wrap gap-3">
            {data.links.map((l, i) => {
              const Icon = resolveContactIcon(l.icon);
              return (
                <Reveal as="li" key={l.id} variant="zoom" delay={250 + i * 80}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-sheen inline-flex items-center gap-2 border border-primary px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {l.platform_name}
                  </a>
                </Reveal>
              );
            })}
          </ul>
        </Reveal>
      )}
      </section>
      <CinematicSlideshow slides={slides} eyebrow="In Frame" title="From the Facility" />
    </>
  );
}
