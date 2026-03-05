import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { Config, ConfigRule, Layer, LAYERS, DEFAULT_IGNORE } from './types';

const VALID_LAYERS = new Set<string>(LAYERS);

function isValidLayer(value: unknown): value is Layer {
  return typeof value === 'string' && VALID_LAYERS.has(value);
}

function validateConfig(raw: unknown, filePath: string): Config {
  if (typeof raw !== 'object' || raw === null) {
    console.error(`Error: Invalid config file: ${filePath}\nConfig must be a YAML object`);
    process.exit(1);
  }

  const obj = raw as Record<string, unknown>;

  // Validate layers
  let layers: Layer[] = [...LAYERS];
  if (obj.layers !== undefined) {
    if (!Array.isArray(obj.layers) || obj.layers.length === 0) {
      console.error(`Error: Invalid config file: ${filePath}\n"layers" must be a non-empty array`);
      process.exit(1);
    }
    for (const l of obj.layers) {
      if (!isValidLayer(l)) {
        console.error(
          `Error: Unknown layer "${l}" in config rules. Valid layers: ${LAYERS.join(', ')}`,
        );
        process.exit(1);
      }
    }
    layers = obj.layers as Layer[];
  }

  // Validate rules
  const rules: ConfigRule[] = [];
  if (obj.rules !== undefined) {
    if (!Array.isArray(obj.rules)) {
      console.error(`Error: Invalid config file: ${filePath}\n"rules" must be an array`);
      process.exit(1);
    }
    for (const rule of obj.rules) {
      if (typeof rule !== 'object' || rule === null) {
        console.error(`Error: Invalid config file: ${filePath}\nEach rule must be an object`);
        process.exit(1);
      }
      const r = rule as Record<string, unknown>;
      if (!isValidLayer(r.layer)) {
        console.error(
          `Error: Unknown layer "${r.layer}" in config rules. Valid layers: ${LAYERS.join(', ')}`,
        );
        process.exit(1);
      }
      if (typeof r.glob !== 'string' || r.glob.length === 0) {
        console.error(`Error: Invalid config file: ${filePath}\nEach rule must have a non-empty "glob" string`);
        process.exit(1);
      }
      rules.push({ layer: r.layer, glob: r.glob });
    }
  }

  // Validate ignore (merge with defaults)
  let ignore: string[] = [];
  if (obj.ignore !== undefined) {
    if (!Array.isArray(obj.ignore)) {
      console.error(`Error: Invalid config file: ${filePath}\n"ignore" must be an array`);
      process.exit(1);
    }
    ignore = obj.ignore.filter((i): i is string => typeof i === 'string');
  }

  return { layers, rules, ignore };
}

export function loadConfig(
  targetDir: string,
  configPath?: string,
): Config {
  const defaultConfig: Config = {
    layers: [...LAYERS],
    rules: [],
    ignore: [],
  };

  const resolvedPath = configPath
    ? path.resolve(configPath)
    : path.resolve(targetDir, '.pyratio.yml');

  // If user explicitly specified --config, file must exist
  if (configPath && !fs.existsSync(resolvedPath)) {
    console.error(`Error: Config file not found: ${resolvedPath}`);
    process.exit(1);
  }

  // If no explicit config and default doesn't exist, return defaults
  if (!configPath && !fs.existsSync(resolvedPath)) {
    return defaultConfig;
  }

  let content: string;
  try {
    content = fs.readFileSync(resolvedPath, 'utf-8');
  } catch (err) {
    console.error(`Error: Config file not found: ${resolvedPath}`);
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = YAML.parse(content);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: Invalid config file: ${resolvedPath}\n${message}`);
    process.exit(1);
  }

  return validateConfig(parsed, resolvedPath);
}
