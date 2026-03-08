# Implementation Plan: Pyratio Report UI

**Branch**: `002-report-ui` | **Date**: 2026-03-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-report-ui/spec.md`

---

## Summary

Add an interactive browser-based report to Pyratio. A new `--ui` flag opens a locally served HTML page with a pyramid (triangle) visualization of test layer distribution, color-coded health status, and clickable layers for file-level drill-down. A `--export <path>` flag writes the same report as a self-contained HTML file (all CSS/JS inlined) for offline sharing and CI integration. The UI consumes the existing `PyramidReport` data with no changes to the analysis pipeline.

---

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js ≥ 18
**Primary Dependencies**:
- Existing: `commander@14`, `cli-table3@0.6.x`, `tinyglobby@0.2.x`, `yaml@2.x`, `picomatch@4`
- New: `open@10` — cross-platform default browser launcher

**Storage**: N/A (generates HTML in memory, optionally writes to file)
**Testing**: `vitest` (existing)
**Target Platform**: Node.js ≥ 18, cross-platform (Linux, macOS, Windows)
**Project Type**: CLI tool (npm package) — adding HTML report output
**Performance Goals**: UI renders and becomes interactive within 3 seconds for up to 5,000 test files
**Constraints**: Self-contained HTML (no external CDN, all CSS/JS inlined); single new dependency (`open`)
**Scale/Scope**: Single report page; no routing, no state persistence, no real-time updates

---

## Constitution Check

*No `.specify/memory/constitution.md` found — no gates to evaluate.*

---

## Project Structure

### Documentation (this feature)

```text
specs/002-report-ui/
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions
├── data-model.md        # Phase 1: UI data model
├── quickstart.md        # Phase 1: dev setup guide
├── contracts/
│   └── cli-schema.md    # Phase 1: updated CLI contract (new flags)
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (repository root)

```text
src/
├── index.ts                    # CLI entry point — add --ui and --export flags
├── scanner.ts                  # (unchanged)
├── classifier.ts               # (unchanged)
├── reporter.ts                 # (unchanged)
├── config.ts                   # (unchanged)
├── types.ts                    # (unchanged)
├── strategies/                 # (unchanged)
├── languages/                  # (unchanged)
└── ui/
    ├── html-report.ts          # Generates complete HTML string from PyramidReport + TestFile[]
    ├── server.ts               # Local HTTP server (Node.js http module) + browser launcher (open)
    └── template.ts             # HTML template with inline CSS/JS, pyramid visualization

tests/
├── unit/
│   ├── ui/
│   │   ├── html-report.test.ts # Test HTML generation, data embedding, self-contained output
│   │   ├── server.test.ts      # Test server starts, serves HTML, shuts down
│   │   └── template.test.ts    # Test template produces valid HTML, data binding
│   └── ...                     # (existing tests unchanged)
├── integration/
│   └── ui-report.test.ts       # End-to-end: run analysis → generate HTML → validate content
└── fixtures/                   # (existing fixtures reused)
```

**Structure Decision**: Extends the existing single-project layout. New source files are placed under `src/ui/` to keep UI concerns separate from the analysis pipeline. No changes to existing files except `src/index.ts` (add CLI flags and wire up the new module).

---

## Key Design Decisions

### D1: Template Literals with Embedded JSON

The HTML report is generated as a single string using TypeScript template literals. The `PyramidReport` object and `TestFile[]` array are serialized as JSON and embedded in a `<script>` tag within the HTML. The browser-side JavaScript reads this data and renders the UI. No templating engine required.

**Rationale**: Zero additional dependencies. The existing codebase already uses template literals for output formatting (`reporter.ts`). A templating engine adds complexity for a single-page output.

### D2: CSS clip-path Pyramid Visualization

The pyramid visualization uses CSS `clip-path: polygon()` to create trapezoid layers stacked vertically. Each layer's width is proportional to its test count percentage. Health status is communicated through color (green for healthy, amber for inverted/flat, gray for incomplete/unknown).

**Rationale**: Pure CSS, no SVG or canvas dependency. Works offline, responsive, and supported in all modern browsers. Simpler to maintain than SVG path calculations.

### D3: Node.js Built-in HTTP Server with Ephemeral Port

The `--ui` flag starts a local HTTP server using Node.js `http` module on port 0 (OS auto-assigns available port). The actual URL is printed to console. The `open` package launches the default browser.

**Rationale**: Port 0 avoids conflicts. Built-in `http` module adds no dependencies. The `open` package is the standard cross-platform solution used by Vite, webpack-dev-server, etc.

### D4: Self-Contained Export

The `--export` flag writes the same HTML string to a file. All CSS is in `<style>` tags, all JS in `<script>` tags, report data in a JSON script block. No external resources. The file works offline in any modern browser.

### D5: Extended PyramidReport for UI

The UI needs per-file classification details (strategy, signal) for drill-down. The existing `PyramidReport` contains `files: string[]` per layer (paths only). The UI template receives both the `PyramidReport` and the full `TestFile[]` array so it can render file-level details without changing the existing report structure.

### D6: Minimal Changes to Existing Code

Only `src/index.ts` is modified (add two CLI flags and wire them to the new `src/ui/` module). All existing functionality, output formats, and tests remain untouched.

---

## Implementation Phases

### Phase A — HTML Template & Report Generator

1. Create `src/ui/template.ts` — HTML template with inline CSS (pyramid visualization, health colors, responsive layout, layer detail panels) and inline JS (read embedded JSON, render pyramid, handle click drill-down)
2. Create `src/ui/html-report.ts` — function that takes `PyramidReport` + `TestFile[]` and returns a complete HTML string by injecting JSON into the template

### Phase B — Server & Browser Launcher

3. Create `src/ui/server.ts` — start HTTP server on port 0, serve HTML on all routes, print URL, open browser via `open` package, handle graceful shutdown on SIGINT
4. Install `open` as a dependency

### Phase C — CLI Integration & Export

5. Update `src/index.ts` — add `--ui` flag and `--export <path>` option to commander setup
6. Wire `--ui` to serve the report via server.ts
7. Wire `--export` to write the HTML file silently (no browser, no server)
8. Handle combined `--ui --export` (export file + open browser)

### Phase D — Tests

9. Unit tests for `html-report.ts` (valid HTML output, embedded data correctness, self-contained)
10. Unit tests for `server.ts` (server lifecycle, port assignment, shutdown)
11. Unit tests for `template.ts` (HTML structure, data binding)
12. Integration test: run full analysis on js-repo fixture → generate HTML → validate report content matches CLI JSON output
13. Verify `npm run build` bundles the new module correctly

---

## Artifact Index

| Artifact | Path | Status |
|----------|------|--------|
| Feature spec | `specs/002-report-ui/spec.md` | Complete |
| Research | `specs/002-report-ui/research.md` | Complete |
| Data model | `specs/002-report-ui/data-model.md` | Complete |
| CLI contract | `specs/002-report-ui/contracts/cli-schema.md` | Complete |
| Quickstart | `specs/002-report-ui/quickstart.md` | Complete |
| Tasks | `specs/002-report-ui/tasks.md` | Pending (`/speckit.tasks`) |
