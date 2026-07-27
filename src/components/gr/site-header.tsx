import { useState } from "react";
import { Link } from "@tanstack/react-router";
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

  return (
    <header className="sticky top-0 z-40 w-full bg-[#1a1a1a] gr-shadow-nav">
      <div className="mx-auto flex h-[55px] md:h-[70px] max-w-[1440px] items-center justify-between px-4 md:px-8">
        <Link
          to="/"
          className="flex items-center shrink-0 max-w-[150px] md:max-w-[220px]"
          aria-label="Gordon Ramsay Restaurants — home"
        >
          <img
            src="/images/asset_18_gr_LOGO.svg"
            alt="Gordon Ramsay Restaurants"
            className="h-auto w-full max-h-8 md:max-h-[42px]"
          />
        </Link>

        <nav className="hidden xl:flex items-center gap-0.5 h-full shrink-0">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              hash={l.hash}
              className="shrink-0 whitespace-nowrap px-3 h-[70px] flex items-center text-[15px] font-light text-white hover:bg-white/10 transition-colors duration-500"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="xl:hidden inline-flex items-center justify-center p-2 text-white shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#303030] border-l border-white/10 w-4/5 p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex items-center justify-between gap-3 px-5 h-[55px] border-b border-white/10">
              <img
                src="/images/asset_18_gr_LOGO.svg"
                alt="Gordon Ramsay Restaurants"
                className="h-auto max-h-6 w-full max-w-[160px]"
              />
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="shrink-0 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col py-2">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  hash={l.hash}
                  onClick={() => setMenuOpen(false)}
                  className="px-5 py-4 text-[15px] font-light text-white border-b border-white/5 hover:bg-white/5 transition-colors"
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
