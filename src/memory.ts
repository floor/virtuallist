// Memory measurement primitives

import { wait, waitFrames } from "./timing";
import { tryGC } from "./helpers";

/**
 * Get current JS heap usage in bytes (Chrome only).
 * Returns null if the API is unavailable.
 */
export const getHeapUsed = (): number | null => {
  const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } })
    .memory;
  if (mem && typeof mem.usedJSHeapSize === "number") {
    return mem.usedJSHeapSize;
  }
  return null;
};

/**
 * Aggressive heap settling — multiple GC + wait cycles.
 *
 * More thorough than `tryGC()`. Designed for memory measurements where
 * residual garbage must be reclaimed before taking a heap snapshot.
 */
export const settleHeap = async (cycles: number = 3): Promise<void> => {
  for (let i = 0; i < cycles; i++) {
    if (typeof globalThis.gc === "function") {
      globalThis.gc();
    }
    await wait(150);
    await waitFrames(5);
  }
};

/**
 * Take a validated heap delta measurement.
 *
 * Measures the memory cost of a create/settle cycle by snapshotting the heap
 * before and after. Rejects negative deltas (GC artifacts).
 */
export const measureMemoryDelta = async (
  create: () => Promise<void>,
  settleFrames: number = 5,
): Promise<number | null> => {
  await settleHeap();

  const before = getHeapUsed();
  if (before === null) return null;

  await create();
  await waitFrames(settleFrames);
  await tryGC();

  const after = getHeapUsed();
  if (after === null) return null;

  const delta = after - before;
  if (delta < 0) return null;

  return delta;
};

/**
 * Measure memory usage with multiple attempts for reliability.
 *
 * Running multiple attempts and taking the median of valid readings
 * reduces noise from GC artifacts.
 */
export const measureMemoryWithRetries = async (opts: {
  createFn: () => Promise<unknown>;
  destroyFn: (instance: unknown) => Promise<void>;
  container: { innerHTML: string };
  onStatus?: (message: string) => void;
  label?: string;
  attempts?: number;
}): Promise<{ memoryBytes: number | null; instance: unknown }> => {
  const {
    createFn,
    destroyFn,
    container,
    onStatus,
    label = "",
    attempts = 5,
  } = opts;

  const validDeltas: number[] = [];
  let instance: unknown = null;

  const hasMemoryAPI = getHeapUsed() !== null;

  if (hasMemoryAPI) {
    for (let i = 0; i < attempts; i++) {
      if (instance) {
        await destroyFn(instance);
        instance = null;
      }
      container.innerHTML = "";

      onStatus?.(
        attempts > 1
          ? `Measuring ${label} memory (${i + 1}/${attempts})...`
          : `Measuring ${label} memory...`,
      );

      let inst: unknown;
      const delta = await measureMemoryDelta(async () => {
        inst = await createFn();
        await waitFrames(3);
      });

      instance = inst!;

      if (delta !== null) {
        validDeltas.push(delta);
      }
    }
  } else {
    onStatus?.(`Measuring ${label} memory (not available)...`);
    container.innerHTML = "";
    instance = await createFn();
    await waitFrames(3);
  }

  const { median } = await import("./stats");
  const memoryBytes = validDeltas.length > 0 ? median(validDeltas) : null;

  return { memoryBytes, instance };
};
