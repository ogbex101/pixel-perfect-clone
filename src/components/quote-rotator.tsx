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
      className={cn("flex flex-col items-center text-center", className)}
    >
      <blockquote
        key={index}
        className={cn(
          "route-transition font-serif italic leading-[1.1] text-foreground/90",
          size === "display"
            ? "text-3xl sm:text-5xl md:text-6xl lg:text-7xl max-w-5xl"
            : "text-2xl md:text-3xl leading-snug text-foreground/85 max-w-2xl",
        )}
      >
        “{quotes[index]}”
      </blockquote>
      {quotes.length > 1 && (
        <div className="mt-6 flex items-center gap-2">
          {quotes.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show quote ${i + 1} of ${quotes.length}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index
                  ? "w-6 bg-[color:var(--brand-gold)]"
                  : "w-1.5 bg-border hover:bg-muted-foreground",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
