import * as React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer } from '../../../test/dndEngine';
import { registerTarget } from '../../utils/drag-and-drop/dropTarget';
import {
  cancel,
  createElement,
  dragEnter,
  dragOver,
  lift,
  registerCleanup,
  setupDragEngineTests,
} from '../../../test/dnd';
import type { DraggableTargetRecord } from '../target/DraggableTarget';

setupDragEngineTests();

const sourceKind = Draggable.createKind('source');
const targetKind = Draggable.createKind<string, number>('target');

describe('drop target record data', () => {
  const { renderDnd } = createDndRenderer();

  it("reads its registration's latest payload and keeps the last one after a kind change", async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    let kind = targetKind;
    let payload = 'initial';
    let current: DraggableTargetRecord<string, number> | undefined;
    engine.registerSource(source, { kind: sourceKind });
    engine.registerTarget(target, () => ({
      accept: sourceKind,
      kind,
      payload,
      onDraggableEnter: ({ currentTarget: record }) => {
        current = record;
      },
    }));

    await lift(source);
    await dragEnter(target);
    expect(current!.payload).toBe('initial');
    payload = 'changed';
    expect(current!.payload).toBe('changed');
    kind = Draggable.createKind<string, number>('other-target');
    payload = 'other';
    expect(current!.payload).toBe('changed');
    cancel();
  });

  it('retains drag data on reentry and resets it for the next drag', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const elsewhere = createElement();
    let current: DraggableTargetRecord<string, number> | undefined;
    engine.registerSource(source, { kind: sourceKind });
    engine.registerTarget(target, {
      accept: sourceKind,
      kind: targetKind,
      payload: 'target',
      onDraggableEnter: ({ currentTarget: record }) => {
        current = record;
      },
    });

    await lift(source);
    await dragEnter(target);
    expect(current!.dragData).toBeUndefined();
    current!.updateDragData(42);
    expect(current!.dragData).toBe(42);
    await dragEnter(elsewhere);
    await dragEnter(target);
    expect(current!.dragData).toBe(42);
    cancel();
    // A record from a finished drag keeps its data after the session ends.
    const finished = current!;
    expect(finished.dragData).toBe(42);

    await lift(source);
    await dragEnter(target);
    expect(current!.dragData).toBeUndefined();
    expect(finished.dragData).toBe(42);
    // The finished record writes only its own drag's data.
    finished.updateDragData(7);
    expect(finished.dragData).toBe(7);
    expect(current!.dragData).toBeUndefined();
    cancel();
  });

  it('shares drag data with later callbacks while keeping nested targets independent', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const outer = createElement();
    const inner = createElement();
    outer.appendChild(inner);
    const observed: [string, number | undefined][] = [];
    engine.registerSource(source, { kind: sourceKind });
    engine.registerTarget(outer, {
      accept: sourceKind,
      kind: targetKind,
      payload: 'outer',
      onDraggableEnter: ({ currentTarget }) => {
        observed.push([currentTarget.payload, currentTarget.dragData]);
      },
    });
    engine.registerTarget(inner, {
      accept: sourceKind,
      kind: targetKind,
      payload: 'inner',
      onDraggableEnter: ({ currentTarget }) => {
        currentTarget.updateDragData(7);
      },
      onDraggableLeave: ({ currentTarget }) => {
        observed.push([currentTarget.payload, currentTarget.dragData]);
      },
    });

    await lift(source);
    await dragEnter(inner);
    cancel();
    expect(observed).toEqual([
      ['outer', undefined],
      ['inner', 7],
    ]);
  });

  it('reads a changed payload prop on a record handed out earlier in the drag', async () => {
    let current: DraggableTargetRecord<string, number> | undefined;
    function Target({ payload, revision }: { payload: string; revision: number }) {
      return (
        <Draggable.Target
          data-testid="target"
          data-revision={revision}
          accept={sourceKind}
          kind={targetKind}
          payload={payload}
          onDraggableEnter={({ currentTarget }) => {
            current = currentTarget;
          }}
        />
      );
    }
    const { engine, rerender } = await renderDnd(<Target payload="initial" revision={0} />);
    const source = createElement();
    engine.registerSource(source, { kind: sourceKind });
    await lift(source);
    await dragEnter(screen.getByTestId('target'));
    const record = current!;
    await rerender(<Target payload="initial" revision={1} />);
    expect(record.payload).toBe('initial');
    await rerender(<Target payload="changed" revision={2} />);
    expect(current).toBe(record);
    expect(record.payload).toBe('changed');
    cancel();
  });

  it('keeps separate data for elements registered with the same getter', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const cellA = createElement();
    const cellB = createElement();
    // The latest record each cell received.
    const records = new Map<Element, DraggableTargetRecord<string, number>>();
    const keepRecord = ({
      currentTarget,
    }: {
      currentTarget: DraggableTargetRecord<string, number>;
    }) => {
      records.set(currentTarget.element, currentTarget);
    };
    // One getter shared by every cell, as a grid registering its cells in a loop
    // might do. The test engine wraps each getter, so register through the raw API.
    const getParameters = () => ({
      accept: sourceKind,
      kind: targetKind,
      payload: 'cell',
      onDraggableEnter: keepRecord,
      onDraggableMove: keepRecord,
    });
    engine.registerSource(source, { kind: sourceKind });
    registerCleanup(registerTarget(cellA, getParameters));
    const unregisterB = registerTarget(cellB, getParameters);
    registerCleanup(unregisterB);

    await lift(source);
    await dragEnter(cellA);
    records.get(cellA)!.updateDragData(1);

    await dragEnter(cellB);
    expect(records.get(cellB)!.dragData).toBeUndefined();
    records.get(cellB)!.updateDragData(2);

    await dragEnter(cellA);
    // Unregistering one cell leaves the others' data alone.
    unregisterB();
    await dragOver(cellA);
    expect(records.get(cellA)!.dragData).toBe(1);
    cancel();
  });

  it('discards drag data when an imperative target unregisters', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    let current: DraggableTargetRecord<string, number> | undefined;
    const parameters = {
      accept: sourceKind,
      kind: targetKind,
      payload: 'initial',
      onDraggableEnter: ({
        currentTarget: record,
      }: {
        currentTarget: DraggableTargetRecord<string, number>;
      }) => {
        current = record;
      },
    };
    const getParameters = () => parameters;
    engine.registerSource(source, { kind: sourceKind });
    const unregister = engine.registerTarget(target, getParameters);
    await lift(source);
    await dragEnter(target);
    current!.updateDragData(1);
    unregister();
    engine.registerTarget(target, getParameters);
    await dragEnter(target);
    expect(current!.dragData).toBeUndefined();
    cancel();
  });
});
