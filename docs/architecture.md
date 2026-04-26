# Architecture Notes

## Intent

The application should separate domain logic from UI and rendering so future gear types and export formats do not force large rewrites.

## Current layers

- `src/domain/gears`: gear-specific types, calculations, and factories
- `src/domain/project`: project-wide models, printer defaults, and relation state
- `src/components`: presentation and interaction surfaces

## Current domain responsibilities

- `src/domain/gears/calculations.ts` now owns:
  - derived standard spur-gear dimensions
  - simple meshing compatibility checks
  - center-distance math
  - advisory validation warnings
- `src/domain/gears/factories.ts` builds gear entities with derived geometry attached at creation time.
- `src/domain/gears/svg.ts` now owns:
  - spur gear outline point sampling
  - involute flank sampling
  - tooth-tip and root-arc sampling
  - closed SVG path generation for individual gears
- `src/domain/export/svgDocument.ts` now owns:
  - single-gear SVG document generation
  - full-layout SVG document generation
  - optional metadata embedding
  - export-time axle-hole inclusion/exclusion
- `src/domain/project/state.ts` now owns:
  - editor reducer state
  - adding free gears
  - adding matching gears
  - removing gears and cleaning dependent relations
  - live gear parameter updates with geometry recomputation
  - locked-relation repositioning after geometry edits
  - selection and movement updates
- `src/domain/project/layout.ts` now owns:
  - snap-to-mesh calculation
  - center-distance-preserving placement near compatible gears

## Planned layers

- `src/features/canvas`: canvas state, drag behavior, snapping, zoom, and alignment
- `src/features/gear-editor`: parameter forms, warnings, and presets
- `src/features/matching`: compatible-gear creation and meshing rules
- `src/features/export`: SVG export, metadata, and later JSON import/export
- `src/features/autosave`: browser persistence and project hydration

## Design constraints

- Gear geometry must not live inside React components.
- Matching rules must not assume spur gears are the only future gear type.
- Export logic should remain testable without a browser.
- Printability heuristics must be configurable through project-level settings.
- Canvas interactions should stay thin and dispatch into domain-level state and layout helpers.
- Parameter editing should continue to flow through reducer actions so geometry and relations remain coherent.
- Canvas rendering should preserve real geometric scale so snap behavior reads correctly visually.
- Export rendering should use real SVG cutouts rather than painted white overlays.
