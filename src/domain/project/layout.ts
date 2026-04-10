import { calculateCenterDistance, canMeshSpurGears } from '../gears/calculations';
import { calculateDrivenRotationDegrees, createLockedMeshRelation } from './meshing';
import type { CanvasPosition, GearMeshRelation, ProjectGear } from './types';

export type SnapResult = {
  position: CanvasPosition;
  relation: GearMeshRelation | null;
  snappedToGearId: string | null;
  rotationDegrees: number | null;
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
  };
  let bestDistanceDelta = Number.POSITIVE_INFINITY;

  for (const candidate of otherGears) {
    if (!canMeshSpurGears(movingGear, candidate)) {
      continue;
    }

    const expectedCenterDistance = calculateCenterDistance(movingGear, candidate);
    const dx = nextPosition.x - candidate.position.x;
    const dy = nextPosition.y - candidate.position.y;
    const currentDistance = calculateDistance(nextPosition, candidate.position);
    const distanceDelta = Math.abs(currentDistance - expectedCenterDistance);
    const snapTolerance = Math.max(3, movingGear.module * 3);

    if (distanceDelta > snapTolerance || distanceDelta >= bestDistanceDelta) {
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

    bestDistanceDelta = distanceDelta;
    bestResult = {
      position: positionedMovingGear.position,
      relation,
      snappedToGearId: candidate.id,
      rotationDegrees: calculateDrivenRotationDegrees(
        candidate,
        positionedMovingGear,
        relation.meshPhaseOffsetDegrees,
      ),
    };
  }

  return bestResult;
}
