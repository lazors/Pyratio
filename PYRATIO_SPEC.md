# Pyratio — Project Specification

## Overview

**Pyratio** is a CLI tool that analyzes a code repository and determines its test pyramid ratio — the distribution of tests across layers (unit, integration, e2e, smoke).

It is designed to work across multiple languages and ecosystems: **JavaScript/TypeScript, Java, C#, Go, and Rust**.

## Key Decisions

| Decision | Choice |
|----------|--------|
| Name | Pyratio |
| Stack | TypeScript / Node.js |
| License | Apache 2.0 |
| Distribution | npm package (`npx pyratio`) |
| Test layers | 4: unit, integration, e2e, smoke |

## Detection Strategy (Priority Order)

### 1. Directory / Path Patterns (Primary)

The most universal and reliable signal. Scan file paths for conventional directory names and file naming patterns.

**Examples by language:**

- **JS/TS:** `test/unit/`, `test/integration/`, `test/e2e/`, `__tests__/unit/`, `*.unit.test.ts`, `*.spec.ts`, `*.e2e.test.ts`
- **Java:** `src/test/unit/`, `src/test/integration/`, `src/test/e2e/`, `*IT.java` (integration by Maven convention), `*Test.java`
- **C#:** `*.UnitTests/`, `*.IntegrationTests/`, `*.E2ETests/`
- **Go:** `*_test.go` in `unit/`, `integration/`, `e2e/` directories
- **Rust:** `tests/` (integration by Rust convention), inline `#[cfg(test)]` modules (unit), `tests/e2e/`

### 2. Test Runner / Config Detection

Detect test frameworks and their configs to infer test types.

**Signals:**

- `playwright.config.ts` / `cypress.config.ts` → e2e
- `jest.config.ts` with `testMatch` patterns → classify by pattern
- `vitest.config.ts` with workspace configs → classify by workspace
- `pom.xml` with `maven-failsafe-plugin` → integration tests
- `build.gradle` with separate test tasks → classify by task
- `.csproj` referencing `Microsoft.AspNetCore.Mvc.Testing` → integration
- `Cargo.toml` test configuration → unit vs integration

### 3. Annotations / Naming Conventions (Tertiary)

Parse test files for language-specific markers.

**Signals:**

- **Java:** `@Tag("unit")`, `@Tag("integration")`, `@SpringBootTest`, `@DataJpaTest`, `@WebMvcTest`
- **C#:** `[Trait("Category", "Unit")]`, `[Trait("Category", "Integration")]`, `[Collection]`
- **Go:** `//go:build integration` build tags, `TestIntegration_*` naming
- **JS/TS:** `describe("unit:")`, `describe("e2e:")`, test file naming conventions
- **Rust:** `#[cfg(test)]` (unit), `tests/` directory (integration)

### 4. Import / Dependency Analysis (Future Enhancement)

Analyze imports within test files to infer test type.

**Signals:**

- HTTP clients, database drivers, Docker/Testcontainers → integration
- Browser automation imports (Selenium, Playwright, Puppeteer) → e2e
- Only local module imports + mocking libraries → unit
- Smoke-specific utilities or health check imports → smoke

### 5. User Config Overrides (`.pyratio.yml`)

Allow users to define or override classification rules.

```yaml
# .pyratio.yml
layers:
  - unit
  - integration
  - e2e
  - smoke

rules:
  - layer: e2e
    glob: "tests/browser/**"
  - layer: smoke
    glob: "tests/smoke/**"
  - layer: integration
    glob: "**/*IT.java"
  - layer: unit
    glob: "**/*.unit.test.ts"

ignore:
  - "node_modules/**"
  - "vendor/**"
  - "target/**"
  - "bin/**"
```

## Test Layers

| Layer | Description |
|-------|-------------|
| **Unit** | Tests a single function/class in isolation. Mocks external deps. Fast. |
| **Integration** | Tests interaction between components (DB, HTTP, queues). May use containers. |
| **E2E** | Tests full user flows through the UI or API. Browser or API-level. |
| **Smoke** | Lightweight sanity checks. Verifies critical paths work after deployment. |

## CLI Interface (Proposed)

```bash
# Basic usage — analyze current directory
npx pyratio

# Analyze specific directory
npx pyratio ./path/to/repo

# Output formats
npx pyratio --format table    # default: ASCII table
npx pyratio --format json     # machine-readable
npx pyratio --format markdown # for README badges or reports

# Options
npx pyratio --config .pyratio.yml   # custom config path
npx pyratio --verbose               # show classification reasoning per file
npx pyratio --lang java             # force language detection (auto by default)
```

## Output Example (Table)

```
 Pyratio — Test Pyramid Analysis
 ──────────────────────────────────────────
 Layer         Tests    %       Bar
 ──────────────────────────────────────────
 Unit           142    62.0%    ████████████████
 Integration     54    23.6%    ██████
 E2E             28    12.2%    ███
 Smoke            5     2.2%    █
 ──────────────────────────────────────────
 Total          229

 Pyramid Health: ✅ Healthy
 Ratio (U:I:E:S): 28:11:6:1
```

## Output Example (JSON)

```json
{
  "total": 229,
  "layers": {
    "unit": { "count": 142, "percentage": 62.0, "files": ["..."] },
    "integration": { "count": 54, "percentage": 23.6, "files": ["..."] },
    "e2e": { "count": 28, "percentage": 12.2, "files": ["..."] },
    "smoke": { "count": 5, "percentage": 2.2, "files": ["..."] }
  },
  "ratio": "28:11:6:1",
  "health": "healthy",
  "language": "typescript",
  "unclassified": []
}
```

## Architecture (High Level)

```
pyratio/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── scanner.ts            # File system traversal
│   ├── classifier.ts         # Orchestrates detection strategies
│   ├── strategies/
│   │   ├── path-strategy.ts       # Priority 1: directory/path patterns
│   │   ├── config-strategy.ts     # Priority 2: test runner configs
│   │   ├── annotation-strategy.ts # Priority 3: annotations/naming
│   │   └── import-strategy.ts     # Priority 4: dependency analysis (future)
│   ├── languages/
│   │   ├── javascript.ts     # JS/TS-specific patterns
│   │   ├── java.ts           # Java-specific patterns
│   │   ├── csharp.ts         # C#-specific patterns
│   │   ├── go.ts             # Go-specific patterns
│   │   └── rust.ts           # Rust-specific patterns
│   ├── config.ts             # .pyratio.yml loader
│   ├── reporter.ts           # Output formatting (table, json, markdown)
│   └── types.ts              # Shared types
├── tests/
├── package.json
├── tsconfig.json
├── LICENSE                   # Apache 2.0
└── README.md
```

## v1 Scope

**In scope:**
- Directory/path pattern detection (strategy 1)
- Test runner/config detection (strategy 2)
- Annotation/naming detection (strategy 3)
- JS/TS, Java, C#, Go, Rust language support
- 4 test layers: unit, integration, e2e, smoke
- Table, JSON, Markdown output
- `.pyratio.yml` config support
- `unclassified` bucket for tests that can't be categorized

**Out of scope for v1:**
- Import/dependency analysis (strategy 4)
- GitHub Action
- MCP tool integration
- Watch mode
- Historical trend tracking
- Monorepo multi-project support

## Future Ideas

- **GitHub Action:** Run Pyratio in CI and post pyramid chart as PR comment
- **MCP integration:** Expose as MCP tool for AI-assisted QA workflows
- **Badge generation:** SVG badges for README showing pyramid ratio
- **Trend tracking:** Compare ratios over time (store in `.pyratio-history.json`)
- **IDE extension:** VS Code extension showing test layer inline
