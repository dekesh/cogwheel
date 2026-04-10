import type { CSSProperties } from 'react';

import type { SpurGear } from '../domain/gears/types';
import { buildSpurGearPath } from '../domain/gears/svg';

type GearSvgPreviewProps = {
  gear: SpurGear;
  size?: number;
};

export function GearSvgPreview({ gear, size = 180 }: GearSvgPreviewProps) {
  const { outerPath, cutoutPaths, outerRadiusMm, boreRadiusMm } = buildSpurGearPath(gear);
  const marginMm = Math.max(gear.module * 2, 4);
  const viewRadius = outerRadiusMm + marginMm;
  const boreLabelStyle: CSSProperties = {
    fontSize: 2.4,
    fill: '#5c5f66',
  };

  return (
    <svg
      aria-label={`${gear.label} preview`}
      viewBox={`${-viewRadius} ${-viewRadius} ${viewRadius * 2} ${viewRadius * 2}`}
      width={size}
      height={size}
      style={{ overflow: 'visible' }}
    >
      <path
        d={outerPath}
        fill={gear.color}
        stroke="#182028"
        strokeWidth={0.5}
        vectorEffect="non-scaling-stroke"
      />
      {cutoutPaths.map((cutoutPath, index) => (
        <path
          key={`${gear.id}-cutout-${index}`}
          d={cutoutPath}
          fill="#ffffff"
          stroke="#182028"
          strokeWidth={0.35}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <circle
        cx={0}
        cy={0}
        r={gear.pitchDiameterMm / 2}
        fill="none"
        stroke="rgba(24, 32, 40, 0.25)"
        strokeDasharray="1.5 1.5"
        strokeWidth={0.35}
      />
      {boreRadiusMm > 0 ? (
        <text x={0} y={0.8} textAnchor="middle" style={boreLabelStyle}>
          {gear.boreDiameterMm.toFixed(1)} mm
        </text>
      ) : null}
    </svg>
  );
}
