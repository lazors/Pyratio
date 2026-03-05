import { Layer } from '../types';

/** Path segment patterns that indicate a test layer for Rust */
export const RUST_PATH_LAYER_MAP: Array<{ pattern: RegExp; layer: Layer }> = [
  { pattern: /^tests[\\/]e2e[\\/]/i, layer: 'e2e' },
  { pattern: /^tests[\\/][^\\/]+\.rs$/, layer: 'integration' },
  { pattern: /(?:^|[\\/])e2e[\\/]/i, layer: 'e2e' },
  { pattern: /(?:^|[\\/])smoke[\\/]/i, layer: 'smoke' },
  { pattern: /(?:^|[\\/])integration[\\/]/i, layer: 'integration' },
  { pattern: /(?:^|[\\/])unit[\\/]/i, layer: 'unit' },
];

/** Content-based pattern for Rust unit test detection (requires file reading) */
export const RUST_UNIT_TEST_PATTERN = /#\[cfg\(test\)\]/;
