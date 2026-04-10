import { createSampleProject } from '../project/sampleProject';
import { buildLayoutSvgDocument, buildSelectedGearSvgDocument } from './svgDocument';

describe('SVG document export', () => {
  it('builds a single-gear SVG document with optional metadata', () => {
    const project = createSampleProject();

    const svg = buildSelectedGearSvgDocument(project, 'gear-driver', {
      includeMetadata: true,
    });

    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('<metadata>');
    expect(svg).toContain('single-gear-export');
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('width="');
    expect(svg).toContain('<path d="M ');
  });

  it('can export filled inside geometry for programs that expect solid shapes', () => {
    const project = createSampleProject();

    const svg = buildSelectedGearSvgDocument(project, 'gear-driver', {
      exportMode: 'inside',
    });

    expect(svg).toContain('fill="#182028"');
    expect(svg).toContain('fill-rule="evenodd"');
    expect(svg).toContain('stroke="none"');
    expect(svg).not.toContain('fill="none"');
  });

  it('builds a layout SVG document containing multiple translated gears', () => {
    const project = createSampleProject();

    const svg = buildLayoutSvgDocument(project, {
      includeMetadata: false,
    });

    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).not.toContain('<metadata>');
    expect(svg).toContain('translate(');
    expect(svg.match(/<g transform=/g)?.length).toBe(project.gears.length);
  });

  it('can export a selected gear without the axle hole', () => {
    const project = createSampleProject();

    const svg = buildSelectedGearSvgDocument(project, 'gear-driver', {
      includeAxleHole: false,
    });

    expect(svg).toContain('fill="none"');
  });

  it('can export a shaft piece smaller than the axle hole by the configured clearance', () => {
    const project = createSampleProject();

    const svg = buildSelectedGearSvgDocument(project, 'gear-driver', {
      includeMetadata: true,
      includeShaftPiece: true,
      shaftClearanceMm: 0.4,
    });

    expect(svg).toContain('shaftClearanceMm');
    expect(svg).toContain('A 2.300 2.300');
    expect(svg).not.toContain('<g transform="translate(0 ');
  });

  it('records the export mode in metadata when requested', () => {
    const project = createSampleProject();

    const svg = buildLayoutSvgDocument(project, {
      includeMetadata: true,
      exportMode: 'inside',
    });

    expect(svg).toContain('&quot;exportMode&quot;:&quot;inside&quot;');
  });

  it('keeps the inner cutout contour when only the axle hole is excluded', () => {
    const project = createSampleProject();
    project.gears[0].innerCutoutDiameterMm = 16;

    const svg = buildSelectedGearSvgDocument(project, 'gear-driver', {
      includeAxleHole: false,
    });

    expect(svg).toContain('A 8.000 8.000');
    expect(svg).not.toContain('A 2.500 2.500');
  });
});
