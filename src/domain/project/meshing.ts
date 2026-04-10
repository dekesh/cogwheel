import type { GearMeshRelation, ProjectGear } from './types';

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function normalizeDegrees(value: number): number {
  const normalized = ((value % 360) + 360) % 360;

  return normalized > 180 ? normalized - 360 : normalized;
}

export function getCenterLineAngleDegrees(fromGear: ProjectGear, toGear: ProjectGear): number {
  return toDegrees(
    Math.atan2(toGear.position.y - fromGear.position.y, toGear.position.x - fromGear.position.x),
  );
}

export function calculateMeshPhaseOffsetDegrees(
  driver: ProjectGear,
  driven: ProjectGear,
): number {
  const centerLineAngleDegrees = getCenterLineAngleDegrees(driver, driven);
  const drivenToothPitchDegrees = 360 / driven.toothCount;
  const ratio = driver.toothCount / driven.toothCount;

  return normalizeDegrees(
    centerLineAngleDegrees + 180 - drivenToothPitchDegrees / 2 + centerLineAngleDegrees * ratio,
  );
}

export function calculateDrivenRotationDegrees(
  driver: ProjectGear,
  driven: ProjectGear,
  phaseOffsetDegrees: number = calculateMeshPhaseOffsetDegrees(driver, driven),
): number {
  const ratio = driver.toothCount / driven.toothCount;

  return normalizeDegrees(phaseOffsetDegrees - driver.rotationDegrees * ratio);
}

export function createLockedMeshRelation(
  driver: ProjectGear,
  driven: ProjectGear,
): GearMeshRelation {
  return {
    driverGearId: driver.id,
    drivenGearId: driven.id,
    centerDistanceLocked: true,
    meshPhaseOffsetDegrees: calculateMeshPhaseOffsetDegrees(driver, driven),
  };
}

export function calculateLinkedRotationDegrees(
  sourceGear: ProjectGear,
  targetGear: ProjectGear,
  relation: GearMeshRelation,
  sourceRotationDegrees: number,
): number {
  if (relation.driverGearId === sourceGear.id && relation.drivenGearId === targetGear.id) {
    const ratio = sourceGear.toothCount / targetGear.toothCount;

    return normalizeDegrees(relation.meshPhaseOffsetDegrees - sourceRotationDegrees * ratio);
  }

  if (relation.drivenGearId === sourceGear.id && relation.driverGearId === targetGear.id) {
    const ratio = sourceGear.toothCount / targetGear.toothCount;

    return normalizeDegrees((relation.meshPhaseOffsetDegrees - sourceRotationDegrees) * ratio);
  }

  throw new Error(`Relation ${relation.driverGearId} -> ${relation.drivenGearId} does not link the supplied gears`);
}
