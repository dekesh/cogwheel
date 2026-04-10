import { calculatePitchDiameter, deriveSpurGearGeometry } from './calculations';
import type { SpurGear } from './types';

type SpurGearInput = Omit<SpurGear, 'pitchDiameterMm' | 'geometry'>;

export function createSpurGear(input: SpurGearInput): SpurGear {
  return {
    ...input,
    pitchDiameterMm: calculatePitchDiameter(input.module, input.toothCount),
    geometry: deriveSpurGearGeometry(
      input.module,
      input.toothCount,
      input.pressureAngleDegrees,
      input.backlashMm,
    ),
  };
}
