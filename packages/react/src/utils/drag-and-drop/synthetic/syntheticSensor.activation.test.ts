import { describe, it, expect, vi } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer } from '#test-utils';
import {
  createElement,
  flushRaf,
  registerCleanup,
  setupDragEngineTests,
} from '../../../../test/dnd';
import * as syntheticSensor from './syntheticSensor';
import { resetTouchTarget, touchDown, touchMove, touchUp } from '../../../../test/syntheticPointer';

setupDragEngineTests({
  extraAfterEach: () => {
    syntheticSensor.resetForTests();
    resetTouchTarget();
  },
});

describe('syntheticDrag activation', () => {
  const { renderDnd } = createDndRenderer();

  it('default press-hold: holds through a small drift, starts at the drifted point, and drops on a target', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const tgt = createElement();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const onDrop = vi.fn();
    // No `activation`: touch falls back to the default 250ms press-hold.
    engine.registerDraggable(el, { onDragStart, onDragEnd });
    engine.registerDropTarget(tgt, { onDrop });

    const originalEFP = document.elementFromPoint;
    const hit = { current: null as Element | null };
    document.elementFromPoint = (() => hit.current) as typeof document.elementFromPoint;
    registerCleanup(() => {
      document.elementFromPoint = originalEFP;
    });

    touchDown(el, 50, 50);
    // A drift under the 5px default tolerance keeps the hold alive.
    touchMove(53, 52);
    // The press-hold timer activates the drag (publishing the session) during
    // this wait, so wrap it in `act` to flush the overlay re-render.
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 300);
      });
    });
    await flushRaf();

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart.mock.calls[0][0].source.element).toBe(el);
    // The drag starts at the drifted point, not the original press.
    const startInput = onDragStart.mock.calls[0][0].location.current.input;
    expect(startInput.clientX).toBe(53);
    expect(startInput.clientY).toBe(52);

    // The activated drag moves and drops on a registered target.
    hit.current = tgt;
    touchMove(120, 80);
    await flushRaf();
    touchUp(120, 80);

    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    const endPayload = onDragEnd.mock.calls[0][0];
    expect(endPayload.canceled).toBe(false);
    expect(endPayload.dropTarget?.element).toBe(tgt);
    expect(endPayload.location.current.input.clientX).toBe(120);
    expect(endPayload.location.current.input.clientY).toBe(80);
  });

  it('cancels when pointerup fires before activation', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { type: 'press-hold', delay: 100, tolerance: 5 },
      onDragStart,
    });

    touchDown(el, 50, 50);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 20);
    });
    touchUp(50, 50);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 120);
    });
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();
  });

  it('cancels a pending press-hold when the window blurs before activation', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { type: 'press-hold', delay: 100, tolerance: 5 },
      onDragStart,
    });

    touchDown(el, 50, 50);
    // The window blurs (app switch / soft keyboard / overlay) before the
    // press-hold timer fires; the candidate must be abandoned.
    window.dispatchEvent(new Event('blur'));
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 120);
    });
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();
  });

  it('cancels a pending press-hold when the tab is hidden before activation', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { type: 'press-hold', delay: 100, tolerance: 5 },
      onDragStart,
    });

    touchDown(el, 50, 50);
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 120);
    });
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();
  });

  it('cancels when pointer moves past tolerance before activation', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { type: 'press-hold', delay: 100, tolerance: 5 },
      onDragStart,
    });

    touchDown(el, 50, 50);
    touchMove(80, 50); // 30px — well past the 5px tolerance
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 120);
    });
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();
  });

  it('distance activation starts the drag after tolerance pixels', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { type: 'distance', distance: 5 },
      onDragStart,
    });

    touchDown(el, 50, 50);
    touchMove(52, 52); // < 5px diagonal
    await flushRaf();
    expect(onDragStart).not.toHaveBeenCalled();

    touchMove(60, 60); // ~14px — past threshold
    await flushRaf();
    expect(onDragStart).toHaveBeenCalledTimes(1);

    touchUp(60, 60);
  });

  it('immediate activation (per-type) starts instantly on touchdown', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    engine.registerDraggable(el, {
      pointerActivation: { touch: { type: 'immediate' } },
      onDragStart,
    });

    touchDown(el, 50, 50);
    await flushRaf();
    expect(onDragStart).toHaveBeenCalledTimes(1);

    touchUp(50, 50);
  });

  it('mouse default activation requires 5px of movement before starting a drag', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const onDragStart = vi.fn();
    // No `activation` override: mouse falls back to the default, which is a 5px
    // distance. A stationary click must NOT start a drag — otherwise a
    // pointerdown on a clickable child of the draggable (e.g. a Tree item's
    // expand chevron) would be hijacked into a drag instead of toggling.
    engine.registerDraggable(el, { onDragStart });

    const dispatchMouse = (type: string, x: number, y: number, buttons: number) =>
      act(() => {
        el.dispatchEvent(
          new PointerEvent(type, {
            pointerType: 'mouse',
            pointerId: 9,
            clientX: x,
            clientY: y,
            button: 0,
            buttons,
            bubbles: true,
            cancelable: true,
          }),
        );
      });

    dispatchMouse('pointerdown', 50, 50, 1);
    await flushRaf();
    expect(onDragStart).not.toHaveBeenCalled();

    dispatchMouse('pointermove', 52, 52, 1); // < 5px diagonal — still pending
    await flushRaf();
    expect(onDragStart).not.toHaveBeenCalled();

    dispatchMouse('pointermove', 60, 60, 1); // ~14px — past the 5px threshold
    await flushRaf();
    expect(onDragStart).toHaveBeenCalledTimes(1);

    dispatchMouse('pointerup', 60, 60, 0);
  });

  describe('scrollbar presses', () => {
    /**
     * A scrollable list nested inside a draggable card — the kanban shape, where
     * the column is the draggable and its list of cards is the scroller. A
     * classic scrollbar is part of the list's own box and hit-tests to the list,
     * so the press walks up to the card unless the gutter is rejected.
     */
    function renderScrollableChild({
      rtl = false,
      borderLeft = 0,
    }: { rtl?: boolean; borderLeft?: number } = {}): {
      card: HTMLElement;
      list: HTMLElement;
    } {
      const card = createElement();
      const list = document.createElement('div');
      list.style.overflow = 'auto';
      if (rtl) {
        list.style.direction = 'rtl';
      }
      // The list's border box spans x = 0..200 with a 15px classic scrollbar, so
      // the padding box is 185 wide and the gutter is whichever 15px strip the
      // writing direction leaves over. jsdom does no layout, so the geometry the
      // guard reads has to be supplied.
      list.getBoundingClientRect = () => new DOMRect(0, 0, 200 + borderLeft, 400);
      // `clientLeft` is the left border width *plus* the scrollbar when the
      // scrollbar is on the left, which is what browsers report in RTL — so the
      // padding edge, and with it the sign of a press in the gutter, follows the
      // writing direction without anything having to special-case it.
      Object.defineProperty(list, 'clientLeft', { value: borderLeft + (rtl ? 15 : 0) });
      Object.defineProperty(list, 'clientTop', { value: 0 });
      Object.defineProperty(list, 'scrollHeight', { value: 1000 });
      Object.defineProperty(list, 'clientHeight', { value: 400 });
      Object.defineProperty(list, 'clientWidth', { value: 185 });
      card.appendChild(list);
      registerCleanup(() => list.remove());
      return { card, list };
    }

    function dispatchOn(
      target: HTMLElement,
      type: string,
      x: number,
      y: number,
      buttons: number,
      offsets?: { offsetX: number; offsetY: number },
    ): void {
      const event = new PointerEvent(type, {
        pointerType: 'mouse',
        pointerId: 11,
        clientX: x,
        clientY: y,
        button: buttons === 0 ? 0 : 0,
        buttons,
        bubbles: true,
        cancelable: true,
      });
      if (offsets) {
        // jsdom does no layout, so `offsetX`/`offsetY` are always 0 — stand in for
        // what a browser would report relative to the list's padding edge.
        Object.defineProperty(event, 'offsetX', { value: offsets.offsetX });
        Object.defineProperty(event, 'offsetY', { value: offsets.offsetY });
      }
      act(() => {
        target.dispatchEvent(event);
      });
    }

    it('a press in the scrollbar gutter of a scrollable child does not start a drag', async () => {
      const { engine } = await renderDnd();
      const { card, list } = renderScrollableChild();
      const onDragStart = vi.fn();
      engine.registerDraggable(card, { onDragStart });

      // x=192 is past the 185px content box: the vertical scrollbar's gutter.
      dispatchOn(list, 'pointerdown', 192, 50, 1);
      await flushRaf();
      // Thumb travel. The default mouse activation is 5px, so without the guard
      // this alone would commit the drag and pick up the whole card.
      dispatchOn(list, 'pointermove', 192, 80, 1);
      await flushRaf();

      expect(onDragStart).not.toHaveBeenCalled();

      dispatchOn(list, 'pointerup', 192, 80, 0);
    });

    it('a press on the content of that same child still starts the drag', async () => {
      const { engine } = await renderDnd();
      const { card, list } = renderScrollableChild();
      const onDragStart = vi.fn();
      engine.registerDraggable(card, { onDragStart });

      // The positive control: x=100 is inside the content box, so this is an
      // ordinary press on the draggable and must behave as one.
      dispatchOn(list, 'pointerdown', 100, 50, 1);
      await flushRaf();
      dispatchOn(list, 'pointermove', 100, 80, 1);
      await flushRaf();

      expect(onDragStart).toHaveBeenCalledTimes(1);

      dispatchOn(list, 'pointerup', 100, 80, 0);
    });

    it('rejects the gutter on the leading side, where RTL puts the vertical scrollbar', async () => {
      const { engine } = await renderDnd();
      const { card, list } = renderScrollableChild({ rtl: true });
      const onDragStart = vi.fn();
      engine.registerDraggable(card, { onDragStart });

      // RTL puts the vertical scrollbar on the left, so the gutter is the strip
      // *before* the padding box rather than after it. x=8 is inside it.
      dispatchOn(list, 'pointerdown', 8, 50, 1);
      await flushRaf();
      dispatchOn(list, 'pointermove', 8, 80, 1);
      await flushRaf();

      expect(onDragStart).not.toHaveBeenCalled();

      dispatchOn(list, 'pointerup', 8, 80, 0);
    });

    it('leaves the trailing side alone in RTL, where the scrollbar is not', async () => {
      const { engine } = await renderDnd();
      const { card, list } = renderScrollableChild({ rtl: true });
      const onDragStart = vi.fn();
      engine.registerDraggable(card, { onDragStart });

      // The mirror of the LTR gutter test: with the scrollbar on the left, x=192
      // is past the padding box but is content (or the element's own border), not
      // a gutter — rejecting it here would make a whole strip of the card undraggable.
      dispatchOn(list, 'pointerdown', 192, 50, 1);
      await flushRaf();
      dispatchOn(list, 'pointermove', 192, 80, 1);
      await flushRaf();

      expect(onDragStart).toHaveBeenCalledTimes(1);

      dispatchOn(list, 'pointerup', 192, 80, 0);
    });

    it('does not reject a press on the border of a scrollable child', async () => {
      const { engine } = await renderDnd();
      const { card, list } = renderScrollableChild({ borderLeft: 2 });
      const onDragStart = vi.fn();
      engine.registerDraggable(card, { onDragStart });

      // A 2px left border on an LTR scroller: it sits before the padding box, so
      // it measures negative — but the scrollbar is on the *right*, so this is an
      // ordinary press on the draggable and must still pick it up.
      dispatchOn(list, 'pointerdown', 1, 50, 1);
      await flushRaf();
      dispatchOn(list, 'pointermove', 1, 80, 1);
      await flushRaf();

      expect(onDragStart).toHaveBeenCalledTimes(1);

      dispatchOn(list, 'pointerup', 1, 80, 0);
    });

    it('does not reject a press on an element with no scrollbars', async () => {
      const { engine } = await renderDnd();
      const card = createElement();
      const inert = document.createElement('div');
      // No scrollable overflow, so there is no gutter and the offsets below are
      // measuring the element's borders — a border press is an ordinary press.
      Object.defineProperty(inert, 'clientWidth', { value: 0 });
      Object.defineProperty(inert, 'clientHeight', { value: 0 });
      card.appendChild(inert);
      registerCleanup(() => inert.remove());
      const onDragStart = vi.fn();
      engine.registerDraggable(card, { onDragStart });

      dispatchOn(inert, 'pointerdown', 50, 50, 1);
      await flushRaf();
      dispatchOn(inert, 'pointermove', 60, 60, 1);
      await flushRaf();

      expect(onDragStart).toHaveBeenCalledTimes(1);

      dispatchOn(inert, 'pointerup', 60, 60, 0);
    });
  });
});
