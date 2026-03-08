# Research: Pyratio Report UI

**Branch**: `002-report-ui`
**Date**: 2026-03-06

---

## R1: HTML Generation Approach

**Decision**: Template literals with embedded JSON data

**Rationale**: The UI is a single static page that displays a snapshot of analysis results. A template literal approach — where the `PyramidReport` and `TestFile[]` are serialized to JSON and injected into a `<script>` tag — is the simplest path. No templating engine is needed. The existing codebase already uses template literals for output formatting in `reporter.ts`.

**Alternatives considered**:
- **Handlebars/EJS templating engine**: Adds a runtime dependency and compilation step for what is essentially a single template. Overkill.
- **React/Preact with SSR**: Introduces a build pipeline, JSX compilation, and bundling. Far too heavy for a single report page.
- **Server-side DOM (jsdom)**: Expensive in both dependency size and runtime performance for generating static content.

---

## R2: Pyramid Visualization Technique

**Decision**: CSS `clip-path: polygon()` for trapezoid-shaped layers

**Rationale**: Each pyramid layer is rendered as a `<div>` with a trapezoidal `clip-path`. Layers are stacked vertically (smoke at top/narrowest, unit at bottom/widest). The width of each trapezoid is proportional to the layer's test count. This is pure CSS — no SVG, no canvas, no external library. `clip-path` has full support in all modern browsers.

**Alternatives considered**:
- **SVG paths**: More precise control but significantly more verbose to generate. Harder to make interactive (click handlers, hover states) without a library.
- **CSS border trick**: Legacy approach for triangles. Cannot easily create trapezoid bands with variable widths. Fixed-size only.
- **HTML5 Canvas**: Requires JavaScript rendering, not inspectable in DOM, harder to make accessible and interactive.
- **D3.js or Chart.js**: Massive dependencies for a single static chart. Violates the minimal-dependency constraint.

---

## R3: Browser Opening

**Decision**: `open` npm package (v10+)

**Rationale**: `open` is the de-facto standard for cross-platform browser launching in Node.js. Maintained by Sindre Sorhus. Used by Vite, webpack-dev-server, and many other tools. Small package (~8KB). Works on Windows, macOS, and Linux without platform-specific code.

**Alternatives considered**:
- **Manual `child_process.exec`**: Platform-specific commands (`start` on Windows, `open` on macOS, `xdg-open` on Linux). Fragile and reinvents what `open` already does.
- **`opn` (deprecated)**: Predecessor to `open`, no longer maintained.

---

## R4: Local Server Strategy

**Decision**: Node.js built-in `http` module with ephemeral port (port 0)

**Rationale**: The server is trivial — serve a single HTML string on all routes. Node's `http` module handles this with zero dependencies. Using port 0 delegates port selection to the OS, eliminating port conflict issues. The assigned port is retrieved via `server.address().port` and printed to the console.

**Alternatives considered**:
- **Express/Koa/Fastify**: Full web frameworks. Massive overkill for serving a single HTML page.
- **Fixed port (e.g., 3000)**: Risks conflicts with other dev servers. Port 0 eliminates this entirely.

---

## R5: Self-Contained HTML Export

**Decision**: All CSS in `<style>` tags, all JS in `<script>` tags, data in an inline JSON script block. Written with `fs.writeFileSync()`.

**Rationale**: The spec requires the export to work offline with no external dependencies. Inlining everything into a single `.html` file is the only approach that satisfies this. No base64 images needed — the UI uses Unicode symbols and CSS shapes for all visuals.

**Alternatives considered**:
- **Zip archive with separate files**: Adds complexity for the user (extract before viewing). Worse UX.
- **PDF export**: Requires a headless browser or PDF library. Heavy dependency for a secondary feature.

---

## R6: UI Data Contract

**Decision**: Embed both `PyramidReport` and `TestFile[]` as separate JSON objects in the HTML template.

**Rationale**: The `PyramidReport` provides summary statistics (layer counts, percentages, health, ratio). The `TestFile[]` array provides per-file details needed for the drill-down feature (file path, layer, strategy, signal). Embedding both avoids modifying the existing `PyramidReport` structure. The browser-side JS joins them for rendering layer detail panels.

**Alternatives considered**:
- **Extend PyramidReport to include TestFile details**: Would change the existing data model and potentially break JSON output consumers. Unnecessary coupling.
- **Single merged object**: Creates a non-standard data shape that doesn't match either existing type. Confusing.
