# Implementation Plan: Pyratio CLI — Test Pyramid Analyzer

**Branch**: `001-pyratio-cli` | **Date**: 2026-03-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-pyratio-cli/spec.md`

---

## Summary

Build `pyratio`, a TypeScript/Node.js CLI tool distributed via npm (`npx pyratio`) that scans a code repository and reports test distribution across four layers (unit, integration, e2e, smoke). Classification uses a priority-ordered strategy pipeline: path patterns → config file detection → annotation/naming conventions. Supports JS/TS, Java, C#, Go, and Rust. Outputs ASCII table (default), JSON, and Markdown. Configurable via `.pyratio.yml`.

---

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js ≥ 18
**Primary Dependencies**:
- `commander@14` — CLI argument parsing
- `tinyglobby@0.2.x` — file system traversal and glob matching
- `yaml@2.x` — `.pyratio.yml` config parsing
- `cli-table3@0.6.x` — ASCII table output
- `tsup` — build/bundle to CJS (single-file dist)
- `tsx` — dev runner
- `vitest` — test runner for Pyratio's own tests

**Storage**: None (reads files, no persistence)
**Testing**: `vitest` with fixture repositories under `tests/fixtures/`
**Target Platform**: Node.js ≥ 18, cross-platform (Linux, macOS, Windows)
**Project Type**: CLI tool (npm package, `npx pyratio`)
**Performance Goals**: Analysis of up to 5,000 test files completes in < 10 seconds on standard developer hardware
**Constraints**: Published artifact is `dist/` only (single bundled `.cjs` file for fast `npx` cold start); minimum Node 18
**Scale/Scope**: Single repository scan per invocation; multi-repo support out of scope for v1

---

## Constitution Check

*No `.specify/memory/constitution.md` found — no gates to evaluate.*

---

## Project Structure

### Documentation (this feature)

```text
specs/001-pyratio-cli/
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions
├── data-model.md        # Phase 1: entities and relationships
├── quickstart.md        # Phase 1: dev setup guide
├── contracts/
│   └── cli-schema.md    # Phase 1: CLI contract (args, output formats, errors)
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (repository root)

```text
src/
├── index.ts                    # CLI entry point (#!/usr/bin/env node, commander setup)
├── scanner.ts                  # File system traversal using tinyglobby
├── classifier.ts               # Orchestrates the ordered strategy pipeline
├── reporter.ts                 # Output: table (cli-table3), json, markdown
├── config.ts                   # .pyratio.yml loader + validator (yaml package)
├── types.ts                    # Shared types: Layer, Language, TestFile, PyramidReport, etc.
├── strategies/
│   ├── path-strategy.ts        # Priority 1: directory/filename glob patterns
│   ├── config-strategy.ts      # Priority 2: test runner config file signals
│   └── annotation-strategy.ts  # Priority 3: in-file annotations and naming
└── languages/
    ├── javascript.ts            # JS/TS detection patterns
    ├── java.ts                  # Java detection patterns (Maven/Gradle conventions)
    ├── csharp.ts                # C# detection patterns (project/file naming)
    ├── go.ts                    # Go detection patterns (build tags, naming)
    └── rust.ts                  # Rust detection patterns (path + content-based)

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
│   └── scan-real-repos.test.ts
└── fixtures/
    ├── js-repo/
    ├── java-repo/
    ├── go-repo/
    ├── rust-repo/
    └── csharp-repo/
```

**Structure Decision**: Single-project layout (Option 1). No monorepo needed — Pyratio is a single npm package with source in `src/` and tests in `tests/`.

---

## Key Design Decisions

### D1: Classification Strategy Pipeline

An ordered array of `ClassificationStrategy` objects. Pipeline iterates with `find()` — first strategy returning a non-null `Layer` wins. Unmatched files go to `unclassified`. User config rules (`.pyratio.yml`) are checked before the strategy pipeline.

**Priority**: config rules > path strategy > config detection strategy > annotation strategy

### D2: Rust Unit Test Detection

Rust is the only language requiring content inspection. Files in `tests/*.rs` are classified as integration via path pattern. Files with `#[cfg(test)]` inside `.rs` source files are classified as unit. `tests/e2e/*.rs` files are classified as e2e via path pattern.

### D3: Single Bundled Output

tsup with `--bundle --minify --format cjs` produces a single `dist/index.js`. No `node_modules/` in published tarball. Critical for `npx pyratio` cold start performance.

### D4: Health Indicator

`healthy` = unit% > integration% > e2e% ≥ smoke%. States: `healthy`, `inverted`, `flat`, `incomplete`, `unknown`. See `data-model.md` for full definitions.

### D5: Language Auto-Detection

Language is detected per-file from extension. Dominant language (most test files) is reported as the top-level `language` field. All detected languages are listed in `detectedLanguages`. `--lang` flag forces classification rules but does not restrict which files are scanned.

---

## Implementation Phases

### Phase A — Foundation (types, config, scanner)
1. Initialize npm project, install dependencies, configure tsup/vitest/tsconfig
2. Implement `types.ts` — all shared types
3. Implement `config.ts` — `.pyratio.yml` loader with validation and defaults
4. Implement `scanner.ts` — file discovery using tinyglobby, respecting ignore patterns

### Phase B — Classification Engine
5. Implement language modules (`javascript.ts`, `java.ts`, `csharp.ts`, `go.ts`, `rust.ts`)
6. Implement `strategies/path-strategy.ts`
7. Implement `strategies/config-strategy.ts`
8. Implement `strategies/annotation-strategy.ts`
9. Implement `classifier.ts` — pipeline orchestration + config rule pre-check

### Phase C — Output & CLI
10. Implement `reporter.ts` — table, JSON, and Markdown formatters
11. Implement `index.ts` — commander CLI wiring + shebang

### Phase D — Tests & Fixtures
12. Create test fixtures (minimal repos for each language)
13. Write unit tests for all strategy modules and classifier
14. Write integration tests against fixtures
15. Verify `npm pack --dry-run` produces correct artifact

---

## Artifact Index

| Artifact | Path | Status |
|----------|------|--------|
| Feature spec | `specs/001-pyratio-cli/spec.md` | ✅ Complete |
| Research | `specs/001-pyratio-cli/research.md` | ✅ Complete |
| Data model | `specs/001-pyratio-cli/data-model.md` | ✅ Complete |
| CLI contract | `specs/001-pyratio-cli/contracts/cli-schema.md` | ✅ Complete |
| Quickstart | `specs/001-pyratio-cli/quickstart.md` | ✅ Complete |
| Tasks | `specs/001-pyratio-cli/tasks.md` | ⏳ Pending (`/speckit.tasks`) |
