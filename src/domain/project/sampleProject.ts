import { createSpurGear } from '../gears/factories';
import { calculateDrivenRotationDegrees, createLockedMeshRelation } from './meshing';
import type { GearProject } from './types';

export function createSampleProject(): GearProject {
  const driver = createSpurGear({
    id: 'gear-driver',
    label: 'Driver gear',
    color: 'orange',
    module: 2,
    toothCount: 20,
    pressureAngleDegrees: 20,
    thicknessMm: 8,
    boreDiameterMm: 5,
    innerCutoutDiameterMm: 0,
    backlashMm: 0.12,
  });

  const driven = createSpurGear({
    id: 'gear-driven',
    label: 'Driven gear',
    color: 'blue',
    module: 2,
    toothCount: 40,
    pressureAngleDegrees: 20,
    thicknessMm: 8,
    boreDiameterMm: 5,
    innerCutoutDiameterMm: 0,
    backlashMm: 0.12,
  });

  const driverGear = {
    ...driver,
    position: { x: 60, y: 60 },
    rotationDegrees: 0,
  };
  const drivenGear = {
    ...driven,
    position: { x: 120, y: 60 },
    rotationDegrees: 0,
  };
  const relation = createLockedMeshRelation(driverGear, drivenGear);

  return {
    id: 'project-sample',
    name: 'Starter gear train',
    gears: [
      driverGear,
      {
        ...drivenGear,
        rotationDegrees: calculateDrivenRotationDegrees(
          driverGear,
          drivenGear,
          relation.meshPhaseOffsetDegrees,
        ),
      },
    ],
    relations: [relation],
    printProfile: {
      material: 'PLA',
      nozzleDiameterMm: 0.4,
      layerHeightMm: 0.2,
      defaultBacklashMm: 0.12,
      toleranceMm: 0.15,
      printWarningsEnabled: true,
    },
  };
}
