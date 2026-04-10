import { calculateCenterDistance } from '../gears/calculations';
import { createSpurGear } from '../gears/factories';
import type { GearMeshRelation, GearProject, ProjectGear } from './types';
import {
  calculateDrivenRotationDegrees,
  calculateLinkedRotationDegrees,
  createLockedMeshRelation,
} from './meshing';
import { snapGearPosition } from './layout';

export type ProjectEditorState = {
  project: GearProject;
  selectedGearId: string | null;
};

export type ProjectAction =
  | { type: 'select-gear'; gearId: string }
  | { type: 'add-gear' }
  | { type: 'add-matching-gear'; sourceGearId: string }
  | { type: 'remove-gear'; gearId: string }
  | {
      type: 'update-gear';
      gearId: string;
      patch: Partial<
        Pick<
          ProjectGear,
          | 'label'
          | 'color'
          | 'module'
          | 'toothCount'
          | 'pressureAngleDegrees'
          | 'thicknessMm'
          | 'boreDiameterMm'
          | 'innerCutoutDiameterMm'
          | 'backlashMm'
        >
      >;
    }
  | { type: 'move-gear'; gearId: string; x: number; y: number }
  | { type: 'rotate-gear'; gearId: string; rotationDegrees: number };

const DEFAULT_NEW_GEAR_POSITION = { x: 70, y: 70 };
const NEW_GEAR_X_STEP = 34;
const NEW_GEAR_Y_STEP = 24;

function createPositionForIndex(index: number) {
  return {
    x: DEFAULT_NEW_GEAR_POSITION.x + index * NEW_GEAR_X_STEP,
    y: DEFAULT_NEW_GEAR_POSITION.y + index * NEW_GEAR_Y_STEP,
  };
}

function updateRelations(
  relations: GearMeshRelation[],
  movingGearId: string,
  nextRelation: GearMeshRelation | null,
): GearMeshRelation[] {
  const remainingRelations = relations.filter(
    (relation) => relation.driverGearId !== movingGearId && relation.drivenGearId !== movingGearId,
  );

  return nextRelation ? [...remainingRelations, nextRelation] : remainingRelations;
}

function getGearById(gears: ProjectGear[], gearId: string): ProjectGear {
  const gear = gears.find((candidate) => candidate.id === gearId);

  if (!gear) {
    throw new Error(`Gear ${gearId} was not found`);
  }

  return gear;
}

function replaceGear(gears: ProjectGear[], updatedGear: ProjectGear): ProjectGear[] {
  return gears.map((gear) => (gear.id === updatedGear.id ? updatedGear : gear));
}

function createProjectGear(
  index: number,
  overrides: Partial<ProjectGear> = {},
  basedOn?: ProjectGear,
): ProjectGear {
  const toothCount =
    overrides.toothCount ??
    (basedOn ? Math.min(80, Math.max(12, basedOn.toothCount + 10)) : 24);
  const moduleValue = overrides.module ?? basedOn?.module ?? 2;
  const pressureAngleDegrees = overrides.pressureAngleDegrees ?? basedOn?.pressureAngleDegrees ?? 20;
  const thicknessMm = overrides.thicknessMm ?? basedOn?.thicknessMm ?? 8;
  const boreDiameterMm = overrides.boreDiameterMm ?? basedOn?.boreDiameterMm ?? 5;
  const innerCutoutDiameterMm =
    overrides.innerCutoutDiameterMm ?? basedOn?.innerCutoutDiameterMm ?? 0;
  const backlashMm = overrides.backlashMm ?? basedOn?.backlashMm ?? 0.12;
  const colorPalette = ['orange', 'blue', 'teal', 'grape', 'red'];

  return {
    ...createSpurGear({
      id: overrides.id ?? `gear-${index + 1}`,
      label: overrides.label ?? `Gear ${index + 1}`,
      color: overrides.color ?? colorPalette[index % colorPalette.length],
      module: moduleValue,
      toothCount,
      pressureAngleDegrees,
      thicknessMm,
      boreDiameterMm,
      innerCutoutDiameterMm,
      backlashMm,
    }),
    position: overrides.position ?? createPositionForIndex(index),
    rotationDegrees: overrides.rotationDegrees ?? 0,
  };
}

