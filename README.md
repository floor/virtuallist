# virtuallist

Low-level benchmark measurement primitives for virtual list libraries.

Used by [virtuallist.io](https://virtuallist.io) and [vlist.io](https://vlist.io) to measure rendering performance, memory usage, and scroll smoothness across virtual list implementations.

## Install

```bash
npm install virtuallist
```

## Usage

```js
import {
  measureDuration,
  measureScrollPerformance,
  measureMemoryDelta,
  median,
  findViewport,
} from "virtuallist";

// Measure render time
const { duration } = await measureDuration("render", () => {
  return myLibrary.mount(container, 10_000);
});

// Measure scroll FPS
const viewport = findViewport(container);
const { medianFPS, p95FrameTime } = await measureScrollPerformance(
  viewport,
  1500, // duration ms
  0,    // stress ms
  7200, // px/sec
);

// Measure memory cost
const delta = await measureMemoryDelta(async () => {
  await myLibrary.mount(container, 100_000);
});
```

## API

### Timing

| Export | Description |
|--------|-------------|
| `measureDuration(label, fn)` | Measure execution time using Performance Timeline API |
| `nextFrame()` | Wait for the next animation frame |
| `waitFrames(n)` | Wait for N animation frames |
| `wait(ms)` | Wait for a duration |

### Memory

| Export | Description |
|--------|-------------|
| `measureMemoryDelta(createFn, settleFrames?)` | Heap delta measurement with GC handling |
| `measureMemoryWithRetries(opts)` | Multiple attempts for reliable memory readings |
| `getHeapUsed()` | Current JS heap in bytes (Chrome only, null otherwise) |
| `settleHeap(cycles?)` | Aggressive GC + settle cycles |

### Scroll

| Export | Description |
|--------|-------------|
| `measureScrollPerformance(viewport, durationMs, stressMs?, speedPxPerSec?)` | FPS, median frame time, P95 frame time |
| `measureScrollToIndex(viewport, itemCount, itemHeight?, targets?, iterations?)` | Scroll-to-index jump latency |

### Stats

| Export | Description |
|--------|-------------|
| `median(values)` | Median of an array |
| `percentile(sorted, p)` | Percentile with linear interpolation |
| `round(value, decimals?)` | Round to N decimal places |
| `mean(values)` | Arithmetic mean |
| `coefficientOfVariation(values)` | CV% — measurement stability indicator |
| `bytesToMB(bytes)` | Convert bytes to megabytes |

### Helpers

| Export | Description |
|--------|-------------|
| `tryGC()` | Trigger GC if available, then settle |
| `burnCpu(targetMs)` | Busy-wait loop for CPU stress simulation |
| `findViewport(container)` | Locate the scrollable element within a container |

## Design Principles

- **Browser-native** — uses Performance Timeline API, `requestAnimationFrame`, `performance.memory`
- **Library-agnostic** — no assumptions about which virtual list library is being measured
- **Zero dependencies** — nothing beyond standard browser APIs
- **TypeScript** — full type declarations included

## License

MIT
