import Table from 'cli-table3';
import { PyramidReport, LAYERS, Layer, TestFile } from './types';

const MAX_BAR_LENGTH = 20;

const LAYER_LABELS: Record<Layer, string> = {
  unit: 'Unit',
  integration: 'Integration',
  e2e: 'E2E',
  smoke: 'Smoke',
};

function healthEmoji(health: string): string {
  if (health === 'healthy') return '\u2705';
  if (health === 'unknown') return '\u2753';
  return '\u26A0\uFE0F';
}

function makeBar(percentage: number): string {
  const length = Math.round((percentage / 100) * MAX_BAR_LENGTH);
  return '\u2588'.repeat(Math.max(length, percentage > 0 ? 1 : 0));
}

export function formatTable(report: PyramidReport): string {
  const table = new Table({
    head: ['Layer', 'Tests', '%', 'Bar'],
    style: { head: [], border: [] },
    chars: {
      top: '\u2500',
      'top-mid': '\u252C',
      'top-left': '\u250C',
      'top-right': '\u2510',
      bottom: '\u2500',
      'bottom-mid': '\u2534',
      'bottom-left': '\u2514',
      'bottom-right': '\u2518',
      left: '\u2502',
      'left-mid': '\u251C',
      mid: '\u2500',
      'mid-mid': '\u253C',
      right: '\u2502',
      'right-mid': '\u2524',
      middle: '\u2502',
    },
  });

  for (const layer of LAYERS) {
    const stats = report.layers[layer];
    table.push([
      LAYER_LABELS[layer],
      String(stats.count),
      `${stats.percentage.toFixed(1)}%`,
      makeBar(stats.percentage),
    ]);
  }

  const lines: string[] = [];
  lines.push(' Pyratio \u2014 Test Pyramid Analysis');
  lines.push(table.toString());
  lines.push(`  Total: ${report.total}`);
  lines.push('');
  lines.push(
    `  Pyramid Health: ${healthEmoji(report.health)} ${report.health.charAt(0).toUpperCase() + report.health.slice(1)}`,
  );
  lines.push(`  Ratio (U:I:E:S): ${report.ratio}`);

  if (report.unclassified.length > 0) {
    lines.push('');
    lines.push(`  Unclassified (${report.unclassified.length}):`);
    for (const file of report.unclassified) {
      lines.push(`    ${file}`);
    }
  }

  return lines.join('\n') + '\n';
}

export function formatJson(report: PyramidReport): string {
  return JSON.stringify(report, null, 2) + '\n';
}

export function formatMarkdown(report: PyramidReport): string {
  const lines: string[] = [];
  lines.push('## Test Pyramid Analysis');
  lines.push('');
  lines.push('| Layer | Tests | % | Bar |');
  lines.push('|-------|-------|---|-----|');

  for (const layer of LAYERS) {
    const stats = report.layers[layer];
    lines.push(
      `| ${LAYER_LABELS[layer]} | ${stats.count} | ${stats.percentage.toFixed(1)}% | ${makeBar(stats.percentage)} |`,
    );
  }

  lines.push('');
  lines.push(
    `**Total**: ${report.total} | **Health**: ${healthEmoji(report.health)} ${report.health.charAt(0).toUpperCase() + report.health.slice(1)} | **Ratio (U:I:E:S)**: ${report.ratio}`,
  );

  if (report.unclassified.length > 0) {
    lines.push('');
    lines.push(`**Unclassified** (${report.unclassified.length}): ${report.unclassified.join(', ')}`);
  }

  return lines.join('\n') + '\n';
}

export function formatVerbose(files: TestFile[]): string {
  const lines: string[] = [];
  for (const file of files) {
    const layer = `[${file.layer}]`.padEnd(16);
    const path = file.relativePath.padEnd(50);
    if (file.layer === 'unclassified') {
      lines.push(`${layer} ${path}`);
    } else {
      lines.push(`${layer} ${path} (${file.strategy}: ${file.signal})`);
    }
  }
  return lines.join('\n') + '\n';
}
