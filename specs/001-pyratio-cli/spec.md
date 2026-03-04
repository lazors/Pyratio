# Feature Specification: Pyratio CLI — Test Pyramid Analyzer

**Feature Branch**: `001-pyratio-cli`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User description: "Pyratio CLI tool for test pyramid ratio analysis across JS/TS, Java, C#, Go, and Rust repositories"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Analyze Repository Test Distribution (Priority: P1)

A developer runs Pyratio against their repository to understand how their tests are distributed across layers (unit, integration, e2e, smoke). They get an ASCII table showing counts, percentages, and a visual bar for each layer, along with a pyramid health indicator.

**Why this priority**: The core value of the tool. Without this, no other functionality matters. This is the single reason users install Pyratio.

**Independent Test**: Run `npx pyratio` in a repository containing tests across multiple directories (e.g., `test/unit/`, `test/e2e/`). Tool produces a table with correct counts per layer.

**Acceptance Scenarios**:

1. **Given** a JS/TS repository with tests in `test/unit/`, `test/integration/`, and `test/e2e/`, **When** the user runs `npx pyratio`, **Then** the tool outputs a table with the count and percentage for each layer and a total.
2. **Given** a repository with tests in an unrecognized structure, **When** the user runs `npx pyratio`, **Then** unclassified test files are listed in an `unclassified` bucket and the total still reflects all discovered test files.
3. **Given** a repository with no test files, **When** the user runs `npx pyratio`, **Then** the tool reports zero tests and no error.

---

### User Story 2 - Machine-Readable Output for Tooling Integration (Priority: P2)

A developer integrates Pyratio into a CI pipeline or script and needs JSON output to post-process results (e.g., fail the build if unit test percentage drops below a threshold).

**Why this priority**: Enables automation use cases and integrations without requiring further tooling. Directly unlocks CI usage.

**Independent Test**: Run `npx pyratio --format json` and parse the output with `jq`. Verify fields `total`, `layers`, `ratio`, `health`, and `unclassified` are present with correct values.

**Acceptance Scenarios**:

1. **Given** a repository with classified tests, **When** the user runs `npx pyratio --format json`, **Then** the output is valid JSON containing `total`, `layers` (with `count`, `percentage`, `files` per layer), `ratio`, `health`, and `unclassified`.
2. **Given** a repository with all tests unclassified, **When** the user runs `npx pyratio --format json`, **Then** `layers` counts are all zero and `unclassified` contains the file list.

---

### User Story 3 - Multi-Language Repository Support (Priority: P2)

A developer working in Java, C#, Go, or Rust runs Pyratio and gets accurate classification using language-specific conventions (e.g., `*IT.java` → integration, `@SpringBootTest` → integration, `//go:build integration` → integration).

**Why this priority**: Pyratio's differentiation over JS-only tools. Essential for polyglot teams.

**Independent Test**: Run `npx pyratio` against a Java project with Maven conventions (`src/test/`, `*IT.java`). Verify integration tests are correctly classified.

**Acceptance Scenarios**:

1. **Given** a Java repository with `*IT.java` files and `@SpringBootTest` annotations, **When** the user runs `npx pyratio`, **Then** those files are classified as integration tests.
2. **Given** a Go repository with `//go:build integration` build tags, **When** the user runs `npx pyratio`, **Then** those files are classified as integration tests.
3. **Given** a Rust repository with inline `#[cfg(test)]` modules and a `tests/` directory, **When** the user runs `npx pyratio`, **Then** inline tests are classified as unit and `tests/` files as integration.
4. **Given** a C# repository with projects named `*.UnitTests` and `*.IntegrationTests`, **When** the user runs `npx pyratio`, **Then** tests are classified by project suffix.

---

### User Story 4 - Custom Classification Rules via Config File (Priority: P3)

A developer has a non-standard test directory structure and wants to define their own glob-based classification rules via `.pyratio.yml`.

**Why this priority**: Makes the tool adaptable to legacy or unconventional codebases without code changes.

**Independent Test**: Create a `.pyratio.yml` with a custom glob `tests/browser/**` mapped to `e2e`. Run `npx pyratio` and verify files under `tests/browser/` are classified as e2e.

**Acceptance Scenarios**:

1. **Given** a `.pyratio.yml` config with custom glob rules, **When** the user runs `npx pyratio`, **Then** files matching custom globs are classified according to the config (overriding built-in rules).
2. **Given** a `.pyratio.yml` with an `ignore` list, **When** the user runs `npx pyratio`, **Then** files matching ignored globs are excluded from analysis.
3. **Given** a missing or malformed `.pyratio.yml`, **When** the user runs `npx pyratio --config .pyratio.yml`, **Then** the tool reports a descriptive error and exits without producing output.

---

### User Story 5 - Verbose Classification Reasoning (Priority: P3)

A developer wants to understand why a specific test file was classified as a particular layer (useful for debugging custom configs or unexpected results).

