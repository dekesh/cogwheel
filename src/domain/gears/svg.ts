import type { SpurGear } from './types';

type Point = {
  x: number;
  y: number;
};

type SpurGearPathOptions = {
  involuteSteps?: number;
  arcSteps?: number;
};

type SpurGearPathResult = {
  path: string;
  outerPath: string;
  innerCutoutPath: string | null;
  axleHolePath: string | null;
  cutoutPaths: string[];
  outerRadiusMm: number;
  boreRadiusMm: number;
};

const DEFAULT_INVOLUTE_STEPS = 8;
const DEFAULT_ARC_STEPS = 4;

function radiusToInvoluteParameter(radius: number, baseRadius: number): number {
  if (radius <= baseRadius) {
    return 0;
  }

  return Math.sqrt((radius * radius) / (baseRadius * baseRadius) - 1);
}

function calculateInvolutePolarAngle(radius: number, baseRadius: number): number {
  const involuteParameter = radiusToInvoluteParameter(radius, baseRadius);

  return involuteParameter - Math.atan(involuteParameter);
}

function rotatePoint(point: Point, angleRadians: number): Point {
  return {
    x: point.x * Math.cos(angleRadians) - point.y * Math.sin(angleRadians),
    y: point.x * Math.sin(angleRadians) + point.y * Math.cos(angleRadians),
  };
}

function createPolarPoint(radius: number, angleRadians: number): Point {
  return {
    x: radius * Math.cos(angleRadians),
    y: radius * Math.sin(angleRadians),
  };
}

function createAngleRange(
  startAngle: number,
  endAngle: number,
  stepCount: number,
  includeStart: boolean,
): number[] {
  if (stepCount <= 0) {
    return includeStart ? [startAngle, endAngle] : [endAngle];
  }

  const angles: number[] = [];

  for (let index = includeStart ? 0 : 1; index <= stepCount; index += 1) {
    const progress = index / stepCount;

    angles.push(startAngle + (endAngle - startAngle) * progress);
  }

  return angles;
}

function sampleArc(
  radius: number,
  startAngle: number,
  endAngle: number,
  stepCount: number,
  includeStart: boolean,
): Point[] {
  return createAngleRange(startAngle, endAngle, stepCount, includeStart).map((angleRadians) =>
    createPolarPoint(radius, angleRadians),
  );
}

function formatPoint(point: Point): string {
  return `${point.x.toFixed(3)} ${(-point.y).toFixed(3)}`;
}

