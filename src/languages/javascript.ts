import { Layer } from '../types';

/** Path segment patterns that indicate a test layer for JS/TS */
export const JS_PATH_LAYER_MAP: Array<{ pattern: RegExp; layer: Layer }> = [
  { pattern: /(?:^|[\\/])e2e[\\/]/i, layer: 'e2e' },
  { pattern: /(?:^|[\\/])smoke[\\/]/i, layer: 'smoke' },
  { pattern: /(?:^|[\\/])integration[\\/]/i, layer: 'integration' },
  { pattern: /(?:^|[\\/])unit[\\/]/i, layer: 'unit' },
];

/** File naming patterns that indicate a test layer for JS/TS */
export const JS_FILE_LAYER_MAP: Array<{ pattern: RegExp; layer: Layer }> = [
  { pattern: /\.e2e\.(test|spec)\.[cm]?[jt]sx?$/i, layer: 'e2e' },
  { pattern: /\.smoke\.(test|spec)\.[cm]?[jt]sx?$/i, layer: 'smoke' },
  { pattern: /\.integration\.(test|spec)\.[cm]?[jt]sx?$/i, layer: 'integration' },
  { pattern: /\.unit\.(test|spec)\.[cm]?[jt]sx?$/i, layer: 'unit' },
];
