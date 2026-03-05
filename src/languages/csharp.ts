import { Layer } from '../types';

/** Path segment patterns that indicate a test layer for C# */
export const CSHARP_PATH_LAYER_MAP: Array<{ pattern: RegExp; layer: Layer }> = [
  { pattern: /\.E2ETests[\\/]/i, layer: 'e2e' },
  { pattern: /\.SmokeTests[\\/]/i, layer: 'smoke' },
  { pattern: /\.IntegrationTests[\\/]/i, layer: 'integration' },
  { pattern: /\.UnitTests[\\/]/i, layer: 'unit' },
  { pattern: /(?:^|[\\/])e2e[\\/]/i, layer: 'e2e' },
  { pattern: /(?:^|[\\/])smoke[\\/]/i, layer: 'smoke' },
  { pattern: /(?:^|[\\/])integration[\\/]/i, layer: 'integration' },
  { pattern: /(?:^|[\\/])unit[\\/]/i, layer: 'unit' },
];

/** Annotation patterns for C# test layer classification */
export const CSHARP_ANNOTATION_MAP: Array<{ pattern: RegExp; layer: Layer; signal: string }> = [
  { pattern: /\[Trait\("Category",\s*"Integration"\)\]/i, layer: 'integration', signal: '[Trait("Category", "Integration")]' },
  { pattern: /\[Trait\("Category",\s*"E2E"\)\]/i, layer: 'e2e', signal: '[Trait("Category", "E2E")]' },
  { pattern: /\[Trait\("Category",\s*"Smoke"\)\]/i, layer: 'smoke', signal: '[Trait("Category", "Smoke")]' },
  { pattern: /\[Trait\("Category",\s*"Unit"\)\]/i, layer: 'unit', signal: '[Trait("Category", "Unit")]' },
];
