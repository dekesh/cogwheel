import { Badge, Button, Checkbox, Divider, NumberInput, Stack, Text, Title } from '@mantine/core';

import type { GearProject } from '../domain/project/types';

type ProjectSidebarProps = {
  project: GearProject;
  selectedGearId: string | null;
  onAddGear: () => void;
  onAddMatchingGear: () => void;
  onSelectGear: (gearId: string) => void;
  includeMetadataInExport: boolean;
  onToggleIncludeMetadataInExport: (value: boolean) => void;
  includeAxleHoleInExport: boolean;
  onToggleIncludeAxleHoleInExport: (value: boolean) => void;
  includeShaftPieceInExport: boolean;
  onToggleIncludeShaftPieceInExport: (value: boolean) => void;
  shaftClearanceMm: number;
  onChangeShaftClearanceMm: (value: number) => void;
  onExportSelectedGear: () => void;
  onExportLayout: () => void;
};

export function ProjectSidebar({
  project,
  selectedGearId,
  onAddGear,
  onAddMatchingGear,
  onSelectGear,
  includeMetadataInExport,
  onToggleIncludeMetadataInExport,
  includeAxleHoleInExport,
  onToggleIncludeAxleHoleInExport,
  includeShaftPieceInExport,
  onToggleIncludeShaftPieceInExport,
  shaftClearanceMm,
  onChangeShaftClearanceMm,
  onExportSelectedGear,
  onExportLayout,
}: ProjectSidebarProps) {
  return (
    <Stack gap="md">
      <div>
        <Title order={4}>Project</Title>
        <Text size="sm" c="dimmed">
          Add gears, select a gear, and create matching gears that snap into valid mesh distance.
        </Text>
      </div>

      <Button onClick={onAddGear}>Add gear</Button>
      <Button onClick={onAddMatchingGear} variant="light" disabled={!selectedGearId}>
        Add matching gear
      </Button>
      <Button onClick={onExportSelectedGear} variant="light" disabled={!selectedGearId}>
        Export selected SVG
      </Button>
      <Button onClick={onExportLayout} variant="light" disabled={project.gears.length === 0}>
        Export layout SVG
      </Button>
      <Checkbox
        label="Include export metadata"
        checked={includeMetadataInExport}
        onChange={(event) => onToggleIncludeMetadataInExport(event.currentTarget.checked)}
      />
      <Checkbox
        label="Include axle hole in export"
        checked={includeAxleHoleInExport}
        onChange={(event) => onToggleIncludeAxleHoleInExport(event.currentTarget.checked)}
      />
      <Checkbox
        label="Include shaft piece in export"
        checked={includeShaftPieceInExport}
        onChange={(event) => onToggleIncludeShaftPieceInExport(event.currentTarget.checked)}
      />
      <NumberInput
        label="Shaft clearance (mm)"
        min={0}
        step={0.05}
        decimalScale={2}
        value={shaftClearanceMm}
        onChange={(value) => {
          if (typeof value === 'number') {
            onChangeShaftClearanceMm(value);
          }
        }}
      />

      <Divider />

      <div>
        <Text fw={600}>Printer profile</Text>
        <Text size="sm">Material: {project.printProfile.material}</Text>
        <Text size="sm">Nozzle: {project.printProfile.nozzleDiameterMm} mm</Text>
        <Text size="sm">Layer height: {project.printProfile.layerHeightMm} mm</Text>
      </div>

      <div>
        <Text fw={600}>Gear train</Text>
        <Stack gap="xs" mt="xs">
          {project.gears.map((gear) => (
            <Badge
              key={gear.id}
              variant={selectedGearId === gear.id ? 'filled' : 'light'}
              color="orange"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectGear(gear.id)}
            >
              {gear.label}
            </Badge>
          ))}
        </Stack>
      </div>
    </Stack>
  );
}
