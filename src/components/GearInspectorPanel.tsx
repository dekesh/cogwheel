import { Alert, Button, Divider, Select, Stack, Text, TextInput, Title } from '@mantine/core';

import { WheelNumberInput } from './WheelNumberInput';
import { validateSpurGear } from '../domain/gears/calculations';
import type { ProjectGear, GearProject } from '../domain/project/types';

type GearInspectorPanelProps = {
  project: GearProject;
  selectedGearId: string | null;
  onRemoveGear: (gearId: string) => void;
  onRotateGear: (gearId: string, rotationDegrees: number) => void;
  onUpdateGear: (
    gearId: string,
    patch: Partial<
      Pick<
        ProjectGear,
        | 'label'
        | 'color'
        | 'module'
        | 'toothCount'
        | 'pressureAngleDegrees'
        | 'thicknessMm'
        | 'boreDiameterMm'
        | 'innerCutoutDiameterMm'
        | 'backlashMm'
      >
    >,
  ) => void;
};

export function GearInspectorPanel({
  project,
  selectedGearId,
  onRemoveGear,
  onRotateGear,
  onUpdateGear,
}: GearInspectorPanelProps) {
  const selectedGear =
    project.gears.find((gear) => gear.id === selectedGearId) ?? project.gears[0] ?? null;

  if (!selectedGear) {
    return (
      <Stack gap="md">
        <div>
          <Title order={4}>Inspector</Title>
          <Text size="sm" c="dimmed">
            Select or add a gear to inspect and edit it.
          </Text>
        </div>
      </Stack>
    );
  }

  const issues = validateSpurGear(selectedGear);
  const colorOptions = ['orange', 'blue', 'teal', 'grape', 'red'].map((value) => ({
    value,
    label: value,
  }));

  return (
    <Stack gap="md">
      <div>
        <Title order={4}>Inspector</Title>
        <Text size="sm" c="dimmed">
          Pressure angle changes the tooth flank shape but can look subtle in 2D. Thickness is the
          3D print depth and does not change the SVG outline.
        </Text>
      </div>

      <Divider />

      <div>
        <Text fw={600}>{selectedGear.label}</Text>
        <Text size="sm">Pressure angle: {selectedGear.pressureAngleDegrees}°</Text>
        <Text size="sm">Thickness: {selectedGear.thicknessMm.toFixed(2)} mm</Text>
        <Text size="sm">Backlash: {selectedGear.backlashMm.toFixed(2)} mm</Text>
        <Text size="sm">Rotation: {selectedGear.rotationDegrees.toFixed(1)}°</Text>
        <Text size="sm">Base diameter: {selectedGear.geometry.baseDiameterMm.toFixed(2)} mm</Text>
        <Text size="sm">
          Axle gap to rim:{' '}
          {Math.max(
            0,
            (selectedGear.innerCutoutDiameterMm - selectedGear.boreDiameterMm) / 2,
          ).toFixed(2)}{' '}
          mm
        </Text>
        <Text size="sm">
          Position: ({selectedGear.position.x.toFixed(1)}, {selectedGear.position.y.toFixed(1)}) mm
        </Text>
      </div>

      <Divider />

      <Stack gap="xs">
        <TextInput
          label="Label"
          value={selectedGear.label}
          onChange={(event) => onUpdateGear(selectedGear.id, { label: event.currentTarget.value })}
        />
        <Select
          label="Color"
          data={colorOptions}
          value={selectedGear.color}
          onChange={(value) => {
            if (value) {
              onUpdateGear(selectedGear.id, { color: value });
            }
          }}
        />
        <WheelNumberInput
          label="Teeth"
          min={4}
          step={1}
          value={selectedGear.toothCount}
          onChange={(value) => onUpdateGear(selectedGear.id, { toothCount: value })}
        />
        <WheelNumberInput
          label="Module"
          min={0.2}
          step={0.1}
          decimalScale={2}
          value={selectedGear.module}
          onChange={(value) => onUpdateGear(selectedGear.id, { module: value })}
        />
        <WheelNumberInput
          label="Pressure angle (degrees)"
          min={14.5}
          max={30}
          step={0.5}
          decimalScale={1}
          value={selectedGear.pressureAngleDegrees}
          onChange={(value) => onUpdateGear(selectedGear.id, { pressureAngleDegrees: value })}
        />
        <WheelNumberInput
          label="Thickness / print depth (mm)"
          min={0.5}
          step={0.5}
          decimalScale={2}
          value={selectedGear.thicknessMm}
          onChange={(value) => onUpdateGear(selectedGear.id, { thicknessMm: value })}
        />
        <WheelNumberInput
          label="Bore diameter (mm)"
          min={0}
          step={0.1}
          decimalScale={2}
          value={selectedGear.boreDiameterMm}
          onChange={(value) => onUpdateGear(selectedGear.id, { boreDiameterMm: value })}
        />
        <WheelNumberInput
          label="Inner cutout diameter (mm)"
          min={0}
          step={0.5}
          decimalScale={2}
          value={selectedGear.innerCutoutDiameterMm}
          onChange={(value) => onUpdateGear(selectedGear.id, { innerCutoutDiameterMm: value })}
        />
        <WheelNumberInput
          label="Rotation (degrees)"
          step={1}
          decimalScale={1}
          value={selectedGear.rotationDegrees}
          onChange={(value) => onRotateGear(selectedGear.id, value)}
        />
        <WheelNumberInput
          label="Backlash (mm)"
          step={0.01}
          decimalScale={3}
          value={selectedGear.backlashMm}
          onChange={(value) => onUpdateGear(selectedGear.id, { backlashMm: value })}
        />
      </Stack>

      <Alert color="yellow" title="Warnings remain permissive">
        {issues.length === 0 ? 'No geometry warnings for the sample gear.' : issues[0].message}
      </Alert>

      <Button color="red" variant="light" onClick={() => onRemoveGear(selectedGear.id)}>
        Remove gear
      </Button>
    </Stack>
  );
}
