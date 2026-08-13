import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUp, Menu, X } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

/**
 * Navigation is grouped rather than flat: nine equal-weight links gave the
 * header no hierarchy, so related pages now sit under three labelled groups
 * and the member CTA is promoted out of the slide-out menu.
 */
const NAV_GROUPS = [
  {
    label: "The Work",
    links: [
      { to: "/books", label: "Books", hint: "Novels & series" },
      { to: "/cinematic", label: "Cinematic", hint: "Trailers & scenes" },
    ],
  },
  {
    label: "Community",
    links: [
      { to: "/home", label: "Challenge", hint: "The DUMB 31 challenge" },
      { to: "/debate", label: "Debate", hint: "Reader arguments" },
      { to: "/news", label: "News", hint: "Latest dispatches" },
    ],
  },
  {
    label: "Reception",
    links: [
      { to: "/press", label: "Press", hint: "Coverage & interviews" },
      { to: "/testimonials", label: "Praise", hint: "What readers say" },
    ],
  },
] as const;

const NAV_DIRECT = [
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

const NAV_LINKS = [
  ...NAV_DIRECT.slice(0, 1),
  ...NAV_GROUPS.flatMap((g) => g.links.map((l) => ({ to: l.to, label: l.label }))),
  ...NAV_DIRECT.slice(1),
] as const;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nik Nanoski — Science Fiction Author" },
      {
        name: "description",
        content:
          "Science fiction author Nik Nanoski. Author of DUMB 31, a post-apocalyptic novel about survival and inherited lies.",
      },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Nik Nanoski — Science Fiction Author" },
      {
        property: "og:description",
        content:
          "Science fiction author Nik Nanoski. Author of DUMB 31, a post-apocalyptic novel about survival and inherited lies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Nik Nanoski — Science Fiction Author" },
      {
        name: "twitter:description",
        content:
          "Science fiction author Nik Nanoski. Author of DUMB 31, a post-apocalyptic novel about survival and inherited lies.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9bffbe67-534f-4a54-a7df-2b4bb6bffc5f/id-preview-3e0d4bf8--244f4434-b112-46fa-96bb-ad217080780b.lovable.app-1784835524505.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9bffbe67-534f-4a54-a7df-2b4bb6bffc5f/id-preview-3e0d4bf8--244f4434-b112-46fa-96bb-ad217080780b.lovable.app-1784835524505.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-[color:var(--brand-gold-deep)] via-[color:var(--brand-gold)] to-[color:var(--brand-gold-bright)]"
      style={{ transform: `scaleX(${progress})` }}
    />
  );
}

function BackToTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`backtotop ${shown ? "is-shown" : ""}`}
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}

/**
 * Slide-out menu shared by every breakpoint. It overlays the page rather than
 * pushing it, closes on link click, on a click outside, and on Escape.
 */
function SiteMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Stop the page behind the overlay from scrolling with it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-background/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span className="sr-only">Close menu</span>
      </button>

      <aside
        id="site-menu"
        aria-hidden={!open}
        className={`texture-ink fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col border-l border-[color:oklch(0.79_0.115_85_/_28%)] shadow-[0_0_60px_-10px_oklch(0_0_0/0.9)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <span className="font-serif text-lg text-gradient-gold">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-primary/40 text-primary transition-colors hover:border-primary hover:bg-primary/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={onClose}
              tabIndex={open ? 0 : -1}
              activeProps={{ className: "text-primary border-primary/50 bg-primary/10" }}
              className="border border-transparent px-4 py-3 font-serif text-lg text-foreground/85 transition-all duration-300 hover:border-border hover:pl-6 hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <Link
            to="/member/login"
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            className="block bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)]"
          >
            Member sign in
          </Link>
        </div>
      </aside>
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isAdmin = pathname.startsWith("/admin");
  // The signed-in member area has its own sidebar chrome. Login and signup keep
  // the public header so a visitor can still navigate the site.
  const isMemberApp =
    pathname.startsWith("/member/") &&
    pathname !== "/member/login" &&
    pathname !== "/member/signup";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isAdmin || isMemberApp) {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <header
          className={`sticky top-0 z-40 border-b border-border backdrop-blur-md transition-all duration-500 ${
            scrolled
              ? "bg-background/95 shadow-[0_12px_30px_-18px_oklch(0_0_0/0.8)]"
              : "bg-background/80"
          }`}
        >
          <div
            className={`mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 transition-all duration-500 ${
              scrolled ? "py-3.5" : "py-5"
            }`}
          >
            <Link
              to="/"
              className="font-serif text-xl tracking-tight text-gradient-gold transition-opacity hover:opacity-80"
            >
              Nik Nanoski
            </Link>
            {/* Desktop links stay visible; the hamburger sits alongside them at
                every width so the full menu is always one click away. */}
            <nav className="hidden lg:flex flex-wrap items-center gap-8 text-[0.8rem] font-medium tracking-[0.08em] uppercase text-muted-foreground">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  activeProps={{ className: "text-primary" }}
                  className="link-underline hover:text-primary transition-colors duration-300"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              className="inline-flex items-center justify-center rounded-sm border border-primary/40 p-2 text-primary transition-colors hover:border-primary hover:bg-primary/10"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <ScrollProgress />
        </header>

        <SiteMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main key={pathname} className="flex-1 route-transition">
          <Outlet />
        </main>
        <footer className="texture-ink relative mt-24 border-t border-[color:oklch(0.79_0.115_85_/_28%)]">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="ornament">
              <span aria-hidden className="text-sm tracking-[0.3em]">
                ✦
              </span>
            </div>
            <div className="mt-10 flex flex-col items-center gap-8 md:flex-row md:items-end md:justify-between">
              <div className="text-center md:text-left">
                <p className="font-serif text-2xl text-gradient-gold">Nik Nanoski</p>
                <p className="mt-2 font-serif italic text-sm text-muted-foreground">
                  Stories from after the end.
                </p>
              </div>
              <nav className="flex flex-wrap justify-center gap-x-7 gap-y-3 text-[0.75rem] font-medium tracking-[0.14em] uppercase text-muted-foreground">
                {NAV_LINKS.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="link-underline hover:text-primary transition-colors duration-300"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground/70 md:text-left">
              © {new Date().getFullYear()} Nik Nanoski. All rights reserved.
            </div>
          </div>
        </footer>
        <BackToTop />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
