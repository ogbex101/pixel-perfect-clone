import { Link } from "@tanstack/react-router";
import { Reveal } from "@/components/reveal";

export interface CategoryItem {
  id: string;
  title: string;
  description: string;
  image: string;
  ctaLabel: string;
  ctaTo: string;
}

export const CATEGORY_ITEMS: CategoryItem[] = [
  {
    id: "outdoor-dining",
    title: "Outdoor Dining",
    description:
      "Soak up the sun on our terraces and outdoor spaces, serving the same seasonal menus you love al fresco.",
    image: "/images/asset_25_CroppedFocusedImage79050050-50-GRR-BSK-S.webp",
    ctaLabel: "Where to Dine Outside",
    ctaTo: "/bread-street-kitchen",
  },
  {
    id: "chef-training-course",
    title: "Chef Training Course",
    description:
      "Learn the skills of a professional kitchen with our intensive chef training course at Gordon Ramsay Academy.",
    image: "/images/asset_38_CroppedFocusedImage79050050-50-GRR-GRA-J.webp",
    ctaLabel: "About the Course",
    ctaTo: "/bread-street-kitchen",
  },
  {
    id: "gordon-ramsay-gifts",
    title: "Gifts for Every Occasion",
    description:
      "From gift cards to dining experiences, give the food lover in your life something to remember.",
    image: "/images/asset_05_CroppedFocusedImage79050050-50-Gifting-M.webp",
    ctaLabel: "Explore Gift Cards",
    ctaTo: "/bread-street-kitchen",
  },
  {
    id: "delivery",
    title: "Delivery",
    description:
      "Enjoy Gordon Ramsay favourites in the comfort of your own home, delivered straight to your door.",
    image: "/images/asset_16_CroppedFocusedImage62758650-50-GR-BSK-22.webp",
    ctaLabel: "Order Now",
    ctaTo: "/bread-street-kitchen",
  },
  {
    id: "groups-events",
    title: "Groups & Events",
    description:
      "Private dining rooms and bespoke event spaces for celebrations, parties and corporate gatherings.",
    image: "/images/asset_28_CroppedFocusedImage79050050-50-GRR-LC-MA.webp",
    ctaLabel: "Explore by Event",
    ctaTo: "/bread-street-kitchen",
  },
  {
    id: "masterclasses",
    title: "Masterclasses",
    description:
      "Cook alongside our chefs in hands-on masterclasses covering everything from pasta to pastry.",
    image: "/images/asset_40_CroppedFocusedImage79050049-73-GRR-PE-JU.webp",
    ctaLabel: "Book a Class",
    ctaTo: "/bread-street-kitchen",
  },
];

export const WHATS_ON_ITEM: CategoryItem = {
  id: "whats-on",
  title: "What's On",
  description:
    "Special events, seasonal menus and limited-time collaborations across the Gordon Ramsay Restaurants group.",
  image: "/images/asset_24_CroppedFocusedImage79050050-60-DSC09426-.webp",
  ctaLabel: "Find Out More",
  ctaTo: "/bread-street-kitchen",
};

const ANCHOR_IDS: Record<string, string> = {
  "gordon-ramsay-gifts": "gifting",
  "groups-events": "events",
  masterclasses: "masterclasses",
  "chef-training-course": "academy",
  delivery: "delivery",
};

function EditorialRow({ item, index }: { item: CategoryItem; index: number }) {
  const flip = index % 2 === 1;
  return (
    <Reveal
      as="article"
      className="grid items-center gap-8 md:grid-cols-12 md:gap-14"
      // Anchor targets for header navigation
    >
      <div id={ANCHOR_IDS[item.id]} className={`md:col-span-7 ${flip ? "md:order-2" : ""}`}>
        <div className="gr-img-zoom">
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className="aspect-[16/10] w-full object-cover"
          />
        </div>
      </div>
      <div className={`md:col-span-5 ${flip ? "md:order-1 md:text-right" : ""}`}>
        <p className="gr-num">
          {String(index + 1).padStart(2, "0")}
          <span className="mx-3 text-[color:var(--gr-hairline)]">—</span>
          <span className="gr-eyebrow not-italic">The Experience</span>
        </p>
        <h2 className="gr-h2 mt-4">{item.title}</h2>
        <div className={`gr-rule my-6 ${flip ? "md:ml-auto md:rotate-180" : ""}`} />
        <p className="max-w-md text-[15px] leading-relaxed text-[color:var(--gr-muted)] md:text-base md:leading-[1.7] md:max-w-none">
          {item.description}
        </p>
        <Link to={item.ctaTo} className="gr-link-arrow mt-8">
          {item.ctaLabel}
          <span className="arrow" aria-hidden>
            &rarr;
          </span>
        </Link>
      </div>
    </Reveal>
  );
}

export function CategoryGrid() {
  return (
    <section className="mx-auto flex max-w-[1240px] flex-col gap-24 px-6 py-24 md:gap-32 md:py-32">
      {CATEGORY_ITEMS.map((item, i) => (
        <EditorialRow key={item.id} item={item} index={i} />
      ))}
    </section>
  );
}

export function WhatsOnFeature() {
  return (
    <section id="whats-on" className="relative h-[480px] overflow-hidden md:h-[580px]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${WHATS_ON_ITEM.image})` }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(15,14,12,0.95) 0%, rgba(15,14,12,0.6) 45%, rgba(15,14,12,0.35) 100%)",
        }}
      />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <Reveal className="flex flex-col items-center">
          <p className="gr-eyebrow">This Season</p>
          <h2 className="gr-h2 mt-4">{WHATS_ON_ITEM.title}</h2>
          <div className="gr-rule-center my-6" />
          <p className="max-w-xl text-[15px] leading-relaxed text-[color:var(--gr-ivory)]/85 md:text-base">
            {WHATS_ON_ITEM.description}
          </p>
          <Link to={WHATS_ON_ITEM.ctaTo} className="gr-btn-ghost mt-9">
            {WHATS_ON_ITEM.ctaLabel}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
