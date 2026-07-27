import { Link } from "@tanstack/react-router";

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

function CategoryCard({ item }: { item: CategoryItem }) {
  return (
    <div id={ANCHOR_IDS[item.id]} className="chef-block-card">
      <div className="bg-image" style={{ backgroundImage: `url(${item.image})` }} />
      <div className="overlay" />
      <div className="content">
        <h2 className="gr-h2 text-white">{item.title}</h2>
        <div className="gr-underline" />
        <p className="text-[18px] leading-[25px] text-white mb-6">{item.description}</p>
        <Link to={item.ctaTo} className="gr-btn-ghost inline-flex items-center gap-2">
          {item.ctaLabel} <span aria-hidden>&rarr;</span>
        </Link>
      </div>
    </div>
  );
}

export function CategoryGrid() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2">
      {CATEGORY_ITEMS.map((item) => (
        <CategoryCard key={item.id} item={item} />
      ))}
    </section>
  );
}

export function WhatsOnFeature() {
  return (
    <section id="whats-on">
      <CategoryCard item={WHATS_ON_ITEM} />
    </section>
  );
}
