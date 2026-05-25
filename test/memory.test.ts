import { describe, test, expect } from "bun:test";
import { getHeapUsed } from "../src/memory";

describe("getHeapUsed", () => {
  test("returns null in non-Chrome environments", () => {
    // Bun doesn't have performance.memory
    const result = getHeapUsed();
    expect(result).toBeNull();
  });
});
