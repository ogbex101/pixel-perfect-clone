import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

export interface HeroSlide {
  image: string;
  eyebrow: string;
  title: string;
  subline?: string;
  ctaLabel: string;
  ctaTo: string;
  ctaHash?: string;
}

const AUTOPLAY_MS = 7500;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const active = slides[index];

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
    // `index` is a dep so a manual selection restarts the autoplay timer.
  }, [slides.length, index]);

  return (
    <section
      className="relative h-[560px] md:h-[700px] overflow-hidden bg-[color:var(--gr-ink)]"
      aria-label="Featured restaurants and offers"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.image + i}
          className={`gr-hero-slide ${i === index ? "is-active" : ""}`}
          aria-hidden={i !== index}
        >
          <div
            className={`absolute inset-0 bg-cover bg-center ${i === index ? "gr-kenburns" : ""}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(15,14,12,0.96) 0%, rgba(15,14,12,0.55) 38%, rgba(15,14,12,0.12) 68%, rgba(15,14,12,0.4) 100%)",
            }}
          />
        </div>
      ))}

      <div className="relative z-10 flex h-full flex-col items-center justify-end pb-28 md:pb-32 px-6 text-center">
        <p key={`e-${index}`} className="gr-eyebrow gr-fade-in">
          {active.eyebrow}
        </p>
        <h1 key={`t-${index}`} className="gr-h1 gr-fade-in gr-fade-in-delay-1 mt-4 max-w-4xl">
          {active.title}
        </h1>
        {active.subline && (
          <p
            key={`s-${index}`}
            className="gr-fade-in gr-fade-in-delay-1 mt-4 max-w-xl text-[15px] leading-relaxed text-[color:var(--gr-muted)]"
          >
            {active.subline}
          </p>
        )}
        <Link
          key={`c-${index}`}
          to={active.ctaTo}
          hash={active.ctaHash}
          className="gr-btn-ghost gr-fade-in gr-fade-in-delay-2 mt-8"
        >
          {active.ctaLabel}
        </Link>
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-10 flex items-center justify-center gap-5 md:gap-7 px-6">
        {slides.map((_, i) => {
          const isActive = i === index;
          return (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className="group flex items-center gap-2 py-2"
            >
              <span
                className={`text-[10px] tracking-[0.22em] transition-colors duration-300 ${
                  isActive
                    ? "text-[color:var(--gr-gold)]"
                    : "text-white/40 group-hover:text-white/70"
                }`}
              >
                0{i + 1}
              </span>
              <span className="h-px w-8 md:w-14 overflow-hidden bg-white/20">
                {isActive && <span key={index} className="gr-progress-fill" />}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
