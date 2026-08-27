import { describe, it, expect, vi } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer, isJSDOM } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { flushRaf, registerCleanup, setupDragEngineTests } from '../../test/dnd';

setupDragEngineTests();

const cardKind = Draggable.createKind<string>('card');

/**
 * End-to-end drop-target resolution against real layout and a real
 * `document.elementFromPoint`.
 *
 * Every other engine test drives drags through the native→synthetic bridge,
 * which stubs `elementFromPoint` to return the element the test named — so the
 * test hands the engine the answer and the point→element path never runs. These
 * drive raw pointer events instead, which the bridge ignores (it only patches
 * `elementFromPoint` once it sees a native `dragstart`), leaving the engine to
 * hit-test the pointer for real.
 */
describe.skipIf(isJSDOM)('drop target resolution (real hit testing)', () => {
  const { renderDnd } = createDndRenderer();

  /** A laid-out box at fixed viewport coordinates. Removed after the test. */
  function createBox(left: number, top: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position: fixed; left: ${left}px; top: ${top}px; width: 100px; height: 50px; background: rgb(200 200 200);`;
    document.body.appendChild(el);
    registerCleanup(() => el.remove());
    return el;
  }

  function pointer(type: string, target: EventTarget, x: number, y: number): void {
    act(() => {
      target.dispatchEvent(
        new PointerEvent(type, {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: x,
          clientY: y,
          button: 0,
          buttons: type === 'pointerup' ? 0 : 1,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
  }

  it('resolves the target under the pointer, looking past the drag preview', async () => {
    const { engine } = await renderDnd();
    const source = createBox(0, 0);
    const target = createBox(0, 200);

    const onDragEnter = vi.fn();
    const onDrop = vi.fn();
    engine.registerDraggable(source, {
      kind: cardKind,
      payload: 'card-1',
      pointerActivation: { mouse: { type: 'immediate' } },
    });
    engine.registerDropTarget(target, { accept: cardKind, onDragEnter, onDrop });

    pointer('pointerdown', source, 50, 25);
    await flushRaf();

    // Onto the target's center, with any preview between the
    // cursor and the target.
    pointer('pointermove', source, 50, 225);
    await flushRaf();
    await flushRaf();

    expect(onDragEnter).toHaveBeenCalled();

    pointer('pointerup', source, 50, 225);
    await flushRaf();

    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop.mock.calls[0][0].self.element).toBe(target);
  });

  it('resolves a target inside a closed shadow root', async () => {
    const { engine } = await renderDnd();
    const source = createBox(0, 0);
    const host = createBox(0, 200);
    const shadowRoot = host.attachShadow({ mode: 'closed' });
    const target = document.createElement('div');
    target.style.cssText = 'display: block; width: 100%; height: 100%;';
    shadowRoot.appendChild(target);

    const onDragEnter = vi.fn();
    const onDrop = vi.fn();
    engine.registerDraggable(source, {
      kind: cardKind,
      payload: 'card-1',
      pointerActivation: { mouse: { type: 'immediate' } },
    });
    engine.registerDropTarget(target, { accept: cardKind, onDragEnter, onDrop });

    pointer('pointerdown', source, 50, 25);
    await flushRaf();
    pointer('pointermove', source, 50, 225);
    await flushRaf();
    await flushRaf();

    expect(onDragEnter).toHaveBeenCalledTimes(1);

    pointer('pointerup', source, 50, 225);
    await flushRaf();
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop.mock.calls[0][0].self.element).toBe(target);
  });

  it('resolves the innermost target when they nest', async () => {
    const { engine } = await renderDnd();
    const source = createBox(0, 0);
    const outer = createBox(0, 200);
    const inner = document.createElement('div');
    // Inset inside `outer`, so a point in its middle hits both boxes and the
    // bubble-ordered stack must put the inner one first.
    inner.style.cssText =
      'position: absolute; left: 10px; top: 10px; width: 60px; height: 30px; background: rgb(120 120 120);';
    outer.appendChild(inner);

    const onOuterDrop = vi.fn();
    const onInnerDrop = vi.fn();
    engine.registerDraggable(source, {
      kind: cardKind,
      payload: 'card-1',
      pointerActivation: { mouse: { type: 'immediate' } },
    });
    engine.registerDropTarget(outer, { accept: cardKind, onDrop: onOuterDrop });
    engine.registerDropTarget(inner, { accept: cardKind, onDrop: onInnerDrop });

    pointer('pointerdown', source, 50, 25);
    await flushRaf();
    // (40, 225) sits inside `inner`, which sits inside `outer`.
    pointer('pointermove', source, 40, 225);
    await flushRaf();
    await flushRaf();
    pointer('pointerup', source, 40, 225);
    await flushRaf();

    // Only the innermost target receives `onDrop`.
    expect(onInnerDrop).toHaveBeenCalledTimes(1);
    expect(onOuterDrop).not.toHaveBeenCalled();
  });

  it('resolves no target when the pointer is released over empty space', async () => {
    const { engine } = await renderDnd();
    const source = createBox(0, 0);
    const target = createBox(0, 200);

    const onDrop = vi.fn();
    const onDragEnd = vi.fn();
    engine.registerDraggable(source, {
      kind: cardKind,
      payload: 'card-1',
      pointerActivation: { mouse: { type: 'immediate' } },
      onDragEnd,
    });
    engine.registerDropTarget(target, { accept: cardKind, onDrop });

    pointer('pointerdown', source, 50, 25);
    await flushRaf();
    // Well clear of both boxes.
    pointer('pointermove', source, 400, 400);
    await flushRaf();
    await flushRaf();
    pointer('pointerup', source, 400, 400);
    await flushRaf();

    expect(onDrop).not.toHaveBeenCalled();
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(false);
    expect(onDragEnd.mock.calls[0][0].dropTarget).toBeNull();
  });

  /**
   * `getLocalPoint` against real geometry: the fraction only means anything if the rect it
   * divides by is one the browser laid out. Boxes here are 100×50 at fixed viewport
   * positions, so every expected fraction is arithmetic rather than a snapshot.
   */
  describe('getLocalPoint', () => {
    it('reports where in the target the pointer was, as a fraction of its box', async () => {
      const { engine } = await renderDnd();
      const source = createBox(0, 0);
      const target = createBox(0, 200);

      const onDrop = vi.fn();
      engine.registerDraggable(source, {
        kind: cardKind,
        payload: 'card-1',
        pointerActivation: { mouse: { type: 'immediate' } },
      });
      engine.registerDropTarget(target, { accept: cardKind, onDrop });

      pointer('pointerdown', source, 50, 25);
      await flushRaf();
      // A quarter across and three-fifths down the 100×50 box at (0, 200).
      pointer('pointermove', source, 25, 230);
      await flushRaf();
      await flushRaf();
      pointer('pointerup', source, 25, 230);
      await flushRaf();

      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop.mock.calls[0][0].self.getLocalPoint()).toEqual({ x: 0.25, y: 0.6 });
    });

    it('quantizes the snapped point against real geometry, on both anchors', async () => {
      const { engine } = await renderDnd();
      const source = createBox(0, 0);
      const target = createBox(0, 200);

      const onDrop = vi.fn();
      engine.registerDraggable(source, {
        kind: cardKind,
        payload: 'card-1',
        pointerActivation: { mouse: { type: 'immediate' } },
      });
      engine.registerDropTarget(target, { accept: cardKind, snap: { x: 4, y: 10 }, onDrop });

      // Grabbed at (10, 20) inside the 100×50 source, so the source anchor
      // trails the pointer by that much.
      pointer('pointerdown', source, 10, 20);
      await flushRaf();
      pointer('pointermove', source, 35, 233);
      await flushRaf();
      await flushRaf();
      pointer('pointerup', source, 35, 233);
      await flushRaf();

      expect(onDrop).toHaveBeenCalledTimes(1);
      const record = onDrop.mock.calls[0][0].self;
      // Pointer: (0.35, 0.66) → nearest of (4, 10) steps.
      expect(record.getSnappedLocalPoint()).toEqual({ x: 0.25, y: 0.7 });
      // Source's leading edges: ((35−10)/100, (233−20−200)/50) = (0.25, 0.26).
      expect(record.getSnappedLocalPoint({ anchor: 'source' })).toEqual({ x: 0.25, y: 0.3 });
    });

    it('measures each target in the stack against its own box', async () => {
      const { engine } = await renderDnd();
      const source = createBox(0, 0);
      const outer = createBox(0, 200);
      const inner = document.createElement('div');
      // Inset 10px into a 100×50 outer, and 60×30 itself, so one pointer lands at a
      // different fraction of each. That is why this lives on the record, not the location.
      inner.style.cssText =
        'position: absolute; left: 10px; top: 10px; width: 60px; height: 30px; background: rgb(120 120 120);';
      outer.appendChild(inner);

      const onDrag = vi.fn();
      engine.registerDraggable(source, {
        kind: cardKind,
        payload: 'card-1',
        pointerActivation: { mouse: { type: 'immediate' } },
        onDrag,
      });
      engine.registerDropTarget(outer, { accept: cardKind });
      engine.registerDropTarget(inner, { accept: cardKind });

      pointer('pointerdown', source, 50, 25);
      await flushRaf();
      // (40, 225): 40% across the outer box, half across the inner one.
      pointer('pointermove', source, 40, 225);
      await flushRaf();
      await flushRaf();

      const { dropTargets } = onDrag.mock.calls.at(-1)![0].location.current;
      expect(dropTargets).toHaveLength(2);
      // Innermost first.
      expect(dropTargets[0].element).toBe(inner);
      expect(dropTargets[0].getLocalPoint()).toEqual({ x: 0.5, y: 0.5 });
      expect(dropTargets[1].element).toBe(outer);
      expect(dropTargets[1].getLocalPoint()).toEqual({ x: 0.4, y: 0.5 });
    });

    it('measures once per record, however many times it is asked', async () => {
      const { engine } = await renderDnd();
      const source = createBox(0, 0);
      const target = createBox(0, 200);

      const onDrop = vi.fn();
      engine.registerDraggable(source, {
        kind: cardKind,
        payload: 'card-1',
        pointerActivation: { mouse: { type: 'immediate' } },
      });
      engine.registerDropTarget(target, { accept: cardKind, onDrop });

      pointer('pointerdown', source, 50, 25);
      await flushRaf();
      pointer('pointermove', source, 50, 225);
      await flushRaf();
      await flushRaf();
      pointer('pointerup', source, 50, 225);
      await flushRaf();

      const { self } = onDrop.mock.calls[0][0];
      const first = self.getLocalPoint();

      // Armed only after the first call, which is the one that is meant to measure.
      const measure = vi.spyOn(target, 'getBoundingClientRect');
      const second = self.getLocalPoint();

      expect(second).toBe(first);
      expect(measure).not.toHaveBeenCalled();
      measure.mockRestore();
    });

    it('does not measure anything unless it is called', async () => {
      const { engine } = await renderDnd();
      const source = createBox(0, 0);
      const target = createBox(0, 200);

      engine.registerDraggable(source, {
        kind: cardKind,
        payload: 'card-1',
        pointerActivation: { mouse: { type: 'immediate' } },
      });
      engine.registerDropTarget(target, { accept: cardKind });

      pointer('pointerdown', source, 50, 25);
      await flushRaf();

      // Armed after the pickup so the preview's own measurements are not counted: this is
      // about what resolving a target over several moves costs a caller that never asks.
      const measure = vi.spyOn(target, 'getBoundingClientRect');
      pointer('pointermove', source, 20, 210);
      await flushRaf();
      pointer('pointermove', source, 50, 225);
      await flushRaf();
      pointer('pointermove', source, 80, 240);
      await flushRaf();
      await flushRaf();

      expect(measure).not.toHaveBeenCalled();
      measure.mockRestore();
    });

    it('reports the virtual cursor position for a keyboard drag', async () => {
      const { engine } = await renderDnd();
      const source = createBox(0, 0);
      const target = createBox(0, 200);
      source.tabIndex = 0;

      const onDrop = vi.fn();
      engine.registerDraggable(source, { kind: cardKind, payload: 'card-1' });
      engine.registerDropTarget(target, { accept: cardKind, onDrop });

      const press = (key: string) => {
        act(() => {
          source.dispatchEvent(
            new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
          );
        });
      };

      act(() => source.focus());
      press(' '); // pick up
      await flushRaf();
      press('ArrowDown'); // aim the virtual cursor at the plain zone's center, (50, 225)
      press(' '); // drop

      // The record's input is the aim point the sensor committed, not a pointer
      // position, so a plain zone entered by arrow key reports its center.
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop.mock.calls[0][0].self.getLocalPoint()).toEqual({ x: 0.5, y: 0.5 });
    });

    it('reports the origin for a target with no extent', async () => {
      const { engine } = await renderDnd();
      const source = createBox(0, 0);
      const target = createBox(0, 200);

      const onDrop = vi.fn();
      engine.registerDraggable(source, {
        kind: cardKind,
        payload: 'card-1',
        pointerActivation: { mouse: { type: 'immediate' } },
      });
      engine.registerDropTarget(target, { accept: cardKind, onDrop });

      pointer('pointerdown', source, 50, 25);
      await flushRaf();
      pointer('pointermove', source, 50, 225);
      await flushRaf();
      await flushRaf();
      pointer('pointerup', source, 50, 225);
      await flushRaf();

      // Detached after the record was made and before it is read, which measures as all
      // zeros: the case that would otherwise divide by zero.
      const { self } = onDrop.mock.calls[0][0];
      target.remove();

      expect(self.getLocalPoint()).toEqual({ x: 0, y: 0 });
    });
  });
});
