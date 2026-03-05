export type Layer = 'unit' | 'integration' | 'e2e' | 'smoke';

export type Language =
  | 'typescript'
  | 'javascript'
  | 'java'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'unknown';

export type PyramidHealth =
  | 'healthy'
  | 'inverted'
  | 'flat'
  | 'incomplete'
  | 'unknown';

export type StrategyName = 'path' | 'config' | 'annotation' | 'config-rule';

export interface TestFile {
  path: string;
  relativePath: string;
  language: Language;
  layer: Layer | 'unclassified';
  signal: string;
  strategy: StrategyName | '';
}

export interface LayerStats {
  count: number;
  percentage: number;
  files: string[];
}

export interface PyramidReport {
  total: number;
  layers: Record<Layer, LayerStats>;
  ratio: string;
  health: PyramidHealth;
  language: Language;
  detectedLanguages: Language[];
  unclassified: string[];
}

export interface ConfigRule {
  layer: Layer;
  glob: string;
}

export interface Config {
  layers: Layer[];
  rules: ConfigRule[];
  ignore: string[];
}

export type ConfigType =
  | 'playwright'
  | 'cypress'
  | 'jest'
  | 'vitest'
  | 'maven-failsafe'
  | 'gradle'
  | 'csproj-testing'
  | 'cargo';

export interface DetectedConfig {
  type: ConfigType;
  path: string;
}

export interface ScanContext {
  root: string;
  config: Config;
  detectedConfigs: DetectedConfig[];
  language: Language | null;
}

export interface ClassificationStrategy {
  name: StrategyName;
  classify(file: TestFile, context: ScanContext): Layer | null;
}

export const LAYERS: Layer[] = ['unit', 'integration', 'e2e', 'smoke'];

export const DEFAULT_IGNORE = [
  'node_modules/**',
  'vendor/**',
  'target/**',
  'bin/**',
  '.git/**',
];

export const EXTENSION_LANGUAGE_MAP: Record<string, Language> = {
  '.ts': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.java': 'java',
  '.cs': 'csharp',
  '.go': 'go',
  '.rs': 'rust',
};
