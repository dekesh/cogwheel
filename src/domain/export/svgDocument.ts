import { buildSpurGearPath } from '../gears/svg';
import type { GearProject, ProjectGear } from '../project/types';

type SvgDocumentOptions = {
  includeMetadata?: boolean;
  marginMm?: number;
  includeAxleHole?: boolean;
  includeShaftPiece?: boolean;
  shaftClearanceMm?: number;
};

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function formatNumber(value: number): string {
  return value.toFixed(3);
}

function buildMetadataBlock(content: string): string {
  return `<metadata>${escapeXml(content)}</metadata>`;
}

function buildStrokePath(path: string): string {
  return `<path d="${path}" fill="none" stroke="#182028" stroke-width="0.5" vector-effect="non-scaling-stroke" />`;
}

function buildGearPaths(gear: ProjectGear, includeAxleHole: boolean): string[] {
  const { outerPath, innerCutoutPath, axleHolePath } = buildSpurGearPath(gear);

  return [
    outerPath,
    innerCutoutPath,
    includeAxleHole ? axleHolePath : null,
  ].filter((path): path is string => Boolean(path));
}

function buildShaftPiecePath(gear: ProjectGear, shaftClearanceMm: number): string | null {
  const shaftDiameterMm = gear.boreDiameterMm - shaftClearanceMm;

  if (shaftDiameterMm <= 0) {
    return null;
  }

  const shaftRadius = shaftDiameterMm / 2;

  return [
    `M 0 ${formatNumber(-shaftRadius)}`,
    `A ${formatNumber(shaftRadius)} ${formatNumber(shaftRadius)} 0 1 0 0 ${formatNumber(shaftRadius)}`,
    `A ${formatNumber(shaftRadius)} ${formatNumber(shaftRadius)} 0 1 0 0 ${formatNumber(-shaftRadius)}`,
    'Z',
  ].join(' ');
}

function buildGearGroup(
  gear: ProjectGear,
  includeAxleHole: boolean,
  includeShaftPiece: boolean,
  shaftClearanceMm: number,
): string {
  const gearPaths = buildGearPaths(gear, includeAxleHole);
  const shaftPath = includeShaftPiece ? buildShaftPiecePath(gear, shaftClearanceMm) : null;
  const rotation = gear.rotationDegrees === 0 ? '' : ` rotate(${formatNumber(-gear.rotationDegrees)})`;

  return [
    `<g transform="translate(${formatNumber(gear.position.x)} ${formatNumber(-gear.position.y)})${rotation}">`,
    ...gearPaths.map((path) => buildStrokePath(path)),
    shaftPath ? buildStrokePath(shaftPath) : '',
    '</g>',
  ]
    .filter(Boolean)
    .join('');
}

function buildSingleGearSvg(
  gear: ProjectGear,
  options: SvgDocumentOptions = {},
): string {
  const { outerPath, innerCutoutPath, axleHolePath, outerRadiusMm } = buildSpurGearPath(gear);
  const marginMm = options.marginMm ?? Math.max(gear.module * 2, 4);
  const includeAxleHole = options.includeAxleHole ?? true;
  const includeShaftPiece = options.includeShaftPiece ?? false;
  const shaftClearanceMm = options.shaftClearanceMm ?? 0.2;
  const minY = -outerRadiusMm - marginMm;
  const maxY = outerRadiusMm + marginMm;
  const viewBoxX = -outerRadiusMm - marginMm;
  const viewBoxY = minY;
  const viewBoxWidth = (outerRadiusMm + marginMm) * 2;
  const viewBoxHeight = maxY - minY;
  const metadata = options.includeMetadata
    ? buildMetadataBlock(
        JSON.stringify({
          type: 'single-gear-export',
          gear: {
            id: gear.id,
            label: gear.label,
            module: gear.module,
            toothCount: gear.toothCount,
            pressureAngleDegrees: gear.pressureAngleDegrees,
            boreDiameterMm: gear.boreDiameterMm,
            innerCutoutDiameterMm: gear.innerCutoutDiameterMm,
            thicknessMm: gear.thicknessMm,
            shaftClearanceMm,
          },
        }),
      )
    : '';
  const gearPaths = [
    outerPath,
    innerCutoutPath,
    includeAxleHole ? axleHolePath : null,
  ].filter((path): path is string => Boolean(path));
  const shaftPath = includeShaftPiece ? buildShaftPiecePath(gear, shaftClearanceMm) : null;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${formatNumber(viewBoxX)} ${formatNumber(viewBoxY)} ${formatNumber(viewBoxWidth)} ${formatNumber(viewBoxHeight)}" width="${formatNumber(viewBoxWidth)}mm" height="${formatNumber(viewBoxHeight)}mm">`,
    metadata,
    ...gearPaths.map((path) => buildStrokePath(path)),
    shaftPath ? buildStrokePath(shaftPath) : '',
    '</svg>',
  ]
    .filter(Boolean)
    .join('');
}

function calculateProjectBounds(project: GearProject, marginMm: number) {
  const bounds = project.gears.map((gear) => {
    const { outerRadiusMm } = buildSpurGearPath(gear);

    return {
      minX: gear.position.x - outerRadiusMm,
      maxX: gear.position.x + outerRadiusMm,
      minY: -gear.position.y - outerRadiusMm,
      maxY: -gear.position.y + outerRadiusMm,
    };
  });

  const minX = Math.min(...bounds.map((entry) => entry.minX)) - marginMm;
  const maxX = Math.max(...bounds.map((entry) => entry.maxX)) + marginMm;
  const minY = Math.min(...bounds.map((entry) => entry.minY)) - marginMm;
  const maxY = Math.max(...bounds.map((entry) => entry.maxY)) + marginMm;

  return {
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function buildLayoutSvg(project: GearProject, options: SvgDocumentOptions = {}): string {
  const marginMm = options.marginMm ?? 8;
  const includeAxleHole = options.includeAxleHole ?? true;
  const includeShaftPiece = options.includeShaftPiece ?? false;
  const shaftClearanceMm = options.shaftClearanceMm ?? 0.2;
  const bounds = calculateProjectBounds(project, marginMm);
  const metadata = options.includeMetadata
    ? buildMetadataBlock(
        JSON.stringify({
          type: 'layout-export',
          projectId: project.id,
          projectName: project.name,
          gearCount: project.gears.length,
          relationCount: project.relations.length,
          shaftClearanceMm,
        }),
      )
    : '';

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${formatNumber(bounds.minX)} ${formatNumber(bounds.minY)} ${formatNumber(bounds.width)} ${formatNumber(bounds.height)}" width="${formatNumber(bounds.width)}mm" height="${formatNumber(bounds.height)}mm">`,
    metadata,
    ...project.gears.map((gear) =>
      buildGearGroup(gear, includeAxleHole, includeShaftPiece, shaftClearanceMm),
    ),
    '</svg>',
  ].join('');
}

export function buildSelectedGearSvgDocument(
  project: GearProject,
  selectedGearId: string,
  options: SvgDocumentOptions = {},
): string {
  const gear = project.gears.find((entry) => entry.id === selectedGearId);

  if (!gear) {
    throw new Error(`Selected gear ${selectedGearId} was not found`);
  }

  return buildSingleGearSvg(gear, options);
}

export function buildLayoutSvgDocument(
  project: GearProject,
  options: SvgDocumentOptions = {},
): string {
  if (project.gears.length === 0) {
    throw new Error('Cannot export an empty project');
  }

  return buildLayoutSvg(project, options);
}
