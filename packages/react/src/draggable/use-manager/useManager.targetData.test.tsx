import * as React from 'react';
import { act, screen } from '@testing-library/react';
import { useStore } from '@base-ui/utils/store';
import { describe, it, expect } from 'vitest';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer } from '../../../test/dndEngine';
import { dragSessionStore } from '../../utils/drag-and-drop/dragSessionStore';
import { registerTarget } from '../../utils/drag-and-drop/registrations';
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

describe('drop target imperative data', () => {
  const { renderDnd } = createDndRenderer();

  it('persists payload overrides across drags until the declared payload changes', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    let declaredPayload = 'initial';
    let current: DraggableTargetRecord<string, number> | undefined;
    engine.registerSource(source, { kind: sourceKind });
    engine.registerTarget(target, () => ({
      accept: sourceKind,
      kind: targetKind,
      payload: declaredPayload,
      onDraggableEnter: ({ currentTarget: record }) => {
        current = record;
      },
    }));

    await lift(source);
    await dragEnter(target);
    current!.updatePayload('override');
    expect(current!.payload).toBe('override');
    cancel();

    await lift(source);
    await dragEnter(target);
    expect(current!.payload).toBe('override');
    cancel();

    declaredPayload = 'changed';
    await lift(source);
    await dragEnter(target);
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
    cancel();
  });

  it('shares updates with subsequent callbacks while keeping nested targets independent', async () => {
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
        currentTarget.updatePayload('updated');
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
      ['updated', 7],
    ]);
  });

  it('preserves overrides on unrelated React renders and applies changed props between drags', async () => {
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
    act(() => current!.updatePayload('override'));
    await rerender(<Target payload="initial" revision={1} />);
    expect(current!.payload).toBe('override');
    await rerender(<Target payload="changed" revision={2} />);
    expect(current!.payload).toBe('changed');
    act(() => current!.updatePayload('second override'));
    cancel();

    await rerender(<Target payload="between drags" revision={3} />);
    await rerender(<Target payload="changed" revision={4} />);
    await lift(source);
    await dragEnter(screen.getByTestId('target'));
    expect(current!.payload).toBe('changed');
    cancel();
  });

  it('publishes repeated target updates to React session consumers', async () => {
    function Observer() {
      const target = useStore(dragSessionStore, (session) => session?.location.current.targets[0]);
      return <span data-testid="observer">{`${target?.payload}:${target?.dragData}`}</span>;
    }
    const { engine } = await renderDnd(<Observer />);
    const source = createElement();
    const target = createElement();
    let current: DraggableTargetRecord<string, number> | undefined;
    engine.registerSource(source, { kind: sourceKind });
    engine.registerTarget(target, {
      accept: sourceKind,
      kind: targetKind,
      payload: 'initial',
      onDraggableEnter: ({ currentTarget: record }) => {
        current = record;
      },
    });
    await lift(source);
    await dragEnter(target);
    act(() => current!.updatePayload('first'));
    expect(screen.getByTestId('observer')).toHaveTextContent('first:undefined');
    act(() => current!.updateDragData(1));
    expect(screen.getByTestId('observer')).toHaveTextContent('first:1');
    act(() => current!.updatePayload('second'));
    expect(screen.getByTestId('observer')).toHaveTextContent('second:1');
    act(() => current!.updateDragData(2));
    expect(screen.getByTestId('observer')).toHaveTextContent('second:2');
    const previous = current!;
    cancel();
    expect(screen.getByTestId('observer')).toHaveTextContent('undefined:undefined');
    await lift(source);
    await dragEnter(target);
    expect(screen.getByTestId('observer')).toHaveTextContent('second:undefined');
    act(() => previous.updatePayload('third'));
    expect(screen.getByTestId('observer')).toHaveTextContent('third:undefined');
    act(() => previous.updateDragData(3));
    expect(screen.getByTestId('observer')).toHaveTextContent('third:undefined');
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
    records.get(cellA)!.updatePayload('a');
    records.get(cellA)!.updateDragData(1);

    await dragEnter(cellB);
    expect(records.get(cellB)!.payload).toBe('cell');
    expect(records.get(cellB)!.dragData).toBeUndefined();
    records.get(cellB)!.updatePayload('b');
    records.get(cellB)!.updateDragData(2);

    await dragEnter(cellA);
    // Unregistering one cell leaves the others' data alone.
    unregisterB();
    await dragOver(cellA);
    expect(records.get(cellA)!.payload).toBe('a');
    expect(records.get(cellA)!.dragData).toBe(1);
    cancel();
  });

  it('discards payload overrides when an imperative target unregisters', async () => {
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
    current!.updatePayload('override');
    current!.updateDragData(1);
    unregister();
    engine.registerTarget(target, getParameters);
    await dragEnter(target);
    expect(current!.payload).toBe('initial');
    expect(current!.dragData).toBeUndefined();
    cancel();
  });
});
