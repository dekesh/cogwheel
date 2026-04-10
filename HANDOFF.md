# Handoff Log

## Purpose
This file tracks what has been decided, what has been done, and what remains so another contributor can continue without re-discovery.

## Working rules
- Update this file whenever meaningful progress is made.
- Keep tests aligned with behavior and architecture changes.
- Keep docs aligned with code and product decisions.
- Record open risks, assumptions, and next steps explicitly.

## Current status
- Requirements gathering is complete enough to begin implementation.
- A manual source scaffold has been created.
- Baseline code, tests, docs, and CI config files exist.
- Local install, lint, typecheck, unit tests, build, and Playwright smoke tests have all been validated successfully.

## Completed work
- Captured product requirements and implementation constraints in `PROJECT_SPEC.md`.
- Researched and recommended the initial frontend stack.
- Created the initial source scaffold for the app:
  - package metadata and scripts
  - TypeScript, Vite, ESLint, and Prettier config
  - Mantine-based application shell
  - baseline domain modules for gears and project state
  - baseline Vitest and Playwright tests
  - GitHub Actions workflow
  - README and docs skeleton
- Chosen direction:
  - React + Vite + TypeScript
  - Mantine component library
  - Vitest + React Testing Library
  - Playwright for browser testing
  - ESLint + Prettier
  - GitHub Actions CI
- The repository is now configured as `pnpm`-first for local development and CI.
- Initial lint configuration was adjusted so ESLint ignores GitHub Actions YAML files instead of trying to parse them as JavaScript.
- Validation fixes applied after first local runs:
  - Vitest now excludes Playwright end-to-end test files
  - Vite config now uses `vitest/config` for typed `test` config support
  - test setup now provides a `window.matchMedia` stub for Mantine under jsdom
  - Playwright web server command now invokes Vite directly so host/port arguments are applied correctly
  - Playwright smoke test now scopes gear-card assertions to the main region to avoid strict-mode locator ambiguity
  - Added an inline favicon to remove the initial browser-console 404 for `/favicon.ico`
- Implemented the first real gear domain slice:
  - derived spur gear geometry
  - compatibility and center-distance helpers
  - advisory validation warnings for risky print geometry
  - UI placeholders now surface some derived dimensions
  - unit tests expanded to cover the new math
- Implemented sampled SVG outline generation for spur gears:
  - sampled involute flanks
  - sampled tip and root arcs
  - bore-hole subpath with even-odd fill support
  - canvas cards now render actual gear previews instead of text-only placeholders
  - unit and browser tests cover the new preview path integration
  - corrected a tooth-shape bug where flank placement made teeth appear to widen outward
  - bore rendering now uses a separate filled hole path in the preview instead of relying on compound-path fill behavior
- Implemented the first interactive canvas slice:
  - reducer-backed project editor state
  - add gear
  - remove gear
  - add matching gear
  - gear selection
  - drag on canvas
  - snap to compatible gear center distance
  - tests for reducer/layout behavior and browser-level add/drag flow
- Extended the interactive slice with live editing and better feedback:
  - inspector fields for label, color, teeth, module, pressure angle, thickness, bore, and backlash
  - geometry recomputation on every edit
  - locked relation repositioning when edited geometry changes center distance
  - drag-time snap indicator overlay
  - tests for reducer updates and browser editing flow
- Implemented SVG document export:
  - selected-gear SVG generation
  - full-layout SVG generation
  - optional metadata inclusion
  - optional axle-hole inclusion/exclusion
  - sidebar export actions
  - tests for document generation and download wiring
- Extended SVG export output modes:
  - contour mode preserves the current stroked-path export behavior
  - inside mode exports filled geometry with even-odd cutouts for programs that expect solid interiors
  - sidebar now lets the user choose the export geometry mode before exporting
- Corrected a visual snap/readability issue:
  - canvas gears now render at size proportional to their real millimeter diameter instead of using one fixed preview size
- Clarified center/shaft handling:
  - export now uses true SVG cutouts rather than white-filled fake holes
  - gears now expose `innerCutoutDiameterMm` for controlling the empty center
  - inspector copy now explains that thickness affects 3D print depth, not the 2D SVG profile
- Corrected SVG contour export for print workflows:
  - inner cutout and axle hole now export as separate concentric contours instead of one merged circle
  - hiding the axle hole no longer removes the inner cutout contour
  - optional shaft-piece contours now export centered on the gear instead of offset below it

## Key product decisions
- V1 supports spur gears first.
- Architecture must support adding more gear types later.
- Matching behavior includes compatibility checks, snapping, ratio-aware rotation preview, and invalid-pairing prevention/warnings.
- Geometry must use true involute spur gear profiles and account for 3D printing constraints.
- Frontend-only for V1.
- Metric-first, millimeters internally, module as the primary sizing parameter.
- SVG export must support:
  - full layout export
  - separate tightly fitted per-gear export
  - optional metadata
- Browser storage auto-save is required in V1.
- Future JSON import/export should be designed in from the start.

## Key engineering decisions
- Use a professional scaffold with strict TypeScript.
- Keep files reasonably small.
- Keep functions reasonably simple.
- Maintain tests from day one.
- Maintain docs from day one.
- English-only UI for V1.

## Recommended scaffold
- Start from Mantine's official Vite template and adapt it to the app architecture.

## Immediate next steps
1. Add autosave and future JSON import/export scaffolding around the reducer-backed state.
2. Extend canvas interaction with zoom/pan, disconnect actions, and rotation preview.
3. Add per-gear export from the inspector and optional multi-file export flow.
4. Introduce project-level print-profile-aware warning thresholds instead of only geometry-local heuristics.
5. Consider undo/redo for add/remove/edit operations.

## Open risks / design points to watch
- Gear geometry and meshing rules should live in domain modules, not UI components.
- Printability warnings must be configurable and not hard-coded.
- Canvas architecture should avoid locking the app into spur-only assumptions.
- Export logic should remain separate from render logic where possible.
- The current validation rules are still intentionally advisory and simplified; they are not yet tied to the project print profile or full involute geometry.
- The current SVG outline uses sampled involute-related geometry and standard tooth proportions, but it still needs export wrappers, layout composition, and deeper print-profile coupling.
- Dragging and snapping currently update positions and relations, but there is not yet an explicit disconnect action or rotation propagation between related gears.
- Removing gears works, but there is not yet a confirmation step or undo flow.
- Live editing updates direct locked relations, but complex multi-gear propagation and cycle handling are not implemented yet.
- Layout export works, but there is not yet project persistence or a user-visible export history/state indicator.
- The current center-cutout model is a simple concentric circular cutout. There are no spokes, keyed shafts, or custom hub geometries yet.

## Sources used for stack research
- Vite guide: https://vite.dev/guide/
- Mantine Vite guide: https://mantine.dev/guides/vite/
- Mantine Vite template: https://github.com/mantinedev/vite-template
- Mantine Vitest guide: https://mantine.dev/guides/vitest/
- Playwright docs: https://playwright.dev/docs/intro
- Playwright component testing: https://playwright.dev/docs/test-components
- Playwright CI docs: https://playwright.dev/docs/ci
