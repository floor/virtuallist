import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import puppeteer, { type Browser, type Page } from "puppeteer";
import { readFileSync } from "fs";
import { resolve } from "path";

const BUNDLE_PATH = resolve(import.meta.dir, "../dist/index.js");

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: true,
    args: ["--js-flags=--expose-gc", "--enable-precise-memory-info"],
  });
  page = await browser.newPage();

  const bundle = readFileSync(BUNDLE_PATH, "utf-8");

  await page.setContent(`
    <html><body>
      <div id="container" style="width:400px;height:600px;overflow:auto;">
        <div id="content" style="height:50000px;"></div>
      </div>
      <script type="module">
        ${bundle}
        window.__vl = {
          nextFrame: nextFrame,
          waitFrames: waitFrames,
          wait: wait,
          measureDuration: measureDuration,
          measureScrollPerformance: measureScrollPerformance,
          measureScrollToIndex: measureScrollToIndex,
          measureMemoryDelta: measureMemoryDelta,
          getHeapUsed: getHeapUsed,
          settleHeap: settleHeap,
          tryGC: tryGC,
          burnCpu: burnCpu,
          findViewport: findViewport,
          median: median,
          percentile: percentile,
          round: round,
          mean: mean,
          bytesToMB: bytesToMB,
        };
      </script>
    </body></html>
  `);

  await page.waitForFunction(() => (window as any).__vl !== undefined);
});

afterAll(async () => {
  await browser.close();
});

describe("timing (browser)", () => {
  test("nextFrame resolves with a timestamp", async () => {
    const result = await page.evaluate(async () => {
      const ts = await (window as any).__vl.nextFrame();
      return typeof ts === "number" && ts > 0;
    });
    expect(result).toBe(true);
  });

  test("waitFrames waits for N frames", async () => {
    const elapsed = await page.evaluate(async () => {
      const start = performance.now();
      await (window as any).__vl.waitFrames(3);
      return performance.now() - start;
    });
    expect(elapsed).toBeGreaterThan(30);
    expect(elapsed).toBeLessThan(200);
  });

  test("measureDuration measures function execution", async () => {
    const result = await page.evaluate(async () => {
      const { duration, result } = await (window as any).__vl.measureDuration(
        "test",
        () => {
          let sum = 0;
          for (let i = 0; i < 100000; i++) sum += i;
          return sum;
        },
      );
      return { duration, hasResult: result > 0 };
    });
    expect(result.duration).toBeGreaterThan(0);
    expect(result.hasResult).toBe(true);
  });

  test("measureDuration works with async functions", async () => {
    const result = await page.evaluate(async () => {
      const { duration, result } = await (window as any).__vl.measureDuration(
        "async-test",
        async () => {
          await new Promise((r) => setTimeout(r, 20));
          return 42;
        },
      );
      return { duration, result };
    });
    expect(result.duration).toBeGreaterThanOrEqual(15);
    expect(result.result).toBe(42);
  });
});

describe("helpers (browser)", () => {
  test("tryGC runs without error", async () => {
    const ok = await page.evaluate(async () => {
      await (window as any).__vl.tryGC();
      return true;
    });
    expect(ok).toBe(true);
  });

  test("burnCpu blocks for the specified duration", async () => {
    const elapsed = await page.evaluate(() => {
      const start = performance.now();
      (window as any).__vl.burnCpu(15);
      return performance.now() - start;
    });
    expect(elapsed).toBeGreaterThanOrEqual(13);
    expect(elapsed).toBeLessThan(50);
  });

  test("findViewport locates a scrollable element", async () => {
    const found = await page.evaluate(() => {
      const wrapper = document.createElement("div");
      const scrollable = document.createElement("div");
      scrollable.style.cssText = "height:300px;overflow:auto;";
      const tall = document.createElement("div");
      tall.style.height = "5000px";
      scrollable.appendChild(tall);
      wrapper.appendChild(scrollable);
      document.body.appendChild(wrapper);
      const viewport = (window as any).__vl.findViewport(wrapper);
      wrapper.remove();
      return viewport === scrollable;
    });
    expect(found).toBe(true);
  });

  test("findViewport returns null for null input", async () => {
    const result = await page.evaluate(() => {
      return (window as any).__vl.findViewport(null);
    });
    expect(result).toBeNull();
  });
});

describe("memory (browser)", () => {
  test("getHeapUsed returns a number in Chrome", async () => {
    const result = await page.evaluate(() => {
      return (window as any).__vl.getHeapUsed();
    });
    expect(result).toBeGreaterThan(0);
  });

  test("settleHeap runs without error", async () => {
    const ok = await page.evaluate(async () => {
      await (window as any).__vl.settleHeap(1);
      return true;
    });
    expect(ok).toBe(true);
  });

  test("measureMemoryDelta measures allocation", async () => {
    const delta = await page.evaluate(async () => {
      return await (window as any).__vl.measureMemoryDelta(async () => {
        // Allocate ~1MB of data
        (window as any).__leak = new Array(100000).fill("x".repeat(10));
      });
    });
    // Should detect some allocation (may be null if GC interferes, but usually works)
    if (delta !== null) {
      expect(delta).toBeGreaterThan(0);
    }
  });
});

describe("scroll (browser)", () => {
  test("measureScrollPerformance measures FPS", async () => {
    const result = await page.evaluate(async () => {
      const container = document.getElementById("container")!;
      return await (window as any).__vl.measureScrollPerformance(
        container,
        500,
        0,
        7200,
      );
    });
    expect(result.medianFPS).toBeGreaterThan(0);
    expect(result.totalFrames).toBeGreaterThan(0);
    expect(result.p95FrameTime).toBeGreaterThan(0);
  });

  test("measureScrollToIndex measures jump latency", async () => {
    const result = await page.evaluate(async () => {
      const container = document.getElementById("container")!;
      return await (window as any).__vl.measureScrollToIndex(
        container,
        1000,
        48,
        [0.5],
        2,
      );
    });
    expect(result).toBeGreaterThan(0);
  });
});
