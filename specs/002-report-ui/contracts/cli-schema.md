# CLI Contract Update: pyratio (002-report-ui)

**Type**: Command-line interface contract extension
**Branch**: `002-report-ui`
**Date**: 2026-03-06
**Extends**: [001-pyratio-cli CLI contract](../../001-pyratio-cli/contracts/cli-schema.md)

---

## New Options

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--ui` | | boolean | `false` | Generate and open interactive HTML report in default browser |
| `--export <path>` | `-e` | string | — | Export report as self-contained HTML file to the given path |

---

## Updated Command Syntax

```
pyratio [directory] [options]
```

All existing options remain unchanged. New options are additive.

---

## Behavior Matrix

| Flags | Behavior |
|-------|----------|
| (no `--ui`, no `--export`) | Existing behavior: print table/JSON/markdown to stdout |
| `--ui` | Start local server, print URL, open browser. Block until Ctrl+C. No stdout output. |
| `--export report.html` | Write self-contained HTML file silently. Print file path to stderr. Exit immediately. |
| `--ui --export report.html` | Write HTML file, print file path to stderr. Then start server, open browser. Block until Ctrl+C. |
| `--ui --format json` | `--format` is ignored when `--ui` is active (UI always renders full visual report). No error. |
| `--export report.html --verbose` | `--verbose` is ignored when `--export` is active. No error. |

---

## New Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success — report served or exported |
| `1` | Error — invalid arguments, export path not writable, or analysis failure |

Existing exit codes remain unchanged.

---

## Output Contract: HTML Report

The HTML report is a single self-contained file with:

- **No external resources**: All CSS in `<style>` tags, all JS in `<script>` tags
- **Embedded data**: `PyramidReport` and `TestFile[]` serialized as JSON in a `<script id="report-data" type="application/json">` tag
- **Responsive**: Readable from 768px to 1920px viewport width
- **Interactive**: Clickable pyramid layers expand to show file-level details

### HTML Structure Contract

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pyratio — Test Pyramid Report</title>
  <style>/* All CSS inlined */</style>
</head>
<body>
  <script id="report-data" type="application/json">
    {"report": { /* PyramidReport */ }, "files": [ /* TestFile[] */ ]}
  </script>
  <script>/* All JS inlined */</script>
</body>
</html>
```

### Embedded Data Schema

The `report-data` script tag contains a JSON object matching:

```typescript
interface UIReportData {
  report: PyramidReport;  // Identical to --format json output
  files: TestFile[];      // Full file list with classification details
}
```

---

## Console Output

### `--ui` Mode

```
Pyratio report server running at http://localhost:54321
Press Ctrl+C to stop
```

### `--export` Mode

```
Report exported to: /absolute/path/to/report.html
```

### `--ui --export` Mode

```
Report exported to: /absolute/path/to/report.html
Pyratio report server running at http://localhost:54321
Press Ctrl+C to stop
```

All console messages are written to stderr (stdout is reserved for CLI format output in non-UI mode).

---

## Error Messages

| Scenario | Message | Exit Code |
|----------|---------|-----------|
| Export path is not writable | `Error: Cannot write to: <path>` | 1 |
| Browser cannot be opened | `Warning: Could not open browser. Navigate to <url>` (non-fatal, server continues) | 0 |

---

## Interaction with Existing Flags

| Existing Flag | Behavior with `--ui` | Behavior with `--export` |
|---------------|---------------------|--------------------------|
| `--format` | Ignored (UI renders full report) | Ignored (export is always HTML) |
| `--verbose` | Verbose data is included in drill-down (always available in UI) | Ignored |
| `--config` | Config affects analysis; UI renders the result | Same |
| `--lang` | Language override affects analysis; UI renders the result | Same |
