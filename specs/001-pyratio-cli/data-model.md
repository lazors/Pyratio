# Data Model: Pyratio CLI

**Branch**: `001-pyratio-cli`
**Date**: 2026-03-05

---

## Core Entities

### TestFile

Represents a single discovered test file and its classification result.

| Field | Type | Description |
|-------|------|-------------|
| `path` | `string` | Absolute path to the file |
| `relativePath` | `string` | Path relative to the scanned root |
| `language` | `Language` | Detected language for this file |
| `layer` | `Layer \| 'unclassified'` | Assigned test layer; `'unclassified'` if no strategy matched |
| `signal` | `string` | The specific pattern/annotation/config that triggered classification (e.g., `"path: test/unit/"`, `"annotation: @SpringBootTest"`) |
| `strategy` | `StrategyName` | Which strategy produced the classification (e.g., `'path'`, `'config'`, `'annotation'`) |

**State transitions**:
```
discovered → (try path strategy) → classified | (try config strategy) → classified | (try annotation strategy) → classified | unclassified
```

---

### Layer

Fixed enumeration of the four test pyramid layers.

| Value | Description |
|-------|-------------|
| `'unit'` | Tests a single function/class in isolation; mocks external deps |
| `'integration'` | Tests interaction between components (DB, HTTP, queues) |
| `'e2e'` | Tests full user flows through UI or API |
| `'smoke'` | Lightweight sanity checks for critical paths post-deployment |

---

### Language

Supported programming languages for test file detection.

| Value | Extensions |
|-------|-----------|
| `'typescript'` | `.ts`, `.mts`, `.cts` |
| `'javascript'` | `.js`, `.mjs`, `.cjs` |
| `'java'` | `.java` |
| `'csharp'` | `.cs` |
| `'go'` | `.go` |
| `'rust'` | `.rs` |
| `'unknown'` | Files that cannot be assigned a language |

---

### StrategyName

The priority-ordered set of classification strategies.

| Value | Priority | Description |
|-------|----------|-------------|
| `'path'` | 1 (highest) | Directory/filename patterns |
| `'config'` | 2 | Test runner/framework config file signals |
| `'annotation'` | 3 | In-file annotations and naming conventions |

---

### LayerStats

Per-layer statistics in the final report.

| Field | Type | Description |
|-------|------|-------------|
| `count` | `number` | Number of test files in this layer |
| `percentage` | `number` | Percentage of total (0–100, 1 decimal place) |
| `files` | `string[]` | Relative paths of all files in this layer |

---

### PyramidReport

The complete output artifact produced by a single run of Pyratio.

| Field | Type | Description |
|-------|------|-------------|
| `total` | `number` | Total test files discovered (classified + unclassified) |
| `layers` | `Record<Layer, LayerStats>` | Per-layer statistics |
| `ratio` | `string` | Simplified ratio string, e.g., `"28:11:6:1"` (U:I:E:S) |
| `health` | `PyramidHealth` | Overall pyramid shape assessment |
| `language` | `Language` | Dominant detected language (or `'unknown'`) |
| `unclassified` | `string[]` | Relative paths of files that could not be classified |
| `detectedLanguages` | `Language[]` | All languages found in the repository |

---

### PyramidHealth

| Value | Condition |
|-------|-----------|
| `'healthy'` | `unit% > integration% > e2e% ≥ smoke%` |
| `'inverted'` | More integration or e2e than unit |
| `'flat'` | All non-zero layers within 10% of each other |
| `'incomplete'` | One or more layers has zero tests |
| `'unknown'` | Total test count is 0 |

---

### Config

The parsed and validated representation of `.pyratio.yml`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `layers` | `Layer[]` | `['unit', 'integration', 'e2e', 'smoke']` | Active layers |
| `rules` | `ConfigRule[]` | `[]` | Custom glob classification rules |
| `ignore` | `string[]` | `['node_modules/**', 'vendor/**', 'target/**', 'bin/**']` | Glob patterns to exclude from scanning |

---

### ConfigRule

A single user-defined classification override rule from `.pyratio.yml`.

| Field | Type | Description |
|-------|------|-------------|
| `layer` | `Layer` | Target layer for files matching this rule |
| `glob` | `string` | Glob pattern (relative to scanned root) |

**Evaluation**: Config rules are checked before all built-in strategies. If a file matches a config rule glob, it is immediately assigned that layer without running the strategy pipeline.

---

### ClassificationStrategy (interface)

The shared interface implemented by all strategy classes.

| Member | Type | Description |
|--------|------|-------------|
| `name` | `StrategyName` | Strategy identifier |
| `classify(file: TestFile, context: ScanContext): Layer \| null` | method | Returns a `Layer` if the strategy can classify the file, `null` to pass to the next strategy |

---

### ScanContext

Shared read-only context passed to all strategies during a scan.

| Field | Type | Description |
|-------|------|-------------|
| `root` | `string` | Absolute path to the scanned directory |
| `config` | `Config` | Resolved config (defaults + user overrides) |
| `detectedConfigs` | `DetectedConfig[]` | Test runner config files found in the repository |
| `language` | `Language \| null` | Forced language override (from `--lang` flag), or `null` for auto-detect |

---

### DetectedConfig

A test framework config file found during the initial repository scan.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `ConfigType` | The type of config file detected |
| `path` | `string` | Absolute path to the config file |

**ConfigType values**: `'playwright'`, `'cypress'`, `'jest'`, `'vitest'`, `'maven-failsafe'`, `'gradle'`, `'csproj-testing'`, `'cargo'`

---

## Relationships

```
ScanContext
  └── Config
        └── ConfigRule[]

ScanContext
  └── DetectedConfig[]

ClassificationStrategy[]  (ordered priority array)
  ├── PathStrategy         (priority 1)
  ├── ConfigStrategy       (priority 2, reads DetectedConfig[])
  └── AnnotationStrategy   (priority 3, reads file content)

TestFile[]  (discovered by Scanner)
  └── classified by strategy pipeline
        → layer | 'unclassified'
        → signal
        → strategy

PyramidReport
  ├── layers: Record<Layer, LayerStats>
  │     └── LayerStats.files: TestFile.relativePath[]
  └── unclassified: TestFile.relativePath[]
```

---

## Validation Rules

- `Config.layers` must contain at least one valid `Layer` value
- `ConfigRule.glob` must be a non-empty string
- `PyramidReport.layers` always contains entries for all 4 layers (count may be 0)
- `LayerStats.percentage` is computed as `(count / total) * 100`, rounded to 1 decimal
- `PyramidReport.ratio` omits layers with count 0 from simplified ratio representation
- `total` equals sum of all layer counts plus `unclassified.length`
