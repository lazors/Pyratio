import path from 'path';
import { glob } from 'tinyglobby';
import {
  TestFile,
  Language,
  Config,
  DetectedConfig,
  ScanContext,
  DEFAULT_IGNORE,
  EXTENSION_LANGUAGE_MAP,
} from './types';

/** All test file globs across supported languages */
const TEST_FILE_GLOBS = [
  // JS/TS
  '**/*.test.ts',
  '**/*.spec.ts',
  '**/*.test.js',
  '**/*.spec.js',
  '**/*.test.mts',
  '**/*.spec.mts',
  '**/*.test.mjs',
  '**/*.spec.mjs',
  '**/*.test.cts',
  '**/*.spec.cts',
  '**/*.test.cjs',
  '**/*.spec.cjs',
  '**/__tests__/**/*.ts',
  '**/__tests__/**/*.js',
  '**/__tests__/**/*.mts',
  '**/__tests__/**/*.mjs',
  // Java
  '**/*Test.java',
  '**/*Tests.java',
  '**/Test*.java',
  '**/*TestCase.java',
  '**/*IT.java',
  '**/*ITCase.java',
  // C#
  '**/*Tests.cs',
  '**/*Test.cs',
  '**/*Spec.cs',
  // Go
  '**/*_test.go',
  // Rust (tests/ for integration, src/ for unit via #[cfg(test)] detection)
  'tests/**/*.rs',
  'src/**/*.rs',
];

/** Config files that indicate test runners/frameworks */
const CONFIG_FILE_GLOBS = [
  'playwright.config.ts',
  'playwright.config.js',
  'cypress.config.ts',
  'cypress.config.js',
  'jest.config.ts',
  'jest.config.js',
  'jest.config.mjs',
  'vitest.config.ts',
  'vitest.config.js',
  'vitest.config.mts',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  '**/*.csproj',
  'Cargo.toml',
];

function detectLanguage(filePath: string): Language {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_LANGUAGE_MAP[ext] ?? 'unknown';
}

function mapConfigFile(fileName: string): DetectedConfig['type'] | null {
  const base = path.basename(fileName);
  if (base.startsWith('playwright.config')) return 'playwright';
  if (base.startsWith('cypress.config')) return 'cypress';
  if (base.startsWith('jest.config')) return 'jest';
  if (base.startsWith('vitest.config')) return 'vitest';
  if (base === 'pom.xml') return 'maven-failsafe';
  if (base.startsWith('build.gradle')) return 'gradle';
  if (base.endsWith('.csproj')) return 'csproj-testing';
  if (base === 'Cargo.toml') return 'cargo';
  return null;
}

export async function scanTestFiles(
  root: string,
  config: Config,
): Promise<TestFile[]> {
  const ignore = [...new Set([...DEFAULT_IGNORE, ...config.ignore])];

  const files = await glob(TEST_FILE_GLOBS, {
    cwd: root,
    ignore,
    dot: false,
    absolute: false,
  });

  return files.map((relativePath) => {
    const normalized = relativePath.replace(/\\/g, '/');
    return {
      path: path.resolve(root, relativePath),
      relativePath: normalized,
      language: detectLanguage(relativePath),
      layer: 'unclassified',
      signal: '',
      strategy: '',
    };
  });
}

export async function detectConfigs(root: string): Promise<DetectedConfig[]> {
  const files = await glob(CONFIG_FILE_GLOBS, {
    cwd: root,
    ignore: DEFAULT_IGNORE,
    dot: false,
    absolute: false,
  });

  const configs: DetectedConfig[] = [];
  for (const file of files) {
    const type = mapConfigFile(file);
    if (type) {
      configs.push({ type, path: path.resolve(root, file) });
    }
  }
  return configs;
}

export function buildScanContext(
  root: string,
  config: Config,
  detectedConfigs: DetectedConfig[],
  forcedLanguage: Language | null,
): ScanContext {
  return { root, config, detectedConfigs, language: forcedLanguage };
}