**Why this priority**: Important for trust and debuggability, but the tool delivers value without it.

**Independent Test**: Run `npx pyratio --verbose` and verify each file in the output includes the strategy and signal that determined its classification.

**Acceptance Scenarios**:

1. **Given** a repository with tests classified via multiple strategies, **When** the user runs `npx pyratio --verbose`, **Then** each file entry shows the classification layer and the specific signal used (e.g., "path pattern: `test/unit/`", "annotation: `@SpringBootTest`").

---

### Edge Cases

- What happens when a test file matches rules from multiple strategies (e.g., both path pattern and annotation)? → Higher-priority strategy wins; verbose output shows which signal was used.
- What happens when a repository contains multiple languages? → Language is auto-detected per file; the overall report shows the dominant language or lists all detected languages.
- What happens when the target directory does not exist? → Tool reports a descriptive error and exits with a non-zero code.
- What happens when `node_modules/`, `vendor/`, `target/`, or `bin/` directories contain test files? → Those directories are excluded by default.
- What happens when a test file has zero test functions (empty test file)? → File is counted as a test file if it matches classification patterns; actual function count is not analyzed in v1.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tool MUST scan a target directory (defaulting to the current directory) and identify all test files across supported languages (JS/TS, Java, C#, Go, Rust).
- **FR-002**: The tool MUST classify each discovered test file into exactly one layer: `unit`, `integration`, `e2e`, or `smoke` using a priority-ordered strategy pipeline (path patterns → config detection → annotations/naming).
- **FR-003**: The tool MUST assign unclassifiable test files to an `unclassified` bucket and include them in output.
- **FR-004**: The tool MUST output results in three formats: ASCII table (default), JSON, and Markdown, selectable via `--format`.
- **FR-005**: The tool MUST display a pyramid health indicator based on the ratio of test layers (healthy when unit > integration > e2e ≥ smoke).
- **FR-006**: The tool MUST support a `.pyratio.yml` config file for defining custom glob-based classification rules and ignore patterns.
- **FR-007**: The tool MUST exclude `node_modules/`, `vendor/`, `target/`, `bin/` directories by default; these defaults MUST be overridable via config.
- **FR-008**: The tool MUST support a `--verbose` flag that shows per-file classification reasoning (which strategy and signal classified each file).
- **FR-009**: The tool MUST support a `--lang` flag to force language detection for the target repository (bypassing auto-detection).
- **FR-010**: The tool MUST support a `--config` flag to specify an alternate config file path.
- **FR-011**: The classification strategy for path patterns MUST take highest priority, followed by config detection, then annotation/naming conventions.
- **FR-012**: The JSON output MUST include: `total`, `layers` (per-layer `count`, `percentage`, `files`), `ratio`, `health`, `language`, and `unclassified`.
- **FR-013**: The tool MUST be distributable as an npm package and invocable via `npx pyratio`.

### Key Entities

- **TestFile**: A file identified as containing tests. Has attributes: path, detected language, classification layer, classification signal, classification strategy.
- **Layer**: One of four fixed values: `unit`, `integration`, `e2e`, `smoke`. Has count and percentage.
- **ClassificationStrategy**: A ranked pipeline stage (path pattern, config detection, annotation/naming). Produces a layer assignment or abstains.
- **PyramidReport**: The final output artifact. Contains per-layer stats, total, ratio, health, language, and unclassified list.
- **Config**: User-provided `.pyratio.yml` specifying custom layers, glob rules, and ignore patterns.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can get a complete test pyramid report for any supported repository by running a single command with no configuration required.
- **SC-002**: Classification accuracy reaches ≥90% on repositories following standard conventions for supported languages (validated against a curated set of real-world open source repositories).
- **SC-003**: The tool completes analysis of a repository with up to 5,000 test files in under 10 seconds on standard developer hardware.
- **SC-004**: Zero false negatives for test files in explicitly named directories (`test/unit/`, `test/integration/`, `test/e2e/`) — these must always be classified correctly.
- **SC-005**: The JSON output format passes schema validation and can be parsed by standard JSON tools without preprocessing.
- **SC-006**: Users with custom directory structures can correctly classify 100% of their test files using `.pyratio.yml` glob rules.
- **SC-007**: Unclassified files are always surfaced in output (never silently dropped), enabling users to iteratively improve classification coverage.

## Assumptions

- Test files are identified by language-specific naming conventions (e.g., `*.test.ts`, `*Test.java`, `*_test.go`) rather than by parsing file contents for test function declarations.
- "Pyramid health" is defined as: unit% > integration% > e2e% ≥ smoke%, with graceful degradation if layers are absent.
- Auto-language detection is based on file extensions found in the repository; mixed-language repositories report the dominant language.
- The `--lang` flag overrides auto-detection for classification rules but does not restrict which files are scanned.
- Test count refers to test files, not individual test functions or assertions (function-level counting is out of scope for v1).
- The Markdown output format is suitable for embedding in GitHub README files or CI reports.
