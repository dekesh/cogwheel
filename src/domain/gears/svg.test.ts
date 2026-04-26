import { createSpurGear } from './factories';
import { buildSpurGearPath, calculateToothHalfAngleAtRadius } from './svg';

describe('spur gear SVG generation', () => {
  it('creates a closed SVG path for a printable spur gear profile', () => {
    const gear = createSpurGear({
      id: 'svg-gear',
      label: 'SVG gear',
      color: 'orange',
      module: 2,
      toothCount: 20,
      pressureAngleDegrees: 20,
      thicknessMm: 8,
      boreDiameterMm: 5,
      innerCutoutDiameterMm: 0,
      backlashMm: 0.12,
    });

    const result = buildSpurGearPath(gear);

    expect(result.outerPath.startsWith('M ')).toBe(true);
    expect(result.outerPath.endsWith(' Z')).toBe(true);
    expect(result.cutoutPaths[0]).toContain('A 2.500 2.500');
    expect(result.path).not.toContain('NaN');
    expect(result.outerRadiusMm).toBe(22);
    expect(result.boreRadiusMm).toBe(2.5);
  });

  it('keeps the inner cutout and axle hole as separate concentric contours', () => {
    const gear = createSpurGear({
      id: 'hub-gear',
      label: 'Hub gear',
      color: 'orange',
      module: 2,
      toothCount: 20,
      pressureAngleDegrees: 20,
      thicknessMm: 8,
      boreDiameterMm: 5,
      innerCutoutDiameterMm: 16,
      backlashMm: 0.12,
    });

    const result = buildSpurGearPath(gear);

    expect(result.innerCutoutPath).toContain('A 8.000 8.000');
    expect(result.axleHolePath).toContain('A 2.500 2.500');
    expect(result.cutoutPaths).toHaveLength(2);
  });

  it('creates a more detailed path when the gear has low tooth count and undercut risk', () => {
    const gear = createSpurGear({
      id: 'compact-gear',
      label: 'Compact gear',
      color: 'red',
      module: 1,
      toothCount: 12,
      pressureAngleDegrees: 20,
      thicknessMm: 6,
      boreDiameterMm: 3,
      innerCutoutDiameterMm: 0,
      backlashMm: 0.08,
    });

    const result = buildSpurGearPath(gear, { involuteSteps: 10, arcSteps: 6 });

    expect(result.outerPath.split('L').length).toBeGreaterThan(gear.toothCount * 10);
    expect(result.path).not.toContain('NaN');
    expect(result.outerRadiusMm).toBeCloseTo(7, 5);
  });

  it('narrows tooth angular thickness toward the outer radius instead of widening it', () => {
    const gear = createSpurGear({
      id: 'shape-check',
      label: 'Shape check',
      color: 'orange',
      module: 2,
      toothCount: 20,
      pressureAngleDegrees: 20,
      thicknessMm: 8,
      boreDiameterMm: 5,
      innerCutoutDiameterMm: 0,
      backlashMm: 0.12,
    });

    const baseRadius = gear.geometry.baseDiameterMm / 2;
    const pitchRadius = gear.pitchDiameterMm / 2;
    const outerRadius = gear.geometry.outsideDiameterMm / 2;
    const pitchInvoluteAngle = Math.sqrt(
      (pitchRadius * pitchRadius) / (baseRadius * baseRadius) - 1,
    );
    const correctedPitchInvoluteAngle = pitchInvoluteAngle - Math.atan(pitchInvoluteAngle);
    const pitchHalfThicknessAngle =
      gear.geometry.toothThicknessAtPitchMm / (2 * gear.geometry.pitchRadiusMm);
    const baseHalfAngle = calculateToothHalfAngleAtRadius(
      baseRadius,
      baseRadius,
      correctedPitchInvoluteAngle,
      pitchHalfThicknessAngle,
    );
    const outerHalfAngle = calculateToothHalfAngleAtRadius(
      outerRadius,
      baseRadius,
      correctedPitchInvoluteAngle,
      pitchHalfThicknessAngle,
    );

    expect(outerHalfAngle).toBeLessThan(baseHalfAngle);
  });
});
