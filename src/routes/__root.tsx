import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { EasyModeProvider } from "@/components/easy-mode";

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

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    const err = error instanceof Error ? error : new Error(String(error));
    reportLovableError(err, { boundary: "tanstack_root_error_component" });
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
      { title: "Srinivasa Cable Network" },
      {
        name: "description",
        content:
          "Manage Srinivasa Cable Network customers: VC numbers, addresses, phones and photos in one place.",
      },
      { property: "og:title", content: "Srinivasa Cable Network" },
      {
        property: "og:description",
        content: "Customer management for Srinivasa Cable Network.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Srinivasa Cable Network" },
      { name: "description", content: "Manage Srinivasa Cable Network customers: VC numbers, addresses, phones and photos in one place." },
      { property: "og:description", content: "Manage Srinivasa Cable Network customers: VC numbers, addresses, phones and photos in one place." },
      { name: "twitter:description", content: "Manage Srinivasa Cable Network customers: VC numbers, addresses, phones and photos in one place." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/Az3Wlqel1CYyQDzGxCIh8VGz3AD3/social-images/social-1783239770193-Srinivasa-cable-network.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/Az3Wlqel1CYyQDzGxCIh8VGz3AD3/social-images/social-1783239770193-Srinivasa-cable-network.webp" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const themeInitScript = `(function(){try{var t=localStorage.getItem('scn-theme')||'system';var a=localStorage.getItem('scn-accent')||'blue';var f=localStorage.getItem('scn-font-size');if(f!=='small'&&f!=='medium'&&f!=='large')f='medium';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');document.documentElement.classList.add('font-'+f);document.documentElement.setAttribute('data-accent',a);}catch(e){}})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    let toastFn: ((msg: string) => void) | null = null;
    void import("sonner").then((m) => {
      toastFn = (msg: string) => m.toast.error(msg);
    });
    const notify = (msg: string) => {
      if (toastFn) toastFn(msg);
    };
    const onError = (event: ErrorEvent) => {
      console.error("[window.error]", event.error ?? event.message);
      reportLovableError(event.error ?? new Error(event.message), {
        boundary: "window_error",
      });
      notify("Something went wrong. Please try again.");
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      console.error("[unhandledrejection]", reason);
      const err = reason instanceof Error ? reason : new Error(String(reason));
      reportLovableError(err, { boundary: "unhandled_rejection" });
      notify(err.message || "An unexpected error occurred.");
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <EasyModeProvider>
          <Outlet />
          <Toaster richColors position="top-right" />
        </EasyModeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
