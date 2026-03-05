# Research: Pyratio CLI Implementation

**Phase**: 0 — Outline & Research
**Branch**: `001-pyratio-cli`
**Date**: 2026-03-05

---

## 1. CLI Argument Parsing

**Decision**: `commander@14`

**Rationale**: Most popular Node.js CLI framework (~282M weekly downloads vs yargs ~148M). Ships its own TypeScript types (no `@types/` package needed). Clean chainable API, automatic `--help`/`--version` generation, and minimal startup overhead. v14.0.3 published recently; actively maintained.

**Alternatives considered**:

| Package | Verdict |
|---------|---------|
| `yargs` | Heavier (~128KB), more built-ins (tab completion, middleware); consider only if those features are needed |
| `minimist` | Too low-level for a multi-option CLI like Pyratio |
| `oclif` | Plugin architecture — overkill for a single-purpose CLI |

---

## 2. Build Toolchain

**Decision**: `tsup` (build/bundle) + `tsx` (dev runner)

**Rationale**: `tsup` wraps esbuild with CLI-specific ergonomics: zero-config entry detection, `--format cjs` output, `.d.ts` generation, shebang preservation, and `dist/` management. The `--bundle --minify` flags compile the entire CLI and its dependencies into a single `.cjs` file — the key optimization for `npx` cold starts (smaller tarball, no `node_modules` unpacking). `tsx` is used only during local development (`tsx watch src/index.ts`). `tsc --noEmit` is run separately in CI for type checking, since tsup/esbuild skips type verification.

**Alternatives considered**:

| Tool | Verdict |
|------|---------|
| Raw `esbuild` | More config, same result — no reason to skip tsup's ergonomic wrapper |
| `tsc` only | Produces many files, no bundling, slower npx startup |
| `ts-node` | Slower than tsx for development use; not for production |

---

## 3. Module Format

**Decision**: CJS (`"type": "commonjs"`)

**Rationale**: CLIs are executed directly by Node.js — not imported by downstream consumers. CJS avoids async module loading overhead (measurable for CLI cold start), has zero ESM interop issues, and works on all Node.js ≥ 12. ESM would add friction with no benefit. If Pyratio ever needs to export a public API (programmatic use), dual-mode output can be added then.

---

## 4. File Globbing / Directory Traversal

**Decision**: `tinyglobby@0.2.x`

