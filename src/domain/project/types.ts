import type { SpurGear } from '../gears/types';

export type CanvasPosition = {
  x: number;
  y: number;
};

export type PrintProfile = {
  material: string;
  nozzleDiameterMm: number;
  layerHeightMm: number;
  defaultBacklashMm: number;
  toleranceMm: number;
  printWarningsEnabled: boolean;
};

export type GearMeshRelation = {
  driverGearId: string;
  drivenGearId: string;
  centerDistanceLocked: boolean;
};

export type ProjectGear = SpurGear & {
  position: CanvasPosition;
  rotationDegrees: number;
};

export type GearProject = {
  id: string;
  name: string;
  gears: ProjectGear[];
  relations: GearMeshRelation[];
  printProfile: PrintProfile;
};
