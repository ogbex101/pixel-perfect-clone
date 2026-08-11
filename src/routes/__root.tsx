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
import { ArrowUp, Menu } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";

const NAV_LINKS = [
  { to: "/about", label: "About" },
  { to: "/books", label: "Books" },
  { to: "/cinematic", label: "Cinematic" },
  { to: "/press", label: "Press" },
  { to: "/testimonials", label: "Praise" },
  { to: "/debate", label: "Debate" },
  { to: "/news", label: "News" },
  { to: "/contact", label: "Contact" },
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isAdmin) {
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
            <nav className="hidden md:flex flex-wrap items-center gap-8 text-[0.8rem] font-medium tracking-[0.08em] uppercase text-muted-foreground">
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
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden inline-flex items-center justify-center rounded-sm border border-border p-2 text-foreground hover:border-primary hover:text-primary transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="texture-paper border-l border-border w-3/4">
                <SheetTitle className="font-serif text-lg text-gradient-gold">Menu</SheetTitle>
                <nav className="mt-8 flex flex-col gap-6 text-lg font-serif">
                  {NAV_LINKS.map((l, i) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setMenuOpen(false)}
                      activeProps={{ className: "text-primary" }}
                      className="route-transition text-foreground/85 hover:text-primary hover:translate-x-1 transition-all duration-300"
                      style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <ScrollProgress />
        </header>
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
