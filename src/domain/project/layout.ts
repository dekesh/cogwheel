import { calculateCenterDistance, canMeshSpurGears } from '../gears/calculations';
import { calculateDrivenRotationDegrees, createLockedMeshRelation } from './meshing';
import type { CanvasPosition, GearMeshRelation, ProjectGear } from './types';

export type SnapMode = 'mesh' | 'stack';

export type SnapResult = {
  position: CanvasPosition;
  relation: GearMeshRelation | null;
  snappedToGearId: string | null;
  rotationDegrees: number | null;
  mode: SnapMode | null;
};

function calculateDistance(a: CanvasPosition, b: CanvasPosition): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  return Math.hypot(dx, dy);
}

function normalize(dx: number, dy: number): { x: number; y: number } {
  const magnitude = Math.hypot(dx, dy);

  if (magnitude === 0) {
    return { x: 1, y: 0 };
  }

  return { x: dx / magnitude, y: dy / magnitude };
}

function calculateStackSnapTolerance(movingGear: ProjectGear, candidate: ProjectGear): number {
  return Math.min(movingGear.geometry.pitchRadiusMm, candidate.geometry.pitchRadiusMm);
}

export function snapGearPosition(
  movingGear: ProjectGear,
  nextPosition: CanvasPosition,
  otherGears: ProjectGear[],
): SnapResult {
  let bestResult: SnapResult = {
    position: nextPosition,
    relation: null,
    snappedToGearId: null,
    rotationDegrees: null,
    mode: null,
  };
  let bestDelta = Number.POSITIVE_INFINITY;

  for (const candidate of otherGears) {
    const dx = nextPosition.x - candidate.position.x;
    const dy = nextPosition.y - candidate.position.y;
    const currentDistance = calculateDistance(nextPosition, candidate.position);

    const stackTolerance = calculateStackSnapTolerance(movingGear, candidate);

    if (currentDistance <= stackTolerance && currentDistance < bestDelta) {
      bestDelta = currentDistance;
      bestResult = {
        position: { x: candidate.position.x, y: candidate.position.y },
        relation: null,
        snappedToGearId: candidate.id,
        rotationDegrees: candidate.rotationDegrees,
        mode: 'stack',
      };
    }

    if (!canMeshSpurGears(movingGear, candidate)) {
      continue;
    }

    const expectedCenterDistance = calculateCenterDistance(movingGear, candidate);
    const distanceDelta = Math.abs(currentDistance - expectedCenterDistance);
    const meshTolerance = Math.max(3, movingGear.module * 3);

    if (distanceDelta > meshTolerance || distanceDelta >= bestDelta) {
      continue;
    }

    const direction = normalize(dx, dy);
    const positionedMovingGear = {
      ...movingGear,
      position: {
        x: candidate.position.x + direction.x * expectedCenterDistance,
        y: candidate.position.y + direction.y * expectedCenterDistance,
      },
    };
    const relation = createLockedMeshRelation(candidate, positionedMovingGear);

    bestDelta = distanceDelta;
    bestResult = {
      position: positionedMovingGear.position,
      relation,
      snappedToGearId: candidate.id,
      rotationDegrees: calculateDrivenRotationDegrees(
        candidate,
        positionedMovingGear,
        relation.meshPhaseOffsetDegrees,
      ),
      mode: 'mesh',
    };
  }

  return bestResult;
}
