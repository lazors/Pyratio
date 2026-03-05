import { ClassificationStrategy, Layer, TestFile, ScanContext } from '../types';
import { JS_PATH_LAYER_MAP, JS_FILE_LAYER_MAP } from '../languages/javascript';
import { JAVA_PATH_LAYER_MAP, JAVA_FILE_LAYER_MAP } from '../languages/java';
import { CSHARP_PATH_LAYER_MAP } from '../languages/csharp';
import { GO_PATH_LAYER_MAP } from '../languages/go';
import { RUST_PATH_LAYER_MAP } from '../languages/rust';

type PatternEntry = { pattern: RegExp; layer: Layer };

const PATH_MAPS: Record<string, PatternEntry[]> = {
  typescript: JS_PATH_LAYER_MAP,
  javascript: JS_PATH_LAYER_MAP,
  java: JAVA_PATH_LAYER_MAP,
  csharp: CSHARP_PATH_LAYER_MAP,
  go: GO_PATH_LAYER_MAP,
  rust: RUST_PATH_LAYER_MAP,
};

const FILE_MAPS: Record<string, PatternEntry[]> = {
  typescript: JS_FILE_LAYER_MAP,
  javascript: JS_FILE_LAYER_MAP,
  java: JAVA_FILE_LAYER_MAP,
};

/** Priority 1: Classify test files by directory path and filename patterns */
export class PathStrategy implements ClassificationStrategy {
  name = 'path' as const;

  classify(file: TestFile, _context: ScanContext): Layer | null {
    const normalized = file.relativePath;

    // Get path patterns for this file's language
    const pathMap = PATH_MAPS[file.language] ?? JS_PATH_LAYER_MAP;
    for (const { pattern, layer } of pathMap) {
      if (pattern.test(normalized)) {
        file.signal = `path: ${pattern.source}`;
        return layer;
      }
    }

    // Get file naming patterns for this file's language
    const fileMap = FILE_MAPS[file.language];
    if (fileMap) {
      for (const { pattern, layer } of fileMap) {
        if (pattern.test(normalized)) {
          file.signal = `filename: ${pattern.source}`;
          return layer;
        }
      }
    }

    return null;
  }
}
