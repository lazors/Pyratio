import { ClassificationStrategy, Layer, TestFile, ScanContext } from '../types';

/**
 * Priority 2: Classify test files based on detected test runner config files.
 * E.g., if playwright.config.ts exists, associated test files are likely e2e.
 */
export class ConfigDetectionStrategy implements ClassificationStrategy {
  name = 'config' as const;

  classify(file: TestFile, context: ScanContext): Layer | null {
    for (const config of context.detectedConfigs) {
      switch (config.type) {
        case 'playwright':
        case 'cypress':
          // Files in the same repo with a playwright/cypress config are e2e candidates
          // Only classify if the file is JS/TS (these frameworks only run JS/TS)
          if (
            (file.language === 'typescript' || file.language === 'javascript') &&
            this.isLikelyE2EFile(file.relativePath)
          ) {
            file.signal = `config: ${config.type}`;
            return 'e2e';
          }
          break;

        case 'maven-failsafe':
          // Maven failsafe plugin runs *IT.java files as integration tests
          if (file.language === 'java' && /IT\.java$/i.test(file.relativePath)) {
            file.signal = 'config: maven-failsafe-plugin';
            return 'integration';
          }
          break;
      }
    }

    return null;
  }

  private isLikelyE2EFile(relativePath: string): boolean {
    // Files in e2e-related directories or with e2e in their name
    return (
      /[\\/]e2e[\\/]/i.test(relativePath) ||
      /\.e2e\./i.test(relativePath) ||
      /[\\/]playwright[\\/]/i.test(relativePath) ||
      /[\\/]cypress[\\/]/i.test(relativePath)
    );
  }
}
