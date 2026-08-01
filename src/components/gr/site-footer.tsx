import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Linkedin, ArrowRight, Music2 } from "lucide-react";
import { toast } from "sonner";

const EXPLORE_LINKS = [
  { label: "Restaurants", to: "/bread-street-kitchen" as const, hash: undefined },
  { label: "Private Dining & Events", to: "/" as const, hash: "events" },
  { label: "Masterclasses", to: "/" as const, hash: "masterclasses" },
  { label: "Gifting", to: "/" as const, hash: "gifting" },
  { label: "What's On", to: "/" as const, hash: "whats-on" },
];

const COMPANY_LINKS = [
  "Terms & Conditions",
  "Privacy Policy",
  "Cookie Policy",
  "Careers",
  "Contact",
];

export function SiteFooter() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Thanks for signing up to the Gordon Ramsay Restaurants newsletter.");
    setEmail("");
  };

  return (
    <footer className="border-t border-[color:var(--gr-hairline-faint)] bg-[#0c0b09] text-[color:var(--gr-ivory)]">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-6 py-16 md:grid-cols-12 md:gap-8 md:py-20">
        <div className="md:col-span-4">
          <img
            src="/images/asset_18_gr_LOGO.svg"
            alt="Gordon Ramsay Restaurants"
            className="h-auto w-full max-w-[220px]"
          />
          <p className="mt-6 max-w-sm text-[14px] leading-relaxed text-[color:var(--gr-muted)]">
            Seasonal ingredients, precise technique and genuine hospitality — across every
            restaurant in the group.
          </p>
          <div className="mt-7 flex items-center gap-5">
            <a
              href="#"
              aria-label="Instagram"
              className="text-[color:var(--gr-muted)] transition-colors hover:text-[color:var(--gr-gold-bright)]"
            >
              <Instagram className="h-[18px] w-[18px]" />
            </a>
            <a
              href="#"
              aria-label="TikTok"
              className="text-[color:var(--gr-muted)] transition-colors hover:text-[color:var(--gr-gold-bright)]"
            >
              <Music2 className="h-[18px] w-[18px]" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="text-[color:var(--gr-muted)] transition-colors hover:text-[color:var(--gr-gold-bright)]"
            >
              <Facebook className="h-[18px] w-[18px]" />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="text-[color:var(--gr-muted)] transition-colors hover:text-[color:var(--gr-gold-bright)]"
            >
              <Linkedin className="h-[18px] w-[18px]" />
            </a>
          </div>
        </div>

        <nav className="md:col-span-2" aria-label="Explore">
          <p className="gr-eyebrow">Explore</p>
          <ul className="mt-5 space-y-3">
            {EXPLORE_LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  hash={l.hash}
                  className="text-[14px] text-[color:var(--gr-muted)] transition-colors hover:text-[color:var(--gr-ivory)]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="md:col-span-2" aria-label="Company">
          <p className="gr-eyebrow">Company</p>
          <ul className="mt-5 space-y-3">
            {COMPANY_LINKS.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="text-[14px] text-[color:var(--gr-muted)] transition-colors hover:text-[color:var(--gr-ivory)]"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <h3 className="gr-h3">Join our newsletter</h3>
          <p className="mt-3 text-[14px] leading-relaxed text-[color:var(--gr-muted)]">
            The latest news, offers and events from Gordon Ramsay Restaurants.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 flex items-center gap-3">
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              required
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-0 border-b border-white/20 bg-transparent py-2.5 text-[14px] text-[color:var(--gr-ivory)] outline-none transition-colors placeholder:text-[color:var(--gr-muted)]/70 focus:border-[color:var(--gr-gold)]"
            />
            <button
              type="submit"
              aria-label="Sign up"
              className="shrink-0 border border-[color:var(--gr-hairline)] p-3 text-[color:var(--gr-gold)] transition-colors hover:border-[color:var(--gr-gold)] hover:text-[color:var(--gr-gold-bright)]"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-[color:var(--gr-hairline-faint)]">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 px-6 py-8 text-center md:flex-row md:text-left">
          <img
            src="/images/asset_09_footer-grg.svg"
            alt="Gordon Ramsay Group"
            className="h-[13px] w-auto opacity-70"
          />
          <p className="text-[12px] tracking-wide text-[color:var(--gr-muted)]">
            &copy; {new Date().getFullYear()} Gordon Ramsay Restaurants. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
