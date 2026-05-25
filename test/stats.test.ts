import { describe, test, expect } from "bun:test";
import { median, percentile, round, mean, coefficientOfVariation, bytesToMB } from "../src/stats";

describe("median", () => {
  test("empty array returns 0", () => {
    expect(median([])).toBe(0);
  });

  test("single value", () => {
    expect(median([5])).toBe(5);
  });

  test("odd count", () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  test("even count", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  test("does not mutate input", () => {
    const arr = [3, 1, 2];
    median(arr);
    expect(arr).toEqual([3, 1, 2]);
  });
});

describe("percentile", () => {
  test("empty array returns 0", () => {
    expect(percentile([], 50)).toBe(0);
  });

  test("single value", () => {
    expect(percentile([10], 95)).toBe(10);
  });

  test("p50 of sorted array", () => {
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
  });

  test("p95 interpolates", () => {
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const p95 = percentile(sorted, 95);
    expect(p95).toBeCloseTo(9.55, 1);
  });
});

describe("round", () => {
  test("rounds to 1 decimal", () => {
    expect(round(3.456, 1)).toBe(3.5);
  });

  test("rounds to 0 decimals", () => {
    expect(round(3.7, 0)).toBe(4);
  });

  test("rounds to 2 decimals", () => {
    expect(round(3.456, 2)).toBe(3.46);
  });
});

describe("mean", () => {
  test("empty returns 0", () => {
    expect(mean([])).toBe(0);
  });

  test("computes average", () => {
    expect(mean([2, 4, 6])).toBe(4);
  });
});

describe("coefficientOfVariation", () => {
  test("single value returns 0", () => {
    expect(coefficientOfVariation([5])).toBe(0);
  });

  test("identical values return 0", () => {
    expect(coefficientOfVariation([10, 10, 10])).toBe(0);
  });

  test("computes CV%", () => {
    const cv = coefficientOfVariation([10, 12, 11, 9, 10]);
    expect(cv).toBeGreaterThan(0);
    expect(cv).toBeLessThan(15);
  });
});

describe("bytesToMB", () => {
  test("converts bytes to MB", () => {
    expect(bytesToMB(1024 * 1024)).toBe(1);
    expect(bytesToMB(5 * 1024 * 1024)).toBe(5);
  });

  test("rounds to 2 decimals", () => {
    expect(bytesToMB(1500000)).toBe(1.43);
  });
});