**Rationale**: Built on `fdir` (fastest Node.js directory traversal) + `picomatch`. Drop-in API compatible with `fast-glob`. Only 2 transitive dependencies (vs fast-glob's 17). Adopted by Vite, Nx, and Nuxt as a replacement for the now-stalled `fast-glob` (no npm release in >1 year despite merged PRs). TypeScript types bundled in the package.

**Alternatives considered**:

| Package | Verdict |
|---------|---------|
| `fast-glob` | Functionally stale; avoid for new projects |
| `glob` v11 | Zero external deps, good option, but slower and prioritizes Bash semantics |
| `tinyglobby` | **Selected** |

---

## 5. YAML Config Parsing

**Decision**: `yaml@2.x` (eemeli/yaml)

**Rationale**: TypeScript types bundled in the package (no `@types/yaml`). Full YAML 1.2 compliance. No external dependencies. Actively maintained (latest release early 2025). `yaml.parse()` is a one-liner identical in usage to `js-yaml.load()`.

**Alternatives considered**:

| Package | Verdict |
|---------|---------|
| `js-yaml` | Last release >4 years ago; types in DefinitelyTyped only; avoid for new projects |
| `yaml` (eemeli) | **Selected** |

---

## 6. ASCII Table Output

**Decision**: `cli-table3@0.6.x`

**Rationale**: De facto standard for bordered ASCII/unicode tables in Node.js CLIs (~9.5M weekly downloads). TypeScript types included. Supports column alignment, unicode box-drawing characters. Actively maintained fork of the abandoned `cli-table`.

**For the pyramid bar chart column**: Manual string construction with `█` character (no library needed — just `'█'.repeat(n)`).

**Alternatives considered**:

| Package | Verdict |
|---------|---------|
| `columnify` | Better for borderless columnar output, not tabular |
| `table` (gajus) | More config options; consider if cell truncation/wrapping becomes needed |
| Manual padding | Breaks on unicode; avoid for anything beyond trivial output |

---

## 7. Test Runner (for Pyratio's own tests)

**Decision**: `vitest`

**Rationale**: Native TypeScript support via esbuild (no `ts-jest`/Babel needed). Jest-compatible API (`describe`, `it`, `expect`, `vi.mock`). 4-10x faster cold-start than Jest. Native ESM support. Growing adoption (~400% in 2023-2024). Since Pyratio itself uses tsup/esbuild, using vitest for tests keeps the entire toolchain esbuild-based for consistency.

**Alternatives considered**:

| Package | Verdict |
|---------|---------|
| `jest` | Requires `ts-jest` transformer; better for existing Jest codebases or React Native |
| `vitest` | **Selected** |

---

## 8. Classification Pipeline Architecture

**Decision**: Ordered strategy array with `findFirst` loop

**Rationale**: A plain array of strategy objects (each implementing `ClassificationStrategy` interface) iterated with a `find()` call is the right pattern for a "first match wins" pipeline where:
- Order is fixed at startup
- Handlers don't mutate shared state
- Each strategy independently says "match" or "pass"

Chain of Responsibility is inappropriate here — it couples each handler to the next and makes reordering awkward. Strategy array is what ESLint, Prettier, and similar tools use internally.

**Future extensibility**: If users need runtime strategy registration, wrap the array in a registry with `register(strategy, priority)`. The loop remains identical.

---

## 9. Test File Detection Patterns (by Language)

### JavaScript / TypeScript
- `**/*.test.{ts,js,mts,mjs,cts,cjs}`
- `**/*.spec.{ts,js,mts,mjs,cts,cjs}`
- `**/__tests__/**/*.{ts,js,mts,mjs}`
- Source: Jest `testMatch` defaults + Vitest `include` defaults

### Java
- `**/*Test.java` → unit (Maven Surefire default)
- `**/*Tests.java` → unit
- `**/Test*.java` → unit
- `**/*TestCase.java` → unit
- `**/*IT.java` → integration (Maven Failsafe convention)
- `**/*ITCase.java` → integration
- All files under `src/test/java/`

### C#
- `**/*Tests.cs` → by project dir suffix
- `**/*Test.cs`
- `**/*Spec.cs`
- Project-level: `*.UnitTests/`, `*.IntegrationTests/`, `*.E2ETests/`
- Source: NUnit/xUnit/MSTest community conventions

### Go
- `**/*_test.go` — language-enforced by `go test`; no exceptions
- Integration sub-classification: presence of `//go:build integration` tag or `TestIntegration_*` prefix

### Rust
- Integration: `tests/*.rs` (Cargo convention — only root-level `.rs` in `tests/` are test crates)
- Unit: **content-based only** — detect `#[cfg(test)]` inside `.rs` files; no filename pattern exists
- E2E: `tests/e2e/*.rs`

**Note on Rust**: Rust is the only language where unit test detection requires content inspection. All other languages can be classified by filename/path alone for the initial pass.

---

## 10. Health Indicator Logic

**Decision**: Define "healthy" as `unit% > integration% > e2e% ≥ smoke%`

**States**:
- `healthy`: Pyramid shape — unit largest, smoke smallest
- `inverted`: More integration/e2e than unit (warning)
- `flat`: All layers within 10% of each other (warning)
- `incomplete`: One or more layers have zero tests (informational)
- `unknown`: Total test count is 0

---

## 11. Minimum Node.js Version

**Decision**: Node.js ≥ 18

**Rationale**: Node 18 is LTS (still active in 2026). Provides stable `fs.promises`, `path` APIs, and ESM support needed. Avoids polyfills for `structuredClone`, `fetch` (not needed but avoids confusion). Node 16 reached EOL September 2023.
