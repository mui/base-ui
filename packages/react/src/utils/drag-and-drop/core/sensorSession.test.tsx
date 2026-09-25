import * as React from 'react';
import { act, screen } from '@mui/internal-test-utils';
import { describe, it, expect, vi } from 'vitest';
import { createDndRenderer } from '#test-utils';
import { Draggable } from '../../../draggable';
import { setupDragEngineTests, createElement, lift, flushRaf } from '../../../../test/dnd';
import { createPreviewAndStartSession } from './sensorSession';
import { createDragSource } from '../dragSource';
import { penDown, penUp } from '../../../../test/syntheticPointer';
import type { DraggableRootRecord } from '../../../types/drag';
import { getInput } from '../utils';
import { dragPreviewStore } from '../overlay/dragPreviewStore';
import { dragSessionStore, dragSourceStore } from '../dragSessionStore';

setupDragEngineTests();

describe('sensor session startup', () => {
  const { renderDnd } = createDndRenderer();

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
              source.updatePayload('updated');
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
    expect(candidate?.payload).toBe('updated');
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
        element,
        dragHandle: null,
        dragSource: createDragSource(element, kind.id, undefined, null),
        initialInput: getInput(new MouseEvent('pointerdown', { clientX: 10, clientY: 10 })),
        initialTarget: element,
        onForceCleanup: vi.fn(),
        draggableParameters: {
          element,
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

  it('shares updates with callbacks and subscribers, persists payload, and resets drag data', async () => {
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
            source.updatePayload('updated');
            source.updateDragData({ offset: 12 });
            expect(source.payload).toBe('updated');
            expect(source.dragData).toEqual({ offset: 12 });
          }}
          onMoveEnd={onMoveEnd}
        />
        <ActiveData />
      </React.Fragment>,
    );
    engine.registerMonitor({ accept: kind, onMoveStart: monitorStart });
    await lift(screen.getByTestId('source'));
    expect(screen.getByTestId('active')).toHaveTextContent('updated:12');
    expect(monitorStart.mock.calls[0][0].source.payload).toBe('updated');
    expect(monitorStart.mock.calls[0][0].source.dragData).toEqual({ offset: 12 });
    const source = monitorStart.mock.calls[0][0].source;
    act(() => {
      source.updatePayload('later');
      source.updateDragData({ offset: 24 });
    });
    expect(screen.getByTestId('active')).toHaveTextContent('later:24');
    act(() => engine.cancelDrag());
    expect(onMoveEnd.mock.calls[0][0].source.payload).toBe('later');
    expect(onMoveEnd.mock.calls[0][0].source.dragData).toEqual({ offset: 24 });
    await lift(screen.getByTestId('source'));
    expect(starts).toEqual([
      { payload: 'initial', dragData: undefined },
      { payload: 'later', dragData: undefined },
    ]);
    act(() => source.updateDragData({ offset: 99 }));
    expect(screen.getByTestId('active')).toHaveTextContent('updated:12');
  });

  it('keeps imperative payload updates across unrelated renders and replaces them when the prop changes', async () => {
    const kind = Draggable.createKind<string, number>('prop-precedence');
    const onMoveStart = vi.fn(({ source }) => {
      source.updatePayload('imperative');
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
    expect(screen.getByTestId('active')).toHaveTextContent('imperative:42');
    await rerender(<Demo payload="changed" label="second" />);
    expect(screen.getByTestId('active')).toHaveTextContent('changed:42');
    const source = onMoveStart.mock.calls[0][0].source;
    act(() => source.updatePayload('new imperative'));
    expect(screen.getByTestId('active')).toHaveTextContent('new imperative:42');
    await rerender(<Demo payload="changed" label="third" />);
    expect(screen.getByTestId('active')).toHaveTextContent('new imperative:42');
  });

  it('keeps the payload through setup rebinds and observes prop changes between drags', async () => {
    const kind = Draggable.createKind<string>('persistent-source');
    const onMoveStart = vi.fn();
    function Demo({ payload, disabled = false }: { payload: string; disabled?: boolean }) {
      return (
        <Draggable.Root
          data-testid="source"
          kind={kind}
          payload={payload}
          disabled={disabled}
          onMoveStart={onMoveStart}
        />
      );
    }
    const { rerender, engine } = await renderDnd(<Demo payload="initial" />);
    await lift(screen.getByTestId('source'));
    const source = onMoveStart.mock.calls[0][0].source;
    act(() => source.updatePayload('persistent'));
    act(() => engine.cancelDrag());
    await rerender(<Demo payload="initial" disabled />);
    await rerender(<Demo payload="initial" />);
    await lift(screen.getByTestId('source'));
    expect(onMoveStart.mock.calls[1][0].source.payload).toBe('persistent');
    act(() => engine.cancelDrag());
    await rerender(<Demo payload="changed" />);
    await rerender(<Demo payload="initial" />);
    await lift(screen.getByTestId('source'));
    expect(onMoveStart.mock.calls[2][0].source.payload).toBe('initial');
  });

  it('publishes changed payload props to memoized observers before any imperative update', async () => {
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

  it('preserves function payloads and honors changes from an imperative registration getter', async () => {
    const { engine } = await renderDnd();
    const element = createElement();
    const initial = vi.fn();
    const replacement = vi.fn();
    const nextProp = vi.fn();
    const onMoveStart = vi.fn();
    let payload = initial;
    engine.registerSource(element, () => ({ payload, onMoveStart }));
    await lift(element);
    const source = onMoveStart.mock.calls[0][0].source;
    act(() => source.updatePayload(replacement));
    expect(source.payload).toBe(replacement);
    act(() => engine.cancelDrag());
    await lift(element);
    expect(onMoveStart.mock.calls[1][0].source.payload).toBe(replacement);
    payload = nextProp;
    expect(source.payload).toBe(nextProp);
    expect(initial).not.toHaveBeenCalled();
    expect(replacement).not.toHaveBeenCalled();
    expect(nextProp).not.toHaveBeenCalled();
  });

  it.each(['updatePayload', 'updateDragData'] as const)(
    'does not restore a canceled source when a subscriber reacts to %s',
    async (method) => {
      const { engine } = await renderDnd();
      const element = createElement();
      const onMoveStart = vi.fn();
      engine.registerSource(element, { onMoveStart });
      await lift(element);
      const source = onMoveStart.mock.calls[0][0].source;
      const unsubscribe = dragSessionStore.subscribe((session) => {
        if (session) {
          engine.cancelDrag();
        }
      });
      try {
        act(() => source[method]('updated'));
        expect(dragSessionStore.state).toBeNull();
        expect(dragSourceStore.state).toBeNull();
      } finally {
        unsubscribe();
      }
    },
  );

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
