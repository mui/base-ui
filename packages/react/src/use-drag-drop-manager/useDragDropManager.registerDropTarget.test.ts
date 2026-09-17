import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { createDndRenderer } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import {
  cancel,
  createElement,
  dragEnter,
  dragOver,
  flushRaf,
  lift,
  registerCleanup,
  setupDragEngineTests,
} from '../../test/dnd';
import { dragSessionStore } from '../utils/drag-and-drop/dragSessionStore';
import { registerDropTarget as registerDropTargetRaw } from '../utils/drag-and-drop/registrations';
import { anyDragKind } from '../utils/drag-and-drop/dragKind';
import type { MoveEvent, DropTargetRecord } from '../types/drag';
import type { RegisterDropTargetParameters } from '../types/dragRegistration';

setupDragEngineTests();

const cardKind = Draggable.createKind('card');
const columnKind = Draggable.createKind('column');
const slotKind = Draggable.createKind('card-slot');

describe('engine.registerDropTarget', () => {
  const { renderDnd } = createDndRenderer();

  it('sets data-drop-target attribute on the element', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const cleanup = engine.registerDropTarget(el, {});
    expect(el.getAttribute('data-drop-target')).toBe('');
    cleanup();
  });

  it('removes data attribute on cleanup', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const cleanup = engine.registerDropTarget(el, {});
    cleanup();
    expect(el.hasAttribute('data-drop-target')).toBe(false);
  });

  it('canDrop returning false prevents the element from being a target', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(target, {
      canDrop: () => false,
      onDraggableEnter,
    });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(onDraggableEnter).not.toHaveBeenCalled();
  });

  it('disabled prevents the element from being a target', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    const onDrop = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(target, {
      disabled: true,
      onDraggableEnter,
      onDraggableDrop: onDrop,
    });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);

    expect(onDraggableEnter).not.toHaveBeenCalled();
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('nested targets: a disabled inner target is skipped and the outer claims the drop', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const outer = createElement();
    const inner = createElement();
    outer.appendChild(inner);

    const outerOnDrop = vi.fn();
    const innerOnDrop = vi.fn();

    engine.registerDraggable(source, {});
    engine.registerDropTarget(outer, { onDraggableDrop: outerOnDrop });
    engine.registerDropTarget(inner, { disabled: true, onDraggableDrop: innerOnDrop });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(inner);
    fireEvent.dragOver(inner);
    await flushRaf();
    fireEvent.drop(inner);

    // The disabled inner target never enters the stack (like `canDrop: () =>
    // false`), so the outer accepting target is the innermost — it gets onDrop.
    expect(innerOnDrop).not.toHaveBeenCalled();
    expect(outerOnDrop).toHaveBeenCalledTimes(1);
    expect(outerOnDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ element: outer }),
      }),
      expect.objectContaining({ reason: 'drop' }),
    );
  });

  it('reports the native pointer event on the move-derived handlers', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const seen: Record<string, Event | undefined> = {};
    engine.registerDraggable(source, {
      onMove: (_payload, details) => {
        seen.drag = details.event;
      },
    });
    engine.registerDropTarget(target, {
      onDraggableEnter: (_payload, details) => {
        seen.enter = details.event;
        seen.change = details.event;
      },
    });

    await lift(source);
    // Entering the target: the change round dispatches `onTargetChange` and
    // `onDraggableEnter` synchronously.
    fireEvent.dragEnter(target, { shiftKey: true, clientX: 30, clientY: 40 });
    fireEvent.dragOver(target, { shiftKey: true, clientX: 30, clientY: 40 });
    await flushRaf();
    // A second move *within* the target, so the stack is unchanged: the change
    // round above cancels the queued source `onMove`, and only a settled move
    // like this one lets the throttled dispatch actually land.
    fireEvent.dragOver(target, { shiftKey: true, clientX: 31, clientY: 41 });
    await flushRaf();

    // `DragEventDetails` narrows `event` to a `PointerEvent` for these reasons, so
    // reading a modifier off it has to actually work — a fabricated placeholder
    // would type-check and silently answer `undefined`.
    for (const name of ['enter', 'change', 'drag'] as const) {
      expect(seen[name]).toBeInstanceOf(PointerEvent);
      expect((seen[name] as PointerEvent).shiftKey).toBe(true);
    }

    cancel();
  });

  it('disabling a hovered target mid-drag dispatches its onDraggableLeave on the next resolution', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    const onDraggableLeave = vi.fn();
    let disabled = false;
    engine.registerDraggable(source, {});
    // The engine reads the getter on every resolution, so flipping `disabled`
    // needs no re-registration — exactly how the React layer's params behave.
    engine.registerDropTarget(target, () => ({ disabled, onDraggableEnter, onDraggableLeave }));

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
    expect(onDraggableLeave).not.toHaveBeenCalled();

    disabled = true;
    // Nothing re-resolves until new input arrives: the next pointer move over
    // the now-disabled target drops it from the stack and delivers its leave.
    fireEvent.dragOver(target);
    await flushRaf();

    expect(onDraggableLeave).toHaveBeenCalledTimes(1);

    cancel();
  });

  it('a canDrop flipping to false mid-hover dispatches onDraggableLeave on the next resolution', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    const onDraggableLeave = vi.fn();
    let allowed = true;
    engine.registerDraggable(source, {});
    // `canDrop` re-runs on every resolution, so a flip needs no re-registration.
    engine.registerDropTarget(target, {
      canDrop: () => allowed,
      onDraggableEnter,
      onDraggableLeave,
    });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
    expect(onDraggableLeave).not.toHaveBeenCalled();

    allowed = false;
    // The next pointer move re-resolves against the flipped predicate.
    fireEvent.dragOver(target, { clientX: 1 });
    await flushRaf();

    expect(onDraggableLeave).toHaveBeenCalledTimes(1);

    cancel();
  });

  it('accept rejects a source of a kind it does not accept', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    engine.registerDraggable(source, { kind: columnKind });
    engine.registerDropTarget(target, { accept: cardKind, onDraggableEnter });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(onDraggableEnter).not.toHaveBeenCalled();
  });

  it('does not invoke canDrop when accept already rejected the source', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const canDrop = vi.fn(() => true);
    const onDraggableEnter = vi.fn();
    engine.registerDraggable(source, { kind: columnKind });
    engine.registerDropTarget(target, { accept: cardKind, canDrop, onDraggableEnter });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    // `accept` is the cheap filter that runs first: a mismatched kind never
    // reaches the predicate, so per-frame walks skip the consumer callback.
    expect(canDrop).not.toHaveBeenCalled();
    expect(onDraggableEnter).not.toHaveBeenCalled();

    cancel();
  });

  it('accept accepts a source whose kind is one of an array of kinds', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    engine.registerDraggable(source, { kind: cardKind });
    engine.registerDropTarget(target, { accept: [cardKind, columnKind], onDraggableEnter });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
  });

  it('accepts any source when accept is omitted', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    engine.registerDraggable(source, { kind: cardKind });
    engine.registerDropTarget(target, { onDraggableEnter });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
  });

  it('matches two global kinds created from the same namespaced key', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    engine.registerDraggable(source, { kind: Draggable.createGlobalKind('test/task') });
    engine.registerDropTarget(target, {
      accept: Draggable.createGlobalKind('test/task'),
      onDraggableEnter,
    });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
  });

  it('drop target kind is exposed on `target` and on records in dropTargets', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    let observedSelfKind: symbol | undefined;
    let observedRecordKind: symbol | undefined;
    engine.registerDraggable(source, { kind: cardKind });
    engine.registerDropTarget(target, {
      kind: slotKind,
      accept: cardKind,
      onDraggableEnter: ({ target, location }) => {
        observedSelfKind = target.kind;
        observedRecordKind = location.current.dropTargets[0]?.kind;
      },
    });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(observedSelfKind).toBe(slotKind.id);
    expect(observedRecordKind).toBe(slotKind.id);
  });

  it('source kind flows through to `source.kind` on every callback', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    let observedKind: symbol | undefined;
    engine.registerDraggable(source, { kind: cardKind });
    engine.registerDropTarget(target, {
      onDraggableEnter: ({ source: src }) => {
        observedKind = src.kind;
      },
    });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(observedKind).toBe(cardKind.id);
  });

  it('calls getPayload with correct feedback args', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const payload = vi.fn(() => ({ targetKey: 'targetValue' }));
    const sourceKind = Draggable.createKind<{ sourceKey: string }>('payload-source');
    engine.registerDraggable(source, {
      kind: sourceKind,
      payload: { sourceKey: 'sourceValue' },
    });
    engine.registerDropTarget(target, { getPayload: payload });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target, { clientX: 40, clientY: 60 });
    fireEvent.dragOver(target, { clientX: 40, clientY: 60 });
    await flushRaf();

    expect(payload).toHaveBeenCalled();
    // The latest resolution reflects the coordinates and source it resolved with,
    // not just the shape of the feedback object.
    const callParameters = (payload.mock.calls.at(-1) as any)[0];
    expect(callParameters).toHaveProperty('element', target);
    expect(callParameters.input.clientX).toBe(40);
    expect(callParameters.input.clientY).toBe(60);
    expect(callParameters.source.element).toBe(source);
    expect(callParameters.source.kind).toBe(sourceKind.id);
    expect(callParameters.source.payload).toEqual({ sourceKey: 'sourceValue' });
  });

  it('attaches a value payload to the target record', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDrop = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(target, {
      payload: { targetKey: 'targetValue' },
      onDraggableDrop: onDrop,
    });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);
    await flushRaf();

    expect(onDrop.mock.calls[0][0].target.payload).toEqual({ targetKey: 'targetValue' });
  });

  it('keeps a function payload as data instead of invoking it', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const command = vi.fn(() => 'command result');
    const onDrop = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(target, { payload: command, onDraggableDrop: onDrop });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);
    await flushRaf();

    expect(onDrop.mock.calls[0][0].target.payload).toBe(command);
    expect(command).not.toHaveBeenCalled();
  });

  // A falsy static value survives instead of being replaced by a stand-in.
  it.each([
    ['a number', 0],
    ['an empty string', ''],
    ['false', false],
    ['null', null],
  ])('attaches %s target payload as-is', async (_label, value) => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDrop = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(target, { payload: value, onDraggableDrop: onDrop });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);
    await flushRaf();

    expect(onDrop.mock.calls[0][0].target.payload).toBe(value);
  });

  it('leaves the target payload undefined when none is declared', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDrop = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(target, { onDraggableDrop: onDrop });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);
    await flushRaf();

    expect(onDrop.mock.calls[0][0].target.payload).toBe(undefined);
  });

  it('fires onDraggableEnter when entering a target', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(target, { onDraggableEnter });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    await flushRaf();

    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
    expect(onDraggableEnter).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ element: target }),
      }),
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('drop target onMove fires synchronously on the frame the target enters the active stack', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    const onMove = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(target, { onDraggableEnter, onDraggableMove: onMove });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    await flushRaf();

    // Both fire on the entering frame so consumers can put hover-tracking
    // logic in `onMove` and rely on it firing immediately. The engine also
    // polls `onMove` every frame for a stationary pointer, so the exact count
    // isn't asserted — only that it fired on entry with the right target.
    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalled();
    expect(onMove).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ element: target }),
      }),
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('delivers onMove once to a target on the frame it enters', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onMove = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(target, { onDraggableMove: onMove });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    await flushRaf();

    // The entry round and the frame's own move dispatch share one delivery, so a
    // consumer measuring in `onMove` pays for it once per frame, not twice.
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it('fires onDraggableLeave when leaving a target', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target1 = createElement();
    const target2 = createElement();
    const onDraggableLeave = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(target1, { onDraggableLeave });
    engine.registerDropTarget(target2, {});

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target1);
    await flushRaf();
    fireEvent.dragEnter(target2);
    await flushRaf();

    expect(onDraggableLeave).toHaveBeenCalledTimes(1);
  });

  it('the terminal onDraggableLeave on drop reports an empty current stack (parity with cancel)', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    // Capture the counts at dispatch time; the payload's `location` is mutated
    // in place, so asserting on the stashed object later would be meaningless.
    const leaveStacks: number[] = [];
    engine.registerDraggable(source, {});
    engine.registerDropTarget(target, {
      onDraggableLeave: ({ location }) => {
        leaveStacks.push(location.current.dropTargets.length);
      },
    });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);

    // A leave handler deriving "still hovered?" from `location.current` must see
    // the same shape on drop as on cancel: the target already out of the stack.
    expect(leaveStacks).toEqual([0]);
  });

  it('fires onDrop when a drop occurs on the target', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDrop = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(target, { onDraggableDrop: onDrop });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);

    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ element: target }),
        // `onDrop` only ever fires for a committed drop, so its reason is fixed.
        dropTarget: expect.objectContaining({ element: target }),
      }),
      expect.objectContaining({ reason: 'drop' }),
    );
  });

  it('nested targets: only the innermost target receives onDrop, ancestors are skipped', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const outer = createElement();
    const inner = createElement();
    outer.appendChild(inner);

    const outerOnDrop = vi.fn();
    const innerOnDrop = vi.fn();
    const monitorOnDrop = vi.fn();

    engine.registerDraggable(source, {});
    engine.registerDropTarget(outer, { onDraggableDrop: outerOnDrop });
    engine.registerDropTarget(inner, { onDraggableDrop: innerOnDrop });
    engine.registerMonitor({ onMoveEnd: monitorOnDrop });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(inner);
    fireEvent.dragOver(inner);
    await flushRaf();
    fireEvent.drop(inner);

    // Inner is the innermost target — it gets onDrop.
    expect(innerOnDrop).toHaveBeenCalledTimes(1);
    expect(innerOnDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ element: inner }),
      }),
      expect.objectContaining({ reason: 'drop' }),
    );

    // Outer is in the active stack but NOT innermost — its onDrop is skipped.
    expect(outerOnDrop).not.toHaveBeenCalled();

    // Monitors still see the full chain via location.current.dropTargets.
    expect(monitorOnDrop).toHaveBeenCalledTimes(1);
    const monitorCall = monitorOnDrop.mock.calls[0]![0];
    expect(monitorCall.location.current.dropTargets.map((t: any) => t.element)).toEqual([
      inner,
      outer,
    ]);
  });

  it('nested targets: an inner target whose canDrop is false is skipped and the outer claims onDrop', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const outer = createElement();
    const inner = createElement();
    outer.appendChild(inner);

    const outerOnDrop = vi.fn();
    const innerOnDrop = vi.fn();

    engine.registerDraggable(source, {});
    engine.registerDropTarget(outer, { onDraggableDrop: outerOnDrop });
    engine.registerDropTarget(inner, { canDrop: () => false, onDraggableDrop: innerOnDrop });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(inner);
    fireEvent.dragOver(inner);
    await flushRaf();
    fireEvent.drop(inner);

    // Inner rejected the drop, so it drops out of the active stack and the
    // outer accepting target becomes the innermost — it receives onDrop.
    expect(innerOnDrop).not.toHaveBeenCalled();
    expect(outerOnDrop).toHaveBeenCalledTimes(1);
    expect(outerOnDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ element: outer }),
      }),
      expect.objectContaining({ reason: 'drop' }),
    );
  });

  it("canDrop returning 'reject' refuses the drop for the whole subtree instead of falling through", async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const column = createElement();
    const card = createElement();
    column.appendChild(card);

    const columnOnDrop = vi.fn();
    const cardOnDrop = vi.fn();
    const cardOnDragEnter = vi.fn();
    const onMoveEnd = vi.fn();

    engine.registerDraggable(source, { onMoveEnd });
    // The container-level rule (a capacity limit): with `false` the drop would
    // fall through to the accepting card inside, silently defeating the limit.
    engine.registerDropTarget(column, { canDrop: () => 'reject', onDraggableDrop: columnOnDrop });
    engine.registerDropTarget(card, {
      onDraggableDrop: cardOnDrop,
      onDraggableEnter: cardOnDragEnter,
    });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(card);
    fireEvent.dragOver(card);
    await flushRaf();

    // The card accepted, but its rejecting ancestor vetoes the subtree: no
    // target resolves at all.
    expect(cardOnDragEnter).not.toHaveBeenCalled();

    fireEvent.drop(card);

    expect(cardOnDrop).not.toHaveBeenCalled();
    expect(columnOnDrop).not.toHaveBeenCalled();
    // Released over no resolved target: an outside release, not a cancel.
    expect(onMoveEnd).toHaveBeenCalledWith(
      expect.objectContaining({ canceled: false, dropTarget: null }),
      expect.objectContaining({ reason: 'outside-release' }),
    );
  });

  it("canDrop returning 'reject' stops outer targets from claiming the drop", async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const board = createElement();
    const column = createElement();
    board.appendChild(column);

    const boardOnDrop = vi.fn();
    const boardOnDragEnter = vi.fn();

    engine.registerDraggable(source, {});
    engine.registerDropTarget(board, {
      onDraggableDrop: boardOnDrop,
      onDraggableEnter: boardOnDragEnter,
    });
    engine.registerDropTarget(column, { canDrop: () => 'reject' });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(column);
    fireEvent.dragOver(column);
    await flushRaf();
    fireEvent.drop(column);

    // Unlike `false` (abstain), `'reject'` refuses outright: the board behind
    // the column never becomes a target either.
    expect(boardOnDragEnter).not.toHaveBeenCalled();
    expect(boardOnDrop).not.toHaveBeenCalled();
  });

  it("a canDrop flipping between 'reject' and true re-resolves like any other flip", async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    const onDraggableLeave = vi.fn();
    let full = true;
    engine.registerDropTarget(target, {
      canDrop: () => (full ? 'reject' : true),
      onDraggableEnter,
      onDraggableLeave,
    });
    engine.registerDraggable(source, {});

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    expect(onDraggableEnter).not.toHaveBeenCalled();

    full = false;
    fireEvent.dragOver(target);
    await flushRaf();
    expect(onDraggableEnter).toHaveBeenCalledTimes(1);

    full = true;
    fireEvent.dragOver(target);
    await flushRaf();
    expect(onDraggableLeave).toHaveBeenCalledTimes(1);
  });

  describe('snap', () => {
    // Targets are the default 200×100 stub rect at (0, 200) throughout, so every
    // expected fraction is arithmetic rather than a snapshot.
    async function dropAt(
      parameters: Omit<RegisterDropTargetParameters<unknown, unknown>, 'accept'>,
      clientX: number,
      clientY: number,
    ) {
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement({ top: 200 });
      const onDrop = vi.fn();
      engine.registerDraggable(source, {});
      engine.registerDropTarget(target, { ...parameters, onDraggableDrop: onDrop });

      await lift(source);
      fireEvent.dragEnter(target, { clientX, clientY });
      fireEvent.dragOver(target, { clientX, clientY });
      await flushRaf();
      fireEvent.drop(target, { clientX, clientY });

      expect(onDrop).toHaveBeenCalledTimes(1);
      return onDrop.mock.calls[0][0].target as DropTargetRecord;
    }

    it('quantizes getSnappedLocalPoint to the declared steps with symmetric rounding', async () => {
      // x 125/200 = 0.625, the exact midpoint between steps 2 and 3 of 4: rounds
      // up, never per-axis-biased. y 235 → 0.35 → nearest of 4 steps is 0.25.
      const record = await dropAt({ snap: { x: 4, y: 4 } }, 125, 235);

      expect(record.getSnappedLocalPoint()).toEqual({ x: 0.75, y: 0.25 });
      // The raw reader is untouched by the declaration.
      expect(record.getLocalPoint()).toEqual({ x: 0.625, y: 0.35 });
    });

    it('leaves an axis without steps at its clamped raw fraction', async () => {
      // The bridge resolves the named target wherever the pointer is, so a point
      // below the target's box exercises the clamp: raw y is 1.2, snapped is 1.
      const record = await dropAt({ snap: { x: 4 } }, 150, 320);

      expect(record.getSnappedLocalPoint()).toEqual({ x: 0.75, y: 1 });
      expect(record.getLocalPoint().y).toBeCloseTo(1.2);
    });

    it('ignores a fractional step count and keeps the result clamped', async () => {
      const record = await dropAt({ snap: { x: 1.5, y: 1.5 } }, 125, 320);

      expect(record.getSnappedLocalPoint()).toEqual({ x: 0.625, y: 1 });
    });

    it('evaluates a snap callback lazily, once per record, with the resolution context', async () => {
      const snap = vi.fn(({ element }: { element: Element }) => {
        expect(element).toHaveAttribute('data-drop-target');
        return { y: 4 };
      });
      const record = await dropAt({ snap }, 150, 235);

      // Nothing has asked yet: a declared-but-unread snap costs nothing.
      expect(snap).not.toHaveBeenCalled();
      expect(record.getSnappedLocalPoint().y).toBe(0.25);
      expect(record.getSnappedLocalPoint({ anchor: 'source' }).y).not.toBeNaN();
      expect(snap).toHaveBeenCalledTimes(1);
    });

    it('a snap callback returning undefined leaves the point unquantized', async () => {
      const record = await dropAt({ snap: () => undefined }, 150, 235);
      expect(record.getSnappedLocalPoint()).toEqual({ x: 0.75, y: 0.35 });
    });

    it("anchors on the pickup grab offset with anchor: 'source'", async () => {
      // Grabbed 30px below the source's top edge (the bridge's activation nudge
      // only shifts x): the source anchor reports where the dragged element's
      // top edge sits, which is what a move commits. Snapping the pointer and
      // subtracting the grab offset afterwards would un-snap it.
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement({ top: 200 });
      const onDrop = vi.fn();
      engine.registerDraggable(source, {});
      engine.registerDropTarget(target, { snap: { y: 4 }, onDraggableDrop: onDrop });

      await lift(source, { clientY: 30 });
      fireEvent.dragEnter(target, { clientY: 265 });
      fireEvent.dragOver(target, { clientY: 265 });
      await flushRaf();
      fireEvent.drop(target, { clientY: 265 });

      const record = onDrop.mock.calls[0][0].target as DropTargetRecord;
      // Pointer: 0.65 → 0.75. Source top edge: (265 − 30 − 200) / 100 = 0.35 → 0.25.
      expect(record.getSnappedLocalPoint().y).toBe(0.75);
      expect(record.getSnappedLocalPoint({ anchor: 'source' }).y).toBe(0.25);
    });

    it('shares one measurement between the raw and snapped readers', async () => {
      const record = await dropAt({ snap: { y: 4 } }, 150, 235);
      const measure = vi.fn(() => new DOMRect(0, 200, 200, 100));
      (record.element as HTMLElement).getBoundingClientRect = measure;

      record.getSnappedLocalPoint();
      record.getSnappedLocalPoint({ anchor: 'source' });
      record.getLocalPoint();
      expect(measure).toHaveBeenCalledTimes(1);
    });
  });

  it('nested targets: both inner and outer receive events', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const outer = createElement();
    const inner = createElement();
    outer.appendChild(inner);

    const outerOnDragEnter = vi.fn();
    const innerOnDragEnter = vi.fn();

    engine.registerDraggable(source, {});
    engine.registerDropTarget(outer, { onDraggableEnter: outerOnDragEnter });
    engine.registerDropTarget(inner, { onDraggableEnter: innerOnDragEnter });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(inner);
    await flushRaf();

    expect(innerOnDragEnter).toHaveBeenCalledTimes(1);
    expect(outerOnDragEnter).toHaveBeenCalledTimes(1);
  });

  it('crosses shadow-DOM boundaries when collecting drop targets', async () => {
    // Outer drop target. Inside it, attach a shadow root containing the
    // dragover target. The walker should climb out of the shadow root via
    // `host.parentElement` and find the outer registration.
    const { engine } = await renderDnd();
    const outer = createElement();
    const host = document.createElement('div');
    outer.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('div');
    inner.style.width = '50px';
    inner.style.height = '50px';
    shadow.appendChild(inner);

    const source = createElement();
    const onDraggableEnter = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(outer, { onDraggableEnter });

    fireEvent.dragStart(source);
    await flushRaf();

    // Firing the drag events at `inner` never exercises the shadow walk: event
    // retargeting resolves `event.target` to the host, which sits in the light
    // DOM. Drive `elementFromPoint` straight to the shadow-internal element (as
    // the direct-child test below does) so the composed climb actually runs.
    const originalEFP = document.elementFromPoint;
    document.elementFromPoint = () => inner;
    try {
      fireEvent.dragOver(source);
      await flushRaf();
    } finally {
      document.elementFromPoint = originalEFP;
    }

    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
    const payload = onDraggableEnter.mock.calls[0][0];
    expect(payload.location.current.dropTargets[0].element).toBe(outer);
  });

  it('collects ancestor drop targets when the inner target is a direct child of a shadow root', async () => {
    // Regression: a registered drop target that is a *direct child* of a shadow
    // root has `parentElement === null`, so the walk must cross out through the
    // host to reach the outer target instead of stopping at the boundary.
    const { engine } = await renderDnd();
    const outer = createElement();
    const host = document.createElement('div');
    outer.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('div');
    shadow.appendChild(inner);

    const source = createElement();
    const onDragEnterOuter = vi.fn();
    const onDragEnterInner = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(outer, { onDraggableEnter: onDragEnterOuter });
    engine.registerDropTarget(inner, { onDraggableEnter: onDragEnterInner });

    fireEvent.dragStart(source);
    await flushRaf();

    // Resolve the pointer straight to the shadow-internal target. Event
    // retargeting would otherwise hide it behind the host, so the deep-target
    // walk can only be exercised by driving `elementFromPoint` directly.
    const originalEFP = document.elementFromPoint;
    document.elementFromPoint = () => inner;
    try {
      // Drive a pointer move so the sensor re-resolves against the swapped
      // `elementFromPoint`. A stationary pointer no longer re-resolves on its
      // own (that would let a reorder under a still pointer loop), so the move
      // is what makes the engine pick up the injected shadow target.
      fireEvent.dragOver(source);
      await flushRaf();
    } finally {
      document.elementFromPoint = originalEFP;
    }

    expect(onDragEnterInner).toHaveBeenCalledTimes(1);
    expect(onDragEnterOuter).toHaveBeenCalledTimes(1);
    const elements = onDragEnterInner.mock.calls[0][0].location.current.dropTargets.map(
      (record: { element: Element }) => record.element,
    );
    expect(elements).toEqual([inner, outer]);
  });

  it('collects a shadow-tree target wrapping the slot a light-DOM node is assigned to', async () => {
    // Regression: a `closest()` walk follows the light-DOM parent chain straight
    // through the shadow host, so when a light-DOM ancestor is also a target the
    // shadow-tree target around the `<slot>` was skipped. The composed walk enters
    // the assigned slot first, then climbs out through the host.
    const { engine } = await renderDnd();
    const light = createElement();
    const host = document.createElement('x-host');
    light.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const zone = document.createElement('div');
    zone.appendChild(document.createElement('slot'));
    shadow.appendChild(zone);
    const slotted = document.createElement('span');
    host.appendChild(slotted);

    const source = createElement();
    const onDragEnterZone = vi.fn();
    const onDragEnterLight = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(zone, { onDraggableEnter: onDragEnterZone });
    engine.registerDropTarget(light, { onDraggableEnter: onDragEnterLight });

    fireEvent.dragStart(source);
    await flushRaf();

    const originalEFP = document.elementFromPoint;
    document.elementFromPoint = () => slotted;
    try {
      fireEvent.dragOver(source);
      await flushRaf();
    } finally {
      document.elementFromPoint = originalEFP;
    }

    expect(onDragEnterZone).toHaveBeenCalledTimes(1);
    expect(onDragEnterLight).toHaveBeenCalledTimes(1);
    const elements = onDragEnterZone.mock.calls[0][0].location.current.dropTargets.map(
      (record: { element: Element }) => record.element,
    );
    expect(elements).toEqual([zone, light]);
  });

  it('keeps non-throwing drop targets active when an ancestor target throws from a consumer callback', async () => {
    // Nest the sane (inner) target inside the buggy (ancestor) target so the
    // walker visits both: sane first, then buggy on the climb. Buggy's
    // `canDrop` throws — the walker should log and skip it without abandoning
    // the inner target's events.
    const { engine } = await renderDnd();
    const source = createElement();
    const buggy = document.createElement('div');
    const sane = document.createElement('div');
    sane.style.width = '50px';
    sane.style.height = '50px';
    buggy.appendChild(sane);
    document.body.appendChild(buggy);
    registerCleanup(() => buggy.remove());

    const onDragEnterSane = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(buggy, {
      canDrop: () => {
        throw new Error('canDrop boom');
      },
    });
    engine.registerDropTarget(sane, { onDraggableEnter: onDragEnterSane });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      fireEvent.dragStart(source);
      await flushRaf();
      fireEvent.dragEnter(sane);
      fireEvent.dragOver(sane);
      await flushRaf();

      // The buggy callback's throw must have been logged (rejection path).
      expect(consoleError).toHaveBeenCalled();
      // The inner target still received its event.
      expect(onDragEnterSane).toHaveBeenCalled();
    } finally {
      // End the drag before restoring the console spy — even if an assertion
      // above failed. Otherwise teardown un-registers the buggy target mid-drag,
      // which re-resolves the stack and re-throws from `canDrop` after the spy is
      // gone. Dispatch `dragend` on the source so the synthetic bridge observes it
      // (it listens on `document`, so a `window`-targeted event would be missed)
      // and cancels the drag, clearing the stack without re-running `canDrop`.
      fireEvent.dragEnd(source);
      consoleError.mockRestore();
    }
  });

  // A throwing `getPayload` callback must make the target inactive rather than
  // dispatching with a stand-in cast as the declared payload type.
  it('treats a target whose getPayload callback throws as inactive', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const buggy = document.createElement('div');
    const sane = document.createElement('div');
    sane.style.width = '50px';
    sane.style.height = '50px';
    buggy.appendChild(sane);
    document.body.appendChild(buggy);
    registerCleanup(() => buggy.remove());

    const onDropBuggy = vi.fn();
    const onDragEnterSane = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(buggy, {
      getPayload: () => {
        throw new Error('payload boom');
      },
      onDraggableDrop: onDropBuggy,
      onDraggableEnter: onDropBuggy,
    });
    engine.registerDropTarget(sane, { onDraggableEnter: onDragEnterSane });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      fireEvent.dragStart(source);
      await flushRaf();
      fireEvent.dragEnter(sane);
      fireEvent.dragOver(sane);
      await flushRaf();

      expect(consoleError).toHaveBeenCalled();
      // Never reaches the stack, so it gets no events — and no sentinel leaks out
      // as its payload.
      expect(onDropBuggy).not.toHaveBeenCalled();
      expect(onDragEnterSane).toHaveBeenCalled();
    } finally {
      fireEvent.dragEnd(source);
      consoleError.mockRestore();
    }
  });

  // The parameters *getter* itself is consumer-supplied through the imperative
  // API. A throw there is contained like a throwing `canDrop`: logged, and the
  // target treated as unregistered, so the drag and every sibling keep working.
  it('keeps the drag and sibling targets working when a parameters getter throws', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const buggy = document.createElement('div');
    const sane = document.createElement('div');
    sane.style.width = '50px';
    sane.style.height = '50px';
    buggy.appendChild(sane);
    document.body.appendChild(buggy);
    registerCleanup(() => buggy.remove());

    const onDragEnterSane = vi.fn();
    const onDropSane = vi.fn();
    const onMoveEnd = vi.fn();
    engine.registerDraggable(source, { onMoveEnd });
    engine.registerDropTarget(buggy, () => {
      throw new Error('getParameters boom');
    });
    engine.registerDropTarget(sane, {
      onDraggableEnter: onDragEnterSane,
      onDraggableDrop: onDropSane,
    });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      fireEvent.dragStart(source);
      await flushRaf();
      fireEvent.dragEnter(sane);
      fireEvent.dragOver(sane);
      await flushRaf();

      // The throw was contained and logged...
      expect(consoleError).toHaveBeenCalled();
      // ...the nested sane target still received its events...
      expect(onDragEnterSane).toHaveBeenCalled();

      // ...and the drag still ends with a delivered drop.
      fireEvent.drop(sane);
      expect(onDropSane).toHaveBeenCalledTimes(1);
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
    } finally {
      fireEvent.dragEnd(source);
      consoleError.mockRestore();
    }
  });

  it('survives a parameters getter that starts throwing while its target is hovered', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDrop = vi.fn();
    const onMoveEnd = vi.fn();
    let shouldThrow = false;
    engine.registerDraggable(source, { onMoveEnd });
    engine.registerDropTarget(target, () => {
      if (shouldThrow) {
        throw new Error('getParameters boom');
      }
      return { onDraggableDrop: onDrop };
    });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      // The getter begins throwing while the target is hovered: the drop's
      // re-resolution and the terminal dispatch to the hovered record both
      // re-read it, and each read must be contained rather than wedge the end.
      shouldThrow = true;
      fireEvent.drop(target);

      expect(consoleError).toHaveBeenCalled();
      // The target resolved as inactive at release, so its onDrop is skipped —
      // but the drag itself still ends cleanly.
      expect(onDrop).not.toHaveBeenCalled();
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].canceled).toBe(false);
    } finally {
      fireEvent.dragEnd(source);
      consoleError.mockRestore();
    }
  });

  it('cleanup removes registration', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    engine.registerDraggable(source, {});
    const cleanupDrop = engine.registerDropTarget(target, { onDraggableEnter });

    cleanupDrop();

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(onDraggableEnter).not.toHaveBeenCalled();
  });

  it('releasing a non-last merged-ref hold keeps the surviving registration active', async () => {
    // Two drop-target registrations against one node (merged-ref composition),
    // registered A then B. B unmounts (e.g. a conditional wrapper) while A stays.
    // A drop must reach A's callback, not B's stale one, and the target must
    // remain registered (the last hold wasn't released).
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDropA = vi.fn();
    const onDropB = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerDropTarget(target, { onDraggableDrop: onDropA });
    const cleanupB = engine.registerDropTarget(target, { onDraggableDrop: onDropB });

    cleanupB();
    expect(target.hasAttribute('data-drop-target')).toBe(true);

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);

    expect(onDropA).toHaveBeenCalledTimes(1);
    expect(onDropB).not.toHaveBeenCalled();
  });

  describe('lifecycle guards', () => {
    it('still delivers onDrop when the source onMoveEnd unregisters the target mid-end', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement();
      const onDrop = vi.fn();
      let cleanupTarget: () => void = () => {};
      engine.registerDraggable(source, {
        // The source is told the drop landed first and tears its zones down,
        // unregistering the very target the drop was resolved to. The engine
        // snapshots the registration before the end dispatch, so the target's
        // onDrop must still fire rather than silently no-op on a re-read.
        onMoveEnd: () => {
          cleanupTarget();
        },
      });
      cleanupTarget = engine.registerDropTarget(target, { onDraggableDrop: onDrop });

      fireEvent.dragStart(source);
      await flushRaf();
      fireEvent.dragEnter(target);
      fireEvent.dragOver(target);
      await flushRaf();
      fireEvent.drop(target);

      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop.mock.calls[0][0].target.element).toBe(target);
    });

    it('seeds previous.input from the pickup point so the first event reads a zero delta', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Captured at dispatch time (the shared `location` is mutated in place);
      // the input objects themselves are immutable snapshots.
      let firstEvent: {
        previousInput: { clientX: number; clientY: number } | undefined;
        initialInput: { clientX: number; clientY: number };
        currentInput: { clientX: number; clientY: number };
      } | null = null;
      engine.registerDraggable(source, {
        onMoveStart: ({ location }) => {
          firstEvent = {
            previousInput: location.previous.input,
            initialInput: location.initial.input,
            currentInput: location.current.input,
          };
        },
      });

      fireEvent.dragStart(source);
      await flushRaf();

      // A consumer diffing `current` against `previous` on the first delivered
      // event must read a zero delta from the pickup point — never `undefined`.
      expect(firstEvent).not.toBeNull();
      expect(firstEvent!.previousInput).toBeDefined();
      expect(firstEvent!.previousInput).toBe(firstEvent!.initialInput);
      expect(firstEvent!.currentInput.clientX).toBe(firstEvent!.previousInput!.clientX);
      expect(firstEvent!.currentInput.clientY).toBe(firstEvent!.previousInput!.clientY);
    });

    it('keeps a registration a leave handler re-creates on the same element', async () => {
      // A target that remounts from its own `onDraggableLeave` calls `registerDropTarget`
      // while the retiring entry is still in the registry, so the new hold lands in
      // it — and used to be deleted along with it, leaving a target that never
      // resolved again.
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement({ top: 200, height: 100 });
      const onDropAfterRemount = vi.fn();
      engine.registerDraggable(source, {});

      // The leave this target receives *as it unregisters* is dispatched from
      // inside `remove()`, while the retiring entry is still in the registry.
      const unregister = engine.registerDropTarget(target, {
        onDraggableLeave: () => {
          registerCleanup(
            engine.registerDropTarget(target, { onDraggableDrop: onDropAfterRemount }),
          );
        },
      });

      await lift(source);
      await dragEnter(target, { clientY: 250 });
      // Unregistering the hovered target refreshes the stack, which delivers the
      // leave above — and that handler re-registers the very same node.
      unregister();

      // The re-registration survived, marker attribute and all.
      expect(target).toHaveAttribute('data-drop-target');

      await dragOver(target, { clientY: 250 });
      fireEvent.drop(target, { clientY: 250 });

      expect(onDropAfterRemount).toHaveBeenCalledTimes(1);
    });

    it('hands every event its own location snapshot', async () => {
      // The engine keeps one mutable location for its own bookkeeping. Handing
      // that object out would make a stashed event report the drag's *latest*
      // position, and would let a handler splice the very array the fan-out is
      // still iterating.
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement({ top: 0, height: 400 });
      const events: MoveEvent[] = [];
      engine.registerDraggable(source, {
        onMove: (event) => events.push(event),
      });
      engine.registerDropTarget(target, {});

      fireEvent.dragStart(source, { clientX: 0, clientY: 0 });
      await flushRaf();
      fireEvent.dragOver(target, { clientX: 0, clientY: 10 });
      await flushRaf();
      await flushRaf();

      expect(events.length).toBeGreaterThan(0);
      const stashed = events.at(-1)!;
      const stashedY = stashed.location.current.input.clientY;
      const stashedStack = stashed.location.current.dropTargets;

      fireEvent.dragOver(target, { clientX: 0, clientY: 300 });
      await flushRaf();
      await flushRaf();

      // The stashed event still reports where it fired.
      expect(stashed.location.current.input.clientY).toBe(stashedY);
      expect(events.at(-1)!.location.current.input.clientY).toBe(300);
      // ...and owns its stack, rather than aliasing the next event's.
      expect(events.at(-1)!.location.current.dropTargets).not.toBe(stashedStack);
    });

    it('advances previous.input once per delivered event, not once per raw sample', async () => {
      // Direction and velocity consumers diff `current` against `previous`. If
      // `previous` advanced for every raw pointer sample, several samples
      // coalesced into one delivered event would report the delta of the last
      // sample pair instead of the whole movement.
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement({ top: 0, height: 400 });
      const samples: Array<{ previous: number; current: number }> = [];
      engine.registerDraggable(source, {
        onMove: ({ location }) => {
          samples.push({
            previous: location.previous.input.clientY,
            current: location.current.input.clientY,
          });
        },
      });
      engine.registerDropTarget(target, {});

      fireEvent.dragStart(source, { clientX: 0, clientY: 0 });
      await flushRaf();
      // Enter the target first: the stack change is itself a delivered event, so
      // measuring from here isolates movement within one target.
      fireEvent.dragOver(target, { clientX: 0, clientY: 10 });
      await flushRaf();
      await flushRaf();

      // A: one move delivered on its own frame.
      fireEvent.dragOver(target, { clientX: 0, clientY: 20 });
      await flushRaf();
      await flushRaf();
      expect(samples.at(-1)).toEqual({ previous: 10, current: 20 });

      // B and C queued before the next frame: one delivered event, whose
      // `previous` is A rather than B.
      fireEvent.dragOver(target, { clientX: 0, clientY: 30 });
      fireEvent.dragOver(target, { clientX: 0, clientY: 40 });
      await flushRaf();
      await flushRaf();

      expect(samples.at(-1)).toEqual({ previous: 20, current: 40 });
    });

    it('does not re-enter targets when a consumer onMoveEnd unregisters a hovered target mid-cancel', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const outer = createElement();
      const inner = document.createElement('div');
      outer.appendChild(inner);

      const outerEnter = vi.fn();
      const outerLeave = vi.fn();
      let cleanupInner: () => void = () => {};
      engine.registerDraggable(source, {
        // Tearing down zones on drag end: the inner target — still under the
        // pointer — unregisters synchronously inside the cancel's onMoveEnd.
        // A live `refreshDropTargets` would re-resolve the emptied stack, find
        // the outer target still under the pointer, and re-enter it mid-cancel
        // with no balancing leave; the cancel path disarms the refresh.
        onMoveEnd: () => {
          cleanupInner();
        },
      });
      engine.registerDropTarget(outer, {
        onDraggableEnter: outerEnter,
        onDraggableLeave: outerLeave,
      });
      cleanupInner = engine.registerDropTarget(inner, {});

      fireEvent.dragStart(source);
      await flushRaf();
      fireEvent.dragEnter(inner);
      fireEvent.dragOver(inner);
      await flushRaf();
      expect(outerEnter).toHaveBeenCalledTimes(1);

      cancel();
      await flushRaf();

      // Every enter the outer target received is balanced by exactly one leave.
      expect(outerEnter).toHaveBeenCalledTimes(1);
      expect(outerLeave).toHaveBeenCalledTimes(1);
    });
  });

  it('surfaces its own payload on drop', async () => {
    const { engine } = await renderDnd();
    const sourceEl = createElement();
    const targetEl = createElement();
    targetEl.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    let observedTargetId: string | undefined;

    engine.registerDraggable(sourceEl, {});
    engine.registerDropTarget(targetEl, {
      getPayload: () => ({ id: 'tgt-low' }),
      onDraggableDrop: ({ target }) => {
        observedTargetId = target.payload.id as string;
      },
    });

    fireEvent.dragStart(sourceEl);
    await flushRaf();
    fireEvent.dragEnter(targetEl);
    fireEvent.dragOver(targetEl);
    await flushRaf();
    fireEvent.drop(targetEl);

    expect(observedTargetId).toBe('tgt-low');
  });

  it('terminal onDraggableLeave on cancel reports the last-resolved payload, not the entry-time one', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement({ top: 200, height: 100 });
    const leavePayloads: unknown[] = [];
    let value = 'entry';
    engine.registerDraggable(source, {});
    engine.registerDropTarget(target, {
      getPayload: () => value,
      onDraggableLeave: ({ target }) => leavePayloads.push(target.payload),
    });

    await lift(source);
    await dragEnter(target, { clientY: 250 });

    // The payload evolves while the pointer keeps moving *inside* the target:
    // the stack stays element-equal, so no change dispatch runs, but every
    // sample re-resolves the records.
    value = 'latest';
    await dragOver(target, { clientY: 260 });

    // Cancel while still hovered: the terminal leave comes from the cancel
    // path's own dispatch, fed by the hovered-stack bookkeeping.
    fireEvent.dragEnd(target);

    expect(leavePayloads).toEqual(['latest']);
  });

  it('terminal onDraggableLeave after a drop reports the payload resolved at release time', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement({ top: 200, height: 100 });
    const leavePayloads: unknown[] = [];
    let value = 'entry';
    engine.registerDraggable(source, {});
    engine.registerDropTarget(target, {
      getPayload: () => value,
      onDraggableLeave: ({ target }) => leavePayloads.push(target.payload),
    });

    await lift(source);
    await dragEnter(target, { clientY: 250 });

    // The drop re-resolves the stack at the release position; the terminal
    // leave must report that resolution, not the record captured at entry.
    value = 'latest';
    fireEvent.drop(target, { clientY: 250 });

    expect(leavePayloads).toEqual(['latest']);
  });

  it('coalesces the mid-drag refresh when a non-hovered target unregisters', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const hovered = createElement({ top: 200, height: 100 });
    const other = createElement({ top: 400, height: 100 });
    const hoveredPayload = vi.fn(() => 'x');
    const onDraggableLeave = vi.fn();
    engine.registerDraggable(source, {});
    const unregisterHovered = engine.registerDropTarget(hovered, {
      getPayload: hoveredPayload,
      onDraggableLeave,
    });
    const unregisterOther = engine.registerDropTarget(other, {});

    await lift(source);
    await dragEnter(hovered, { clientY: 250 });

    // Unregistering a target outside the hovered stack cannot change the
    // resolved stack, so it must not re-resolve synchronously — a virtualizer
    // commit unregistering many off-screen targets would pay O(k) walks.
    const callsBefore = hoveredPayload.mock.calls.length;
    unregisterOther();
    expect(hoveredPayload.mock.calls.length).toBe(callsBefore);

    // The refresh coalesces into the same microtask the register path uses.
    await Promise.resolve();
    expect(hoveredPayload.mock.calls.length).toBeGreaterThan(callsBefore);

    // A *hovered* target's unregister still refreshes synchronously: its leave
    // must dispatch while the registration is still readable.
    expect(onDraggableLeave).not.toHaveBeenCalled();
    unregisterHovered();
    expect(onDraggableLeave).toHaveBeenCalledTimes(1);
  });

  it('a handler unregistering a hovered target from inside the change fan-out defers the re-resolve until the round completes', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const outer = createElement();
    const inner = createElement();
    outer.appendChild(inner);

    const currentStacks: Element[][] = [];
    engine.registerDraggable(source, {});
    engine.registerMonitor({
      onTargetChange: ({ location }) => {
        currentStacks.push(location.current.dropTargets.map((record) => record.element));
      },
    });
    let unregisterOuter: (() => void) | null = null;
    engine.registerDropTarget(inner, {
      onDraggableEnter: () => {
        // Runs while the [outer] → [inner, outer] fan-out is in flight, with
        // outer in the published stack: its unregister requests a synchronous
        // re-resolve that must wait for the round instead of re-entering it.
        unregisterOuter?.();
        unregisterOuter = null;
      },
    });
    const outerOnDragLeave = vi.fn();
    unregisterOuter = engine.registerDropTarget(outer, { onDraggableLeave: outerOnDragLeave });

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(outer);
    await flushRaf();
    fireEvent.dragEnter(inner);
    await flushRaf();

    // The interrupted round still reports exactly what it delivered
    // ([inner, outer]), and the deferred re-resolve settles the stack as its
    // own follow-up round. Re-entering mid-round instead would deliver the two
    // rounds inverted — the stale [inner, outer] change last — leaving the
    // engine (and every monitor) believing the unregistered outer target is
    // still hovered.
    expect(currentStacks.at(-1)).toEqual([inner]);
    expect(
      dragSessionStore.getSnapshot()?.location.current.dropTargets.map((record) => record.element),
    ).toEqual([inner]);
    // And the outer target still gets the `onDraggableLeave` it was owed. Deferring the
    // refresh is what makes that hard: the registry entry is deleted as the
    // unregister returns, so by the time the queued round runs there is nothing
    // left to dispatch through unless the retiring getter was held back.
    expect(outerOnDragLeave).toHaveBeenCalledTimes(1);
  });

  it('warns in development when kind is declared without accept', async () => {
    const { engine } = await renderDnd();
    const target = createElement();
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // `kind` is what the target *is*; reading it as `accept` compiles and then
    // silently takes every drag on the page.
    engine.registerDropTarget(target, { kind: cardKind });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0][0])).toContain('declares `kind` but no `accept`');

    // Declaring both is the normal way to give a target an identity.
    spy.mockClear();
    const other = createElement();
    engine.registerDropTarget(other, { kind: cardKind, accept: cardKind });
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it('warns in development when accept is omitted entirely', async () => {
    await renderDnd();
    const target = createElement();
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // The types require `accept`, so only plain JS (or a cast) reaches this,
    // where the target would otherwise silently take every drag on the page.
    // The raw registration API is used directly: the test wrapper opts
    // accept-less fixtures into `anyDragKind` on purpose.
    const cleanup = registerDropTargetRaw(target, () => ({}));
    registerCleanup(cleanup);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0][0])).toContain('declares no `accept`');

    // `anyDragKind` is the explicit way to accept everything.
    spy.mockClear();
    const other = createElement();
    const otherCleanup = registerDropTargetRaw(other, () => ({ accept: anyDragKind }));
    registerCleanup(otherCleanup);
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });
});
