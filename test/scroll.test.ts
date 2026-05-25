import { describe, test, expect } from "bun:test";
import { measureScrollPerformance, measureScrollToIndex } from "../src/scroll";

describe("measureScrollPerformance", () => {
  test("returns zeros for null viewport", async () => {
    const result = await measureScrollPerformance(null, 1000);
    expect(result).toEqual({
      medianFPS: 0,
      medianFrameTime: 0,
      p95FrameTime: 0,
      totalFrames: 0,
    });
  });
});

describe("measureScrollToIndex", () => {
  test("returns 0 for null viewport", async () => {
    const result = await measureScrollToIndex(null, 10000);
    expect(result).toBe(0);
  });
});
