import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ProductModeContext = createContext({
  cinema: true,
  setCinema: () => {},
  reducedMotion: false,
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

const THEME_KEY = "portfolio-theme";

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return "dark";
}

export function ProductModeProvider({ children }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [cinema, setCinema] = useState(true);
  const [theme, setThemeState] = useState(() =>
    typeof window !== "undefined" ? readStoredTheme() : "dark"
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReducedMotion(media.matches);
      if (media.matches) setCinema(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.mode =
      cinema && !reducedMotion ? "product" : "screen";
  }, [cinema, reducedMotion]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = (next) => {
    setThemeState(next === "light" ? "light" : "dark");
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const value = useMemo(
    () => ({
      cinema: cinema && !reducedMotion,
      setCinema,
      reducedMotion,
      theme,
      setTheme,
      toggleTheme,
    }),
    [cinema, reducedMotion, theme]
  );

  return (
    <ProductModeContext.Provider value={value}>
      {children}
    </ProductModeContext.Provider>
  );
}

export function useProductMode() {
  return useContext(ProductModeContext);
}
