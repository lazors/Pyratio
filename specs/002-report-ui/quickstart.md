# Quickstart: Pyratio Report UI Development

**Branch**: `002-report-ui`
**Date**: 2026-03-06

---

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- Git
- Existing Pyratio CLI working (branch `001-pyratio-cli` merged to main)

---

## Setup

```bash
# Switch to feature branch
git checkout 002-report-ui

# Install new dependency
npm install open

# Verify existing tests still pass
npm test
```

---

## New Files to Create

```
src/ui/
├── html-report.ts    # Generates HTML string from PyramidReport + TestFile[]
├── server.ts         # Local HTTP server + browser launcher
└── template.ts       # HTML template with inline CSS/JS

tests/unit/ui/
├── html-report.test.ts
├── server.test.ts
└── template.test.ts

tests/integration/
└── ui-report.test.ts
```

---

## Existing Files to Modify

```
src/index.ts          # Add --ui and --export flags to commander setup
```

No other existing files are modified.

---

## Development Workflow

```bash
# Run analysis with UI (opens browser)
tsx src/index.ts --ui

# Run analysis with UI against a specific directory
tsx src/index.ts ./path/to/repo --ui

# Export report to HTML file
tsx src/index.ts --export report.html

# Both: export and open browser
tsx src/index.ts --ui --export report.html

# Run tests
npm test

# Watch mode
npm run test:watch

# Type check
npm run typecheck

# Build and verify
npm run build
node dist/index.js --ui
```

---

## Key Implementation Notes

### HTML Template Structure

The template in `src/ui/template.ts` exports a function that returns a complete HTML string. The report data is embedded as JSON in a non-executing script tag:

```html
<script id="report-data" type="application/json">
  {"report": {...}, "files": [...]}
</script>
```

Browser-side JavaScript reads this with `JSON.parse(document.getElementById('report-data').textContent)`.

### Pyramid CSS Pattern

Each layer is a `<div>` with `clip-path: polygon()` creating a trapezoid shape. Layers stack vertically from smoke (top/narrowest) to unit (bottom/widest). Width percentages derive from test count proportions.

### Server Lifecycle

- Server starts on port 0 (OS picks available port)
- Bound to `localhost` only (no external access)
- URL printed to console
- `open` package launches the default browser
- Server stays running until Ctrl+C (SIGINT triggers graceful shutdown)

### Export Behavior

- `--export <path>`: writes file silently, exits
- `--ui`: starts server, opens browser, blocks until Ctrl+C
- `--ui --export <path>`: writes file, then starts server and opens browser

### Testing the HTML Output

To verify the generated HTML in tests, check:
1. Valid HTML structure (contains `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`)
2. Embedded JSON is valid and matches input data
3. No external resource references (no `<link href="http...">`, no `<script src="http...">`)
4. Contains expected CSS classes for pyramid layers
5. Contains health color CSS for all 5 health states
