import { Monitor, Moon, Sun, Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCENTS, useTheme, type ThemeMode } from "./theme-provider";

const MODES: { id: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
];

export function ThemeSwitcher() {
  const { theme, accent, setTheme, setAccent } = useTheme();
  const current = MODES.find((m) => m.id === theme) ?? MODES[2];
  const CurrentIcon = current.Icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Change theme and accent color"
          className="glass-surface h-10 w-10 rounded-2xl border-white/60 shadow-sm hover:bg-card dark:hover:bg-card/10"
        >
          <CurrentIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-strong w-56">
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Theme
        </DropdownMenuLabel>
        {MODES.map((m) => {
          const Icon = m.Icon;
          const active = theme === m.id;
          return (
            <DropdownMenuItem key={m.id} onClick={() => setTheme(m.id)}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">{m.label}</span>
              {active && <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Palette className="h-3 w-3" aria-hidden="true" /> Accent
        </DropdownMenuLabel>
        <div className="grid grid-cols-5 gap-1.5 px-2 py-1.5">
          {ACCENTS.map((a) => {
            const active = accent === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccent(a.id)}
                aria-label={`${a.label} accent`}
                aria-pressed={active}
                title={a.label}
                className={`relative flex h-8 w-8 items-center justify-center rounded-xl ring-1 ring-inset ring-black/5 transition hover:scale-105 dark:ring-white/10 ${active ? "ring-2 ring-primary" : ""}`}
                style={{ backgroundColor: a.swatch }}
              >
                {active && <Check className="h-4 w-4 text-white drop-shadow" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
