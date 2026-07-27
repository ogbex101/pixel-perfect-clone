import { createFileRoute } from "@tanstack/react-router";

interface BskLocation {
  name: string;
  image: string;
  comingSoon?: boolean;
}

const LOCATIONS: BskLocation[] = [
  {
    name: "22 Bishopsgate",
    image: "/images/asset_16_CroppedFocusedImage62758650-50-GR-BSK-22.webp",
  },
  { name: "Battersea", image: "/images/asset_27_CroppedFocusedImage62758650-50-GRR-BSK-B.webp" },
  { name: "St Paul's", image: "/images/asset_29_CroppedFocusedImage62758650-50-GRR-BSK-S.webp" },
  { name: "Edinburgh", image: "/images/asset_07_CroppedFocusedImage62758650-58-GR-Edinbu.webp" },
  { name: "Liverpool", image: "/images/asset_34_CroppedFocusedImage62758650-50-vb1949514.webp" },
  { name: "Stratford", image: "/images/asset_12_CroppedFocusedImage62758650-50-GRR-BSK-S.webp" },
  { name: "The City", image: "/images/asset_03_CroppedFocusedImage62758650-50-GRR-BSK-C.webp" },
  { name: "Limehouse", image: "/images/asset_22_CroppedFocusedImage62758650-50-GRR-BSK-D.webp" },
  {
    name: "Bath — Coming Soon",
    image: "/images/asset_30_CroppedFocusedImage62758650-50-GRR-BREAD.webp",
    comingSoon: true,
  },
];

export const Route = createFileRoute("/bread-street-kitchen")({
  head: () => ({
    meta: [
      { title: "Bread Street Kitchen & Bar | Gordon Ramsay Restaurants" },
      {
        name: "description",
        content:
          "Find your nearest Bread Street Kitchen & Bar. Relaxed, all-day dining from Gordon Ramsay across London, Edinburgh, Liverpool and Bath.",
      },
    ],
  }),
  component: BreadStreetKitchen,
});

function BreadStreetKitchen() {
  return (
    <div>
      <section className="bsk-tile-bg py-16 md:py-20 flex flex-col items-center justify-center text-center px-6">
        <img
          src="/images/asset_08_logo.svg"
          alt="Bread Street Kitchen & Bar"
          className="h-20 md:h-28 w-auto"
        />
        <p className="mt-6 max-w-xl text-[#1d1d1b] text-[16px] md:text-[18px] font-medium">
          Relaxed, all-day dining in the heart of the city. Find your nearest Bread Street Kitchen
          &amp; Bar below.
        </p>
      </section>

      <section className="bg-black py-10 md:py-16 px-4 md:px-8">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 md:grid-cols-3 gap-[10px]">
          {LOCATIONS.map((loc) => (
            <div key={loc.name} className="bsk-hub-card">
              <div className="bg-image" style={{ backgroundImage: `url(${loc.image})` }} />
              <div className="overlay" />
              <div className="content">
                <img
                  src="/images/asset_02_BSK-LOGO.svg"
                  alt=""
                  aria-hidden="true"
                  className="h-14 w-auto"
                />
                <h3 className="text-[19px] font-bold uppercase text-white tracking-wide">
                  {loc.name}
                </h3>
                <button
                  type="button"
                  className="gr-btn-gold disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={loc.comingSoon}
                >
                  {loc.comingSoon ? "Coming Soon" : "View"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bsk-tile-bg-grey py-10 text-center">
        <p className="text-[13px] text-[#d0d0d0]">
          Bread Street Kitchen &amp; Bar is part of Gordon Ramsay Restaurants.
        </p>
      </section>
    </div>
  );
}
