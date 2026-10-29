import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

const KEY = "scn-font-size";

export type FontSize = "small" | "medium" | "large";
const ORDER: FontSize[] = ["small", "medium", "large"];
const DEFAULT: FontSize = "medium";

type Ctx = { size: FontSize; setSize: (v: FontSize) => void; cycle: () => void };
const FontSizeContext = createContext<Ctx | null>(null);

function apply(v: FontSize) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.remove("font-small", "font-medium", "font-large");
  el.classList.add(`font-${v}`);
}

export function EasyModeProvider({ children }: { children: ReactNode }) {
  const [size, setSizeState] = useState<FontSize>(DEFAULT);

  useEffect(() => {
    const raw = localStorage.getItem(KEY) as FontSize | null;
    const v = raw && ORDER.includes(raw) ? raw : DEFAULT;
    setSizeState(v);
    apply(v);
  }, []);

  const setSize = (v: FontSize) => {
    setSizeState(v);
    localStorage.setItem(KEY, v);
    apply(v);
  };

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(size) + 1) % ORDER.length];
    setSize(next);
  };

  return (
    <FontSizeContext.Provider value={{ size, setSize, cycle }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error("useFontSize must be used within EasyModeProvider");
  return ctx;
}

const LABEL: Record<FontSize, string> = {
  small: "Small text",
  medium: "Medium text",
  large: "Large text",
};

const NEXT_LABEL: Record<FontSize, string> = {
  small: "medium",
  medium: "large",
  large: "small",
};

export function EasyModeToggle() {
  const { size, cycle } = useFontSize();
  return (
    <Button
      type="button"
      variant="outline"
      onClick={cycle}
      aria-label={`${LABEL[size]}. Tap to switch to ${NEXT_LABEL[size]}.`}
      title={`${LABEL[size]} — tap for ${NEXT_LABEL[size]}`}
      className="glass-surface h-10 shrink-0 items-baseline gap-1 rounded-2xl border-white/60 px-2.5 shadow-sm hover:bg-card dark:hover:bg-card/10"
    >
      <span className="text-[13px] font-semibold leading-none">A</span>
      <span
        aria-hidden="true"
        className={`font-semibold leading-none ${
          size === "small" ? "text-[13px]" : size === "medium" ? "text-[16px]" : "text-[19px]"
        }`}
      >
        A
      </span>
    </Button>
  );
}
