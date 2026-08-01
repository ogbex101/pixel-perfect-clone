import { createFileRoute } from "@tanstack/react-router";
import { Reveal } from "@/components/reveal";

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
    name: "Bath",
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
      <section className="bsk-tile-bg relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow:
              "inset 0 30px 60px rgba(15,14,12,0.18), inset 0 -30px 60px rgba(15,14,12,0.18)",
          }}
        />
        <div className="relative mx-auto flex max-w-[880px] flex-col items-center px-6 py-20 text-center md:py-24">
          <img
            src="/images/asset_08_logo.svg"
            alt="Bread Street Kitchen & Bar"
            className="h-24 w-auto md:h-28"
          />
          <p className="mt-8 max-w-xl font-[family-name:var(--font-gr-serif)] text-[19px] italic leading-relaxed text-[#33301f] md:text-[22px]">
            Relaxed, all-day dining in the heart of the city — find your nearest Bread Street
            Kitchen &amp; Bar below.
          </p>
        </div>
      </section>

      <section className="bg-[color:var(--gr-ink)] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1240px]">
          <Reveal className="mb-12 flex flex-col items-center text-center md:mb-16">
            <p className="gr-eyebrow">Nine Locations</p>
            <h1 className="gr-h2 mt-4">Choose Your Kitchen</h1>
            <div className="gr-rule-center mt-6" />
          </Reveal>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
            {LOCATIONS.map((loc, i) => (
              <Reveal key={loc.name} delay={(i % 3) * 120}>
                <div className="bsk-hub-card gr-frame">
                  <div className="bg-image" style={{ backgroundImage: `url(${loc.image})` }} />
                  <div className="overlay" />
                  <div className="content px-6">
                    <img
                      src="/images/asset_02_BSK-LOGO.svg"
                      alt=""
                      aria-hidden="true"
                      className="h-12 w-auto opacity-90"
                    />
                    <h3 className="gr-serif text-[26px] leading-tight text-[color:var(--gr-ivory)]">
                      {loc.name}
                    </h3>
                    {loc.comingSoon ? (
                      <p className="gr-eyebrow">Coming Soon</p>
                    ) : (
                      <button type="button" className="gr-btn-gold">
                        View
                      </button>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[color:var(--gr-hairline-faint)] bg-[#0c0b09] py-12 text-center">
        <p className="gr-eyebrow">Part of the Gordon Ramsay Restaurants Group</p>
      </section>
    </div>
  );
}
