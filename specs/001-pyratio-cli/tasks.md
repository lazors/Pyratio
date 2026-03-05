# Tasks: Pyratio CLI — Test Pyramid Analyzer

**Input**: Design documents from `/specs/001-pyratio-cli/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/cli-schema.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — npm package, TypeScript, build tooling, test runner

- [X] T001 Initialize npm project: run `npm init -y`, then update `package.json` with name `pyratio`, version `0.1.0`, description, `"type": "commonjs"`, `bin`, `main`, `exports`, `files`, `engines` fields per `quickstart.md` recommended shape
- [X] T002 Install runtime dependencies: `commander@14 tinyglobby yaml cli-table3`
- [X] T003 Install dev dependencies: `typescript tsup tsx vitest @types/node`
- [X] T004 [P] Configure TypeScript: create `tsconfig.json` targeting ES2022, module commonjs, strict mode, outDir `dist/`, rootDir `src/`, include `src/**/*`
- [X] T005 [P] Configure vitest: create `vitest.config.ts` with test root `tests/`, include `tests/**/*.test.ts`
- [X] T006 [P] Add npm scripts to `package.json`: `build` (tsup), `dev` (tsx watch), `typecheck` (tsc --noEmit), `test` (vitest run), `test:watch` (vitest), `prepublishOnly` per quickstart.md
- [X] T007 Create source directory structure: `src/`, `src/strategies/`, `src/languages/`, `tests/unit/`, `tests/unit/strategies/`, `tests/integration/`, `tests/fixtures/`

**Checkpoint**: `npm run typecheck` and `npm test` run without errors (empty test suite)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and file scanner that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Define all shared types in `src/types.ts`: `Layer`, `Language`, `PyramidHealth`, `StrategyName`, `TestFile`, `LayerStats`, `PyramidReport`, `Config`, `ConfigRule`, `ClassificationStrategy` interface, `ScanContext`, `DetectedConfig`, `ConfigType` — per data-model.md entity definitions
- [X] T009 Implement file scanner in `src/scanner.ts`: use `tinyglobby` to discover test files recursively in a target directory; accept ignore patterns (default: `node_modules/**`, `vendor/**`, `target/**`, `bin/**`); return `TestFile[]` with `path`, `relativePath`, and `language` populated by file extension mapping (per data-model.md Language entity); scanner does NOT classify — only discovers and tags language

**Checkpoint**: Foundation ready — `types.ts` compiles, scanner finds test files by extension

---

## Phase 3: User Story 1 — Analyze Repository Test Distribution (Priority: P1) MVP

**Goal**: Run `npx pyratio` in a JS/TS repository and see an ASCII table with test counts per layer, percentages, bar chart, health indicator, and ratio

**Independent Test**: Run `tsx src/index.ts tests/fixtures/js-repo` and verify ASCII table output with correct layer counts

### Implementation for User Story 1

- [X] T010 [P] [US1] Implement JS/TS language patterns in `src/languages/javascript.ts`: export test file globs (`**/*.test.{ts,js,mts,mjs,cts,cjs}`, `**/*.spec.{ts,js,mts,mjs,cts,cjs}`, `**/__tests__/**/*.{ts,js,mts,mjs}`) and path-to-layer mapping rules (directories containing `unit`, `integration`, `e2e`, `smoke` in the path) per research.md section 9
- [X] T011 [P] [US1] Implement path classification strategy in `src/strategies/path-strategy.ts`: implement `ClassificationStrategy` interface; classify files based on directory/filename patterns using JS/TS language patterns; match path segments against layer keywords (`/unit/`, `/integration/`, `/e2e/`, `/smoke/`); also match file naming patterns like `*.unit.test.ts`, `*.e2e.spec.ts`; return `Layer | null`
- [X] T012 [US1] Implement classifier pipeline in `src/classifier.ts`: accept `TestFile[]` and `ScanContext`; iterate strategy array (path-strategy only for now) using `find()` pattern; assign `layer`, `signal`, `strategy` to each `TestFile`; unmatched files get `layer: 'unclassified'`; compute `PyramidReport` with `LayerStats` per layer, `total`, `ratio` string (simplified GCD), `health` (per data-model.md PyramidHealth conditions), dominant `language`, `detectedLanguages`, and `unclassified` list
- [X] T013 [US1] Implement table reporter in `src/reporter.ts`: accept `PyramidReport`; output ASCII table using `cli-table3` matching the table format in `contracts/cli-schema.md` — header "Pyratio — Test Pyramid Analysis", columns: Layer, Tests, %, Bar; bar uses `█` character normalized to max 20 chars; footer with Total, Pyramid Health (emoji per health value), Ratio (U:I:E:S); append Unclassified section if `unclassified.length > 0`
- [X] T014 [US1] Implement CLI entry point in `src/index.ts`: add `#!/usr/bin/env node` shebang; use `commander` to define `pyratio [directory]` command with `--format`, `--config`, `--verbose`, `--lang` options per `contracts/cli-schema.md`; for US1: wire only `[directory]` arg (default `.`) → scanner → classifier (path strategy only) → table reporter → `process.stdout.write`; handle errors (directory not found → exit 1 with message per error contract); read version from `package.json`
- [X] T015 [P] [US1] Create JS/TS test fixture in `tests/fixtures/js-repo/`: create minimal directory tree with files in `test/unit/` (3 `.test.ts` files), `test/integration/` (2 `.test.ts` files), `test/e2e/` (1 `.spec.ts` file), and one unclassifiable file in `test/misc/` — files can be empty, only paths matter for classification
- [X] T016 [US1] Verify end-to-end: run `tsx src/index.ts tests/fixtures/js-repo` and confirm ASCII table output shows correct counts (3 unit, 2 integration, 1 e2e, 0 smoke, 1 unclassified) with valid percentages, health status, and ratio

