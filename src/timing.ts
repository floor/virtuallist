// Timing measurement primitives

let _measureId = 0;

/**
 * Wait for the next animation frame.
 */
export const nextFrame = (): Promise<number> =>
  new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Wait for N animation frames.
 */
export const waitFrames = async (n: number): Promise<void> => {
  for (let i = 0; i < n; i++) {
    await nextFrame();
  }
};

/**
 * Wait for a specified duration in ms.
 */
export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Measure the duration of a function using the Performance Timeline API.
 *
 * Uses `performance.mark` + `performance.measure` for structured timing
 * that integrates with browser DevTools.
 */
export const measureDuration = async <T>(
  label: string,
  fn: () => T | Promise<T>,
): Promise<{ duration: number; result: T }> => {
  const id = _measureId++;
  const startMark = `bench-start-${id}`;
  const endMark = `bench-end-${id}`;
  const measureName = `bench-${label}-${id}`;

  try {
    performance.mark(startMark);
    const result = await fn();
    performance.mark(endMark);

    const entry = performance.measure(measureName, startMark, endMark);
    const duration = entry.duration;

    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);

    return { duration, result };
  } catch (err) {
    try {
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
    } catch {
      /* ignore cleanup errors */
    }
    throw err;
  }
};
