import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface QuoteRotatorProps {
  quotes: string[];
  intervalMs?: number;
  className?: string;
  size?: "default" | "display";
}

export function QuoteRotator({
  quotes,
  intervalMs = 6000,
  className,
  size = "default",
}: QuoteRotatorProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (quotes.length < 2 || paused || reducedMotionRef.current) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % quotes.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [quotes.length, paused, intervalMs]);

  if (quotes.length === 0) return null;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn("relative flex flex-col items-center text-center", className)}
    >
      {size === "display" && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 font-serif text-[10rem] leading-none text-primary/10 select-none md:-top-20 md:text-[16rem]"
        >
          “
        </span>
      )}
      <blockquote
        key={index}
        className={cn(
          "quote-swap relative font-serif italic leading-[1.1]",
          size === "display"
            ? "text-gradient-gold max-w-5xl pb-2 text-3xl sm:text-5xl md:text-6xl lg:text-7xl"
            : "max-w-2xl text-2xl leading-snug text-foreground/85 md:text-3xl",
        )}
      >
        “{quotes[index]}”
      </blockquote>
      {quotes.length > 1 && (
        <div className="mt-8 flex items-center gap-2.5">
          {quotes.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show quote ${i + 1} of ${quotes.length}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i === index
                  ? "w-8 bg-gradient-to-r from-[color:var(--brand-gold-bright)] to-[color:var(--brand-gold-deep)]"
                  : "w-1.5 bg-border hover:bg-muted-foreground",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
