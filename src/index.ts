#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { scanTestFiles, detectConfigs, buildScanContext } from './scanner';
import { classify } from './classifier';
import { formatTable, formatJson, formatMarkdown, formatVerbose } from './reporter';
import { Language } from './types';
import { loadConfig } from './config';

const VALID_FORMATS = ['table', 'json', 'markdown'] as const;
const VALID_LANGUAGES: Language[] = [
  'typescript',
  'javascript',
  'java',
  'csharp',
  'go',
  'rust',
];

function loadPackageVersion(): string {
  try {
    const pkgPath = path.resolve(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const program = new Command();

program
  .name('pyratio')
  .description('Analyze the test pyramid ratio of a code repository')
  .version(loadPackageVersion())
  .argument('[directory]', 'Directory to analyze', '.')
  .option('-f, --format <format>', 'Output format (table, json, markdown)', 'table')
  .option('-c, --config <path>', 'Path to .pyratio.yml config file')
  .option('-v, --verbose', 'Show per-file classification reasoning', false)
  .option('-l, --lang <lang>', 'Force language detection')
  .action(async (directory: string, options: Record<string, unknown>) => {
    const targetDir = path.resolve(directory);

    // Validate directory exists
    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
      console.error(`Error: Directory not found: ${targetDir}`);
      process.exit(1);
    }

    // Validate format
    const format = options.format as string;
    if (!VALID_FORMATS.includes(format as typeof VALID_FORMATS[number])) {
      console.error(
        `Error: Unknown format "${format}". Valid formats: ${VALID_FORMATS.join(', ')}`,
      );
      process.exit(1);
    }

    // Validate language
    const lang = options.lang as string | undefined;
    if (lang && !VALID_LANGUAGES.includes(lang as Language)) {
      console.error(
        `Error: Unknown language "${lang}". Valid languages: ${VALID_LANGUAGES.join(', ')}`,
      );
      process.exit(1);
    }

    // Load config
    const config = loadConfig(targetDir, options.config as string | undefined);

    // Scan
    const files = await scanTestFiles(targetDir, config);
    const detectedConfigs = await detectConfigs(targetDir);
    const context = buildScanContext(
      targetDir,
      config,
      detectedConfigs,
      (lang as Language) ?? null,
    );

    // Classify
    const report = classify(files, context);

    // Output
    if (options.verbose) {
      process.stdout.write(formatVerbose(files));
      process.stdout.write('\n');
    }

    switch (format) {
      case 'json':
        process.stdout.write(formatJson(report));
        break;
      case 'markdown':
        process.stdout.write(formatMarkdown(report));
        break;
      default:
        process.stdout.write(formatTable(report));
        break;
    }
  });

program.parse();
