import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";

/**
 * Cinematic masthead used at the top of every content page: full-bleed
 * artwork (or looping footage) graded down so the headline stays legible.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  imageUrl,
  videoUrl,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string;
  videoUrl?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative flex min-h-[46vh] items-end overflow-hidden border-b border-border texture-metal md:min-h-[62vh]">
      {videoUrl ? (
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          aria-hidden
          className="kenburns absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
      <div className="absolute inset-0 vignette" />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-12 pt-24 md:px-14 md:pb-16 md:pt-32">
        <Reveal variant="blur">
          <p className="eyebrow track-in">{eyebrow}</p>
        </Reveal>
        <Reveal variant="blur" delay={120}>
          <h1 className="text-gradient-gold mt-3 max-w-3xl pb-2 font-serif text-4xl leading-[1.06] sm:text-5xl md:text-6xl lg:text-7xl">
            {title}
          </h1>
        </Reveal>
        {subtitle && (
          <Reveal variant="blur" delay={240}>
            <p className="mt-5 max-w-2xl font-serif text-lg italic text-foreground/80 md:text-2xl">
              {subtitle}
            </p>
          </Reveal>
        )}
        {children}
        <Reveal delay={340}>
          <hr className="rule-gold rule-draw mt-9" />
        </Reveal>
      </div>
    </section>
  );
}