**Checkpoint**: US1 is complete — `npx pyratio` works against any JS/TS repository and produces a correct ASCII table

---

## Phase 4: User Story 2 — Machine-Readable Output (Priority: P2)

**Goal**: `npx pyratio --format json` and `--format markdown` produce structured output suitable for CI pipelines and README embedding

**Independent Test**: Run `tsx src/index.ts tests/fixtures/js-repo --format json | node -e "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'))"` and verify valid JSON with all required fields

### Implementation for User Story 2

- [X] T017 [P] [US2] Implement JSON reporter in `src/reporter.ts`: add `formatJson(report: PyramidReport): string` function; output JSON matching `contracts/cli-schema.md` JSON format contract — fields: `total`, `layers` (per-layer `count`, `percentage`, `files`), `ratio`, `health`, `language`, `detectedLanguages`, `unclassified`; use `JSON.stringify(report, null, 2)` for pretty output
- [X] T018 [P] [US2] Implement Markdown reporter in `src/reporter.ts`: add `formatMarkdown(report: PyramidReport): string` function; output Markdown table matching `contracts/cli-schema.md` Markdown format contract — table with Layer/Tests/%/Bar columns, footer with Total/Health/Ratio
- [X] T019 [US2] Wire `--format` flag in `src/index.ts`: dispatch to `formatTable`, `formatJson`, or `formatMarkdown` based on `--format` option value; validate format value — exit 1 with error message per error contract if invalid

**Checkpoint**: US2 is complete — JSON output is parseable by `jq`/`JSON.parse`, Markdown renders correctly in GitHub

---

## Phase 5: User Story 3 — Multi-Language Repository Support (Priority: P2)

**Goal**: Pyratio accurately classifies test files in Java, C#, Go, and Rust repositories using language-specific conventions, config file detection, and annotation parsing

**Independent Test**: Run `tsx src/index.ts tests/fixtures/java-repo` and verify `*IT.java` files classified as integration, `*Test.java` as unit

### Implementation for User Story 3

