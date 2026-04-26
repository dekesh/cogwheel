import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionIcon, Group, Paper, Stack, Text, Title } from '@mantine/core';

import { GearSvgPreview } from './GearSvgPreview';
import { snapGearPosition } from '../domain/project/layout';
import type { GearProject } from '../domain/project/types';

const PIXELS_PER_MILLIMETER = 4;
const CANVAS_WIDTH_MM = 180;
const CANVAS_HEIGHT_MM = 120;
const CANVAS_MIN_HEIGHT_MM = 120;
const MINIMUM_GEAR_PREVIEW_SIZE = 72;
const PREVIEW_MARGIN_MM = 4;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

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
  const [zoom, setZoom] = useState(1);
  const pixelsPerMillimeter = PIXELS_PER_MILLIMETER * zoom;
  const contentWidthPx = CANVAS_WIDTH_MM * pixelsPerMillimeter;
  const contentHeightPx = CANVAS_HEIGHT_MM * pixelsPerMillimeter;

  function changeZoom(delta: number) {
    setZoom((current) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((current + delta).toFixed(2)))),
    );
  }

  function renderGear(gear: GearProject['gears'][number]) {
    const previewDiameterMm = gear.geometry.outsideDiameterMm + PREVIEW_MARGIN_MM * 2;
    const previewSizePx = Math.max(
      MINIMUM_GEAR_PREVIEW_SIZE,
      previewDiameterMm * pixelsPerMillimeter,
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
          left: gear.position.x * pixelsPerMillimeter,
          top: gear.position.y * pixelsPerMillimeter,
          width: previewSizePx + 28,
          cursor: dragState?.gearId === gear.id ? 'grabbing' : 'grab',
          transform: 'translate(-50%, -50%)',
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
            transform: `rotate(${gear.rotationDegrees}deg)`,
            transformOrigin: '50% 50%',
            borderRadius: '50%',
            background:
              selectedGearId === gear.id
                ? 'radial-gradient(circle, rgba(255,244,229,0.95) 0%, rgba(255,244,229,0.2) 62%, transparent 74%)'
                : undefined,
            boxShadow: selectedGearId === gear.id ? '0 0 0 2px rgba(197, 107, 16, 0.22)' : 'none',
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

      const scrollLeft = canvasRef.current?.scrollLeft ?? 0;
      const scrollTop = canvasRef.current?.scrollTop ?? 0;
      const x =
        (event.clientX - bounds.left + scrollLeft - activeDrag.pointerOffsetX) /
        pixelsPerMillimeter;
      const y =
        (event.clientY - bounds.top + scrollTop - activeDrag.pointerOffsetY) / pixelsPerMillimeter;
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
  }, [dragState, onMoveGear, pixelsPerMillimeter, project.gears]);

  const relationLines = project.relations
    .map((relation) => {
      const driver = project.gears.find((gear) => gear.id === relation.driverGearId);
      const driven = project.gears.find((gear) => gear.id === relation.drivenGearId);

      if (!driver || !driven) {
        return null;
      }

      return {
        id: `${relation.driverGearId}-${relation.drivenGearId}`,
        x1: driver.position.x * pixelsPerMillimeter,
        y1: driver.position.y * pixelsPerMillimeter,
        x2: driven.position.x * pixelsPerMillimeter,
        y2: driven.position.y * pixelsPerMillimeter,
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
      x1: snappedToGear.position.x * pixelsPerMillimeter,
      y1: snappedToGear.position.y * pixelsPerMillimeter,
      x2: dragPreview.previewPosition.x * pixelsPerMillimeter,
      y2: dragPreview.previewPosition.y * pixelsPerMillimeter,
    };
  }, [dragPreview, pixelsPerMillimeter, project.gears]);

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
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={3}>Design canvas</Title>
            <Text c="dimmed" size="sm">
              Drag gears directly. Adding a matching gear or dragging near another compatible gear
              will snap it into mesh distance. The canvas expands with the available workspace.
            </Text>
          </div>
          <Group gap="xs" align="center">
            <ActionIcon
              variant="light"
              aria-label="Zoom out"
              onClick={() => changeZoom(-ZOOM_STEP)}
              disabled={zoom <= MIN_ZOOM}
            >
              -
            </ActionIcon>
            <Text size="sm" miw={64} ta="center">
              Zoom {Math.round(zoom * 100)}%
            </Text>
            <ActionIcon
              variant="light"
              aria-label="Zoom in"
              onClick={() => changeZoom(ZOOM_STEP)}
              disabled={zoom >= MAX_ZOOM}
            >
              +
            </ActionIcon>
          </Group>
        </Group>

        <div
          ref={canvasRef}
          style={{
            position: 'relative',
            width: '100%',
            minHeight: CANVAS_MIN_HEIGHT_MM * PIXELS_PER_MILLIMETER,
            height: '100%',
            flex: 1,
            overflow: 'auto',
            borderRadius: 18,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(245,240,232,0.95) 100%)',
            border: '1px dashed rgba(24, 32, 40, 0.18)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              minWidth: '100%',
              minHeight: '100%',
              width: contentWidthPx,
              height: contentHeightPx,
            }}
          >
            <svg
              aria-hidden="true"
              width={contentWidthPx}
              height={contentHeightPx}
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
              }}
            >
              <defs>
                <pattern
                  id="canvas-grid"
                  width={pixelsPerMillimeter * 10}
                  height={pixelsPerMillimeter * 10}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${pixelsPerMillimeter * 10} 0 L 0 0 0 ${pixelsPerMillimeter * 10}`}
                    fill="none"
                    stroke="rgba(24, 32, 40, 0.05)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width={contentWidthPx} height={contentHeightPx} fill="url(#canvas-grid)" />
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
        </div>
      </Stack>
    </Paper>
  );
}