function buildClosedPath(points: Point[]): string {
  const segments = points.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${formatPoint(point)}`,
  );

  return `${segments.join(' ')} Z`;
}

function buildCirclePath(radius: number): string {
  const top = formatPoint({ x: 0, y: radius });
  const bottom = formatPoint({ x: 0, y: -radius });

  return `M ${top} A ${radius.toFixed(3)} ${radius.toFixed(3)} 0 1 0 ${bottom} A ${radius.toFixed(3)} ${radius.toFixed(3)} 0 1 0 ${top} Z`;
}

export function calculateToothHalfAngleAtRadius(
  radius: number,
  baseRadius: number,
  pitchInvoluteAngle: number,
  pitchHalfThicknessAngle: number,
): number {
  return (
    pitchHalfThicknessAngle -
    (calculateInvolutePolarAngle(radius, baseRadius) - pitchInvoluteAngle)
  );
}

export function buildSpurGearPath(
  gear: SpurGear,
  options: SpurGearPathOptions = {},
): SpurGearPathResult {
  const involuteSteps = options.involuteSteps ?? DEFAULT_INVOLUTE_STEPS;
  const arcSteps = options.arcSteps ?? DEFAULT_ARC_STEPS;
  const toothAngle = (2 * Math.PI) / gear.toothCount;
  const pitchRadius = gear.pitchDiameterMm / 2;
  const baseRadius = gear.geometry.baseDiameterMm / 2;
  const outsideRadius = gear.geometry.outsideDiameterMm / 2;
  const rootRadius = gear.geometry.rootDiameterMm / 2;
  const boreRadius = gear.boreDiameterMm / 2;
  const innerCutoutRadius = gear.innerCutoutDiameterMm / 2;
  const involuteStartRadius = Math.max(baseRadius, rootRadius);
  const pitchHalfThicknessAngle = gear.geometry.toothThicknessAtPitchMm / (2 * pitchRadius);
  const pitchInvoluteAngle = calculateInvolutePolarAngle(pitchRadius, baseRadius);
  const localInvoluteRadii = Array.from({ length: involuteSteps + 1 }, (_, index) => {
    const progress = index / involuteSteps;

    return involuteStartRadius + (outsideRadius - involuteStartRadius) * progress;
  });

  const localLeftFlank = localInvoluteRadii.map((radius) =>
    createPolarPoint(
      radius,
      -calculateToothHalfAngleAtRadius(
        radius,
        baseRadius,
        pitchInvoluteAngle,
        pitchHalfThicknessAngle,
      ),
    ),
  );
  const localRightFlank = localInvoluteRadii.map((radius) =>
    createPolarPoint(
      radius,
      +calculateToothHalfAngleAtRadius(
        radius,
        baseRadius,
        pitchInvoluteAngle,
        pitchHalfThicknessAngle,
      ),
    ),
  );

  const outerStartAngle = Math.atan2(
    localLeftFlank[localLeftFlank.length - 1].y,
    localLeftFlank[localLeftFlank.length - 1].x,
  );
  const outerEndAngle = Math.atan2(
    localRightFlank[localRightFlank.length - 1].y,
    localRightFlank[localRightFlank.length - 1].x,
  );

  const localOuterArc = sampleArc(
    outsideRadius,
    outerStartAngle,
    outerEndAngle,
    arcSteps,
    false,
  );
  const localLeftRootPoint = createPolarPoint(
    rootRadius,
    Math.atan2(localLeftFlank[0].y, localLeftFlank[0].x),
  );
  const localRightRootPoint = createPolarPoint(
    rootRadius,
    Math.atan2(localRightFlank[0].y, localRightFlank[0].x),
  );

  const contourPoints: Point[] = [];

  for (let toothIndex = 0; toothIndex < gear.toothCount; toothIndex += 1) {
    const toothRotation = toothIndex * toothAngle;
    const nextToothRotation = toothRotation + toothAngle;
    const rotatedLeftRoot = rotatePoint(localLeftRootPoint, toothRotation);
    const rotatedLeftFlank = localLeftFlank.map((point) => rotatePoint(point, toothRotation));
    const rotatedRightFlank = localRightFlank.map((point) => rotatePoint(point, toothRotation));
    const rotatedOuterArc = localOuterArc.map((point) => rotatePoint(point, toothRotation));
    const rotatedRightRoot = rotatePoint(localRightRootPoint, toothRotation);
    const nextLeftRoot = rotatePoint(localLeftRootPoint, nextToothRotation);

    if (toothIndex === 0) {
      contourPoints.push(rotatedLeftRoot);
    }

    if (involuteStartRadius > rootRadius) {
      contourPoints.push(rotatedLeftFlank[0]);
    }

    contourPoints.push(...rotatedLeftFlank.slice(1));
    contourPoints.push(...rotatedOuterArc);

    const reversedRightFlank = [...rotatedRightFlank].reverse();
    contourPoints.push(...reversedRightFlank);

    if (involuteStartRadius > rootRadius) {
      contourPoints.push(rotatedRightRoot);
    }

    const rootArcStartAngle = Math.atan2(rotatedRightRoot.y, rotatedRightRoot.x);
    let rootArcEndAngle = Math.atan2(nextLeftRoot.y, nextLeftRoot.x);

    if (rootArcEndAngle <= rootArcStartAngle) {
      rootArcEndAngle += 2 * Math.PI;
    }

    contourPoints.push(
      ...sampleArc(rootRadius, rootArcStartAngle, rootArcEndAngle, arcSteps, false),
    );
  }

  const outerPath = buildClosedPath(contourPoints);
  const innerCutoutPath =
    innerCutoutRadius > boreRadius ? buildCirclePath(innerCutoutRadius) : null;
  const axleHolePath = boreRadius > 0 ? buildCirclePath(boreRadius) : null;
  const cutoutPaths = [innerCutoutPath, axleHolePath].filter(
    (path): path is string => path !== null,
  );

  return {
    path: [outerPath, ...cutoutPaths].join(' '),
    outerPath,
    innerCutoutPath,
    axleHolePath,
    cutoutPaths,
    outerRadiusMm: outsideRadius,
    boreRadiusMm: boreRadius,
  };
}
