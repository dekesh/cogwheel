import { calculateCenterDistance } from '../gears/calculations';
import { createSpurGear } from '../gears/factories';
import { snapGearPosition } from './layout';
import type { ProjectGear } from './types';

function createProjectGear(
  id: string,
  toothCount: number,
  position: { x: number; y: number },
): ProjectGear {
  return {
    ...createSpurGear({
      id,
      label: id,
      color: 'orange',
      module: 2,
      toothCount,
      pressureAngleDegrees: 20,
      thicknessMm: 8,
      boreDiameterMm: 5,
      innerCutoutDiameterMm: 0,
      backlashMm: 0.12,
    }),
    position,
    rotationDegrees: 0,
  };
}

describe('project layout snapping', () => {
  it('snaps compatible gears to the correct center distance', () => {
    const stationary = createProjectGear('driver', 20, { x: 60, y: 60 });
    const moving = createProjectGear('driven', 40, { x: 0, y: 0 });

    const result = snapGearPosition(moving, { x: 122, y: 61 }, [stationary]);
    const snappedDistance = Math.hypot(
      result.position.x - stationary.position.x,
      result.position.y - stationary.position.y,
    );

    expect(result.snappedToGearId).toBe('driver');
    expect(snappedDistance).toBeCloseTo(calculateCenterDistance(stationary, moving), 4);
    expect(result.relation?.centerDistanceLocked).toBe(true);
  });

  it('does not snap incompatible gears', () => {
    const stationary = {
      ...createProjectGear('driver', 20, { x: 60, y: 60 }),
      module: 3,
    };
    const moving = createProjectGear('driven', 40, { x: 0, y: 0 });

    const result = snapGearPosition(moving, { x: 122, y: 61 }, [stationary]);

    expect(result.snappedToGearId).toBeNull();
    expect(result.position).toEqual({ x: 122, y: 61 });
  });
});
