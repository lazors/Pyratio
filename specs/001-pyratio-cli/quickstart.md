# Quickstart: Pyratio CLI Development

**Branch**: `001-pyratio-cli`
**Date**: 2026-03-05

---

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9 (or pnpm / bun)
- Git

---

## Project Initialization

```bash
# Initialize npm package
npm init -y

# Install runtime dependencies
npm install commander@14 tinyglobby yaml cli-table3

# Install dev dependencies
npm install -D typescript tsup tsx vitest @types/node

# Initialize TypeScript config
npx tsc --init
```

---

## Recommended `package.json` Shape

```json
{
  "name": "pyratio",
  "version": "0.1.0",
  "description": "Analyze the test pyramid ratio of any code repository",
  "type": "commonjs",
  "bin": { "pyratio": "./dist/index.js" },
  "main": "./dist/index.js",
  "exports": { ".": "./dist/index.js" },
  "files": ["dist"],
  "engines": { "node": ">=18" },
  "scripts": {
    "build": "tsup src/index.ts --format cjs --bundle --minify --clean",
    "dev": "tsx watch src/index.ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepublishOnly": "npm run typecheck && npm run build && npm test"
  }
}
```

---

## Source Layout

```
src/
├── index.ts                    # CLI entry point (commander setup, shebang)
├── scanner.ts                  # File system traversal (tinyglobby)
├── classifier.ts               # Orchestrates strategy pipeline
├── reporter.ts                 # Output formatting (table, json, markdown)
├── config.ts                   # .pyratio.yml loader and validator
├── types.ts                    # Shared types (Layer, Language, TestFile, etc.)
├── strategies/
│   ├── path-strategy.ts        # Priority 1: directory/path patterns
│   ├── config-strategy.ts      # Priority 2: test runner config detection
│   └── annotation-strategy.ts  # Priority 3: annotations/naming conventions
└── languages/
    ├── javascript.ts            # JS/TS patterns and globs
    ├── java.ts                  # Java patterns and globs
    ├── csharp.ts                # C# patterns and globs
    ├── go.ts                    # Go patterns and globs
    └── rust.ts                  # Rust patterns and globs (incl. content-based unit detection)

tests/
├── unit/
│   ├── classifier.test.ts
│   ├── scanner.test.ts
│   ├── config.test.ts
│   ├── reporter.test.ts
│   └── strategies/
│       ├── path-strategy.test.ts
│       ├── config-strategy.test.ts
│       └── annotation-strategy.test.ts
├── integration/
│   └── scan-real-repos.test.ts  # Tests against fixture repos
└── fixtures/
    ├── js-repo/                 # Minimal JS/TS repo fixture
    ├── java-repo/               # Minimal Java repo fixture
    ├── go-repo/                 # Minimal Go repo fixture
    ├── rust-repo/               # Minimal Rust repo fixture
    └── csharp-repo/             # Minimal C# repo fixture
```

---

## Development Workflow

```bash
# Run against current directory (development mode)
tsx src/index.ts

# Run against a specific directory
tsx src/index.ts ./path/to/some/repo

# Run tests
npm test

# Watch mode during development
npm run dev                   # tsx watch (runs on file changes)
npm run test:watch            # vitest watch

# Type check (no emit)
npm run typecheck

# Build for distribution
npm run build                 # outputs dist/index.js

# Test the built artifact locally
node dist/index.js --help
npx . --format json           # test via npx from project root
```

---

## Key Implementation Notes

### Entry Point Shebang

`src/index.ts` must begin with:
```typescript
#!/usr/bin/env node
```
tsup preserves this automatically. Without it, the installed CLI will not execute on Linux/macOS.

### Strategy Pipeline Pattern

```typescript
// classifier.ts — conceptual structure
const strategies: ClassificationStrategy[] = [
  new PathStrategy(context),
  new ConfigStrategy(context),
  new AnnotationStrategy(context),
];

for (const file of testFiles) {
  const strategy = strategies.find(s => s.classify(file) !== null);
  file.layer = strategy?.classify(file) ?? 'unclassified';
}
```

### Rust Unit Test Detection

Rust is the only language requiring content inspection for unit test detection:
- Check file content for `#[cfg(test)]` — mark as unit
- Files in `tests/*.rs` — mark as integration (no content read needed)
- Files in `tests/e2e/*.rs` — mark as e2e

### Config Rule Priority

User config rules (`.pyratio.yml` `rules:` section) take priority over all strategies. Apply them before running the strategy pipeline.

---

## Publishing to npm

```bash
# Dry run — verify what gets published
npm pack --dry-run

# Publish (after build + tests pass)
npm publish --access public
```

The `files: ["dist"]` field in `package.json` ensures only the compiled output is included in the tarball.
