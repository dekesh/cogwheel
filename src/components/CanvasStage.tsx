import { useEffect, useMemo, useRef, useState } from 'react';
import { Paper, Stack, Text, Title } from '@mantine/core';

import { GearSvgPreview } from './GearSvgPreview';
import { snapGearPosition } from '../domain/project/layout';
import type { GearProject } from '../domain/project/types';

const PIXELS_PER_MILLIMETER = 4;
const CANVAS_MIN_HEIGHT_MM = 120;
const MINIMUM_GEAR_PREVIEW_SIZE = 72;
const PREVIEW_MARGIN_MM = 4;

type CanvasStageProps = {
  project: GearProject;
  selectedGearId: string | null;
  onMoveGear: (gearId: string, x: number, y: number) => void;
  onSelectGear: (gearId: string) => void;
};

type DragState = {
  gearId: string;
  pointerOffsetX: number;
  pointerOffsetY: number;
};

type DragPreview = {
  movingGearId: string;
  snappedToGearId: string | null;
  previewPosition: { x: number; y: number };
};

export function CanvasStage({
  project,
  selectedGearId,
  onMoveGear,
  onSelectGear,
}: CanvasStageProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);

  function renderGear(gear: GearProject['gears'][number]) {
    const previewDiameterMm = gear.geometry.outsideDiameterMm + PREVIEW_MARGIN_MM * 2;
    const previewSizePx = Math.max(
      MINIMUM_GEAR_PREVIEW_SIZE,
      previewDiameterMm * PIXELS_PER_MILLIMETER,
    );

    return (
      <div
        key={gear.id}
        data-testid={`gear-card-${gear.id}`}
        onPointerDown={(event) => {
          const gearBounds = event.currentTarget.getBoundingClientRect();

          onSelectGear(gear.id);
          setDragState({
            gearId: gear.id,
            pointerOffsetX: event.clientX - gearBounds.left - gearBounds.width / 2,
            pointerOffsetY: event.clientY - gearBounds.top - gearBounds.height / 2,
          });
        }}
        onClick={() => onSelectGear(gear.id)}
        style={{
          position: 'absolute',
          left: gear.position.x * PIXELS_PER_MILLIMETER,
          top: gear.position.y * PIXELS_PER_MILLIMETER,
          width: previewSizePx + 28,
          cursor: dragState?.gearId === gear.id ? 'grabbing' : 'grab',
          transform: `translate(-50%, -50%) rotate(${gear.rotationDegrees}deg)`,
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: previewSizePx + 12,
            height: previewSizePx + 12,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            background:
              selectedGearId === gear.id
                ? 'radial-gradient(circle, rgba(255,244,229,0.95) 0%, rgba(255,244,229,0.2) 62%, transparent 74%)'
                : undefined,
            boxShadow:
              selectedGearId === gear.id ? '0 0 0 2px rgba(197, 107, 16, 0.22)' : 'none',
          }}
        >
          <GearSvgPreview gear={gear} size={previewSizePx} />
        </div>
        <Stack gap={1} align="center">
          <Text fw={700} size="sm">
            {gear.label}
          </Text>
          <Text size="xs" c="dimmed">
            Teeth: {gear.toothCount}
          </Text>
          <Text size="xs" c="dimmed">
            Center: ({gear.position.x.toFixed(1)}, {gear.position.y.toFixed(1)}) mm
          </Text>
          <Text size="xs" c="dimmed">
            Rotation: {gear.rotationDegrees.toFixed(1)}°
          </Text>
        </Stack>
      </div>
    );
  }

  useEffect(() => {
    if (!dragState) {
      setDragPreview(null);
      return undefined;
    }

    const activeDrag = dragState;

    function handlePointerMove(event: PointerEvent) {
      const bounds = canvasRef.current?.getBoundingClientRect();

      if (!bounds) {
        return;
      }

      const x = (event.clientX - bounds.left - activeDrag.pointerOffsetX) / PIXELS_PER_MILLIMETER;
      const y = (event.clientY - bounds.top - activeDrag.pointerOffsetY) / PIXELS_PER_MILLIMETER;
      const movingGear = project.gears.find((gear) => gear.id === activeDrag.gearId);

      if (!movingGear) {
        return;
      }

      const previewResult = snapGearPosition(
        movingGear,
        { x, y },
        project.gears.filter((gear) => gear.id !== activeDrag.gearId),
      );

      setDragPreview({
        movingGearId: activeDrag.gearId,
        snappedToGearId: previewResult.snappedToGearId,
        previewPosition: previewResult.position,
      });

      onMoveGear(activeDrag.gearId, x, y);
    }

    function handlePointerUp() {
      setDragState(null);
      setDragPreview(null);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, onMoveGear, project.gears]);

  const relationLines = project.relations
    .map((relation) => {
      const driver = project.gears.find((gear) => gear.id === relation.driverGearId);
      const driven = project.gears.find((gear) => gear.id === relation.drivenGearId);

      if (!driver || !driven) {
        return null;
      }

      return {
        id: `${relation.driverGearId}-${relation.drivenGearId}`,
        x1: driver.position.x * PIXELS_PER_MILLIMETER,
        y1: driver.position.y * PIXELS_PER_MILLIMETER,
        x2: driven.position.x * PIXELS_PER_MILLIMETER,
        y2: driven.position.y * PIXELS_PER_MILLIMETER,
      };
    })
    .filter((relation): relation is NonNullable<typeof relation> => relation !== null);

  const snapIndicator = useMemo(() => {
    if (!dragPreview?.snappedToGearId) {
      return null;
    }

    const snappedToGear = project.gears.find((gear) => gear.id === dragPreview.snappedToGearId);

    if (!snappedToGear) {
      return null;
    }

    return {
      x1: snappedToGear.position.x * PIXELS_PER_MILLIMETER,
      y1: snappedToGear.position.y * PIXELS_PER_MILLIMETER,
      x2: dragPreview.previewPosition.x * PIXELS_PER_MILLIMETER,
      y2: dragPreview.previewPosition.y * PIXELS_PER_MILLIMETER,
    };
  }, [dragPreview, project.gears]);

  return (
    <Paper
      h="calc(100vh - 120px)"
      p="lg"
      radius="lg"
      shadow="sm"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(247,243,235,0.95) 100%)',
        border: '1px solid rgba(24, 32, 40, 0.08)',
      }}
    >
      <Stack gap="lg" h="100%">
        <div>
          <Title order={3}>Design canvas</Title>
          <Text c="dimmed" size="sm">
            Drag gears directly. Adding a matching gear or dragging near another compatible gear
            will snap it into mesh distance. The canvas expands with the available workspace.
          </Text>
        </div>

        <div
          ref={canvasRef}
          style={{
            position: 'relative',
            width: '100%',
            minHeight: CANVAS_MIN_HEIGHT_MM * PIXELS_PER_MILLIMETER,
            height: '100%',
            flex: 1,
            borderRadius: 18,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(245,240,232,0.95) 100%)',
            border: '1px dashed rgba(24, 32, 40, 0.18)',
            overflow: 'hidden',
          }}
        >
          <svg
            aria-hidden="true"
            width="100%"
            height="100%"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
            }}
          >
            <defs>
              <pattern
                id="canvas-grid"
                width={PIXELS_PER_MILLIMETER * 10}
                height={PIXELS_PER_MILLIMETER * 10}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${PIXELS_PER_MILLIMETER * 10} 0 L 0 0 0 ${PIXELS_PER_MILLIMETER * 10}`}
                  fill="none"
                  stroke="rgba(24, 32, 40, 0.05)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="url(#canvas-grid)"
            />
            {relationLines.map((relation) => (
              <line
                key={relation.id}
                x1={relation.x1}
                y1={relation.y1}
                x2={relation.x2}
                y2={relation.y2}
                stroke="rgba(197, 107, 16, 0.35)"
                strokeDasharray="8 6"
                strokeWidth="2"
              />
            ))}
            {snapIndicator ? (
              <>
                <line
                  x1={snapIndicator.x1}
                  y1={snapIndicator.y1}
                  x2={snapIndicator.x2}
                  y2={snapIndicator.y2}
                  stroke="rgba(46, 160, 67, 0.75)"
                  strokeWidth="3"
                />
                <circle
                  cx={snapIndicator.x2}
                  cy={snapIndicator.y2}
                  r="7"
                  fill="rgba(46, 160, 67, 0.18)"
                  stroke="rgba(46, 160, 67, 0.85)"
                  strokeWidth="2"
                />
              </>
            ) : null}
          </svg>

          {project.gears.map((gear) => renderGear(gear))}
        </div>
      </Stack>
    </Paper>
  );
}
