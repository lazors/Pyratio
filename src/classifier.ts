import {
  TestFile,
  ScanContext,
  ClassificationStrategy,
  PyramidReport,
  LayerStats,
  Layer,
  Language,
  PyramidHealth,
  LAYERS,
} from './types';
import { PathStrategy } from './strategies/path-strategy';
import { ConfigDetectionStrategy } from './strategies/config-strategy';
import { AnnotationStrategy } from './strategies/annotation-strategy';
import picomatch from 'picomatch';

function gcd(a: number, b: number): number {
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function computeRatio(layers: Record<Layer, LayerStats>): string {
  const counts = LAYERS.map((l) => layers[l].count).filter((c) => c > 0);
  if (counts.length === 0) return '0';
  const divisor = counts.reduce((a, b) => gcd(a, b));
  return counts.map((c) => c / divisor).join(':');
}

function computeHealth(
  layers: Record<Layer, LayerStats>,
  total: number,
): PyramidHealth {
  if (total === 0) return 'unknown';

  const u = layers.unit.percentage;
  const i = layers.integration.percentage;
  const e = layers.e2e.percentage;
  const s = layers.smoke.percentage;

  const nonZero = [u, i, e, s].filter((p) => p > 0);
  if (nonZero.length < LAYERS.length) return 'incomplete';

  // Check if all layers are within 10% of each other
  const max = Math.max(...nonZero);
  const min = Math.min(...nonZero);
  if (max - min <= 10) return 'flat';

  if (u > i && i > e && e >= s) return 'healthy';
  return 'inverted';
}

function getDominantLanguage(files: TestFile[]): Language {
  const counts = new Map<Language, number>();
  for (const file of files) {
    if (file.language !== 'unknown') {
      counts.set(file.language, (counts.get(file.language) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return 'unknown';
  let dominant: Language = 'unknown';
  let maxCount = 0;
  for (const [lang, count] of counts) {
    if (count > maxCount) {
      dominant = lang;
      maxCount = count;
    }
  }
  return dominant;
}

function getDetectedLanguages(files: TestFile[]): Language[] {
  const seen = new Set<Language>();
  for (const file of files) {
    if (file.language !== 'unknown') {
      seen.add(file.language);
    }
  }
  return [...seen];
}

export function classify(
  files: TestFile[],
  context: ScanContext,
  strategies?: ClassificationStrategy[],
): PyramidReport {
  const strats: ClassificationStrategy[] = strategies ?? [
    new PathStrategy(),
    new ConfigDetectionStrategy(),
    new AnnotationStrategy(),
  ];

  // Pre-compile config rule matchers
  const configRuleMatchers = context.config.rules.map((rule) => ({
    rule,
    isMatch: picomatch(rule.glob),
  }));

  for (const file of files) {
    // Check config rules first (highest priority)
    for (const { rule, isMatch } of configRuleMatchers) {
      if (isMatch(file.relativePath)) {
        file.layer = rule.layer;
        file.strategy = 'config-rule';
        file.signal = `config rule: ${rule.glob}`;
        break;
      }
    }
    if (file.layer !== 'unclassified') continue;

    // Try strategies in priority order
    for (const strategy of strats) {
      const layer = strategy.classify(file, context);
      if (layer !== null) {
        file.layer = layer;
        file.strategy = strategy.name;
        break;
      }
    }
  }

  // Filter out Rust source files that weren't classified as test files.
  // src/**/*.rs files are scanned as candidates for #[cfg(test)] unit tests,
  // but those without #[cfg(test)] are not test files and should be excluded.
  const classifiedFiles = files.filter((file) => {
    if (
      file.language === 'rust' &&
      file.layer === 'unclassified' &&
      file.relativePath.startsWith('src/')
    ) {
      return false;
    }
    return true;
  });

  // Build report
  const layerStats: Record<Layer, LayerStats> = {
    unit: { count: 0, percentage: 0, files: [] },
    integration: { count: 0, percentage: 0, files: [] },
    e2e: { count: 0, percentage: 0, files: [] },
    smoke: { count: 0, percentage: 0, files: [] },
  };

  const unclassified: string[] = [];

  for (const file of classifiedFiles) {
    if (file.layer === 'unclassified') {
      unclassified.push(file.relativePath);
    } else {
      const stats = layerStats[file.layer];
      stats.count++;
      stats.files.push(file.relativePath);
    }
  }

  const total = classifiedFiles.length;
  for (const layer of LAYERS) {
    layerStats[layer].percentage =
      total > 0
        ? Math.round((layerStats[layer].count / total) * 1000) / 10
        : 0;
  }

  return {
    total,
    layers: layerStats,
    ratio: computeRatio(layerStats),
    health: computeHealth(layerStats, total),
    language: getDominantLanguage(classifiedFiles),
    detectedLanguages: getDetectedLanguages(classifiedFiles),
    unclassified,
  };
}
