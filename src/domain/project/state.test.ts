import { calculateCenterDistance } from '../gears/calculations';
import { createSampleProject } from './sampleProject';
import { createInitialEditorState, projectReducer } from './state';

describe('project reducer', () => {
  it('adds a new free gear and selects it', () => {
    const state = createInitialEditorState(createSampleProject());

    const nextState = projectReducer(state, { type: 'add-gear' });

    expect(nextState.project.gears).toHaveLength(3);
    expect(nextState.selectedGearId).toBe('gear-3');
  });

  it('adds a matching gear with a locked relation', () => {
    const state = createInitialEditorState(createSampleProject());

    const nextState = projectReducer(state, {
      type: 'add-matching-gear',
      sourceGearId: 'gear-driver',
    });

    expect(nextState.project.gears).toHaveLength(3);
    expect(nextState.project.relations).toHaveLength(2);
    expect(nextState.project.relations[1]?.drivenGearId).toBe('gear-3');
  });

  it('snaps a moved gear into mesh distance with a compatible gear', () => {
    const state = createInitialEditorState(createSampleProject());

    const nextState = projectReducer(state, {
      type: 'move-gear',
      gearId: 'gear-driven',
      x: 121,
      y: 61,
    });

    const movedGear = nextState.project.gears.find((gear) => gear.id === 'gear-driven');
    const driverGear = nextState.project.gears.find((gear) => gear.id === 'gear-driver');

    if (!movedGear || !driverGear) {
      throw new Error('Expected sample gears to exist after reducer update');
    }

    expect(
      Math.hypot(movedGear.position.x - driverGear.position.x, movedGear.position.y - driverGear.position.y),
    ).toBeCloseTo(calculateCenterDistance(driverGear, movedGear), 4);
  });

  it('removes a gear and clears attached relations', () => {
    const state = createInitialEditorState(createSampleProject());

    const nextState = projectReducer(state, {
      type: 'remove-gear',
      gearId: 'gear-driver',
    });

    expect(nextState.project.gears.map((gear) => gear.id)).toEqual(['gear-driven']);
    expect(nextState.project.relations).toHaveLength(0);
    expect(nextState.selectedGearId).toBe('gear-driven');
  });

  it('updates a gear and keeps a locked mate at the new center distance', () => {
    const state = createInitialEditorState(createSampleProject());

    const nextState = projectReducer(state, {
      type: 'update-gear',
      gearId: 'gear-driver',
      patch: { toothCount: 30, module: 2.5, label: 'Updated driver' },
    });

    const driverGear = nextState.project.gears.find((gear) => gear.id === 'gear-driver');
    const drivenGear = nextState.project.gears.find((gear) => gear.id === 'gear-driven');

    if (!driverGear || !drivenGear) {
      throw new Error('Expected updated gears to exist');
    }

    expect(driverGear.label).toBe('Updated driver');
    expect(driverGear.pitchDiameterMm).toBe(75);
    expect(
      Math.hypot(
        driverGear.position.x - drivenGear.position.x,
        driverGear.position.y - drivenGear.position.y,
      ),
    ).toBeCloseTo(calculateCenterDistance(driverGear, drivenGear), 4);
  });
});
