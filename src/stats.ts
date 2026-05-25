// Statistical utilities

/**
 * Compute the median of an array of numbers.
 */
export const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

/**
 * Compute percentile from a sorted-ascending array using linear interpolation.
 */
export const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0]!;
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower]!;
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (index - lower);
};

/**
 * Round a number to N decimal places.
 */
export const round = (value: number, decimals: number = 1): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/**
 * Compute the arithmetic mean.
 */
export const mean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

/**
 * Compute the coefficient of variation (CV%) — standard deviation as a
 * percentage of the mean. Lower CV means more stable measurements.
 */
export const coefficientOfVariation = (values: number[]): number => {
  if (values.length < 2) return 0;
  const m = mean(values);
  if (m === 0) return 0;
  const variance =
    values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return (Math.sqrt(variance) / Math.abs(m)) * 100;
};

/**
 * Format bytes as megabytes.
 */
export const bytesToMB = (bytes: number): number =>
  Math.round((bytes / (1024 * 1024)) * 100) / 100;
