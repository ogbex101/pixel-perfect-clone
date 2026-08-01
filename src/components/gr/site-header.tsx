import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV_LINKS = [
  { to: "/" as const, hash: "book", label: "Book a Table" },
  { to: "/bread-street-kitchen" as const, hash: undefined, label: "Restaurants" },
  { to: "/" as const, hash: "events", label: "Private Dining & Events" },
  { to: "/" as const, hash: "masterclasses", label: "Masterclasses" },
  { to: "/" as const, hash: "gifting", label: "Gifting" },
  { to: "/" as const, hash: "whats-on", label: "What's On" },
  { to: "/" as const, hash: "academy", label: "GR Academy" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = !isHome || scrolled || menuOpen;

  return (
    <header
      className={`fixed top-0 z-40 w-full transition-all duration-500 ${
        solid
          ? "bg-[#12100d]/95 backdrop-blur-sm border-b border-[color:var(--gr-hairline-faint)]"
          : "bg-gradient-to-b from-black/60 to-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[60px] md:h-[76px] max-w-[1320px] items-center justify-between px-4 md:px-8">
        <Link
          to="/"
          className="flex items-center shrink-0 max-w-[150px] md:max-w-[210px]"
          aria-label="Gordon Ramsay Restaurants — home"
        >
          <img
            src="/images/asset_18_gr_LOGO.svg"
            alt="Gordon Ramsay Restaurants"
            className="h-auto w-full max-h-7 md:max-h-9"
          />
        </Link>

        <nav className="hidden xl:flex items-center h-full shrink-0">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              hash={l.hash}
              className="gr-navlink shrink-0 whitespace-nowrap px-3 h-[76px] flex items-center text-[12px] font-medium uppercase tracking-[0.16em] text-[color:var(--gr-ivory)] hover:text-[color:var(--gr-gold-bright)] transition-colors duration-300"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="xl:hidden inline-flex items-center justify-center p-2 text-[color:var(--gr-ivory)] shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="bg-[#14110e] border-l border-[color:var(--gr-hairline-faint)] w-4/5 p-0"
          >
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex items-center justify-between gap-3 px-5 h-[60px] border-b border-[color:var(--gr-hairline-faint)]">
              <img
                src="/images/asset_18_gr_LOGO.svg"
                alt="Gordon Ramsay Restaurants"
                className="h-auto max-h-6 w-full max-w-[160px]"
              />
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="shrink-0 text-[color:var(--gr-ivory)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col py-4">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  hash={l.hash}
                  onClick={() => setMenuOpen(false)}
                  className="px-6 py-4 text-[13px] uppercase tracking-[0.18em] text-[color:var(--gr-ivory)] border-b border-white/5 hover:text-[color:var(--gr-gold-bright)] transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
