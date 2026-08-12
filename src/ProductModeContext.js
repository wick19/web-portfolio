import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ProductModeContext = createContext({
  cinema: true,
  setCinema: () => {},
  reducedMotion: false,
});

export function ProductModeProvider({ children }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [cinema, setCinema] = useState(true);

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
    document.documentElement.dataset.mode = cinema && !reducedMotion ? "product" : "screen";
  }, [cinema, reducedMotion]);

  const value = useMemo(
    () => ({
      cinema: cinema && !reducedMotion,
      setCinema,
      reducedMotion,
    }),
    [cinema, reducedMotion]
  );

  return <ProductModeContext.Provider value={value}>{children}</ProductModeContext.Provider>;
}

export function useProductMode() {
  return useContext(ProductModeContext);
}