- [X] T020 [P] [US3] Implement Java language patterns in `src/languages/java.ts`: export test file globs (`**/*Test.java`, `**/*Tests.java`, `**/Test*.java`, `**/*TestCase.java`, `**/*IT.java`, `**/*ITCase.java`); path-to-layer rules: `*IT.java`/`*ITCase.java` → integration, `src/test/unit/` → unit, `src/test/integration/` → integration, `src/test/e2e/` → e2e; annotation signals: `@SpringBootTest`, `@DataJpaTest`, `@WebMvcTest` → integration, `@Tag("unit")` → unit, `@Tag("integration")` → integration per research.md section 9
- [X] T021 [P] [US3] Implement C# language patterns in `src/languages/csharp.ts`: export test file globs (`**/*Tests.cs`, `**/*Test.cs`, `**/*Spec.cs`); path-to-layer rules: `*.UnitTests/` → unit, `*.IntegrationTests/` → integration, `*.E2ETests/` → e2e; annotation signals: `[Trait("Category", "Unit")]` → unit, `[Trait("Category", "Integration")]` → integration per research.md section 9
- [X] T022 [P] [US3] Implement Go language patterns in `src/languages/go.ts`: export test file globs (`**/*_test.go`); path-to-layer rules: `unit/` → unit, `integration/` → integration, `e2e/` → e2e; annotation signals: `//go:build integration` build tag → integration, `TestIntegration_*` naming prefix → integration per research.md section 9
- [X] T023 [P] [US3] Implement Rust language patterns in `src/languages/rust.ts`: export test file globs (`tests/*.rs` → integration, `tests/e2e/*.rs` → e2e); content-based signal: `#[cfg(test)]` in any `.rs` file → unit; this is the only language requiring file content reading for unit test detection per research.md section 9 note
- [X] T024 [US3] Implement config detection strategy in `src/strategies/config-strategy.ts`: implement `ClassificationStrategy` interface; during scan, detect presence of config files (`playwright.config.ts`/`cypress.config.ts` → e2e, `jest.config.ts`/`vitest.config.ts` with testMatch → classify by pattern, `pom.xml` with `maven-failsafe-plugin` → integration) per research.md; use `DetectedConfig[]` from `ScanContext`; classify test files associated with detected configs
- [X] T025 [US3] Implement annotation/naming strategy in `src/strategies/annotation-strategy.ts`: implement `ClassificationStrategy` interface; read file content and check for language-specific markers — Java: `@Tag`, `@SpringBootTest`, `@DataJpaTest`; C#: `[Trait("Category",...)]`; Go: `//go:build integration`, `TestIntegration_` prefix; Rust: `#[cfg(test)]`; JS/TS: `describe("unit:")`, `describe("e2e:")`; return matching `Layer` or `null`
- [X] T026 [US3] Update scanner in `src/scanner.ts`: extend to discover test files across all languages (use all language modules to build combined glob patterns); detect test runner config files and populate `DetectedConfig[]` in `ScanContext`
- [X] T027 [US3] Update classifier in `src/classifier.ts`: register all three strategies in priority order (path → config → annotation); pass `ScanContext` with `DetectedConfig[]` to strategies; support `--lang` flag override (when set, only use language patterns for that language but still scan all files)
- [X] T028 [P] [US3] Create Java test fixture in `tests/fixtures/java-repo/`: create `src/test/java/` with `FooTest.java`, `BarIT.java`, `BazTests.java`; files should contain minimal annotations (`@SpringBootTest` in one file, `@Tag("unit")` in another) for annotation strategy testing
- [X] T029 [P] [US3] Create Go test fixture in `tests/fixtures/go-repo/`: create `unit/foo_test.go`, `integration/bar_test.go` (with `//go:build integration` tag), `e2e/baz_test.go`
- [X] T030 [P] [US3] Create Rust test fixture in `tests/fixtures/rust-repo/`: create `src/lib.rs` (with `#[cfg(test)] mod tests {}` block), `tests/integration_test.rs`, `tests/e2e/browser_test.rs`
- [X] T031 [P] [US3] Create C# test fixture in `tests/fixtures/csharp-repo/`: create `MyApp.UnitTests/FooTests.cs`, `MyApp.IntegrationTests/BarTests.cs`, `MyApp.E2ETests/BazTests.cs`

