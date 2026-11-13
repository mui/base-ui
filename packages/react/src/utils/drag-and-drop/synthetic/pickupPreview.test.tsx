import * as React from 'react';
import { act, screen } from '@mui/internal-test-utils';
import { describe, it, expect, vi } from 'vitest';
import { isJSDOM } from '#test-utils';
import { createDndRenderer } from '../../../../test/dndEngine';
import { Draggable } from '../../../draggable';
import {
  setupDragEngineTests,
  createElement,
  lift,
  flushRaf,
  registerCleanup,
} from '../../../../test/dnd';
import { penDown, penUp } from '../../../../test/syntheticPointer';
import type { DraggableRootRecord } from '../../../draggable/root/DraggableRoot';
import { dragSessionStore, dragSourceStore } from '../dragSessionStore';
import { holdClosedShadowRoots } from '../composedTree';
import { measureSourceSize } from './pickupPreview';

setupDragEngineTests();

describe('sensor session startup', () => {
  const { renderDnd } = createDndRenderer();

  it('finishes a child preview before picking up its parent', async () => {
    const { engine } = await renderDnd(
      <Draggable.Root activation={{ type: 'immediate' }}>
        <Draggable.Trigger data-testid="parent">
          <Draggable.Root activation={{ type: 'immediate' }}>
            <Draggable.Trigger data-testid="child" />
            <Draggable.Positioner />
          </Draggable.Root>
        </Draggable.Trigger>
      </Draggable.Root>,
    );
    const parent = screen.getByTestId('parent');
    const child = screen.getByTestId('child');

    penDown(child, 10, 10);
    penUp(10, 10);
    // The child's preview settles on the next frame.
    expect(child).toHaveAttribute('data-settling');

    penDown(parent, 150, 80);

    // Its `data-settling` and `data-dragging` would otherwise skew the parent's measure.
    expect(child).not.toHaveAttribute('data-settling');
    expect(child).not.toHaveAttribute('data-dragging');
    expect(parent).toHaveAttribute('data-dragging');
    act(() => engine.cancelDrag());
    penUp(150, 80);
  });

  it('carries the typed pre-start source and data into target resolution, preview and start', async () => {
    const kind = Draggable.createKind<string, { offset: number }>('prepared-source');
    function DragDataLabel() {
      const source = Draggable.useActiveDrag(kind);
      return <span data-testid="preview-offset">{source?.dragData?.offset}</span>;
    }
    let candidate: DraggableRootRecord<string, { offset: number }> | undefined;
    const snapshots: unknown[] = [];
    const canDrop = vi.fn(({ source }) => source.dragData?.offset === 12);
    const onMoveStart = vi.fn();
    function Fixture({ offset = 12 }) {
      return (
        <React.Fragment>
          <Draggable.Target accept={kind} canDrop={canDrop} data-testid="target" />
          <Draggable.Root
            kind={kind}
            payload="event"
            activation={{ pen: { type: 'immediate' } }}
            onBeforeMoveStart={({ source }) => {
              candidate = source;
              snapshots.push(source.dragData);
              source.updateDragData({ offset });
              expect(dragSourceStore.state).toBeNull();
              expect(document.querySelector('[data-drag-preview]')).toBeNull();
            }}
            onMoveStart={onMoveStart}
          >
            <Draggable.Trigger data-testid="source" />
            <Draggable.Positioner>
              <Draggable.Preview>
                <DragDataLabel />
              </Draggable.Preview>
            </Draggable.Positioner>
          </Draggable.Root>
        </React.Fragment>
      );
    }
    const { engine, rerender } = await renderDnd(<Fixture />);
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(screen.getByTestId('target'));
    penDown(screen.getByTestId('source'), 10, 10);
    await flushRaf();
    expect(canDrop).toHaveBeenCalled();
    expect(canDrop.mock.results[0].value).toBe(true);
    expect(canDrop.mock.calls[0][0].source).toBe(candidate);
    expect(screen.getByTestId('preview-offset')).toHaveTextContent('12');
    expect(onMoveStart.mock.calls[0][0].source).toBe(candidate);
    expect(candidate?.payload).toBe('event');
    expect(candidate?.dragData).toEqual({ offset: 12 });
    await rerender(<Fixture offset={24} />);
    expect(candidate?.dragData).toEqual({ offset: 12 });
    act(() => engine.cancelDrag());
    penUp(10, 10);
    const previous = candidate;
    penDown(screen.getByTestId('source'), 10, 10);
    await flushRaf();
    expect(candidate).not.toBe(previous);
    expect(candidate?.dragData).toEqual({ offset: 24 });
    expect(snapshots).toEqual([undefined, undefined]);
    penUp(10, 10);
  });

  it('keeps source callbacks compatible when its kind changes mid-drag', async () => {
    const original = Draggable.createKind<string>('original');
    const next = Draggable.createKind<{ id: number }>('next');
    const originalEnd = vi.fn();
    const latestEnd = vi.fn();
    const nextEnd = vi.fn();
    const { rerender, engine } = await renderDnd(
      <Draggable.Root kind={original} payload="first" onMoveEnd={originalEnd}>
        <Draggable.Trigger data-testid="source" />
      </Draggable.Root>,
    );
    await lift(screen.getByTestId('source'));
    await rerender(
      <Draggable.Root kind={next} payload={{ id: 1 }} onMoveEnd={nextEnd}>
        <Draggable.Trigger data-testid="source" />
      </Draggable.Root>,
    );
    act(() => engine.cancelDrag());
    expect(nextEnd).not.toHaveBeenCalled();
    expect(originalEnd).toHaveBeenCalledTimes(1);
    expect(originalEnd.mock.calls[0][0].source.payload).toBe('first');

    await rerender(
      <Draggable.Root kind={original} payload="second" onMoveEnd={latestEnd}>
        <Draggable.Trigger data-testid="source" />
      </Draggable.Root>,
    );
    await lift(screen.getByTestId('source'));
    act(() => engine.cancelDrag());
    expect(latestEnd).toHaveBeenCalledTimes(1);
    expect(latestEnd.mock.calls[0][0].source.payload).toBe('second');
  });

  it('shares drag data with callbacks and subscribers and resets it for the next drag', async () => {
    const kind = Draggable.createKind<string, { offset: number }>('mutable-source');
    const starts: Array<{ payload: string; dragData: { offset: number } | undefined }> = [];
    const monitorStart = vi.fn();
    const onMoveEnd = vi.fn();
    function ActiveData() {
      const source = Draggable.useActiveDrag(kind);
      return (
        <output data-testid="active">
          {source ? `${source.payload}:${source.dragData?.offset}` : 'idle'}
        </output>
      );
    }
    const { engine } = await renderDnd(
      <React.Fragment>
        <Draggable.Root
          kind={kind}
          payload="initial"
          onMoveStart={({ source }) => {
            starts.push({ payload: source.payload, dragData: source.dragData });
            source.updateDragData({ offset: 12 });
            expect(source.dragData).toEqual({ offset: 12 });
          }}
          onMoveEnd={onMoveEnd}
        >
          <Draggable.Trigger data-testid="source" />
        </Draggable.Root>
        <ActiveData />
      </React.Fragment>,
    );
    engine.registerMonitor({ accept: kind, onMoveStart: monitorStart });
    await lift(screen.getByTestId('source'));
    expect(screen.getByTestId('active')).toHaveTextContent('initial:12');
    expect(monitorStart.mock.calls[0][0].source.dragData).toEqual({ offset: 12 });
    const source = monitorStart.mock.calls[0][0].source;
    act(() => source.updateDragData({ offset: 24 }));
    expect(screen.getByTestId('active')).toHaveTextContent('initial:24');
    act(() => engine.cancelDrag());
    expect(onMoveEnd.mock.calls[0][0].source.dragData).toEqual({ offset: 24 });
    await lift(screen.getByTestId('source'));
    expect(starts).toEqual([
      { payload: 'initial', dragData: undefined },
      { payload: 'initial', dragData: undefined },
    ]);
    act(() => source.updateDragData({ offset: 99 }));
    expect(screen.getByTestId('active')).toHaveTextContent('initial:12');
  });

  it('keeps drag data across renders and publishes a changed payload prop', async () => {
    const kind = Draggable.createKind<string, number>('prop-precedence');
    const onMoveStart = vi.fn(({ source }) => {
      source.updateDragData(42);
    });
    function ActiveData() {
      const source = Draggable.useActiveDrag(kind);
      return (
        <output data-testid="active">
          {source ? `${source.payload}:${source.dragData}` : 'idle'}
        </output>
      );
    }
    function Demo({ payload, label }: { payload: string; label: string }) {
      return (
        <React.Fragment>
          <Draggable.Root kind={kind} payload={payload} onMoveStart={onMoveStart}>
            <Draggable.Trigger data-testid="source">{label}</Draggable.Trigger>
          </Draggable.Root>
          <ActiveData />
        </React.Fragment>
      );
    }
    const { rerender } = await renderDnd(<Demo payload="initial" label="first" />);
    await lift(screen.getByTestId('source'));
    await rerender(<Demo payload="initial" label="second" />);
    expect(screen.getByTestId('active')).toHaveTextContent('initial:42');
    await rerender(<Demo payload="changed" label="second" />);
    expect(screen.getByTestId('active')).toHaveTextContent('changed:42');
    expect(onMoveStart.mock.calls[0][0].source.payload).toBe('changed');
  });

  it('publishes changed payload props to memoized observers', async () => {
    const kind = Draggable.createKind<string>('observed-source');
    const Observer = React.memo(function Observer() {
      const source = Draggable.useActiveDrag(kind);
      return <output data-testid="observed">{source?.payload}</output>;
    });
    function Demo({ payload }: { payload: string }) {
      return (
        <React.Fragment>
          <Draggable.Root kind={kind} payload={payload}>
            <Draggable.Trigger data-testid="source" />
          </Draggable.Root>
          <Observer />
        </React.Fragment>
      );
    }
    const { rerender } = await renderDnd(<Demo payload="first" />);
    await lift(screen.getByTestId('source'));
    expect(screen.getByTestId('observed')).toHaveTextContent('first');
    await rerender(<Demo payload="second" />);
    expect(screen.getByTestId('observed')).toHaveTextContent('second');
  });

  it('does not republish the source when a render keeps its payload', async () => {
    const kind = Draggable.createKind<string>('unchanged-source');
    let observerUpdates = 0;
    const Observer = React.memo(function Observer() {
      Draggable.useActiveDrag(kind);
      observerUpdates += 1;
      return null;
    });
    function Demo({ label }: { label: string }) {
      return (
        <React.Fragment>
          <Draggable.Root kind={kind} payload="item">
            <Draggable.Trigger data-testid="source">
              <output data-testid="label">{label}</output>
            </Draggable.Trigger>
          </Draggable.Root>
          <Observer />
        </React.Fragment>
      );
    }
    const { rerender } = await renderDnd(<Demo label="first" />);
    await lift(screen.getByTestId('source'));
    const updatesBefore = observerUpdates;
    await rerender(<Demo label="second" />);
    expect(screen.getAllByTestId('label')[0]).toHaveTextContent('second');
    expect(observerUpdates).toBe(updatesBefore);
  });

  it('preserves function payloads and reads changes from an imperative registration getter', async () => {
    const { engine } = await renderDnd();
    const element = createElement();
    const initial = vi.fn();
    const next = vi.fn();
    const onMoveStart = vi.fn();
    let payload = initial;
    engine.registerSource(element, () => ({ payload, onMoveStart }));
    await lift(element);
    const source = onMoveStart.mock.calls[0][0].source;
    expect(source.payload).toBe(initial);
    payload = next;
    expect(source.payload).toBe(next);
    expect(initial).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('honors cancellation in a modifier', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const onMoveStart = vi.fn();
    engine.registerSource(source, {
      payload: 'item',
      modifiers: ({ point }) => {
        engine.cancelDrag();
        return point;
      },
      onMoveStart,
    });
    await lift(source, { expectNoDrag: true });
    expect(onMoveStart).not.toHaveBeenCalled();
    expect(dragSessionStore.state).toBeNull();
    expect(source).not.toHaveAttribute('data-dragging');
  });
});

// Needs layout: `offsetWidth` is 0 in jsdom.
describe.skipIf(isJSDOM)('measureSourceSize', () => {
  // A closed root hides `assignedSlot`, so the parent scale is found only through a held root.
  it.each(['open', 'closed'] as const)(
    'scales a transformed source by the wrapper around its slot (%s root)',
    (mode) => {
      const host = createElement();
      const wrapper = document.createElement('div');
      wrapper.style.transform = 'scale(2)';
      wrapper.appendChild(document.createElement('slot'));
      host.attachShadow({ mode }).appendChild(wrapper);
      registerCleanup(holdClosedShadowRoots(wrapper));
      const source = document.createElement('div');
      // Its own transform sends the measure through the parent's scale.
      source.style.cssText = 'width: 100px; height: 40px; transform: scale(1.5);';
      host.appendChild(source);

      expect(measureSourceSize(source, source.getBoundingClientRect())).toEqual({
        width: 200,
        height: 80,
      });
    },
  );
});
