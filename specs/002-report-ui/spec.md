# Feature Specification: Pyratio Report UI

**Feature Branch**: `002-report-ui`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "lets build ui interface that will show a report for our application"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Test Pyramid Report in Browser (Priority: P1)

A developer runs Pyratio with a UI flag and a browser window opens showing their test pyramid report. The report displays an interactive visual representation of the test pyramid with layer counts, percentages, and a health indicator — the same data currently shown in the CLI table, but rendered as a rich, visual dashboard.

**Why this priority**: The fundamental reason for this feature. Without rendering the report visually, there is no UI to build upon.

**Independent Test**: Run `npx pyratio --ui` in a repository with tests. A browser tab opens showing a pyramid visualization with correct layer counts matching the CLI output.

**Acceptance Scenarios**:

1. **Given** a repository with tests across multiple layers, **When** the user runs `npx pyratio --ui`, **Then** a local web page opens in the default browser displaying the test pyramid report with layer names, test counts, percentages, and visual bars.
2. **Given** a repository with unclassified test files, **When** the user views the UI report, **Then** unclassified files are listed in a visible section with their file paths.
3. **Given** a repository with no test files, **When** the user runs `npx pyratio --ui`, **Then** the UI shows an empty state with a message indicating no tests were found.

---

### User Story 2 - Visual Pyramid Health Indicator (Priority: P1)

A developer sees at a glance whether their test pyramid is healthy through a color-coded pyramid visualization. The pyramid shape itself communicates health: a proper pyramid shape for healthy distributions, and a visually distinct shape for inverted, flat, or incomplete distributions.

**Why this priority**: The pyramid visualization is the central visual metaphor of the tool and the primary reason a user would prefer the UI over the CLI.

**Independent Test**: Analyze a repository with a healthy test distribution (unit > integration > e2e). The UI displays a green-tinted pyramid shape. Repeat with an inverted distribution and confirm the visual changes to indicate unhealthy status.

**Acceptance Scenarios**:

1. **Given** a healthy test distribution, **When** the UI renders, **Then** the pyramid health is displayed as "Healthy" with a positive visual indicator (green color or equivalent).
2. **Given** an inverted test distribution (e2e > integration > unit), **When** the UI renders, **Then** the pyramid health is displayed as "Inverted" with a warning visual indicator.
3. **Given** an incomplete distribution (only one layer has tests), **When** the UI renders, **Then** the pyramid health is displayed as "Incomplete" with an informational visual indicator.

---

### User Story 3 - Drill Down Into Layer Details (Priority: P2)

A developer clicks on a specific layer in the pyramid (e.g., "Integration") to see the list of test files classified in that layer, including which classification strategy and signal placed each file there.

**Why this priority**: Adds interactivity that the CLI verbose mode provides, but in a more navigable format. Makes the UI more useful than just a pretty version of the CLI.

**Independent Test**: Click the "Unit" layer in the pyramid visualization. A panel expands showing each unit test file path, the classification strategy used, and the matching signal.

**Acceptance Scenarios**:

1. **Given** the UI is displaying a report with multiple layers, **When** the user clicks on a layer, **Then** a detail view shows all files in that layer with their file paths.
2. **Given** the detail view is open for a layer, **When** the user reviews file entries, **Then** each file shows the classification strategy (path, config, annotation) and signal that determined its classification.
3. **Given** the detail view is open, **When** the user clicks the layer again or a close control, **Then** the detail view collapses.

---

### User Story 4 - Export Report as HTML File (Priority: P3)

A developer wants to save a snapshot of the report for sharing with teammates or attaching to a pull request. They can export the current view as a standalone HTML file that renders without a server.

**Why this priority**: Enables sharing and archiving of reports without requiring teammates to install and run Pyratio themselves. Useful for code review discussions.

**Independent Test**: Run `npx pyratio --ui --export report.html`. Verify the generated HTML file opens in a browser and displays the full report without requiring a running server.

**Acceptance Scenarios**:

1. **Given** a repository with tests, **When** the user runs `npx pyratio --ui --export report.html`, **Then** a standalone HTML file is created at the specified path containing the full report.
2. **Given** an exported HTML file, **When** the user opens it in a browser offline, **Then** the report renders correctly with all visualizations and interactivity intact.

