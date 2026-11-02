import * as React from 'react';
import { act, screen } from '@mui/internal-test-utils';
import { describe, it, expect, vi } from 'vitest';
import { createDndRenderer } from '../../../../test/dndEngine';
import { Draggable } from '../../../draggable';
import { setupDragEngineTests, createElement, lift, flushRaf } from '../../../../test/dnd';
import { createPreviewAndStartSession } from './pickupPreview';
import { createDragSource } from '../dragSource';
import { penDown, penUp } from '../../../../test/syntheticPointer';
import type { DraggableRootRecord } from '../../../draggable/root/DraggableRoot';
import { getInput } from '../utils';
import { dragPreviewStore } from '../overlay/dragPreviewStore';
import { dragSessionStore, dragSourceStore } from '../dragSessionStore';

setupDragEngineTests();

describe('sensor session startup', () => {
  const { renderDnd } = createDndRenderer();

  it('finishes a child preview before picking up its parent', async () => {
    const { engine } = await renderDnd();
    const parent = createElement();
    const child = createElement();
    child.id = 'settling-child';
    parent.appendChild(child);
    engine.registerSource(parent, { activation: { type: 'immediate' } });
    engine.registerSource(child, { activation: { type: 'immediate' } });

    penDown(child, 10, 10);
    penUp(10, 10);
    expect(child).toHaveAttribute('data-settling');

    penDown(parent, 150, 80);

    const ids = Array.from(document.querySelectorAll('[id]'), (node) => node.id);
    expect(ids.length).toBe(new Set(ids).size);
    expect(child).not.toHaveAttribute('data-settling');
    expect(parent.querySelector('[data-drag-preview]')).toBeNull();
    act(() => engine.cancelDrag());
    penUp(150, 80);
  });

  it('carries the typed pre-start source and data into target resolution, preview and start', async () => {
    const kind = Draggable.createKind<string, { offset: number }>('prepared-source');
    let candidate: DraggableRootRecord<string, { offset: number }> | undefined;
    const snapshots: unknown[] = [];
    const canDrop = vi.fn(({ source }) => source.dragData?.offset === 12);
    const preview = vi.fn(({ source }) => <span>{source.dragData?.offset}</span>);
    const onMoveStart = vi.fn();
    function Fixture({ offset = 12 }) {
      return (
        <React.Fragment>
          <Draggable.Target accept={kind} canDrop={canDrop} data-testid="target" />
          <Draggable.Root
            kind={kind}
            payload="event"
            data-testid="source"
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
            <Draggable.Preview kind={kind}>{preview}</Draggable.Preview>
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
    expect(preview.mock.results[0].value.props.children).toBe(12);
    expect(preview.mock.calls[0][0].source).toBe(candidate);
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

  it('removes a cloned preview when its offset callback throws', () => {
    const element = createElement();
    const kind = Draggable.createKind('offset-error');
    expect(() =>
      createPreviewAndStartSession({
        dragSource: createDragSource(element, kind.id, undefined, null),
        initialInput: getInput(new MouseEvent('pointerdown', { clientX: 10, clientY: 10 })),
        initialTarget: element,
        startReason: 'pointer',
        pressPoint: { x: 10, y: 10 },
        sourceRect: element.getBoundingClientRect(),
        isPickupCurrent: () => true,
        draggableParameters: {
          kind,
          preview: {
            offset() {
              throw new Error('offset failed');
            },
          },
        },
      }),
    ).toThrow('offset failed');
    expect(document.querySelector('[data-drag-preview]')).toBeNull();
    expect(element.parentElement?.querySelector('[popover]')).toBeNull();
    expect(dragSessionStore.state).toBeNull();
  });

  it('keeps source callbacks compatible when its kind changes mid-drag', async () => {
    const original = Draggable.createKind<string>('original');
    const next = Draggable.createKind<{ id: number }>('next');
    const originalEnd = vi.fn();
    const latestEnd = vi.fn();
    const nextEnd = vi.fn();
    const { rerender, engine } = await renderDnd(
      <Draggable.Root
        data-testid="source"
        kind={original}
        payload="first"
        onMoveEnd={originalEnd}
      />,
    );
    await lift(screen.getByTestId('source'));
    await rerender(
      <Draggable.Root data-testid="source" kind={next} payload={{ id: 1 }} onMoveEnd={nextEnd} />,
    );
    act(() => engine.cancelDrag());
    expect(nextEnd).not.toHaveBeenCalled();
    expect(originalEnd).toHaveBeenCalledTimes(1);
    expect(originalEnd.mock.calls[0][0].source.payload).toBe('first');

    await rerender(
      <Draggable.Root
        data-testid="source"
        kind={original}
        payload="second"
        onMoveEnd={latestEnd}
      />,
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
          data-testid="source"
          kind={kind}
          payload="initial"
          onMoveStart={({ source }) => {
            starts.push({ payload: source.payload, dragData: source.dragData });
            source.updateDragData({ offset: 12 });
            expect(source.dragData).toEqual({ offset: 12 });
          }}
          onMoveEnd={onMoveEnd}
        />
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
          <Draggable.Root
            kind={kind}
            payload={payload}
            onMoveStart={onMoveStart}
            data-testid="source"
          >
            {label}
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
          <Draggable.Root data-testid="source" kind={kind} payload={payload} />
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
          <Draggable.Root data-testid="source" kind={kind} payload="item">
            <output data-testid="label">{label}</output>
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

  it.each(['modifier', 'preview'])('honors cancellation in the %s callback', async (callback) => {
    const { engine } = await renderDnd();
    const source = createElement();
    const onMoveStart = vi.fn();
    engine.registerSource(source, {
      payload: 'item',
      modifiers: ({ point }) => {
        if (callback === 'modifier') {
          engine.cancelDrag();
        }
        return point;
      },
      preview: {
        render: () => {
          if (callback === 'preview') {
            engine.cancelDrag();
          }
          return 'Preview';
        },
      },
      onMoveStart,
    });
    await lift(source, { expectNoDrag: true });
    expect(onMoveStart).not.toHaveBeenCalled();
    expect(dragSessionStore.state).toBeNull();
    expect(dragPreviewStore.state).toBeNull();
    expect(document.querySelector('[data-drag-preview]')).toBeNull();
    expect(source).not.toHaveAttribute('data-dragging');
  });
});