function rebuildProjectGear(
  gear: ProjectGear,
  patch: Partial<
    Pick<
      ProjectGear,
      | 'label'
      | 'color'
      | 'module'
      | 'toothCount'
      | 'pressureAngleDegrees'
      | 'thicknessMm'
      | 'boreDiameterMm'
      | 'innerCutoutDiameterMm'
      | 'backlashMm'
    >
  >,
): ProjectGear {
  const nextCoreGear = createSpurGear({
    id: gear.id,
    label: patch.label ?? gear.label,
    color: patch.color ?? gear.color,
    module: patch.module ?? gear.module,
    toothCount: patch.toothCount ?? gear.toothCount,
    pressureAngleDegrees: patch.pressureAngleDegrees ?? gear.pressureAngleDegrees,
    thicknessMm: patch.thicknessMm ?? gear.thicknessMm,
    boreDiameterMm: patch.boreDiameterMm ?? gear.boreDiameterMm,
    innerCutoutDiameterMm: patch.innerCutoutDiameterMm ?? gear.innerCutoutDiameterMm,
    backlashMm: patch.backlashMm ?? gear.backlashMm,
  });

  return {
    ...nextCoreGear,
    position: gear.position,
    rotationDegrees: gear.rotationDegrees,
  };
}

function propagateRotationsThroughRelations(
  gears: ProjectGear[],
  relations: GearMeshRelation[],
  sourceGearId: string,
  rotationDegrees: number,
): ProjectGear[] {
  let nextGears = gears.map((gear) =>
    gear.id === sourceGearId ? { ...gear, rotationDegrees } : gear,
  );
  const queue = [sourceGearId];
  const visited = new Set<string>([sourceGearId]);

  while (queue.length > 0) {
    const currentGearId = queue.shift();

    if (!currentGearId) {
      continue;
    }

    const currentGear = getGearById(nextGears, currentGearId);
    const linkedRelations = relations.filter(
      (relation) =>
        relation.centerDistanceLocked &&
        (relation.driverGearId === currentGearId || relation.drivenGearId === currentGearId),
    );

    for (const relation of linkedRelations) {
      const otherGearId =
        relation.driverGearId === currentGearId ? relation.drivenGearId : relation.driverGearId;

      if (visited.has(otherGearId)) {
        continue;
      }

      const otherGear = getGearById(nextGears, otherGearId);
      const linkedRotationDegrees = calculateLinkedRotationDegrees(
        currentGear,
        otherGear,
        relation,
        currentGear.rotationDegrees,
      );

      nextGears = nextGears.map((gear) =>
        gear.id === otherGearId ? { ...gear, rotationDegrees: linkedRotationDegrees } : gear,
      );
      visited.add(otherGearId);
      queue.push(otherGearId);
    }
  }

  return nextGears;
}

function syncLockedRelations(
  gears: ProjectGear[],
  relations: GearMeshRelation[],
  updatedGearId: string,
): { gears: ProjectGear[]; relations: GearMeshRelation[] } {
  let nextGears = [...gears];
  let nextRelations = [...relations];

  for (const relation of relations) {
    const isDriver = relation.driverGearId === updatedGearId;
    const isDriven = relation.drivenGearId === updatedGearId;

    if (!relation.centerDistanceLocked || (!isDriver && !isDriven)) {
      continue;
    }

    const updatedGear = nextGears.find((gear) => gear.id === updatedGearId);
    const counterpartId = isDriver ? relation.drivenGearId : relation.driverGearId;
    const counterpart = nextGears.find((gear) => gear.id === counterpartId);

    if (!updatedGear || !counterpart) {
      continue;
    }

    const dx = counterpart.position.x - updatedGear.position.x;
    const dy = counterpart.position.y - updatedGear.position.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const direction = { x: dx / magnitude, y: dy / magnitude };
    const lockedDistance = calculateCenterDistance(updatedGear, counterpart);

    const positionedCounterpart = {
      ...counterpart,
      position: {
        x: updatedGear.position.x + direction.x * lockedDistance,
        y: updatedGear.position.y + direction.y * lockedDistance,
      },
    };
    const driverGear = isDriver ? updatedGear : positionedCounterpart;
    const drivenGear = isDriver ? positionedCounterpart : updatedGear;
    const nextRelation = createLockedMeshRelation(driverGear, drivenGear);
    const alignedDrivenGear = {
      ...drivenGear,
      rotationDegrees: calculateDrivenRotationDegrees(
        driverGear,
        drivenGear,
        nextRelation.meshPhaseOffsetDegrees,
      ),
    };

    nextGears = replaceGear(nextGears, driverGear);
    nextGears = replaceGear(nextGears, alignedDrivenGear);
    nextRelations = nextRelations.map((entry) =>
      entry.driverGearId === relation.driverGearId && entry.drivenGearId === relation.drivenGearId
        ? nextRelation
        : entry,
    );
  }

  return { gears: nextGears, relations: nextRelations };
}

