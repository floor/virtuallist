import { describe, test, expect } from "bun:test";
import { wait } from "../src/timing";

describe("wait", () => {
  test("resolves after approximately the specified duration", async () => {
    const start = performance.now();
    await wait(50);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45);
    expect(elapsed).toBeLessThan(150);
  });

  test("resolves immediately for 0ms", async () => {
    const start = performance.now();
    await wait(0);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