**Checkpoint**: US3 is complete — `npx pyratio` correctly classifies tests in Java, C#, Go, and Rust repos using path, config, and annotation strategies

---

## Phase 6: User Story 4 — Custom Classification Rules via Config (Priority: P3)

**Goal**: Users with non-standard directory structures define `.pyratio.yml` with custom glob rules that override built-in classification

**Independent Test**: Create `.pyratio.yml` with `rules: [{layer: e2e, glob: "tests/browser/**"}]` in js-repo fixture, run `tsx src/index.ts tests/fixtures/js-repo`, verify browser files classified as e2e

### Implementation for User Story 4

- [X] T032 [US4] Implement config loader in `src/config.ts`: load and parse `.pyratio.yml` using `yaml` package; validate against `Config` type from `types.ts` — `layers` must be non-empty array of valid layer names, each `ConfigRule` must have valid `layer` and non-empty `glob`, `ignore` merges with defaults (not replaces); return default config if no config file found (silent); exit 1 with descriptive error per `contracts/cli-schema.md` error messages if file specified via `--config` is missing or malformed
- [X] T033 [US4] Integrate config rule pre-check in `src/classifier.ts`: before running strategy pipeline, check each file against `Config.rules` globs; if a file matches a config rule, assign that layer immediately (skip strategy pipeline); set `strategy: 'config-rule'` and `signal` to the matching glob pattern
- [X] T034 [US4] Wire `--config` flag in `src/index.ts`: pass config file path to config loader; merge loaded config ignore patterns with scanner defaults; pass resolved `Config` through `ScanContext` to classifier
- [X] T035 [P] [US4] Create config fixture in `tests/fixtures/js-repo/.pyratio.yml`: add rules mapping `tests/browser/**` → e2e, `tests/smoke/**` → smoke; add `tests/browser/login.spec.ts` and `tests/smoke/health.test.ts` files to fixture

**Checkpoint**: US4 is complete — `.pyratio.yml` rules correctly override built-in classification; malformed configs produce clear errors

---

## Phase 7: User Story 5 — Verbose Classification Reasoning (Priority: P3)

**Goal**: `--verbose` flag outputs per-file classification reasoning showing which strategy and signal classified each file

**Independent Test**: Run `tsx src/index.ts tests/fixtures/js-repo --verbose` and verify each file line shows `[layer] path (strategy: signal)` format

### Implementation for User Story 5

- [X] T036 [US5] Implement verbose formatter in `src/reporter.ts`: add `formatVerbose(files: TestFile[]): string` function; output one line per file in format `[layer]  <relativePath>  (<strategy>: <signal>)` per `contracts/cli-schema.md` verbose output contract; `[unclassified]` for unmatched files (no strategy/signal shown)
- [X] T037 [US5] Wire `--verbose` flag in `src/index.ts`: when `--verbose` is passed, output verbose file listing before the main report (table/json/markdown); pass classified `TestFile[]` to verbose formatter

**Checkpoint**: US5 is complete — verbose output shows per-file reasoning for debugging classification

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Build verification, edge cases, and distribution readiness

