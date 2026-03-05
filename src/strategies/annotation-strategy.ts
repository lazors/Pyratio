import fs from 'fs';
import { ClassificationStrategy, Layer, TestFile, ScanContext } from '../types';
import { JAVA_ANNOTATION_MAP } from '../languages/java';
import { CSHARP_ANNOTATION_MAP } from '../languages/csharp';
import { GO_ANNOTATION_MAP } from '../languages/go';
import { RUST_UNIT_TEST_PATTERN } from '../languages/rust';

/**
 * Priority 3: Classify test files by parsing file content for annotations,
 * build tags, and naming conventions.
 */
export class AnnotationStrategy implements ClassificationStrategy {
  name = 'annotation' as const;

  classify(file: TestFile, _context: ScanContext): Layer | null {
    let content: string;
    try {
      content = fs.readFileSync(file.path, 'utf-8');
    } catch {
      return null;
    }

    switch (file.language) {
      case 'java':
        return this.classifyJava(file, content);
      case 'csharp':
        return this.classifyCSharp(file, content);
      case 'go':
        return this.classifyGo(file, content);
      case 'rust':
        return this.classifyRust(file, content);
      case 'typescript':
      case 'javascript':
        return this.classifyJsTs(file, content);
      default:
        return null;
    }
  }

  private classifyJava(file: TestFile, content: string): Layer | null {
    for (const { pattern, layer, signal } of JAVA_ANNOTATION_MAP) {
      if (pattern.test(content)) {
        file.signal = `annotation: ${signal}`;
        return layer;
      }
    }
    return null;
  }

  private classifyCSharp(file: TestFile, content: string): Layer | null {
    for (const { pattern, layer, signal } of CSHARP_ANNOTATION_MAP) {
      if (pattern.test(content)) {
        file.signal = `annotation: ${signal}`;
        return layer;
      }
    }
    return null;
  }

  private classifyGo(file: TestFile, content: string): Layer | null {
    for (const { pattern, layer, signal } of GO_ANNOTATION_MAP) {
      if (pattern.test(content)) {
        file.signal = `annotation: ${signal}`;
        return layer;
      }
    }
    return null;
  }

  private classifyRust(file: TestFile, content: string): Layer | null {
    if (RUST_UNIT_TEST_PATTERN.test(content)) {
      file.signal = 'annotation: #[cfg(test)]';
      return 'unit';
    }
    return null;
  }

  private classifyJsTs(file: TestFile, content: string): Layer | null {
    const patterns: Array<{ pattern: RegExp; layer: Layer; signal: string }> = [
      { pattern: /describe\(\s*["']e2e[:\s]/i, layer: 'e2e', signal: 'describe("e2e:...")' },
      { pattern: /describe\(\s*["']smoke[:\s]/i, layer: 'smoke', signal: 'describe("smoke:...")' },
      { pattern: /describe\(\s*["']integration[:\s]/i, layer: 'integration', signal: 'describe("integration:...")' },
      { pattern: /describe\(\s*["']unit[:\s]/i, layer: 'unit', signal: 'describe("unit:...")' },
    ];

    for (const { pattern, layer, signal } of patterns) {
      if (pattern.test(content)) {
        file.signal = `annotation: ${signal}`;
        return layer;
      }
    }
    return null;
  }
}
