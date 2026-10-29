import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type AccentColor = "blue" | "violet" | "emerald" | "rose" | "amber";

export const ACCENTS: { id: AccentColor; label: string; swatch: string }[] = [
  { id: "blue", label: "Blue", swatch: "oklch(0.62 0.19 256)" },
  { id: "violet", label: "Violet", swatch: "oklch(0.6 0.24 295)" },
  { id: "emerald", label: "Emerald", swatch: "oklch(0.62 0.17 160)" },
  { id: "rose", label: "Rose", swatch: "oklch(0.63 0.22 15)" },
  { id: "amber", label: "Amber", swatch: "oklch(0.75 0.16 70)" },
];

const THEME_KEY = "scn-theme";
const ACCENT_KEY = "scn-accent";

type Ctx = {
  theme: ThemeMode;
  accent: AccentColor;
  setTheme: (t: ThemeMode) => void;
  setAccent: (a: AccentColor) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

function applyTheme(t: ThemeMode) {
  if (typeof document === "undefined") return;
  const isDark =
    t === "dark" ||
    (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

function applyAccent(a: AccentColor) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-accent", a);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [accent, setAccentState] = useState<AccentColor>("blue");

  useEffect(() => {
    const t = (localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? "system";
    const a = (localStorage.getItem(ACCENT_KEY) as AccentColor | null) ?? "blue";
    setThemeState(t);
    setAccentState(a);
    applyTheme(t);
    applyAccent(a);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    applyTheme(t);
  };
  const setAccent = (a: AccentColor) => {
    setAccentState(a);
    localStorage.setItem(ACCENT_KEY, a);
    applyAccent(a);
  };

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
