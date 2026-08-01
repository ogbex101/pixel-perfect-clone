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
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/gr/site-header";
import { SiteFooter } from "@/components/gr/site-footer";
import { SiteOverlays } from "@/components/gr/site-overlays";

const SITE_TITLE = "Explore Gordon Ramsay Restaurants";
const SITE_DESCRIPTION =
  "Book a table at Gordon Ramsay Restaurants — Bread Street Kitchen & Bar, Petrus, Lucky Cat and more. Explore menus, private dining, masterclasses and gifting.";

function NotFoundComponent() {
  return (
    <div className="gr-page flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="gr-h1 text-[color:var(--gr-gold)]">404</h1>
        <h2 className="gr-h3 mt-4">Page not found</h2>
        <div className="gr-rule-center my-5" />
        <p className="text-sm text-[color:var(--gr-muted)]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link to="/" className="gr-btn-ghost">
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
    <div className="gr-page flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="gr-h3">This page didn't load</h1>
        <div className="gr-rule-center my-5" />
        <p className="text-sm text-[color:var(--gr-muted)]">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="gr-btn-solid"
          >
            Try again
          </button>
          <a href="/" className="gr-btn-ghost">
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
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: SITE_DESCRIPTION },
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
        href: "https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&display=swap",
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster />
      </QueryClientProvider>
    );
  }

  const isHome = pathname === "/";

  return (
    <QueryClientProvider client={queryClient}>
      <div className="gr-page min-h-screen flex flex-col">
        <SiteHeader />
        {/* The header is fixed; the homepage hero runs underneath it, all
            other routes need a spacer so content clears it. */}
        {!isHome && <div aria-hidden className="h-[60px] md:h-[76px]" />}
        <main key={pathname} className="flex-1 route-transition">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      <SiteOverlays />
      <Toaster />
    </QueryClientProvider>
  );
}
