# Cogwheel Designer

Cogwheel Designer is a TypeScript web app for designing 3D-printable spur gears and exporting dimensionally correct SVG output.

## Current status
- Initial professional scaffold is in place.
- The current UI supports adding gears, removing gears, selecting gears, dragging gears on a canvas, and adding matching gears that snap into valid mesh distance.
- The inspector now supports live editing of core gear parameters with immediate geometry recomputation.
- Derived spur-gear dimensions, sampled involute-style SVG outlines, meshing helpers, drag/snap state, snap feedback, and advisory validation warnings are implemented and tested.
- Export buttons now generate selected-gear and layout SVG documents, with optional metadata, optional axle-hole inclusion, and either contour or filled-inside geometry output.
- Gears now expose an inner cutout diameter parameter to control the empty center between the shaft area and the toothed rim.
- Autosave is still ahead.

## Stack
- React
- Vite
- TypeScript with strict mode
- Mantine
- Vitest
- Playwright
- ESLint
- Prettier

## Scripts
- `pnpm dev`: start the development server
- `pnpm build`: typecheck and build
- `pnpm typecheck`: run TypeScript checks
- `pnpm lint`: run ESLint
- `pnpm format`: format the codebase
- `pnpm test`: run unit tests
- `pnpm test:e2e`: run Playwright browser tests

## Project structure
- `src/components`: UI building blocks and layout
- `src/domain`: gear and project domain logic
- `src/test`: shared test setup
- `tests/e2e`: Playwright browser coverage
- `docs`: architecture and math notes
- `.github/workflows`: CI pipelines

## Working agreement
- Keep `HANDOFF.md` updated as meaningful progress is made.
- Keep tests aligned with behavioral changes.
- Keep documentation aligned with architectural and product changes.

## Getting started
1. Enable Corepack if needed with `corepack enable`.
2. Install dependencies with `pnpm install`.
3. Run `pnpm dev`.
4. Run `pnpm test` and `pnpm test:e2e`.

## References
- Requirements and decisions: `PROJECT_SPEC.md`
- Continuity log: `HANDOFF.md`