export function createInitialEditorState(project: GearProject): ProjectEditorState {
  return {
    project,
    selectedGearId: project.gears[0]?.id ?? null,
  };
}

export function projectReducer(
  state: ProjectEditorState,
  action: ProjectAction,
): ProjectEditorState {
  switch (action.type) {
    case 'select-gear':
      return {
        ...state,
        selectedGearId: action.gearId,
      };

    case 'add-gear': {
      const nextGear = createProjectGear(state.project.gears.length);

      return {
        project: {
          ...state.project,
          gears: [...state.project.gears, nextGear],
        },
        selectedGearId: nextGear.id,
      };
    }

    case 'add-matching-gear': {
      const sourceGear = getGearById(state.project.gears, action.sourceGearId);
      const nextGear = createProjectGear(state.project.gears.length, {}, sourceGear);
      const dx = calculateCenterDistance(sourceGear, nextGear);
      const snappedPosition = {
        x: sourceGear.position.x + dx,
        y: sourceGear.position.y,
      };
      const snapResult = snapGearPosition(
        nextGear,
        snappedPosition,
        state.project.gears,
      );
      const nextPlacedGear = {
        ...nextGear,
        position: snapResult.position,
        rotationDegrees: snapResult.rotationDegrees ?? nextGear.rotationDegrees,
      };

      return {
        project: {
          ...state.project,
          gears: [...state.project.gears, nextPlacedGear],
          relations: snapResult.relation
            ? [...state.project.relations, snapResult.relation]
            : state.project.relations,
        },
        selectedGearId: nextPlacedGear.id,
      };
    }

    case 'remove-gear': {
      const remainingGears = state.project.gears.filter((gear) => gear.id !== action.gearId);
      const remainingRelations = state.project.relations.filter(
        (relation) =>
          relation.driverGearId !== action.gearId && relation.drivenGearId !== action.gearId,
      );
      const nextSelectedGearId =
        state.selectedGearId === action.gearId
          ? (remainingGears[0]?.id ?? null)
          : state.selectedGearId;

      return {
        project: {
          ...state.project,
          gears: remainingGears,
          relations: remainingRelations,
        },
        selectedGearId: nextSelectedGearId,
      };
    }

    case 'update-gear': {
      const nextGears = state.project.gears.map((gear) =>
        gear.id === action.gearId ? rebuildProjectGear(gear, action.patch) : gear,
      );
      const syncedProject = syncLockedRelations(nextGears, state.project.relations, action.gearId);

      return {
        ...state,
        project: {
          ...state.project,
          gears: syncedProject.gears,
          relations: syncedProject.relations,
        },
      };
    }

    case 'move-gear': {
      const movingGear = getGearById(state.project.gears, action.gearId);
      const otherGears = state.project.gears.filter((gear) => gear.id !== action.gearId);
      const snapResult = snapGearPosition(
        movingGear,
        { x: action.x, y: action.y },
        otherGears,
      );
      const nextGears = state.project.gears.map((gear) =>
        gear.id === action.gearId
          ? {
              ...gear,
              position: snapResult.position,
              rotationDegrees: snapResult.rotationDegrees ?? gear.rotationDegrees,
            }
          : gear,
      );
      const nextRelations = updateRelations(state.project.relations, action.gearId, snapResult.relation);

      return {
        ...state,
        project: {
          ...state.project,
          gears: nextGears,
          relations: nextRelations,
        },
      };
    }

    case 'rotate-gear': {
      return {
        ...state,
        project: {
          ...state.project,
          gears: propagateRotationsThroughRelations(
            state.project.gears,
            state.project.relations,
            action.gearId,
            action.rotationDegrees,
          ),
        },
      };
    }

    default:
      return state;
  }
}
