import { describe, it, expect, vi } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer } from '../../../test/dndEngine';
import {
  cancel,
  createElement,
  dragEnter,
  dragOver,
  flushRaf,
  lift,
  mockElementFromPoint,
  registerCleanup,
  setupDragEngineTests,
  fireDrag,
} from '../../../test/dnd';
import { dragSessionStore } from '../../utils/drag-and-drop/dragSessionStore';
import { getActiveSession } from '../../utils/drag-and-drop/core/dragSession';
import { registerTarget as registerTargetRaw } from '../../utils/drag-and-drop/registrations';
import { anyDragKind } from '../../utils/drag-and-drop/dragKind';
import type { MoveEventDetails } from '../../utils/drag-and-drop/types';
import type { DraggableTargetRecord } from '../target/DraggableTarget';
import type { RegisterTargetParameters } from '../../utils/drag-and-drop/registrationTypes';

setupDragEngineTests();

const cardKind = Draggable.createKind('card');
const columnKind = Draggable.createKind('column');
const slotKind = Draggable.createKind('card-slot');

describe('engine.registerTarget', () => {
  const { renderDnd } = createDndRenderer();

  it('sets the internal drop target marker on the element and removes it on cleanup', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const cleanup = engine.registerTarget(el, {});
    expect(el.getAttribute('data-base-ui-drop-target')).toBe('');
    cleanup();
    expect(el.hasAttribute('data-base-ui-drop-target')).toBe(false);
  });

  it.each([
    ['canDrop returning false', { canDrop: () => false }],
    ['disabled', { disabled: true }],
  ])('%s prevents the element from being a target', async (_label, blocking) => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    const onDrop = vi.fn();
    engine.registerSource(source, {});
    engine.registerTarget(target, {
      ...blocking,
      onDraggableEnter,
      onDraggableDrop: onDrop,
    });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);
    fireDrag.drop(target);

    expect(onDraggableEnter).not.toHaveBeenCalled();
    expect(onDrop).not.toHaveBeenCalled();
  });

  it.each([
    ['a disabled inner target', { disabled: true }],
    ['an inner target whose canDrop is false', { canDrop: () => false }],
  ])('nested targets: %s is skipped and the outer claims the drop', async (_label, blocking) => {
    const { engine } = await renderDnd();
    const source = createElement();
    const outer = createElement();
    const inner = createElement();
    outer.appendChild(inner);

    const outerOnDrop = vi.fn();
    const innerOnDrop = vi.fn();

    engine.registerSource(source, {});
    engine.registerTarget(outer, { onDraggableDrop: outerOnDrop });
    engine.registerTarget(inner, { ...blocking, onDraggableDrop: innerOnDrop });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(inner);
    await dragOver(inner);
    fireDrag.drop(inner);

    // The blocked inner target never enters the active stack, so the outer
    // accepting target is the innermost and gets onDrop.
    expect(innerOnDrop).not.toHaveBeenCalled();
    expect(outerOnDrop).toHaveBeenCalledTimes(1);
    expect(outerOnDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        currentTarget: expect.objectContaining({ element: outer }),
        reason: 'drop',
      }),
    );
  });

  it('reports the native pointer event on the move-derived handlers', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const seen: Record<string, Event | undefined> = {};
    engine.registerSource(source, {
      onMove: (details) => {
        seen.drag = details.event;
      },
    });
    engine.registerTarget(target, {
      onDraggableEnter: (details) => {
        seen.enter = details.event;
      },
    });

    await lift(source);
    // Entering the target. The change round dispatches `onDraggableEnter` synchronously.
    fireDrag.dragEnter(target, { shiftKey: true, clientX: 30, clientY: 40 });
    await dragOver(target, { shiftKey: true, clientX: 30, clientY: 40 });
    // A second move within the target, so the stack is unchanged. The change
    // round above cancels the queued source `onMove`, and only a settled move
    // like this one lets the throttled dispatch land.
    await dragOver(target, { shiftKey: true, clientX: 31, clientY: 41 });

    // `DragEventDetails` narrows `event` to a `PointerEvent` for these reasons, so
    // reading a modifier off it has to work. A fabricated placeholder would
    // type-check and return `undefined`.
    for (const name of ['enter', 'drag'] as const) {
      expect(seen[name]).toBeInstanceOf(PointerEvent);
      expect((seen[name] as PointerEvent).shiftKey).toBe(true);
    }

    cancel();
  });

  it.each([
    ['disabling a hovered target', (isBlocked: () => boolean) => ({ disabled: isBlocked() })],
    [
      'a canDrop flipping to false',
      (isBlocked: () => boolean) => ({ canDrop: () => !isBlocked() }),
    ],
  ])(
    '%s mid-hover dispatches its onDraggableLeave on the next resolution',
    async (_label, blocking) => {
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement();
      const onDraggableEnter = vi.fn();
      const onDraggableLeave = vi.fn();
      let blocked = false;
      engine.registerSource(source, {});
      // The engine reads the getter and runs `canDrop` on every resolution, so the
      // flip needs no re-registration. The React layer's params work the same way.
      engine.registerTarget(target, () => ({
        ...blocking(() => blocked),
        onDraggableEnter,
        onDraggableLeave,
      }));

      fireDrag.dragStart(source);
      await flushRaf();
      fireDrag.dragEnter(target);
      await dragOver(target);
      expect(onDraggableEnter).toHaveBeenCalledTimes(1);
      expect(onDraggableLeave).not.toHaveBeenCalled();

      blocked = true;
      // Nothing re-resolves until new input arrives. The next pointer move over
      // the now-blocked target drops it from the stack and delivers its leave.
      await dragOver(target);

      expect(onDraggableLeave).toHaveBeenCalledTimes(1);

      cancel();
    },
  );

  it('does not invoke canDrop when accept already rejected the source', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const canDrop = vi.fn(() => true);
    const onDraggableEnter = vi.fn();
    engine.registerSource(source, { kind: columnKind });
    engine.registerTarget(target, { accept: cardKind, canDrop, onDraggableEnter });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);

    // `accept` is the cheap filter that runs first. A mismatched kind never
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
    engine.registerSource(source, { kind: cardKind });
    engine.registerTarget(target, { accept: [cardKind, columnKind], onDraggableEnter });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);

    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
  });

  it('matches two global kinds created from the same namespaced key', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    engine.registerSource(source, { kind: Draggable.createGlobalKind('test/task') });
    engine.registerTarget(target, {
      accept: Draggable.createGlobalKind('test/task'),
      onDraggableEnter,
    });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);

    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
  });

  it('drop target kind is exposed on `currentTarget` and on records in location targets', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    let observedSelfKind: symbol | undefined;
    let observedRecordKind: symbol | undefined;
    engine.registerSource(source, { kind: cardKind });
    engine.registerTarget(target, {
      kind: slotKind,
      accept: cardKind,
      onDraggableEnter: ({ currentTarget, location }) => {
        observedSelfKind = currentTarget.kind;
        observedRecordKind = location.current.targets[0]?.kind;
      },
    });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);

    expect(observedSelfKind).toBe(slotKind.id);
    expect(observedRecordKind).toBe(slotKind.id);
  });

  it('source kind flows through to `source.kind` on every callback', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    let observedKind: symbol | undefined;
    engine.registerSource(source, { kind: cardKind });
    engine.registerTarget(target, {
      onDraggableEnter: ({ source: src }) => {
        observedKind = src.kind;
      },
    });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);

    expect(observedKind).toBe(cardKind.id);
  });

  it('attaches a value payload to the target record', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDrop = vi.fn();
    engine.registerSource(source, {});
    engine.registerTarget(target, {
      payload: { targetKey: 'targetValue' },
      onDraggableDrop: onDrop,
    });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);
    fireDrag.drop(target);
    await flushRaf();

    expect(onDrop.mock.calls[0][0].currentTarget.payload).toEqual({ targetKey: 'targetValue' });
  });

  it('keeps a function payload as data instead of invoking it', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const command = vi.fn(() => 'command result');
    const onDrop = vi.fn();
    engine.registerSource(source, {});
    engine.registerTarget(target, { payload: command, onDraggableDrop: onDrop });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);
    fireDrag.drop(target);
    await flushRaf();

    expect(onDrop.mock.calls[0][0].currentTarget.payload).toBe(command);
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
    engine.registerSource(source, {});
    engine.registerTarget(target, { payload: value, onDraggableDrop: onDrop });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);
    fireDrag.drop(target);
    await flushRaf();

    expect(onDrop.mock.calls[0][0].currentTarget.payload).toBe(value);
  });

  it('leaves the target payload undefined when none is declared', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDrop = vi.fn();
    engine.registerSource(source, {});
    engine.registerTarget(target, { onDraggableDrop: onDrop });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);
    fireDrag.drop(target);
    await flushRaf();

    expect(onDrop.mock.calls[0][0].currentTarget.payload).toBe(undefined);
  });

  it('fires onDraggableEnter when entering a target', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    engine.registerSource(source, {});
    engine.registerTarget(target, { onDraggableEnter });

    fireDrag.dragStart(source);
    await flushRaf();
    await dragEnter(target);

    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
    expect(onDraggableEnter).toHaveBeenCalledWith(
      expect.objectContaining({
        currentTarget: expect.objectContaining({ element: target }),
        reason: 'pointer',
      }),
    );
  });

  it('delivers a leave on refresh when a hovered target is disabled under a still pointer', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableLeave = vi.fn();
    let disabled = false;
    engine.registerSource(source, {});
    engine.registerTarget(target, () => ({ disabled, onDraggableLeave }));

    fireDrag.dragStart(source);
    await flushRaf();
    await dragEnter(target);

    disabled = true;
    await act(async () => {
      engine.refresh(target);
    });
    expect(onDraggableLeave).toHaveBeenCalledTimes(1);
  });

  it('delivers onMove once to a target on the frame it enters', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onMove = vi.fn();
    engine.registerSource(source, {});
    engine.registerTarget(target, { onDraggableMove: onMove });

    fireDrag.dragStart(source);
    await flushRaf();
    await dragEnter(target);

    // The entry round and the frame's own move dispatch share one delivery, so a
    // consumer measuring in `onMove` pays for it once per frame, not twice.
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith(
      expect.objectContaining({
        currentTarget: expect.objectContaining({ element: target }),
        reason: 'pointer',
      }),
    );
  });

  it('fires onDraggableLeave when leaving a target', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target1 = createElement();
    const target2 = createElement();
    const onDraggableLeave = vi.fn();
    engine.registerSource(source, {});
    engine.registerTarget(target1, { onDraggableLeave });
    engine.registerTarget(target2, {});

    fireDrag.dragStart(source);
    await flushRaf();
    await dragEnter(target1);
    await dragEnter(target2);

    expect(onDraggableLeave).toHaveBeenCalledTimes(1);
  });

  it('the terminal onDraggableLeave on drop reports an empty current stack (parity with cancel)', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableLeave = vi.fn();
    engine.registerSource(source, {});
    engine.registerTarget(target, { onDraggableLeave });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);
    fireDrag.drop(target);

    // A leave handler deriving "still hovered?" from `location.current` must see
    // the same shape on drop as on cancel, with the target already out of the stack.
    // Each dispatch gets its own `location` snapshot, so reading it afterwards is safe.
    expect(onDraggableLeave).toHaveBeenCalledTimes(1);
    expect(onDraggableLeave.mock.calls[0][0].location.current.targets).toEqual([]);
  });

  it('fires onDrop when a drop occurs on the target', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDrop = vi.fn();
    engine.registerSource(source, {});
    engine.registerTarget(target, { onDraggableDrop: onDrop });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);
    fireDrag.drop(target);

    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        currentTarget: expect.objectContaining({ element: target }),
        // `onDrop` only ever fires for a committed drop, so its reason is fixed.
        reason: 'drop',
      }),
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

    engine.registerSource(source, {});
    engine.registerTarget(outer, { onDraggableDrop: outerOnDrop });
    engine.registerTarget(inner, { onDraggableDrop: innerOnDrop });
    engine.registerMonitor({ onMoveEnd: monitorOnDrop });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(inner);
    await dragOver(inner);
    fireDrag.drop(inner);

    // Inner is the innermost target, so it gets onDrop.
    expect(innerOnDrop).toHaveBeenCalledTimes(1);
    expect(innerOnDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        currentTarget: expect.objectContaining({ element: inner }),
        reason: 'drop',
      }),
    );

    // Outer is in the active stack but not innermost, so its onDrop is skipped.
    expect(outerOnDrop).not.toHaveBeenCalled();

    // Monitors still see the full chain via location.current.targets.
    expect(monitorOnDrop).toHaveBeenCalledTimes(1);
    const monitorDetails = monitorOnDrop.mock.calls[0]![0];
    expect(monitorDetails.location.current.targets.map((t: any) => t.element)).toEqual([
      inner,
      outer,
    ]);
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

    engine.registerSource(source, { onMoveEnd });
    // A container-level rule, such as a capacity limit. With `false` the drop
    // would fall through to the accepting card inside and bypass the limit.
    engine.registerTarget(column, { canDrop: () => 'reject', onDraggableDrop: columnOnDrop });
    engine.registerTarget(card, {
      onDraggableDrop: cardOnDrop,
      onDraggableEnter: cardOnDragEnter,
    });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(card);
    await dragOver(card);

    // The card accepted, but its rejecting ancestor vetoes the subtree, so no
    // target resolves.
    expect(cardOnDragEnter).not.toHaveBeenCalled();

    fireDrag.drop(card);

    expect(cardOnDrop).not.toHaveBeenCalled();
    expect(columnOnDrop).not.toHaveBeenCalled();
    // Released over no resolved target. That is an outside release, not a cancel.
    expect(onMoveEnd).toHaveBeenCalledWith(
      expect.objectContaining({ target: null, reason: 'outside-release' }),
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

    engine.registerSource(source, {});
    engine.registerTarget(board, {
      onDraggableDrop: boardOnDrop,
      onDraggableEnter: boardOnDragEnter,
    });
    engine.registerTarget(column, { canDrop: () => 'reject' });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(column);
    await dragOver(column);
    fireDrag.drop(column);

    // Unlike `false`, which abstains, `'reject'` refuses outright. The board
    // behind the column never becomes a target either.
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
    engine.registerTarget(target, {
      canDrop: () => (full ? 'reject' : true),
      onDraggableEnter,
      onDraggableLeave,
    });
    engine.registerSource(source, {});

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);
    expect(onDraggableEnter).not.toHaveBeenCalled();

    full = false;
    await dragOver(target);
    expect(onDraggableEnter).toHaveBeenCalledTimes(1);

    full = true;
    await dragOver(target);
    expect(onDraggableLeave).toHaveBeenCalledTimes(1);
  });

  describe('snap', () => {
    // Targets are the default 200×100 stub rect at (0, 200) throughout, so every
    // expected fraction is arithmetic rather than a snapshot.
    async function dropAt(
      parameters: Omit<RegisterTargetParameters<unknown, unknown>, 'accept'>,
      clientX: number,
      clientY: number,
    ) {
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement({ top: 200 });
      const onDrop = vi.fn();
      engine.registerSource(source, {});
      engine.registerTarget(target, { ...parameters, onDraggableDrop: onDrop });

      await lift(source);
      fireDrag.dragEnter(target, { clientX, clientY });
      await dragOver(target, { clientX, clientY });
      fireDrag.drop(target, { clientX, clientY });

      expect(onDrop).toHaveBeenCalledTimes(1);
      return onDrop.mock.calls[0][0].currentTarget as DraggableTargetRecord;
    }

    it('quantizes getSnappedLocalPoint to the declared steps with symmetric rounding', async () => {
      // x is 125/200 = 0.625, the exact midpoint between steps 2 and 3 of 4, and
      // rounds up. y is 235 → 0.35, and the nearest of 4 steps is 0.25.
      const record = await dropAt({ snap: { x: 4, y: 4 } }, 125, 235);

      expect(record.getSnappedLocalPoint()).toEqual({ x: 0.75, y: 0.25 });
      // The raw reader is untouched by the declaration.
      expect(record.getLocalPoint()).toEqual({ x: 0.625, y: 0.35 });
    });

    it('leaves an axis without steps at its clamped raw fraction', async () => {
      // `fireDrag` resolves the named target wherever the pointer is, so a point
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
        expect(element).toHaveAttribute('data-base-ui-drop-target');
        return { y: 4 };
      });
      const record = await dropAt({ snap }, 150, 235);

      // Nothing has read the point yet, so a declared but unread snap costs nothing.
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
      // Grabbed 30px below the source's top edge. `fireDrag`'s activation nudge
      // only shifts x. The source anchor reports where the dragged element's
      // top edge sits, which is what a move commits. Snapping the pointer and
      // subtracting the grab offset afterwards would un-snap it.
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement({ top: 200 });
      const onDrop = vi.fn();
      engine.registerSource(source, {});
      engine.registerTarget(target, { snap: { y: 4 }, onDraggableDrop: onDrop });

      await lift(source, { clientY: 30 });
      fireDrag.dragEnter(target, { clientY: 265 });
      await dragOver(target, { clientY: 265 });
      fireDrag.drop(target, { clientY: 265 });

      const record = onDrop.mock.calls[0][0].currentTarget as DraggableTargetRecord;
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
    engine.registerSource(source, {});
    engine.registerTarget(outer, { onDraggableEnter });

    fireDrag.dragStart(source);
    await flushRaf();
    await dragOver(inner);

    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
    const details = onDraggableEnter.mock.calls[0][0];
    expect(details.location.current.targets[0].element).toBe(outer);
  });

  it('collects ancestor drop targets when the inner target is a direct child of a shadow root', async () => {
    // A registered drop target that is a direct child of a shadow root has
    // `parentElement === null`, so the walk must cross out through the host to
    // reach the outer target instead of stopping at the boundary.
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
    engine.registerSource(source, {});
    engine.registerTarget(outer, { onDraggableEnter: onDragEnterOuter });
    engine.registerTarget(inner, { onDraggableEnter: onDragEnterInner });

    fireDrag.dragStart(source);
    await flushRaf();
    await dragOver(inner);

    expect(onDragEnterInner).toHaveBeenCalledTimes(1);
    expect(onDragEnterOuter).toHaveBeenCalledTimes(1);
    const elements = onDragEnterInner.mock.calls[0][0].location.current.targets.map(
      (record: { element: Element }) => record.element,
    );
    expect(elements).toEqual([inner, outer]);
  });

  it.each(['open', 'closed'] as const)(
    'collects a shadow-tree target wrapping the slot a light-DOM node is assigned to (%s root)',
    async (mode) => {
      // A `closest()` walk follows the light-DOM parent chain straight through the
      // shadow host, so when a light-DOM ancestor is also a target, it skips the
      // shadow-tree target around the `<slot>`. The composed walk enters the
      // assigned slot first, then climbs out through the host. A closed root hides
      // the slot from `assignedSlot`, so the engine finds it in the root it knows
      // from the registered target.
      const { engine } = await renderDnd();
      const light = createElement();
      const host = document.createElement('x-host');
      light.appendChild(host);
      const shadow = host.attachShadow({ mode });
      const zone = document.createElement('div');
      zone.appendChild(document.createElement('slot'));
      shadow.appendChild(zone);
      const slotted = document.createElement('span');
      host.appendChild(slotted);

      const source = createElement();
      const onDragEnterZone = vi.fn();
      const onDragEnterLight = vi.fn();
      engine.registerSource(source, {});
      engine.registerTarget(zone, { onDraggableEnter: onDragEnterZone });
      engine.registerTarget(light, { onDraggableEnter: onDragEnterLight });

      fireDrag.dragStart(source);
      await flushRaf();
      await dragOver(slotted);

      expect(onDragEnterZone).toHaveBeenCalledTimes(1);
      expect(onDragEnterLight).toHaveBeenCalledTimes(1);
      const elements = onDragEnterZone.mock.calls[0][0].location.current.targets.map(
        (record: { element: Element }) => record.element,
      );
      expect(elements).toEqual([zone, light]);
    },
  );

  it('keeps non-throwing drop targets active when an ancestor target throws from a consumer callback', async () => {
    // Nest the sane (inner) target inside the buggy (ancestor) target so the
    // walker visits both, sane first, then buggy on the climb. Buggy's
    // `canDrop` throws. The walker should log and skip it without abandoning
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
    engine.registerSource(source, {});
    engine.registerTarget(buggy, {
      canDrop: () => {
        throw new Error('canDrop boom');
      },
    });
    engine.registerTarget(sane, { onDraggableEnter: onDragEnterSane });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      fireDrag.dragStart(source);
      await flushRaf();
      fireDrag.dragEnter(sane);
      await dragOver(sane);

      // The buggy callback's throw must have been logged (rejection path).
      expect(consoleError).toHaveBeenCalled();
      // The inner target still received its event.
      expect(onDragEnterSane).toHaveBeenCalled();
    } finally {
      // End the drag before restoring the console spy, even if an assertion
      // above failed. Otherwise teardown unregisters the buggy target mid-drag,
      // which re-resolves the stack and throws from `canDrop` again after the spy
      // is gone. `fireDrag.dragEnd()` cancels the drag and clears the stack
      // without re-running `canDrop`.
      fireDrag.dragEnd();
      consoleError.mockRestore();
    }
  });

  // Consumers supply the parameters getter itself through the imperative API.
  // A throw there is contained like a throwing `canDrop`. It is logged and the
  // target is treated as unregistered, so the drag and every sibling keep working.
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
    engine.registerSource(source, { onMoveEnd });
    engine.registerTarget(buggy, () => {
      throw new Error('getParameters boom');
    });
    engine.registerTarget(sane, {
      onDraggableEnter: onDragEnterSane,
      onDraggableDrop: onDropSane,
    });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      fireDrag.dragStart(source);
      await flushRaf();
      fireDrag.dragEnter(sane);
      await dragOver(sane);

      // The throw was contained and logged...
      expect(consoleError).toHaveBeenCalled();
      // ...the nested sane target still received its events...
      expect(onDragEnterSane).toHaveBeenCalled();

      // ...and the drag still ends with a delivered drop.
      fireDrag.drop(sane);
      expect(onDropSane).toHaveBeenCalledTimes(1);
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
    } finally {
      fireDrag.dragEnd();
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
    engine.registerSource(source, { onMoveEnd });
    engine.registerTarget(target, () => {
      if (shouldThrow) {
        throw new Error('getParameters boom');
      }
      return { onDraggableDrop: onDrop };
    });

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      // The getter starts throwing while the target is hovered. The drop's
      // re-resolution and the terminal dispatch to the hovered record both
      // read it again, and each read must be contained so the drag still ends.
      shouldThrow = true;
      fireDrag.drop(target);

      expect(consoleError).toHaveBeenCalled();
      // The target resolved as inactive at release, so its onDrop is skipped,
      // but the drag itself still ends cleanly.
      expect(onDrop).not.toHaveBeenCalled();
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('outside-release');
    } finally {
      fireDrag.dragEnd();
      consoleError.mockRestore();
    }
  });

  it('cleanup removes registration', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onDraggableEnter = vi.fn();
    engine.registerSource(source, {});
    const cleanupDrop = engine.registerTarget(target, { onDraggableEnter });

    cleanupDrop();

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);

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
    engine.registerSource(source, {});
    engine.registerTarget(target, { onDraggableDrop: onDropA });
    const cleanupB = engine.registerTarget(target, { onDraggableDrop: onDropB });

    cleanupB();
    expect(target.hasAttribute('data-base-ui-drop-target')).toBe(true);

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);
    fireDrag.drop(target);

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
      engine.registerSource(source, {
        // The source hears about the drop first and tears down its zones,
        // unregistering the target the drop resolved to. The engine snapshots
        // the registration before the end dispatch, so the target's onDrop must
        // still fire instead of doing nothing on a re-read.
        onMoveEnd: () => {
          cleanupTarget();
        },
      });
      cleanupTarget = engine.registerTarget(target, { onDraggableDrop: onDrop });

      fireDrag.dragStart(source);
      await flushRaf();
      fireDrag.dragEnter(target);
      await dragOver(target);
      fireDrag.drop(target);

      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop.mock.calls[0][0].currentTarget.element).toBe(target);
    });

    it('seeds previous.input from the pickup point so the first event reads a zero delta', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Captured at dispatch time, since the shared `location` is mutated in place.
      // The input objects themselves are immutable snapshots.
      let firstEvent: {
        previousInput: { clientX: number; clientY: number } | undefined;
        initialInput: { clientX: number; clientY: number };
        currentInput: { clientX: number; clientY: number };
      } | null = null;
      engine.registerSource(source, {
        onMoveStart: ({ location }) => {
          firstEvent = {
            previousInput: location.previous.input,
            initialInput: location.initial.input,
            currentInput: location.current.input,
          };
        },
      });

      fireDrag.dragStart(source);
      await flushRaf();

      // A consumer diffing `current` against `previous` on the first delivered
      // event must read a zero delta from the pickup point, never `undefined`.
      expect(firstEvent).not.toBeNull();
      expect(firstEvent!.previousInput).toBeDefined();
      expect(firstEvent!.previousInput).toBe(firstEvent!.initialInput);
      expect(firstEvent!.currentInput.clientX).toBe(firstEvent!.previousInput!.clientX);
      expect(firstEvent!.currentInput.clientY).toBe(firstEvent!.previousInput!.clientY);
    });

    it('keeps a registration a leave handler re-creates on the same element', async () => {
      // A target that remounts from its own `onDraggableLeave` calls `registerTarget`
      // while the retiring entry is still in the registry, so the new hold lands in
      // that entry. Deleting the hold along with the entry would leave a target that
      // never resolves again.
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement({ top: 200, height: 100 });
      const onDropAfterRemount = vi.fn();
      engine.registerSource(source, {});

      // The leave this target receives as it unregisters is dispatched from
      // inside `remove()`, while the retiring entry is still in the registry.
      const unregister = engine.registerTarget(target, {
        onDraggableLeave: () => {
          registerCleanup(engine.registerTarget(target, { onDraggableDrop: onDropAfterRemount }));
        },
      });

      await lift(source);
      await dragEnter(target, { clientY: 250 });
      // Unregistering the hovered target refreshes the stack, which delivers the
      // leave above. That handler re-registers the same node.
      unregister();

      // The re-registration survived, including the marker attribute.
      expect(target).toHaveAttribute('data-base-ui-drop-target');

      await dragOver(target, { clientY: 250 });
      fireDrag.drop(target, { clientY: 250 });

      expect(onDropAfterRemount).toHaveBeenCalledTimes(1);
    });

    it('hands every event its own location snapshot', async () => {
      // The engine keeps one mutable location for its own bookkeeping. Handing
      // that object out would make a stashed event report the drag's latest
      // position, and would let a handler splice the array the fan-out is still
      // iterating.
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement({ top: 0, height: 400 });
      const events: MoveEventDetails[] = [];
      engine.registerSource(source, {
        onMove: (eventDetails) => events.push(eventDetails),
      });
      engine.registerTarget(target, {});

      fireDrag.dragStart(source, { clientX: 0, clientY: 0 });
      await flushRaf();
      await dragOver(target, { clientX: 0, clientY: 10 });
      await flushRaf();

      expect(events.length).toBeGreaterThan(0);
      const stashed = events.at(-1)!;
      const stashedY = stashed.location.current.input.clientY;
      const stashedStack = stashed.location.current.targets;

      await dragOver(target, { clientX: 0, clientY: 300 });
      await flushRaf();

      // The stashed event still reports where it fired.
      expect(stashed.location.current.input.clientY).toBe(stashedY);
      expect(events.at(-1)!.location.current.input.clientY).toBe(300);
      // ...and owns its stack, rather than aliasing the next event's.
      expect(events.at(-1)!.location.current.targets).not.toBe(stashedStack);
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
      engine.registerSource(source, {
        onMove: ({ location }) => {
          samples.push({
            previous: location.previous.input.clientY,
            current: location.current.input.clientY,
          });
        },
      });
      engine.registerTarget(target, {});

      fireDrag.dragStart(source, { clientX: 0, clientY: 0 });
      await flushRaf();
      // Enter the target first. The stack change is itself a delivered event, so
      // measuring from here isolates movement within one target.
      await dragOver(target, { clientX: 0, clientY: 10 });
      await flushRaf();

      // A: one move delivered on its own frame.
      await dragOver(target, { clientX: 0, clientY: 20 });
      await flushRaf();
      expect(samples.at(-1)).toEqual({ previous: 10, current: 20 });

      // B and C are queued before the next frame, so they produce one delivered
      // event whose `previous` is A rather than B.
      fireDrag.dragOver(target, { clientX: 0, clientY: 30 });
      await dragOver(target, { clientX: 0, clientY: 40 });
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
      engine.registerSource(source, {
        // Tear down zones on drag end. The inner target, still under the
        // pointer, unregisters synchronously inside the cancel's onMoveEnd.
        // A live `refreshDropTargets` would re-resolve the emptied stack, find
        // the outer target still under the pointer, and re-enter it mid-cancel
        // with no matching leave. The cancel path disarms the refresh.
        onMoveEnd: () => {
          cleanupInner();
        },
      });
      engine.registerTarget(outer, {
        onDraggableEnter: outerEnter,
        onDraggableLeave: outerLeave,
      });
      cleanupInner = engine.registerTarget(inner, {});

      fireDrag.dragStart(source);
      await flushRaf();
      fireDrag.dragEnter(inner);
      await dragOver(inner);
      expect(outerEnter).toHaveBeenCalledTimes(1);

      cancel();
      await flushRaf();

      // Every enter the outer target received is balanced by exactly one leave.
      expect(outerEnter).toHaveBeenCalledTimes(1);
      expect(outerLeave).toHaveBeenCalledTimes(1);
    });
  });

  it('terminal onDraggableLeave on cancel reports the last-resolved payload, not the entry-time one', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement({ top: 200, height: 100 });
    const leavePayloads: unknown[] = [];
    let value = 'entry';
    engine.registerSource(source, {});
    engine.registerTarget(target, () => ({
      payload: value,
      onDraggableLeave: ({ currentTarget }) => leavePayloads.push(currentTarget.payload),
    }));

    await lift(source);
    await dragEnter(target, { clientY: 250 });

    // The payload changes while the pointer keeps moving inside the target.
    // The stack stays element-equal, so no change dispatch runs, but every
    // sample re-resolves the records.
    value = 'latest';
    await dragOver(target, { clientY: 260 });

    // Cancel while still hovered. The terminal leave comes from the cancel
    // path's own dispatch, fed by the hovered-stack bookkeeping.
    fireDrag.dragEnd();

    expect(leavePayloads).toEqual(['latest']);
  });

  it('terminal onDraggableLeave after a drop reports the payload resolved at release time', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement({ top: 200, height: 100 });
    const leavePayloads: unknown[] = [];
    let value = 'entry';
    engine.registerSource(source, {});
    engine.registerTarget(target, () => ({
      payload: value,
      onDraggableLeave: ({ currentTarget }) => leavePayloads.push(currentTarget.payload),
    }));

    await lift(source);
    await dragEnter(target, { clientY: 250 });

    // The drop re-resolves the stack at the release position. The terminal
    // leave must report that resolution, not the record captured at entry.
    value = 'latest';
    fireDrag.drop(target, { clientY: 250 });

    expect(leavePayloads).toEqual(['latest']);
  });

  it('coalesces the mid-drag refresh when a non-hovered target unregisters', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const hovered = createElement({ top: 200, height: 100 });
    const other = createElement({ top: 400, height: 100 });
    const canDrop = vi.fn(() => true);
    const onDraggableLeave = vi.fn();
    engine.registerSource(source, {});
    const unregisterHovered = engine.registerTarget(hovered, {
      canDrop,
      onDraggableLeave,
    });
    const unregisterOther = engine.registerTarget(other, {});

    await lift(source);
    await dragEnter(hovered, { clientY: 250 });

    // Unregistering a target outside the hovered stack can't change the
    // resolved stack, so it must not re-resolve synchronously. A virtualizer
    // commit unregistering many off-screen targets would pay O(k) walks.
    const callsBefore = canDrop.mock.calls.length;
    unregisterOther();
    expect(canDrop.mock.calls.length).toBe(callsBefore);

    // The refresh coalesces into the same microtask the register path uses.
    await Promise.resolve();
    expect(canDrop.mock.calls.length).toBeGreaterThan(callsBefore);

    // A hovered target's unregister still refreshes synchronously, because its
    // leave must dispatch while the registration is still readable.
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
    engine.registerSource(source, {});
    engine.registerMonitor({
      onTargetChange: ({ location }) => {
        currentStacks.push(location.current.targets.map((record) => record.element));
      },
    });
    let unregisterOuter: (() => void) | null = null;
    engine.registerTarget(inner, {
      onDraggableEnter: () => {
        // Runs while the [outer] → [inner, outer] fan-out is in flight, with
        // outer in the published stack. Its unregister requests a synchronous
        // re-resolve, which must wait for the round instead of re-entering it.
        unregisterOuter?.();
        unregisterOuter = null;
      },
    });
    const outerOnDragLeave = vi.fn();
    unregisterOuter = engine.registerTarget(outer, { onDraggableLeave: outerOnDragLeave });

    fireDrag.dragStart(source);
    await flushRaf();
    await dragEnter(outer);
    await dragEnter(inner);

    // The interrupted round still reports exactly what it delivered
    // ([inner, outer]), and the deferred re-resolve settles the stack as its
    // own follow-up round. Re-entering mid-round would deliver the two rounds
    // in reverse, with the stale [inner, outer] change last. The engine and
    // every monitor would then believe the unregistered outer target is still
    // hovered.
    expect(currentStacks.at(-1)).toEqual([inner]);
    expect(
      dragSessionStore.getSnapshot()?.location.current.targets.map((record) => record.element),
    ).toEqual([inner]);
    // The outer target still gets the `onDraggableLeave` it was owed. The deferred
    // refresh makes that hard, because the registry entry is deleted as the
    // unregister returns. When the queued round runs, there is nothing left to
    // dispatch through unless the retiring getter was held back.
    expect(outerOnDragLeave).toHaveBeenCalledTimes(1);
  });

  it('warns in development when kind is declared without accept', async () => {
    const { engine } = await renderDnd();
    const target = createElement();
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // `kind` is what the target is, not what it accepts. Mistaking it for `accept`
    // compiles, and the target then takes every drag on the page.
    engine.registerTarget(target, { kind: cardKind });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0][0])).toContain(
      'registerTarget() was called with `kind` but no `accept`',
    );

    // Declaring both is the normal way to give a target an identity.
    spy.mockClear();
    const other = createElement();
    engine.registerTarget(other, { kind: cardKind, accept: cardKind });
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it('warns in development when accept is omitted entirely', async () => {
    await renderDnd();
    const target = createElement();
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // The types require `accept`, so only plain JS or a cast reaches this. The
    // target would then take every drag on the page. Uses the raw registration
    // API because the test wrapper opts accept-less fixtures into `anyDragKind`.
    const cleanup = registerTargetRaw(target, () => ({}));
    registerCleanup(cleanup);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0][0])).toContain('registerTarget() was called without `accept`');

    // `anyDragKind` is the explicit way to accept everything.
    spy.mockClear();
    const other = createElement();
    const otherCleanup = registerTargetRaw(other, () => ({ accept: anyDragKind }));
    registerCleanup(otherCleanup);
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });
  it('drops onto a target inside an iframe, hit-testing and scrolling in that document', async () => {
    const { engine } = await renderDnd();
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    registerCleanup(() => iframe.remove());
    const frameDocument = iframe.contentDocument!;

    function createFrameElement(
      rect: { left: number; top: number; width: number; height: number },
      parent: HTMLElement = frameDocument.body,
    ): HTMLElement {
      const el = frameDocument.createElement('div');
      el.getBoundingClientRect = () => new DOMRect(rect.left, rect.top, rect.width, rect.height);
      parent.appendChild(el);
      return el;
    }

    const scroller = createFrameElement({ left: 0, top: 0, width: 200, height: 200 });
    scroller.style.overflow = 'auto';
    scroller.scrollBy = vi.fn();
    Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 200 });
    const source = createFrameElement({ left: 0, top: 0, width: 200, height: 50 }, scroller);
    const target = createFrameElement({ left: 0, top: 150, width: 200, height: 50 }, scroller);

    // The engine hit-tests the source's own document. Every other drop test
    // stubs the top-level `document.elementFromPoint`, which would miss a
    // lookup against the wrong document.
    let hit: Element | null = null;
    frameDocument.elementFromPoint = () => hit;
    const topHitTest = vi.fn(() => target);
    mockElementFromPoint(topHitTest);

    const onDraggableEnter = vi.fn();
    const onDraggableDrop = vi.fn();
    engine.registerSource(source, {
      kind: cardKind,
      activation: { mouse: { type: 'immediate' } },
    });
    engine.registerTarget(target, { accept: cardKind, onDraggableEnter, onDraggableDrop });
    engine.registerViewport(scroller, {});

    function pointer(type: string, clientY: number): void {
      act(() => {
        source.dispatchEvent(
          new PointerEvent(type, {
            pointerType: 'mouse',
            pointerId: 1,
            clientX: 100,
            clientY,
            button: 0,
            buttons: type === 'pointerup' ? 0 : 1,
            bubbles: true,
            cancelable: true,
          }),
        );
      });
    }

    // The engine schedules its frames in the source's window, which runs its
    // own frame clock.
    async function flushFrameRaf(): Promise<void> {
      await act(async () => {
        await new Promise<void>((resolve) => {
          iframe.contentWindow!.requestAnimationFrame(() => resolve());
        });
      });
    }

    pointer('pointerdown', 25);
    await flushFrameRaf();
    // Into the target, which also lies in the viewport's bottom edge zone.
    hit = target;
    pointer('pointermove', 190);
    await flushFrameRaf();
    await flushFrameRaf();
    await flushFrameRaf();

    expect(onDraggableEnter).toHaveBeenCalledTimes(1);
    expect(scroller.scrollBy).toHaveBeenCalled();

    pointer('pointerup', 190);
    expect(onDraggableDrop).toHaveBeenCalledTimes(1);
    expect(onDraggableDrop.mock.calls[0][0].currentTarget.element).toBe(target);
    expect(topHitTest).not.toHaveBeenCalled();
    expect(getActiveSession()).toBe(null);
  });

  describe('parameters from plain JS', () => {
    it('registers a getter that returns undefined without throwing', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement();
      const onMoveEnd = vi.fn();
      engine.registerSource(source, { onMoveEnd });

      registerTargetRaw(target, () => undefined as never);

      await lift(source);
      await dragEnter(target);
      fireDrag.drop(target);
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][0].reason).toBe('outside-release');
      expect(getActiveSession()).toBe(null);
    });

    it('treats `accept: null` like an omitted `accept` and keeps later drags working', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement();
      const onDraggableDrop = vi.fn();
      engine.registerSource(source, { kind: cardKind });
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      registerTargetRaw(target, () => ({
        accept: null as never,
        onDraggableDrop,
      }));

      await lift(source);
      await dragEnter(target);
      fireDrag.drop(target);
      expect(onDraggableDrop).toHaveBeenCalledTimes(1);
      expect(getActiveSession()).toBe(null);

      // `lift` throws if the engine refuses the pickup.
      await lift(source);
      cancel();
    });
  });

  it('refreshes callbacks in reused options before accept stops matching', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const original = vi.fn();
    const current = vi.fn();
    const options = { accept: cardKind, onDraggableLeave: original };
    engine.registerSource(source, { kind: cardKind });
    const target = createElement();
    engine.registerTarget(target, () => options);

    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);
    fireDrag.drop(source);
    expect(original).toHaveBeenCalledTimes(1);
    original.mockClear();

    // Keep the options identity while changing the callback for the next drag.
    options.onDraggableLeave = current;
    fireDrag.dragStart(source);
    await flushRaf();
    fireDrag.dragEnter(target);
    await dragOver(target);
    options.accept = columnKind;
    await dragOver(target);

    expect(current).toHaveBeenCalledTimes(1);
    expect(original).not.toHaveBeenCalled();
  });
});
