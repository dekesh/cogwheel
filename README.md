# Cogwheel Designer

Cogwheel Designer is a TypeScript web app for designing 3D-printable spur gears and exporting dimensionally correct SVG output.
Note: Strictly vibecoded

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
