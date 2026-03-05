import { Layer } from '../types';

/** Path segment patterns that indicate a test layer for Go */
export const GO_PATH_LAYER_MAP: Array<{ pattern: RegExp; layer: Layer }> = [
  { pattern: /(?:^|[\\/])e2e[\\/]/i, layer: 'e2e' },
  { pattern: /(?:^|[\\/])smoke[\\/]/i, layer: 'smoke' },
  { pattern: /(?:^|[\\/])integration[\\/]/i, layer: 'integration' },
  { pattern: /(?:^|[\\/])unit[\\/]/i, layer: 'unit' },
];

/** Annotation/content patterns for Go test layer classification */
export const GO_ANNOTATION_MAP: Array<{ pattern: RegExp; layer: Layer; signal: string }> = [
  { pattern: /\/\/go:build\s+integration/, layer: 'integration', signal: '//go:build integration' },
  { pattern: /\/\/\s*\+build\s+integration/, layer: 'integration', signal: '//+build integration' },
  { pattern: /func\s+TestIntegration_/m, layer: 'integration', signal: 'TestIntegration_ prefix' },
  { pattern: /\/\/go:build\s+e2e/, layer: 'e2e', signal: '//go:build e2e' },
  { pattern: /\/\/go:build\s+smoke/, layer: 'smoke', signal: '//go:build smoke' },
];
