import { useState } from "react";
import { Instagram, Facebook, Linkedin, ArrowRight, Music2 } from "lucide-react";
import { toast } from "sonner";

const LEGAL_LINKS = ["Terms & Conditions", "Privacy Policy", "Cookie Policy", "Careers", "Contact"];

export function SiteFooter() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Thanks for signing up to the Gordon Ramsay Restaurants newsletter.");
    setEmail("");
  };

  return (
    <footer className="bg-[#141414] text-white">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 py-14">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border-b border-white/10 pb-10">
          <div>
            <h2 className="text-[20px] md:text-[25px] font-normal">Join our newsletter</h2>
            <p className="mt-1 text-[14px] text-[#d0d0d0]">
              Sign up for the latest news, offers and events from Gordon Ramsay Restaurants.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex w-full md:w-auto max-w-md">
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-l-[4px] border border-r-0 border-[rgba(77,77,77,0.8)] bg-[#1f1f1f] px-4 py-3 text-[15px] text-white outline-none focus:border-white/60"
            />
            <button
              type="submit"
              aria-label="Sign up"
              className="rounded-r-[4px] bg-[#d2cece] px-4 text-[#1d1d1b] hover:bg-white transition-colors"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 py-10 border-b border-white/10">
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-[13px] md:text-[14px] text-[#d0d0d0]">
            {LEGAL_LINKS.map((link) => (
              <a key={link} href="#" className="hover:text-white transition-colors">
                {link}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <a
              href="#"
              aria-label="Instagram"
              className="text-white hover:text-[#e1d8bf] transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="#"
              aria-label="TikTok"
              className="text-white hover:text-[#e1d8bf] transition-colors"
            >
              <Music2 className="h-5 w-5" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="text-white hover:text-[#e1d8bf] transition-colors"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="text-white hover:text-[#e1d8bf] transition-colors"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-10 text-center md:text-left">
          <img
            src="/images/asset_09_footer-grg.svg"
            alt="Gordon Ramsay Group"
            className="h-[15px] w-auto opacity-90"
          />
          <p className="text-[13px] leading-[21px] text-[#d0d0d0]">
            &copy; {new Date().getFullYear()} Gordon Ramsay Restaurants. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
