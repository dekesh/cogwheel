import {
  calculateCenterDistance,
  calculateGearRatio,
  calculateMinimumToothCountToAvoidUndercut,
  calculatePitchDiameter,
  canMeshSpurGears,
  deriveSpurGearGeometry,
  validateSpurGear,
} from './calculations';
import { createSpurGear } from './factories';

describe('gear calculations', () => {
  it('calculates pitch diameter from module and tooth count', () => {
    expect(calculatePitchDiameter(2, 20)).toBe(40);
  });

  it('calculates simple driven ratio', () => {
    expect(calculateGearRatio(20, 40)).toBe(2);
  });

  it('derives standard spur gear geometry from module and tooth count', () => {
    const geometry = deriveSpurGearGeometry(2, 20, 20, 0.12);

    expect(geometry.addendumMm).toBe(2);
    expect(geometry.dedendumMm).toBe(2.5);
    expect(geometry.wholeDepthMm).toBe(4.5);
    expect(geometry.outsideDiameterMm).toBe(44);
    expect(geometry.rootDiameterMm).toBe(35);
    expect(geometry.pitchRadiusMm).toBe(20);
    expect(geometry.baseDiameterMm).toBeCloseTo(37.5877, 4);
  });

  it('calculates the minimum tooth count undercut threshold', () => {
    expect(calculateMinimumToothCountToAvoidUndercut(20)).toBeCloseTo(17.097, 3);
  });

  it('checks if two gears can mesh and computes their center distance', () => {
    const driver = createSpurGear({
      id: 'driver',
      label: 'Driver',
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
      id: 'driven',
      label: 'Driven',
      color: 'blue',
      module: 2,
      toothCount: 40,
      pressureAngleDegrees: 20,
      thicknessMm: 8,
      boreDiameterMm: 5,
      innerCutoutDiameterMm: 0,
      backlashMm: 0.12,
    });

    expect(canMeshSpurGears(driver, driven)).toBe(true);
    expect(calculateCenterDistance(driver, driven)).toBe(60);
  });

  it('warns about borderline or invalid printable geometry without blocking derivation', () => {
    const riskyGear = createSpurGear({
      id: 'risky',
      label: 'Risky',
      color: 'red',
      module: 1,
      toothCount: 12,
      pressureAngleDegrees: 20,
      thicknessMm: 5,
      boreDiameterMm: 20,
      innerCutoutDiameterMm: 0,
      backlashMm: -0.02,
    });

    const issues = validateSpurGear(riskyGear);

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['negative-backlash', 'bore-too-large', 'undercut-risk']),
    );
  });
});