- [X] T038 Verify build: run `npm run build` and confirm `dist/index.js` is a single bundled CJS file with shebang; run `node dist/index.js --help` and verify help text matches CLI contract
- [X] T039 Verify npm pack: run `npm pack --dry-run` and confirm only `dist/` is included in tarball; verify `package.json` `files` field is correct
- [X] T040 Handle edge cases in `src/classifier.ts` and `src/index.ts`: directory not found → exit 1 with error; zero test files found → output table with all zeros and health `unknown`; empty fixture test to verify graceful handling
- [X] T041 Add `.gitignore` entries: ensure `dist/`, `node_modules/`, `*.tsbuildinfo` are ignored
- [X] T042 Verify cross-platform: test `tsx src/index.ts` on the target OS, confirm path separators are handled correctly (use `/` in output even on Windows)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — MVP delivery target
- **US2 (Phase 4)**: Depends on Phase 3 (T013 reporter exists) — adds JSON/Markdown formats
- **US3 (Phase 5)**: Depends on Phase 2 — can run in parallel with US2; extends scanner + classifier
- **US4 (Phase 6)**: Depends on Phase 2 — can run in parallel with US2/US3; adds config layer
- **US5 (Phase 7)**: Depends on Phase 3 (T014 CLI exists) — can run in parallel with US3/US4
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|-----------|-------------------|
| US1 (P1) | Phase 2 only | — (MVP, do first) |
| US2 (P2) | US1 (reporter.ts exists) | US3, US4, US5 |
| US3 (P2) | Phase 2 only | US2, US4, US5 |
| US4 (P3) | Phase 2 only | US2, US3, US5 |
| US5 (P3) | US1 (CLI exists) | US3, US4 |

### Within Each User Story

1. Language patterns (if any) — parallelizable
2. Strategy implementations — parallelizable
3. Classifier/scanner updates — sequential (depends on strategies)
4. Reporter/CLI wiring — sequential (depends on classifier)
5. Fixtures — parallelizable (independent of implementation)
6. End-to-end verification — last

### Parallel Opportunities

**Phase 1**: T004, T005, T006 can run in parallel (different config files)
**US1**: T010 + T011 + T015 can run in parallel (different files)
**US3**: T020 + T021 + T022 + T023 can run in parallel (language modules); T028 + T029 + T030 + T031 can run in parallel (fixtures)
**Cross-story**: US3 and US4 can run in parallel after Phase 2

---

## Parallel Example: User Story 3

```text
# Launch all language modules together (different files, no deps):
T020: "Implement Java language patterns in src/languages/java.ts"
T021: "Implement C# language patterns in src/languages/csharp.ts"
T022: "Implement Go language patterns in src/languages/go.ts"
T023: "Implement Rust language patterns in src/languages/rust.ts"

# Launch all fixtures together (different directories, no deps):
T028: "Create Java test fixture in tests/fixtures/java-repo/"
T029: "Create Go test fixture in tests/fixtures/go-repo/"
T030: "Create Rust test fixture in tests/fixtures/rust-repo/"
T031: "Create C# test fixture in tests/fixtures/csharp-repo/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (`types.ts` + `scanner.ts`)
3. Complete Phase 3: User Story 1 (path strategy + table output + CLI)
4. **STOP and VALIDATE**: Run `tsx src/index.ts tests/fixtures/js-repo` — correct table?
5. Ship if ready — tool works for JS/TS repos with standard directory conventions

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (path strategy + table) → **MVP** — works for JS/TS repos
3. US2 (JSON + Markdown) → CI pipeline integration unlocked
4. US3 (multi-language + config + annotation strategies) → Java/C#/Go/Rust support
5. US4 (config file) → Custom directory structures supported
6. US5 (verbose) → Debugging/trust unlocked
7. Polish → Distribution-ready npm package

### Task Count Summary

| Phase | Tasks | Parallel |
|-------|-------|----------|
| Phase 1: Setup | 7 | 3 |
| Phase 2: Foundational | 2 | 0 |
| Phase 3: US1 (P1) | 7 | 3 |
| Phase 4: US2 (P2) | 3 | 2 |
| Phase 5: US3 (P2) | 12 | 8 |
| Phase 6: US4 (P3) | 4 | 1 |
| Phase 7: US5 (P3) | 2 | 0 |
| Phase 8: Polish | 5 | 0 |
| **Total** | **42** | **17** |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
- Test tasks are NOT included (not requested in the feature specification) — add via `/speckit.checklist` if needed
