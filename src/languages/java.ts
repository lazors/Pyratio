import { Layer } from '../types';

/** Path segment patterns that indicate a test layer for Java */
export const JAVA_PATH_LAYER_MAP: Array<{ pattern: RegExp; layer: Layer }> = [
  { pattern: /(?:^|[\\/])e2e[\\/]/i, layer: 'e2e' },
  { pattern: /(?:^|[\\/])smoke[\\/]/i, layer: 'smoke' },
  { pattern: /(?:^|[\\/])integration[\\/]/i, layer: 'integration' },
  { pattern: /(?:^|[\\/])unit[\\/]/i, layer: 'unit' },
];

/** File naming patterns for Java test layer classification */
export const JAVA_FILE_LAYER_MAP: Array<{ pattern: RegExp; layer: Layer }> = [
  { pattern: /IT\.java$/i, layer: 'integration' },
  { pattern: /ITCase\.java$/i, layer: 'integration' },
];

/** Annotation patterns for Java test layer classification */
export const JAVA_ANNOTATION_MAP: Array<{ pattern: RegExp; layer: Layer; signal: string }> = [
  { pattern: /@SpringBootTest/,  layer: 'integration', signal: '@SpringBootTest' },
  { pattern: /@DataJpaTest/,     layer: 'integration', signal: '@DataJpaTest' },
  { pattern: /@WebMvcTest/,      layer: 'integration', signal: '@WebMvcTest' },
  { pattern: /@Tag\(\s*"integration"\s*\)/i, layer: 'integration', signal: '@Tag("integration")' },
  { pattern: /@Tag\(\s*"e2e"\s*\)/i, layer: 'e2e', signal: '@Tag("e2e")' },
  { pattern: /@Tag\(\s*"smoke"\s*\)/i, layer: 'smoke', signal: '@Tag("smoke")' },
  { pattern: /@Tag\(\s*"unit"\s*\)/i, layer: 'unit', signal: '@Tag("unit")' },
];
