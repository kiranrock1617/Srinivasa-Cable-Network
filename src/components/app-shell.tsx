import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Cable } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { EasyModeToggle } from "@/components/easy-mode";
import { RefreshButton } from "@/components/refresh-button";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-foreground">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="group flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.55_0.22_290)] text-primary-foreground shadow-[0_6px_20px_-6px_oklch(0.62_0.19_256/0.55)] ring-1 ring-white/40 transition-transform group-hover:scale-[1.03]"
            >
              <Cable className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-[15px] font-semibold tracking-tight sm:text-base">
                Srinivasa Cable Network
              </span>
              <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Customer Management
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <EasyModeToggle />
            <RefreshButton />
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

