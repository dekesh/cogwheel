export type GearId = string;

export type GearGeometry = {
  addendumMm: number;
  dedendumMm: number;
  wholeDepthMm: number;
  circularPitchMm: number;
  basePitchMm: number;
  toothThicknessAtPitchMm: number;
  pitchRadiusMm: number;
  baseDiameterMm: number;
  outsideDiameterMm: number;
  rootDiameterMm: number;
};

export type SpurGear = {
  id: GearId;
  label: string;
  color: string;
  module: number;
  toothCount: number;
  pressureAngleDegrees: number;
  thicknessMm: number;
  boreDiameterMm: number;
  innerCutoutDiameterMm: number;
  backlashMm: number;
  pitchDiameterMm: number;
  geometry: GearGeometry;
};
