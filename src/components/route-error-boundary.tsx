import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { toUserMessage } from "@/lib/errors";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { AlertTriangle } from "lucide-react";

export function RouteErrorBoundary({ error: rawError, reset }: ErrorComponentProps) {
  const router = useRouter();
  const error = rawError instanceof Error ? rawError : new Error(String(rawError));
  useEffect(() => {
    console.error("[route-error]", error);
    reportLovableError(error, { boundary: "route_error_component" });
  }, [error]);

  return (
    <AppShell>
      <div className="glass-surface mx-auto max-w-lg rounded-2xl p-8 text-center">
        <div
          aria-hidden="true"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-lg font-semibold tracking-tight">
          We couldn't load this page
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {toUserMessage(error, "Something went wrong while loading this page.")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              void router.invalidate();
              reset();
            }}
            className="rounded-full"
          >
            Try again
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
