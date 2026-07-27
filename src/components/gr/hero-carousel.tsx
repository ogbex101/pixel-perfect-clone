import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "@tanstack/react-router";

export interface HeroSlide {
  image: string;
  title: string;
  ctaLabel: string;
  ctaTo: string;
  ctaHash?: string;
}

const AUTOPLAY_MS = 7500;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const id = window.setInterval(() => {
      emblaApi.scrollNext();
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [emblaApi]);

  return (
    <section
      className="relative w-full overflow-hidden bg-black"
      aria-label="Featured restaurants and offers"
    >
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide, i) => (
            <div
              key={i}
              className="relative min-w-0 shrink-0 grow-0 basis-full h-[400px] md:h-[534px]"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.image})` }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgb(0,0,0) 0%, rgba(0,0,0,0.8) 35%, rgba(0,0,0,0) 75%)",
                }}
              />
              <div className="relative z-10 flex h-full flex-col items-center justify-end pb-14 md:pb-20 px-6 text-center gap-6">
                <h1 className="gr-h1 text-white max-w-3xl uppercase">{slide.title}</h1>
                <Link to={slide.ctaTo} hash={slide.ctaHash} className="gr-btn gr-btn-outline">
                  {slide.ctaLabel}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 z-10 flex items-center justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`gr-hero-dot ${i === selectedIndex ? "is-active" : ""}`}
          />
        ))}
      </div>
    </section>
  );
}
