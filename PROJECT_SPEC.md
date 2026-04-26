# Cogwheel Designer

## Purpose

Build a web app for designing cogwheels for 3D printing.

## Initial requirements from user

- Users can add different kinds of cogwheels to a canvas.
- Cogwheels on the canvas should be draggable.
- Users can modify cogwheel parameters.
- Users can create cogwheels that match so they can rotate one another.
- The output should be an SVG image.

## Language and stack constraints

- Frontend should be written in TypeScript.
- If a backend is needed, use Python with FastAPI.
- The project should use a professional template and setup, including linting and GitHub Actions.
- Implementation should be done professionally, with explicit confirmation of key decisions.
- Maintain a persistent handoff/progress file so another contributor can continue the work without re-discovery.
- Keep tests and documentation updated alongside all meaningful code changes.

## Product decisions confirmed

- V1 should support spur gears first.
- The architecture should make it easy to add more gear types later.
- "Match" means:
  - compute compatible gears from gear parameters
  - snap gears into valid meshing positions on the canvas
  - preview rotation direction and ratio
  - prevent invalid pairings
- Geometry should be suitable for 3D printing, including print-relevant constraints.
- Editable gear properties in scope:
  - number of teeth
  - module or diametral pitch
  - pressure angle
  - thickness
  - bore diameter
  - keyway
  - backlash
  - material/profile presets
  - label
  - color
- SVG export must support:
  - exporting the full layout
  - exporting separate files per gear
  - user choice between those export modes
  - dimensionally correct sizes
- Canvas interactions in scope:
  - drag
  - zoom and pan
  - manual rotation
  - alignment guides and snapping
  - grouping
  - delete and duplicate
  - layer order
  - dimension annotations
- Motion scope for V1:
  - no full simulation
  - rotation preview only
- Start frontend-only.
- Design should keep future import/export of project files in mind.
- Preferred frontend stack: React + Vite + TypeScript.
- Engineering expectations:
  - strict TypeScript
  - tests from day one
  - CI from day one
  - strong documentation
  - files should stay reasonably small
  - functions should stay reasonably simple
  - no mobile support requirement
  - prefer using a component library
- Primary measurement system should be metric.
- Internal calculations should use millimeters.
- 3D-printing defaults should exist, but they must not be hard-coded:
  - users should be able to customize them
  - users should be able to disable print-oriented constraints/warnings
- V1 should generate true involute spur gear tooth profiles.
- Invalid inputs and pairings should be allowed, but the UI should warn clearly and help users correct them.
- Dimension annotations should be available both on the canvas and in SVG export.
- Separate SVG export should produce tightly fitted files per gear.
- Future project import/export should use human-readable, versioned JSON.
- The chosen component library should be well documented and easy to use.
- Creating a matching gear at a valid meshing position is acceptable.
- Rotation preview should propagate through connected gears according to gear ratios.
- Documentation scope should include:
  - README
  - architecture documentation
  - gear/math notes
  - ongoing implementation and handoff notes
- The main sizing parameter in V1 should be module.
- The UI should still aim to be easy to use, with gear jargon minimized where possible.
- Printability warnings and defaults should be driven by one global project-level printer/material profile.
- Accepted initial print defaults:
  - material: PLA
  - nozzle diameter: 0.4 mm
  - layer height: 0.2 mm
  - conservative tolerance/clearance defaults
  - mild backlash defaults
- SVG metadata should be supported, but export should make it optional.
- One project may contain multiple independent gear trains.
- Grouping in V1 should be based on mechanical relationships.
- Meshed gears should keep their center distance locked until explicitly disconnected.
- Shared-center or compound gears are out of scope for V1.
- Bore and keyway editing should support presets plus manual input.
- The component library choice can be made by implementation.
- English-only UI is acceptable for V1.
- The UI should use a single simple workflow with collapsible advanced settings instead of separate beginner/advanced modes.
- Rotation preview should support:
  - play/pause
  - speed control
  - manual turning of a selected gear
- The app should auto-save the current project in browser storage in V1.
- Future export support to keep in mind:
  - versioned JSON project export/import
  - possible DXF support later

## Open questions

- None blocking for v1 requirements gathering.

## Notes

- This file is intended to be the living source of truth during requirements gathering.

## Implementation research

### Recommended scaffold

- Base the project on the official Mantine Vite template rather than plain `create-vite`.
- Rationale:
  - the product is UI-heavy
  - Mantine is well documented and easy to work with
  - the official Mantine Vite template already includes TypeScript, Vitest, Prettier, Storybook, and ESLint
  - this reduces setup risk and gets tests/tooling in place from day one

### Recommended stack

- Build tool: Vite
- Frontend framework: React
- Language: TypeScript with strict mode
- Component library: Mantine
- Unit/component test runner: Vitest + React Testing Library
- Browser/end-to-end testing: Playwright
- Linting: ESLint with flat config
- Formatting: Prettier
- Documentation:
  - README
  - architecture notes
  - gear math notes
  - implementation handoff log
- CI:
  - GitHub Actions job for install, lint, typecheck, unit tests, build
  - GitHub Actions job for Playwright browser tests

### Why not start from plain Vite

- Official Vite React TypeScript templates are a good base, but they do not provide the fuller UI-focused setup we want by default.
- The Mantine template is a better fit for the stated requirement of a professional setup with a documented component library and testing from the start.

### Testing strategy

- Use Vitest for fast logic and React component tests:
  - gear math
  - validation
  - reducers/state transitions
  - form behavior
- Use Playwright for browser verification:
  - canvas interactions
  - drag behavior
  - matching workflow
  - rotation preview controls
  - SVG export flow

### Current implementation recommendation

- Start from Mantine's official full Vite template, then customize it to the app architecture rather than assembling all tooling manually from a bare Vite starter.

### Sources consulted

- Vite Getting Started: https://vite.dev/guide/
- Mantine Vite guide: https://mantine.dev/guides/vite/
- Mantine Vite template: https://github.com/mantinedev/vite-template
- Mantine Vitest guide: https://mantine.dev/guides/vitest/
- Playwright component/browser testing docs: https://playwright.dev/docs/test-components
- Playwright CI docs: https://playwright.dev/python/docs/ci-intro
