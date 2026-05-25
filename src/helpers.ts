// Low-level helpers

import { wait, waitFrames } from "./timing";

/**
 * Try to trigger garbage collection and let the engine settle.
 * Falls back to a short pause if gc() is unavailable.
 */
export const tryGC = async (): Promise<void> => {
  if (typeof globalThis.gc === "function") {
    globalThis.gc();
  }
  await wait(100);
  await waitFrames(3);
};

/**
 * Burn CPU for approximately `targetMs` milliseconds.
 *
 * Uses a tight busy-wait loop. The loop body cannot be dead-code-eliminated
 * because `performance.now()` reads the system clock.
 */
export const burnCpu = (targetMs: number): void => {
  if (targetMs <= 0) return;
  const end = performance.now() + targetMs;
  while (performance.now() < end) {
    /* busy wait */
  }
};

/**
 * Find the scrollable viewport element within a container.
 *
 * Strategies:
 *   1. Known class names (.vlist-viewport, react-virtuoso scroller)
 *   2. CSS overflow detection (auto/scroll)
 *   3. scrollHeight heuristic
 *   4. Fall back to first child element
 */
export const findViewport = (
  container: HTMLElement,
): HTMLElement | null => {
  if (!container) return null;

  const knownSelectors = [
    ".vlist-viewport",
    "[data-testid='virtuoso-scroller']",
  ];

  for (const selector of knownSelectors) {
    const el = container.querySelector<HTMLElement>(selector);
    if (el) return el;
  }

  const isScrollable = (style: CSSStyleDeclaration): boolean => {
    const vals = ["auto", "scroll"];
    if (vals.includes(style.overflowY)) return true;
    if (vals.includes(style.overflowX)) return true;
    const ov = style.overflow;
    if (vals.includes(ov)) return true;
    if (ov && ov.split(" ").some((v) => vals.includes(v))) return true;
    return false;
  };

  const walk = (el: Element): HTMLElement | null => {
    for (const child of el.children) {
      const style = getComputedStyle(child);
      if (isScrollable(style)) return child as HTMLElement;
      const found = walk(child);
      if (found) return found;
    }
    return null;
  };

  const found = walk(container);
  if (found) return found;

  const walkScrollable = (el: Element): HTMLElement | null => {
    for (const child of el.children) {
      if (child.scrollHeight > child.clientHeight + 1) {
        const deeper = walkScrollable(child);
        return deeper || (child as HTMLElement);
      }
    }
    return null;
  };

  return walkScrollable(container) || (container.firstElementChild as HTMLElement | null);
};
