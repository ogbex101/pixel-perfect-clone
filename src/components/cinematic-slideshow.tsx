import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import type { Slide } from "@/lib/page-media";

/**
 * Auto-advancing cinematic slideshow. Slides can be images or videos; the
 * active slide cross-fades and slowly drifts (Ken Burns) so a page of text
 * always has a moving visual companion.
 */
export function CinematicSlideshow({
  slides,
  eyebrow = "Cinematic",
  title,
  intervalMs = 5200,
  className = "",
}: {
  slides: Slide[];
  eyebrow?: string;
  title?: string;
  intervalMs?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (count < 2 || paused) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [count, paused, intervalMs]);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (count === 0) return null;

  const go = (next: number) => setIndex(((next % count) + count) % count);
  const active = slides[Math.min(index, count - 1)];

  return (
    <section
      className={`overflow-hidden border-y border-border bg-secondary/25 texture-metal ${className}`}
    >
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="eyebrow track-in">{eyebrow}</p>
            {title && (
              <h2 className="text-gradient-gold mt-2 pb-1 font-serif text-2xl sm:text-3xl md:text-4xl">
                {title}
              </h2>
            )}
          </div>
          <p className="eyebrow text-xs tabular-nums text-muted-foreground">
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </p>
        </Reveal>

        <Reveal
          variant="zoom"
          delay={120}
          className="card-premium group relative mt-8 aspect-[16/10] overflow-hidden sm:aspect-[16/9]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {slides.map((s, i) => (
            <div
              key={s.id}
              aria-hidden={i !== index}
              className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
            >
              {s.type === "video" ? (
                <video
                  src={s.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={s.src}
                  alt={s.caption ?? ""}
                  loading={i === 0 ? "eager" : "lazy"}
                  className={`h-full w-full object-cover ${i === index ? "kenburns" : ""}`}
                />
              )}
            </div>
          ))}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
          <div className="pointer-events-none absolute inset-0 vignette" />

          {active?.caption && (
            <p className="absolute inset-x-0 bottom-0 px-5 pb-5 font-serif text-base italic text-foreground/90 md:px-8 md:pb-7 md:text-xl">
              {active.caption}
            </p>
          )}

          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous slide"
                onClick={() => go(index - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 border border-primary/50 bg-background/60 p-2 text-primary opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => go(index + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 border border-primary/50 bg-background/60 p-2 text-primary opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </Reveal>

        {count > 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={`h-14 w-20 shrink-0 overflow-hidden border transition-all duration-300 ${
                  i === index
                    ? "border-primary opacity-100"
                    : "border-border opacity-50 hover:opacity-90"
                }`}
              >
                {s.type === "video" ? (
                  <span className="flex h-full w-full items-center justify-center bg-secondary/60 text-[0.6rem] tracking-widest text-primary">
                    VIDEO
                  </span>
                ) : (
                  <img src={s.src} alt="" loading="lazy" className="h-full w-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
