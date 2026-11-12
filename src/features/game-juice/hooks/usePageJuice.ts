import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { registerJuiceAnchor } from "@/features/juice-engine/api";
import { emitJuice } from "@/features/game-juice/services/gameJuiceRuntime";

/** The app's page area (`App.tsx`), marked with a plain attribute so the main chunk stays juice-free. */
const PAGE_SELECTOR = "[data-juice-page]";

/**
 * Each navigation to another page plays `page.opened` (the page settles in), never the first
 * page load: the app's own loading already showed it. Registers the app's page area as the
 * `page` anchor while mounted.
 */
export function usePageJuice(): void {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = document.querySelector(PAGE_SELECTOR);
    return page ? registerJuiceAnchor("page", page) : undefined;
  }, []);
  const seen = useRef(pathname);
  useEffect(() => {
    if (pathname === seen.current) return;
    seen.current = pathname;
    emitJuice("page.opened");
  }, [pathname]);
}
