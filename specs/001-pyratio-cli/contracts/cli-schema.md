# CLI Contract: pyratio

**Type**: Command-line interface contract
**Branch**: `001-pyratio-cli`
**Date**: 2026-03-05

---

## Command Syntax

```
pyratio [directory] [options]
```

`directory` is optional and defaults to the current working directory.

---

## Arguments

| Argument | Type | Default | Description |
|----------|------|---------|-------------|
| `[directory]` | path | `.` (cwd) | Directory to analyze. Must be an accessible directory path. |

---

## Options

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--format <format>` | `-f` | `table \| json \| markdown` | `table` | Output format |
| `--config <path>` | `-c` | string | `.pyratio.yml` (in target dir) | Path to config file |
| `--verbose` | `-v` | boolean | `false` | Show per-file classification reasoning |
| `--lang <lang>` | `-l` | `typescript \| javascript \| java \| csharp \| go \| rust` | auto-detect | Force language detection |
| `--version` | | boolean | — | Print version and exit |
| `--help` | `-h` | boolean | — | Print usage and exit |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success — analysis completed (even if no tests found) |
| `1` | Error — invalid arguments, target directory not found, or malformed config |

---

## Output Contract: Table Format (`--format table`)

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

**Rules**:
- Bar column: one `█` per ~4% of total (normalized to max 20 characters)
- Health emoji: `✅` for healthy, `⚠️` for inverted/flat/incomplete, `❓` for unknown
- Unclassified section appears below the table only if `unclassified.length > 0`:
  ```
   Unclassified (3):
     src/tests/mystery.ts
     tests/weird_test.go
     ...
  ```

---

## Output Contract: JSON Format (`--format json`)

```json
{
  "total": 229,
  "layers": {
    "unit":        { "count": 142, "percentage": 62.0, "files": ["tests/unit/foo.test.ts"] },
    "integration": { "count": 54,  "percentage": 23.6, "files": ["..."] },
    "e2e":         { "count": 28,  "percentage": 12.2, "files": ["..."] },
    "smoke":       { "count": 5,   "percentage": 2.2,  "files": ["..."] }
  },
  "ratio": "28:11:6:1",
  "health": "healthy",
  "language": "typescript",
  "detectedLanguages": ["typescript"],
  "unclassified": []
}
```

**Guarantees**:
- Output is valid JSON (parseable by `JSON.parse()` without preprocessing)
- All four layer keys are always present (count may be 0)
- `total` equals sum of all layer counts + `unclassified.length`
- `health` is one of: `"healthy"`, `"inverted"`, `"flat"`, `"incomplete"`, `"unknown"`
- `percentage` values are numbers with 1 decimal place
- `files` arrays contain relative paths from the scanned root

---

## Output Contract: Markdown Format (`--format markdown`)

```markdown
## Test Pyramid Analysis

| Layer | Tests | % | Bar |
|-------|-------|---|-----|
| Unit | 142 | 62.0% | ████████████████ |
| Integration | 54 | 23.6% | ██████ |
| E2E | 28 | 12.2% | ███ |
| Smoke | 5 | 2.2% | █ |

**Total**: 229 | **Health**: ✅ Healthy | **Ratio (U:I:E:S)**: 28:11:6:1
```

---

## Verbose Output (`--verbose`)

When `--verbose` is passed, each classified file is listed with its reasoning. Output appears before the summary table/JSON:

```
[unit]        tests/unit/parser.test.ts         (path: test/unit/)
[integration] tests/integration/db.test.ts      (path: test/integration/)
[e2e]         tests/e2e/login.spec.ts            (config: playwright.config.ts)
[unit]        src/UserService.java               (annotation: @Tag("unit"))
[unclassified] tests/legacy/oldstuff.ts
```

Format per line: `[layer] <relative-path> (<strategy>: <signal>)`

---

## Config File Contract (`.pyratio.yml`)

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

**Validation rules**:
- `layers` must be a non-empty array of valid layer names (`unit`, `integration`, `e2e`, `smoke`)
- Each rule must have a `layer` (valid layer name) and a `glob` (non-empty string)
- Config rules override all built-in strategies (config rules are checked first)
- `ignore` patterns are merged with built-in defaults (not replaced)
- Unknown top-level keys produce a warning but do not cause an error (forward compatibility)
- Malformed YAML or invalid layer names cause exit code 1 with a descriptive error message

---

## Error Messages

| Scenario | Message | Exit Code |
|----------|---------|-----------|
| Directory not found | `Error: Directory not found: <path>` | 1 |
| Config file specified but not found | `Error: Config file not found: <path>` | 1 |
| Config file is malformed YAML | `Error: Invalid config file: <path>\n<parse error>` | 1 |
| Config file has invalid layer name | `Error: Unknown layer "<name>" in config rules. Valid layers: unit, integration, e2e, smoke` | 1 |
| Invalid `--format` value | `Error: Unknown format "<value>". Valid formats: table, json, markdown` | 1 |
| Invalid `--lang` value | `Error: Unknown language "<value>". Valid languages: typescript, javascript, java, csharp, go, rust` | 1 |
