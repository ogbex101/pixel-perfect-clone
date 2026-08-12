import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Wraps a full-bleed background layer and drifts it slower than the page as it
 * scrolls, so foreground copy appears to float above the artwork. No-ops on
 * touch/SSR and whenever the visitor asks for reduced motion.
 */
export function ParallaxLayer({
  children,
  speed = 0.25,
  className,
}: {
  children: ReactNode;
  /** Fraction of scroll distance the layer moves (0 = fixed, 1 = normal). */
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      // Only animate while the section is anywhere near the viewport.
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
      const offset = Math.max(0, -rect.top) * speed;
      node.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("absolute inset-x-0 top-0 h-full will-change-transform", className)}
    >
      {children}
    </div>
  );
}
