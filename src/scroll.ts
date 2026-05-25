// Scroll measurement primitives

import { nextFrame } from "./timing";
import { burnCpu } from "./helpers";
import { median, percentile, round } from "./stats";

export interface ScrollResult {
  medianFPS: number;
  medianFrameTime: number;
  p95FrameTime: number;
  totalFrames: number;
}

/**
 * Scroll and measure frame times over a duration.
 *
 * Uses a dual-loop architecture:
 *   1. setTimeout scroll driver (~250 updates/sec) — smooth sub-pixel scrolling
 *   2. rAF paint counter — accurate frame timing without coupling to scroll
 */
export const measureScrollPerformance = async (
  viewport: HTMLElement | null,
  durationMs: number,
  stressMs: number = 0,
  speedPxPerSec: number = 7200,
): Promise<ScrollResult> => {
  if (!viewport) {
    return { medianFPS: 0, medianFrameTime: 0, p95FrameTime: 0, totalFrames: 0 };
  }

  const maxScroll = viewport.scrollHeight - viewport.clientHeight;

  return new Promise((resolve) => {
    const frameTimes: number[] = [];
    let running = true;
    let scrollPos = 0;
    let direction = 1;

    let lastPaintTime = 0;

    const paintTick = (timestamp: number): void => {
      if (!running) return;

      if (lastPaintTime > 0) {
        frameTimes.push(timestamp - lastPaintTime);
      }
      lastPaintTime = timestamp;

      if (stressMs > 0) burnCpu(stressMs);

      requestAnimationFrame(paintTick);
    };

    const scrollStartTime = performance.now();
    let lastScrollTime = scrollStartTime;

    const scrollTick = (): void => {
      if (!running) return;

      const now = performance.now();
      const elapsed = now - scrollStartTime;

      if (elapsed >= durationMs) {
        running = false;

        const medianFrameTime = median(frameTimes);
        const p95FrameTime = percentile(
          [...frameTimes].sort((a, b) => a - b),
          95,
        );
        const medianFPS =
          frameTimes.length > 0 ? round(1000 / medianFrameTime, 1) : 0;

        resolve({
          medianFPS,
          medianFrameTime: round(medianFrameTime, 2),
          p95FrameTime: round(p95FrameTime, 2),
          totalFrames: frameTimes.length,
        });
        return;
      }

      const dt = now - lastScrollTime;
      lastScrollTime = now;

      const pxDelta = (speedPxPerSec * dt) / 1000;
      scrollPos += pxDelta * direction;

      if (scrollPos >= maxScroll) {
        scrollPos = maxScroll;
        direction = -1;
      } else if (scrollPos <= 0) {
        scrollPos = 0;
        direction = 1;
      }

      viewport.scrollTop = scrollPos;

      setTimeout(scrollTick, 0);
    };

    requestAnimationFrame(paintTick);
    setTimeout(scrollTick, 0);
  });
};

/**
 * Measure how fast a library renders after a large scroll position jump.
 *
 * Sets scrollTop to distant positions and measures time until the next
 * rAF callback fires (browser has committed layout + paint).
 */
export const measureScrollToIndex = async (
  viewport: HTMLElement | null,
  itemCount: number,
  itemHeight: number = 48,
  targets: number[] = [0.5, 0.95, 0.0],
  iterations: number = 5,
): Promise<number> => {
  if (!viewport) return 0;

  const maxScroll = viewport.scrollHeight - viewport.clientHeight;
  const allTimes: number[] = [];

  for (const fraction of targets) {
    const targetScroll = Math.min(
      Math.round(fraction * itemCount * itemHeight),
      maxScroll,
    );

    for (let i = 0; i < iterations; i++) {
      const resetScroll = fraction >= 0.5 ? 0 : maxScroll;
      viewport.scrollTop = resetScroll;

      await nextFrame();
      await nextFrame();

      const t0 = performance.now();
      viewport.scrollTop = targetScroll;
      await nextFrame();
      const t1 = performance.now();

      allTimes.push(t1 - t0);
    }
  }

  return allTimes.length > 0 ? round(median(allTimes), 2) : 0;
};
