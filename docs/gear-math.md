# Gear Math Notes

## Current assumptions
- V1 targets spur gears.
- The primary user-facing size parameter is module.
- Internal length calculations use millimeters.
- Geometry must eventually support true involute profiles.

## Current implemented formulas
- Pitch diameter: `module * toothCount`
- Simple ratio: `drivenToothCount / driverToothCount`
- Base diameter: `pitchDiameter * cos(pressureAngle)`
- Outside diameter: `module * (toothCount + 2)`
- Root diameter: `module * (toothCount - 2.5)`
- Circular pitch: `pi * module`
- Tooth thickness at pitch circle: `(circularPitch / 2) - (backlash / 2)`
- Center distance for meshed gears: `(driverPitchDiameter + drivenPitchDiameter) / 2`
- Standard whole depth:
  - addendum: `module`
  - dedendum: `1.25 * module`
  - whole depth: `2.25 * module`
- Involute point parameterization:
  - `x = rb * (cos(t) + t * sin(t))`
  - `y = rb * (sin(t) - t * cos(t))`
  - `t = sqrt((r^2 / rb^2) - 1)`
- Pitch-line alignment for tooth flanks:
  - use involute polar angle at the pitch radius
  - place left/right flanks so pitch-circle tooth thickness matches the requested backlash-adjusted thickness
  - keep tooth half-angle decreasing as radius increases so tooth tips narrow outward instead of widening
- SVG outline strategy:
  - sample left involute flank
  - sample outer arc across the tooth tip
  - sample mirrored right involute flank
  - sample root arc between teeth
  - repeat for all teeth and close the path
- Bore hole strategy:
  - generate a dedicated circular hole path
  - render/export the hole separately so preview fill behavior stays robust

## Planned additions
- Backlash and clearance adjustments for SVG tooth geometry
- More complete printability heuristics tied to the project print profile
- Export-ready SVG document generation for whole gears and layouts
- Higher-fidelity involute controls if the current sampling approach proves insufficient

## Printability considerations
- Defaults should come from a project-level print profile.
- Warnings should remain advisory rather than blocking.
- Users must be able to disable printability warnings.

## Current parameter semantics
- `Thickness / print depth` is a 3D-print parameter. It represents the extrusion depth of the part and does not change the 2D SVG outline.
- `Pressure angle` affects the flank geometry and base circle. In the current 2D preview the visible change can be subtle, especially for small parameter adjustments.
- `Inner cutout diameter` controls the empty center region between the shaft area and the toothed rim.
- `Bore diameter` is the axle/shaft hole diameter.
