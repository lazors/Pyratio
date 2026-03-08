# Data Model: Pyratio Report UI

**Branch**: `002-report-ui`
**Date**: 2026-03-06

---

## Existing Entities (unchanged)

The UI feature consumes existing entities from `001-pyratio-cli` without modification. See [001 data model](../001-pyratio-cli/data-model.md) for full definitions.

| Entity | Role in UI |
|--------|-----------|
| `PyramidReport` | Primary data source: layer stats, health, ratio, total, unclassified |
| `TestFile` | Detail data: per-file path, layer, strategy, signal (used for drill-down) |
| `Layer` | Enum keys for pyramid bands (`unit`, `integration`, `e2e`, `smoke`) |
| `LayerStats` | Per-layer count, percentage, file list |
| `PyramidHealth` | Drives color-coding of the pyramid visualization |

---

## New Entities

### UIReportData

The combined data payload embedded in the HTML template. This is not a runtime TypeScript type — it exists as a JSON object inside the generated HTML `<script>` tag.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `report` | `PyramidReport` | `classify()` output | Summary statistics for the pyramid |
| `files` | `TestFile[]` | Scanner + classifier output | Full file list with classification details for drill-down |

**Serialization**: `JSON.stringify()` with 2-space indentation, embedded in `<script id="report-data" type="application/json">` tag.

---

### HealthColorMap

Maps `PyramidHealth` values to visual indicators used in the HTML template.

| Health Value | Color | Label | Icon |
|-------------|-------|-------|------|
| `healthy` | `#16a34a` (green) | Healthy | Unicode check mark |
| `inverted` | `#d97706` (amber) | Inverted | Unicode warning |
| `flat` | `#d97706` (amber) | Flat | Unicode warning |
| `incomplete` | `#6b7280` (gray) | Incomplete | Unicode info |
| `unknown` | `#6b7280` (gray) | Unknown | Unicode question mark |

---

### LayerColorMap

Assigns distinct colors to each pyramid layer for the visualization.

| Layer | Color | Purpose |
|-------|-------|---------|
| `unit` | `#3b82f6` (blue) | Widest band (bottom of pyramid) |
| `integration` | `#8b5cf6` (violet) | Second band |
| `e2e` | `#f59e0b` (amber) | Third band |
| `smoke` | `#ef4444` (red) | Narrowest band (top of pyramid) |

---

## Data Flow

```
CLI invocation (--ui or --export)
  │
  ├── scanTestFiles() → TestFile[] (raw)
  ├── classify()      → PyramidReport + mutated TestFile[] (with layer/strategy/signal)
  │
  └── generateHtmlReport(report, files)
        │
        ├── Serializes { report, files } as JSON
        ├── Injects into HTML template string
        └── Returns complete HTML string
              │
              ├── [--ui]     → serveReport(html) → HTTP server + open browser
              └── [--export] → fs.writeFileSync(path, html)
```

---

## Browser-Side Data Access

The embedded JSON is read by inline JavaScript in the HTML:

```
<script id="report-data" type="application/json">
  { "report": { ... }, "files": [ ... ] }
</script>

<script>
  const data = JSON.parse(document.getElementById('report-data').textContent);
  // data.report → PyramidReport
  // data.files  → TestFile[]
</script>
```

This approach avoids `eval()` or assigning to `window` globals. The `type="application/json"` script tag is not executed by the browser — it's a safe data container.

---

## Validation Rules

- `UIReportData.report` must satisfy all existing `PyramidReport` validation rules (see 001 data model)
- `UIReportData.files` must contain all files from `report.layers[*].files` and `report.unclassified` combined
- The total of `files.length` must equal `report.total`
- Each `TestFile` in `files` must have a non-empty `relativePath`
- Layer detail drill-down filters `files` by `file.layer === selectedLayer`
