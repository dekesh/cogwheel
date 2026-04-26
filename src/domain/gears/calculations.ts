import type { GearGeometry, SpurGear } from './types';

export function calculatePitchDiameter(moduleValue: number, toothCount: number): number {
  return moduleValue * toothCount;
}

export function calculateGearRatio(driverToothCount: number, drivenToothCount: number): number {
  return drivenToothCount / driverToothCount;
}

export function degreesToRadians(angleDegrees: number): number {
  return (angleDegrees * Math.PI) / 180;
}

export function calculateBaseDiameter(
  pitchDiameterMm: number,
  pressureAngleDegrees: number,
): number {
  return pitchDiameterMm * Math.cos(degreesToRadians(pressureAngleDegrees));
}

export function calculateOutsideDiameter(moduleValue: number, toothCount: number): number {
  return moduleValue * (toothCount + 2);
}

export function calculateRootDiameter(moduleValue: number, toothCount: number): number {
  return moduleValue * (toothCount - 2.5);
}

export function calculateCircularPitch(moduleValue: number): number {
  return Math.PI * moduleValue;
}

export function calculateToothThicknessAtPitch(moduleValue: number, backlashMm: number): number {
  return calculateCircularPitch(moduleValue) / 2 - backlashMm / 2;
}

export function calculateMinimumToothCountToAvoidUndercut(pressureAngleDegrees: number): number {
  const pressureAngleRadians = degreesToRadians(pressureAngleDegrees);

  return 2 / (Math.sin(pressureAngleRadians) * Math.sin(pressureAngleRadians));
}

export function deriveSpurGearGeometry(
  moduleValue: number,
  toothCount: number,
  pressureAngleDegrees: number,
  backlashMm: number,
): GearGeometry {
  const pitchDiameterMm = calculatePitchDiameter(moduleValue, toothCount);
  const circularPitchMm = calculateCircularPitch(moduleValue);
  const addendumMm = moduleValue;
  const dedendumMm = 1.25 * moduleValue;
  const wholeDepthMm = addendumMm + dedendumMm;

  return {
    addendumMm,
    dedendumMm,
    wholeDepthMm,
    circularPitchMm,
    basePitchMm: circularPitchMm * Math.cos(degreesToRadians(pressureAngleDegrees)),
    toothThicknessAtPitchMm: calculateToothThicknessAtPitch(moduleValue, backlashMm),
    pitchRadiusMm: pitchDiameterMm / 2,
    baseDiameterMm: calculateBaseDiameter(pitchDiameterMm, pressureAngleDegrees),
    outsideDiameterMm: calculateOutsideDiameter(moduleValue, toothCount),
    rootDiameterMm: calculateRootDiameter(moduleValue, toothCount),
  };
}

export function calculateCenterDistance(driver: SpurGear, driven: SpurGear): number {
  return (driver.pitchDiameterMm + driven.pitchDiameterMm) / 2;
}

export function canMeshSpurGears(driver: SpurGear, driven: SpurGear): boolean {
  return (
    driver.module === driven.module && driver.pressureAngleDegrees === driven.pressureAngleDegrees
  );
}

export type GearValidationIssue = {
  code:
    | 'invalid-module'
    | 'invalid-tooth-count'
    | 'invalid-thickness'
    | 'negative-backlash'
    | 'bore-too-large'
    | 'undercut-risk'
    | 'thin-tooth-risk';
  severity: 'error' | 'warning';
  message: string;
};

export function validateSpurGear(gear: SpurGear): GearValidationIssue[] {
  const issues: GearValidationIssue[] = [];

  if (gear.module <= 0) {
    issues.push({
      code: 'invalid-module',
      severity: 'error',
      message: 'Module must be greater than zero.',
    });
  }

  if (gear.toothCount < 4) {
    issues.push({
      code: 'invalid-tooth-count',
      severity: 'error',
      message: 'Spur gears need at least 4 teeth to produce meaningful geometry.',
    });
  }

  if (gear.thicknessMm <= 0) {
    issues.push({
      code: 'invalid-thickness',
      severity: 'error',
      message: 'Gear thickness must be greater than zero.',
    });
  }

  if (gear.backlashMm < 0) {
    issues.push({
      code: 'negative-backlash',
      severity: 'warning',
      message: 'Negative backlash may create an interference fit between teeth.',
    });
  }

  if (gear.boreDiameterMm >= gear.geometry.rootDiameterMm) {
    issues.push({
      code: 'bore-too-large',
      severity: 'error',
      message: 'Bore diameter must stay smaller than the root diameter.',
    });
  }

  if (gear.toothCount < calculateMinimumToothCountToAvoidUndercut(gear.pressureAngleDegrees)) {
    issues.push({
      code: 'undercut-risk',
      severity: 'warning',
      message: 'This tooth count risks undercut for the chosen pressure angle.',
    });
  }

  if (gear.geometry.toothThicknessAtPitchMm <= gear.module * 0.35) {
    issues.push({
      code: 'thin-tooth-risk',
      severity: 'warning',
      message: 'Tooth thickness at the pitch circle is getting thin for 3D printing.',
    });
  }

  return issues;
}
