import { useReducer, useState } from 'react';
import { AppShell, Group, Stack, Text, Title } from '@mantine/core';

import { CanvasStage } from './components/CanvasStage';
import { GearInspectorPanel } from './components/GearInspectorPanel';
import { ProjectSidebar } from './components/ProjectSidebar';
import {
  buildLayoutSvgDocument,
  buildSelectedGearSvgDocument,
  type SvgExportMode,
} from './domain/export/svgDocument';
import { createSampleProject } from './domain/project/sampleProject';
import { createInitialEditorState, projectReducer } from './domain/project/state';
import { downloadTextFile } from './utils/download';

const initialState = createInitialEditorState(createSampleProject());

export function App() {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const [includeMetadataInExport, setIncludeMetadataInExport] = useState(true);
  const [includeAxleHoleInExport, setIncludeAxleHoleInExport] = useState(true);
  const [includeShaftPieceInExport, setIncludeShaftPieceInExport] = useState(false);
  const [shaftClearanceMm, setShaftClearanceMm] = useState(0.2);
  const [exportMode, setExportMode] = useState<SvgExportMode>('contour');

  function handleExportSelectedGear() {
    if (!state.selectedGearId) {
      return;
    }

    const selectedGear = state.project.gears.find((gear) => gear.id === state.selectedGearId);

    if (!selectedGear) {
      return;
    }

    const document = buildSelectedGearSvgDocument(state.project, state.selectedGearId, {
      includeMetadata: includeMetadataInExport,
      includeAxleHole: includeAxleHoleInExport,
      includeShaftPiece: includeShaftPieceInExport,
      shaftClearanceMm,
      exportMode,
    });

    downloadTextFile(
      `${selectedGear.label.replaceAll(/\s+/g, '-').toLowerCase()}.svg`,
      document,
      'image/svg+xml',
    );
  }

  function handleExportLayout() {
    const document = buildLayoutSvgDocument(state.project, {
      includeMetadata: includeMetadataInExport,
      includeAxleHole: includeAxleHoleInExport,
      includeShaftPiece: includeShaftPieceInExport,
      shaftClearanceMm,
      exportMode,
    });

    downloadTextFile(
      `${state.project.name.replaceAll(/\s+/g, '-').toLowerCase()}-layout.svg`,
      document,
      'image/svg+xml',
    );
  }

  return (
    <AppShell
      header={{ height: 72 }}
      navbar={{ width: 320, breakpoint: 0 }}
      aside={{ width: 360, breakpoint: 0 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" justify="space-between" px="lg">
          <Stack gap={2}>
            <Title order={2}>Cogwheel Designer</Title>
            <Text size="sm" c="dimmed">
              Spur gear design for dimensionally correct 3D-print-ready SVG export.
            </Text>
          </Stack>
          <Text size="sm" c="dimmed">
            Active slice: add gears, drag gears, and snap compatible gears into mesh.
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" style={{ overflowY: 'auto' }}>
        <ProjectSidebar
          project={state.project}
          selectedGearId={state.selectedGearId}
          onAddGear={() => dispatch({ type: 'add-gear' })}
          onAddMatchingGear={() =>
            state.selectedGearId
              ? dispatch({ type: 'add-matching-gear', sourceGearId: state.selectedGearId })
              : undefined
          }
          onSelectGear={(gearId) => dispatch({ type: 'select-gear', gearId })}
          includeMetadataInExport={includeMetadataInExport}
          onToggleIncludeMetadataInExport={setIncludeMetadataInExport}
          includeAxleHoleInExport={includeAxleHoleInExport}
          onToggleIncludeAxleHoleInExport={setIncludeAxleHoleInExport}
          includeShaftPieceInExport={includeShaftPieceInExport}
          onToggleIncludeShaftPieceInExport={setIncludeShaftPieceInExport}
          shaftClearanceMm={shaftClearanceMm}
          onChangeShaftClearanceMm={setShaftClearanceMm}
          exportMode={exportMode}
          onChangeExportMode={setExportMode}
          onExportSelectedGear={handleExportSelectedGear}
          onExportLayout={handleExportLayout}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <CanvasStage
          project={state.project}
          selectedGearId={state.selectedGearId}
          onMoveGear={(gearId, x, y) => dispatch({ type: 'move-gear', gearId, x, y })}
          onSelectGear={(gearId) => dispatch({ type: 'select-gear', gearId })}
        />
      </AppShell.Main>

      <AppShell.Aside p="md" style={{ overflowY: 'auto' }}>
        <GearInspectorPanel
          project={state.project}
          selectedGearId={state.selectedGearId}
          onRemoveGear={(gearId) => dispatch({ type: 'remove-gear', gearId })}
          onRotateGear={(gearId, rotationDegrees) =>
            dispatch({ type: 'rotate-gear', gearId, rotationDegrees })
          }
          onUpdateGear={(gearId, patch) => dispatch({ type: 'update-gear', gearId, patch })}
        />
      </AppShell.Aside>
    </AppShell>
  );
}