---

### Edge Cases

- What happens when the user's default browser cannot be detected? → The UI report is served on a local port and the URL is printed to the console for manual navigation.
- What happens when the specified port is already in use? → The server automatically selects the next available port and reports the actual URL.
- What happens when the report contains a very large number of test files (5,000+)? → The layer detail view paginates or virtualizes the file list to maintain responsiveness.
- What happens when the user closes the browser tab? → The local server remains running until the user terminates the CLI process (Ctrl+C).
- What happens when the export path already exists? → The file is overwritten with a warning printed to the console.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tool MUST support a `--ui` flag that generates and opens an interactive HTML report in the user's default browser.
- **FR-002**: The UI MUST display all data from the PyramidReport: layer names, test counts, percentages, total count, pyramid health status, ratio, detected language, and unclassified files.
- **FR-003**: The UI MUST render a pyramid (triangle) visualization where layers are stacked as horizontal bands within the triangle, with widths proportional to each layer's test count.
- **FR-004**: The UI MUST color-code the pyramid health status (healthy, inverted, flat, incomplete, unknown) with visually distinct indicators.
- **FR-005**: The UI MUST allow users to click on a layer to expand a detail view showing all files in that layer, including classification strategy and signal.
- **FR-006**: The UI MUST display unclassified files in a dedicated section with their file paths.
- **FR-007**: The tool MUST support a `--export <path>` flag that writes the report as a self-contained HTML file (all CSS and JS inlined, no external dependencies).
- **FR-008**: The UI MUST be served via a lightweight local server when using `--ui` without `--export`.
- **FR-009**: The UI MUST be responsive and readable on screen widths from 768px to 1920px.
- **FR-010**: The local server MUST print the serving URL to the console.
- **FR-011**: The UI MUST display the ratio string (U:I:E:S) prominently alongside the pyramid visualization.

### Key Entities

- **PyramidReport**: The data object produced by the existing analysis pipeline. Contains all layer stats, health, ratio, language, and unclassified files. The UI consumes this as its sole data source.
- **ReportView**: The rendered HTML page representing the visual report. Contains a pyramid visualization, summary statistics, and expandable layer detail panels.
- **LayerDetail**: An expandable section within the ReportView that lists individual test files for a given layer, including classification metadata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view a complete visual test pyramid report by running a single command (`npx pyratio --ui`) with no additional setup or configuration.
- **SC-002**: The UI report displays identical data to the CLI table output — layer counts, percentages, total, health, ratio, and unclassified files all match exactly.
- **SC-003**: Users can identify pyramid health status within 2 seconds of the page loading through color and shape cues.
- **SC-004**: Users can find which classification strategy placed a specific file by navigating to the layer detail in under 3 clicks.
- **SC-005**: Exported HTML files are fully self-contained and render correctly when opened offline in any modern browser.
- **SC-006**: The UI renders and becomes interactive within 3 seconds for repositories with up to 5,000 test files.
- **SC-007**: 90% of users prefer the UI report over CLI output for understanding their test pyramid distribution (validated through user feedback).

## Clarifications

### Session 2026-03-06

- Q: Should the primary visualization be a pyramid shape, a bar chart, or both? → A: Pyramid/triangle shape — layers stacked as horizontal bands within a triangle, widths proportional to test count.
- Q: What should `--export` without `--ui` do? → A: Write the HTML file silently (no browser, no server) — suitable for CI pipelines.

## Assumptions

- The UI consumes the existing `PyramidReport` data structure as-is, with no changes to the analysis pipeline.
- "Default browser" means the OS-registered default browser; detection uses standard platform APIs.
- The local server is intended for single-user, local-only use and does not need authentication or HTTPS.
- The `--ui` flag and `--export` flag can be used independently or together. `--export` alone writes the HTML file silently (no browser, no server) — suitable for CI pipelines. `--ui` alone opens the browser with a local server. When combined, the file is exported and the browser also opens.
- The self-contained HTML export bundles all CSS and JavaScript inline so it works without network access.
- The UI does not support real-time updating; it shows a snapshot of the analysis at the time the command was run.
