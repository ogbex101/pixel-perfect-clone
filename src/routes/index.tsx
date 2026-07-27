import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroCarousel, type HeroSlide } from "@/components/gr/hero-carousel";
import { BookingBar } from "@/components/gr/booking-bar";
import { CategoryGrid, WhatsOnFeature } from "@/components/gr/category-grid";

const HERO_SLIDES: HeroSlide[] = [
  {
    image: "/images/asset_37_CroppedFocusedImage160059050-50-GRR-BSK-.webp",
    title: "Make This Summer Yours",
    ctaLabel: "Discover Our Restaurants",
    ctaTo: "/bread-street-kitchen",
  },
  {
    image: "/images/asset_13_CroppedFocusedImage160059050-50-GRR-PETR.webp",
    title: "Summer at Pétrus",
    ctaLabel: "View the Menu",
    ctaTo: "/bread-street-kitchen",
  },
  {
    image: "/images/asset_35_CroppedFocusedImage160059050-50-GRR-BSK-.webp",
    title: "New Kids Menu Available",
    ctaLabel: "Find Out More",
    ctaTo: "/bread-street-kitchen",
  },
  {
    image: "/images/asset_15_CroppedFocusedImage160059050-50-GRR-BSK-.webp",
    title: "Dining by the River at Limehouse",
    ctaLabel: "Book a Table",
    ctaTo: "/",
    ctaHash: "book",
  },
  {
    image: "/images/asset_19_CroppedFocusedImage160059050-50-GRR-BSK-.webp",
    title: "Afternoon Tea at Bishopsgate",
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

      <section className="mx-auto max-w-[1000px] px-6 py-16 md:py-24 text-center">
        <h2 className="gr-h2 text-white">Explore the World of Gordon Ramsay Restaurants</h2>
        <div className="gr-underline" />
        <p className="mt-6 text-[18px] leading-[25px] text-white">
          From the bustling open kitchens of Bread Street Kitchen &amp; Bar to the refined dining
          room at Pétrus, every Gordon Ramsay restaurant is built on the same obsession with
          seasonal ingredients, precise technique and genuine hospitality. Discover our full
          collection of restaurants across the UK and beyond.
        </p>
        <Link to="/bread-street-kitchen" className="gr-btn gr-btn-light mt-8 inline-flex">
          Discover Our Restaurants
        </Link>
      </section>

      <CategoryGrid />
      <WhatsOnFeature />
    </>
  );
}
