import { describe, test, expect } from "bun:test";
import { burnCpu } from "../src/helpers";

describe("burnCpu", () => {
  test("burns approximately the target duration", () => {
    const start = performance.now();
    burnCpu(20);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(18);
    expect(elapsed).toBeLessThan(40);
  });

  test("returns immediately for 0ms", () => {
    const start = performance.now();
    burnCpu(0);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2);
  });

  test("returns immediately for negative values", () => {
    const start = performance.now();
    burnCpu(-10);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2);
  });
});
