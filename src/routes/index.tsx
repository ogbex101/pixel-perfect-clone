import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroCarousel, type HeroSlide } from "@/components/gr/hero-carousel";
import { BookingBar } from "@/components/gr/booking-bar";
import { CategoryGrid, WhatsOnFeature } from "@/components/gr/category-grid";
import { Reveal } from "@/components/reveal";

const HERO_SLIDES: HeroSlide[] = [
  {
    image: "/images/asset_37_CroppedFocusedImage160059050-50-GRR-BSK-.webp",
    eyebrow: "Summer 2026",
    title: "Make This Summer Yours",
    subline:
      "Long lunches, golden evenings and the dishes you'll talk about for the rest of the year.",
    ctaLabel: "Discover Our Restaurants",
    ctaTo: "/bread-street-kitchen",
  },
  {
    image: "/images/asset_13_CroppedFocusedImage160059050-50-GRR-PETR.webp",
    eyebrow: "The Season's Menu",
    title: "Summer at Pétrus",
    subline: "A refined seasonal menu from one of London's most celebrated dining rooms.",
    ctaLabel: "View the Menu",
    ctaTo: "/bread-street-kitchen",
  },
  {
    image: "/images/asset_35_CroppedFocusedImage160059050-50-GRR-BSK-.webp",
    eyebrow: "Family Dining",
    title: "New Kids Menu",
    subline: "Little plates, big flavours — now available across Bread Street Kitchen & Bar.",
    ctaLabel: "Find Out More",
    ctaTo: "/bread-street-kitchen",
  },
  {
    image: "/images/asset_15_CroppedFocusedImage160059050-50-GRR-BSK-.webp",
    eyebrow: "On the River",
    title: "Dining at Limehouse",
    subline: "Riverside tables, sunset views and an all-day menu on the Thames.",
    ctaLabel: "Book a Table",
    ctaTo: "/",
    ctaHash: "book",
  },
  {
    image: "/images/asset_19_CroppedFocusedImage160059050-50-GRR-BSK-.webp",
    eyebrow: "An Afternoon Ritual",
    title: "Afternoon Tea at Bishopsgate",
    subline: "Classic afternoon tea with a view, fifty floors above the City.",
    ctaLabel: "Reserve Now",
    ctaTo: "/",
    ctaHash: "book",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Explore Gordon Ramsay Restaurants" },
      {
        name: "description",
        content:
          "Book a table at Gordon Ramsay Restaurants — Bread Street Kitchen & Bar, Petrus, Lucky Cat and more.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <HeroCarousel slides={HERO_SLIDES} />
      <BookingBar />

      <section className="mx-auto max-w-[880px] px-6 pb-8 pt-24 text-center md:pt-32">
        <Reveal className="flex flex-col items-center">
          <p className="gr-eyebrow">The Collection</p>
          <h2 className="gr-h2 mt-4">
            Explore the World of
            <br />
            <em className="gr-serif font-normal italic text-[color:var(--gr-gold-bright)]">
              Gordon Ramsay
            </em>{" "}
            Restaurants
          </h2>
          <div className="gr-rule-center my-7" />
          <p className="max-w-2xl text-[15px] leading-[1.8] text-[color:var(--gr-muted)] md:text-base">
            From the bustling open kitchens of Bread Street Kitchen &amp; Bar to the refined dining
            room at Pétrus, every restaurant is built on the same obsession — seasonal ingredients,
            precise technique and genuine hospitality.
          </p>
          <Link to="/bread-street-kitchen" className="gr-btn-solid mt-10">
            Discover Our Restaurants
          </Link>
        </Reveal>
      </section>

      <CategoryGrid />
      <WhatsOnFeature />
    </>
  );
}
