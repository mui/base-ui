import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@mui/internal-test-utils';
import { createDndRenderer, firePointer } from '#test-utils';
import {
  createElement,
  flushRaf,
  registerCleanup,
  setupDragEngineTests,
} from '../../../../test/dnd';
import { restrictToVerticalAxis } from '../dragModifiers';
import * as syntheticSensor from './syntheticSensor';

setupDragEngineTests({ extraAfterEach: () => syntheticSensor.resetForTests() });

describe('syntheticDrag double-click activation', () => {
  const { renderDnd } = createDndRenderer();

  it('moves without a held button and drops on the next click without clicking the target', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = createElement();
    const onMoveStart = vi.fn();
    const onBeforeMoveStart = vi.fn();
    const onMove = vi.fn();
    const onDrop = vi.fn();
    const onClick = vi.fn();
    engine.registerDraggable(source, {
      activation: { type: 'double-click' },
      onBeforeMoveStart,
      onMoveStart,
      onMove,
      modifiers: restrictToVerticalAxis,
    });
    engine.registerDropTarget(target, { onDraggableDrop: onDrop });
    target.addEventListener('click', onClick);
    registerCleanup(() => target.removeEventListener('click', onClick));
    const original = document.elementFromPoint;
    document.elementFromPoint = () => target;
    registerCleanup(() => {
      document.elementFromPoint = original;
    });

    fireEvent.doubleClick(source, { detail: 2, button: 0, clientX: 20, clientY: 20 });
    expect(onMoveStart).toHaveBeenCalledTimes(1);
    expect(onBeforeMoveStart.mock.calls[0][1].reason).toBe('double-click');
    expect(onBeforeMoveStart.mock.calls[0][1].event.type).toBe('dblclick');
    firePointer.move(target, {
      pointerType: 'mouse',
      pointerId: 1,
      buttons: 0,
      clientX: 90,
      clientY: 80,
      timeStamp: 20,
    });
    await flushRaf();
    expect(onMove.mock.lastCall?.[0].location.current.input.clientX).toBe(20);
    expect(onMove.mock.lastCall?.[0].location.current.input.clientY).toBe(80);
    firePointer.up(target, { pointerType: 'mouse', pointerId: 1, button: 0, timeStamp: 30 });
    expect(onDrop).not.toHaveBeenCalled();
    fireEvent.click(target, { detail: 1, button: 0, clientX: 90, clientY: 80 });
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop.mock.calls[0][0].location.current.input.clientX).toBe(20);
    expect(onClick).not.toHaveBeenCalled();
    fireEvent.click(target, { detail: 1 });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('cancels the press that drops so the destination is neither focused nor pressed', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const target = document.createElement('button');
    document.body.append(target);
    registerCleanup(() => target.remove());
    engine.registerDraggable(source, { activation: { type: 'double-click' } });
    fireEvent.doubleClick(source, { detail: 2, button: 0 });

    const onPress = vi.fn();
    target.addEventListener('pointerdown', onPress);
    target.addEventListener('mousedown', onPress);
    const press = new PointerEvent('pointerdown', {
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(press);
    expect(press.defaultPrevented).toBe(true);
    const mouseDown = new MouseEvent('mousedown', { button: 0, bubbles: true, cancelable: true });
    target.dispatchEvent(mouseDown);
    expect(mouseDown.defaultPrevented).toBe(true);
    expect(onPress).not.toHaveBeenCalled();

    // A touch press during a mouse double-click session is somebody else's.
    const touchPress = new PointerEvent('pointerdown', {
      pointerType: 'touch',
      button: 0,
      buttons: 1,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(touchPress);
    expect(touchPress.defaultPrevented).toBe(false);

    fireEvent.keyDown(document.body, { key: 'Escape' });
    const afterPress = new PointerEvent('pointerdown', {
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(afterPress);
    expect(afterPress.defaultPrevented).toBe(false);
  });

  it('Escape cancels and leaves the next ordinary click available', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const onMoveEnd = vi.fn();
    const onClick = vi.fn();
    engine.registerDraggable(source, { activation: { type: 'double-click' }, onMoveEnd });
    source.addEventListener('click', onClick);
    registerCleanup(() => source.removeEventListener('click', onClick));
    fireEvent.doubleClick(source, { detail: 2 });
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onMoveEnd.mock.calls[0][1].reason).toBe('escape-key');
    fireEvent.click(source, { detail: 1 });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can veto double-click pickup before onMoveStart', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const onMoveStart = vi.fn();
    engine.registerDraggable(source, {
      activation: { type: 'double-click' },
      onMoveStart,
      onBeforeMoveStart: (_, details) => details.cancel(),
    });
    fireEvent.doubleClick(source, { detail: 2 });
    expect(onMoveStart).not.toHaveBeenCalled();
  });

  it('ignores disabled sources, controls, and clicks outside the handle', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const handle = document.createElement('div');
    const input = document.createElement('input');
    source.append(handle);
    handle.append(input);
    const onMoveStart = vi.fn();
    let disabled = true;
    engine.registerDraggable(source, () => ({
      activation: { type: 'double-click' },
      dragHandle: handle,
      disabled,
      onMoveStart,
    }));
    fireEvent.doubleClick(handle, { detail: 2 });
    disabled = false;
    fireEvent.doubleClick(input, { detail: 2 });
    fireEvent.doubleClick(source, { detail: 2 });
    expect(onMoveStart).not.toHaveBeenCalled();
    fireEvent.doubleClick(handle, { detail: 2 });
    expect(onMoveStart).toHaveBeenCalledTimes(1);
  });

  it('does not activate on a press or finish on a programmatic click', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const onMoveStart = vi.fn();
    const onMoveEnd = vi.fn();
    engine.registerDraggable(source, {
      activation: { type: 'double-click' },
      onMoveStart,
      onMoveEnd,
    });
    firePointer.down(source, { pointerType: 'mouse', pointerId: 1, buttons: 1, timeStamp: 10 });
    firePointer.move(source, {
      pointerType: 'mouse',
      pointerId: 1,
      buttons: 1,
      clientX: 100,
      timeStamp: 20,
    });
    firePointer.up(source, { pointerType: 'mouse', pointerId: 1, timeStamp: 30 });
    expect(onMoveStart).not.toHaveBeenCalled();
    fireEvent.doubleClick(source, { detail: 2 });
    fireEvent.click(source, { detail: 0 });
    expect(onMoveEnd).not.toHaveBeenCalled();
    fireEvent.blur(window);
    expect(onMoveEnd.mock.calls[0][1].reason).toBe('window-blur');
  });
  it('allows either distance pickup or double-click pickup on the same source', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const onBeforeMoveStart = vi.fn();
    const onMoveEnd = vi.fn();
    engine.registerDraggable(source, {
      activation: [{ type: 'distance', distance: 10 }, { type: 'double-click' }],
      onBeforeMoveStart,
      onMoveEnd,
    });
    firePointer.down(source, { pointerType: 'mouse', pointerId: 1, buttons: 1, timeStamp: 10 });
    firePointer.move(source, {
      pointerType: 'mouse',
      pointerId: 1,
      buttons: 1,
      clientX: 15,
      timeStamp: 20,
    });
    expect(onBeforeMoveStart.mock.calls[0][1].reason).toBe('pointer');
    firePointer.up(source, { pointerType: 'mouse', pointerId: 1, timeStamp: 30 });
    fireEvent.click(source, { detail: 1 });
    fireEvent.doubleClick(source, { detail: 2 });
    expect(onBeforeMoveStart.mock.calls[1][1].reason).toBe('double-click');
    fireEvent.click(source, { detail: 1 });
    expect(onMoveEnd).toHaveBeenCalledTimes(2);
  });

  it('handles a vetoed pickup inside a shadow root only once', async () => {
    const { engine } = await renderDnd();
    const host = createElement();
    const root = host.attachShadow({ mode: 'open' });
    const source = document.createElement('div');
    root.append(source);
    const onBeforeMoveStart = vi.fn((_, details) => details.cancel());
    engine.registerDraggable(host, { activation: { type: 'double-click' }, onBeforeMoveStart });
    engine.registerDraggable(source, { activation: { type: 'double-click' }, onBeforeMoveStart });
    fireEvent.doubleClick(source, { detail: 2, composed: true });
    expect(onBeforeMoveStart).toHaveBeenCalledTimes(1);
  });

  describe('touch and pen double-tap', () => {
    const tap = { button: 0, buttons: 1, clientX: 20, clientY: 20 } as const;

    it('picks up on the second touch tap while held and drops on release', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const target = createElement();
      const onBeforeMoveStart = vi.fn();
      const onMoveStart = vi.fn();
      const onMove = vi.fn();
      const onMoveEnd = vi.fn();
      const onDrop = vi.fn();
      engine.registerDraggable(source, {
        activation: { type: 'double-click' },
        onBeforeMoveStart,
        onMoveStart,
        onMove,
        onMoveEnd,
      });
      engine.registerDropTarget(target, { onDraggableDrop: onDrop });
      const original = document.elementFromPoint;
      document.elementFromPoint = () => target;
      registerCleanup(() => {
        document.elementFromPoint = original;
      });

      firePointer.down(source, { ...tap, pointerType: 'touch', pointerId: 1, timeStamp: 10 });
      firePointer.up(source, { ...tap, pointerType: 'touch', pointerId: 1, timeStamp: 60 });
      expect(onMoveStart).not.toHaveBeenCalled();

      // Browsers hand each touch contact a new pointerId; the pair is matched on
      // the source, not the id.
      firePointer.down(source, { ...tap, pointerType: 'touch', pointerId: 2, timeStamp: 200 });
      expect(onMoveStart).toHaveBeenCalledTimes(1);
      expect(onBeforeMoveStart.mock.calls[0][1].reason).toBe('double-click');
      expect(onBeforeMoveStart.mock.calls[0][1].event.type).toBe('pointerdown');

      firePointer.move(target, {
        pointerType: 'touch',
        pointerId: 2,
        buttons: 1,
        clientX: 90,
        clientY: 80,
        timeStamp: 220,
      });
      await flushRaf();
      expect(onMove.mock.lastCall?.[0].location.current.input.clientY).toBe(80);

      firePointer.up(target, {
        pointerType: 'touch',
        pointerId: 2,
        button: 0,
        clientX: 90,
        clientY: 80,
        timeStamp: 240,
      });
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onMoveEnd).toHaveBeenCalledTimes(1);
      expect(onMoveEnd.mock.calls[0][1].reason).toBe('drop');
    });

    it('picks up on a pen double-tap', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onMoveStart = vi.fn();
      engine.registerDraggable(source, { activation: { type: 'double-click' }, onMoveStart });
      firePointer.down(source, { ...tap, pointerType: 'pen', pointerId: 1, timeStamp: 10 });
      firePointer.up(source, { ...tap, pointerType: 'pen', pointerId: 1, timeStamp: 40 });
      firePointer.down(source, { ...tap, pointerType: 'pen', pointerId: 1, timeStamp: 100 });
      expect(onMoveStart).toHaveBeenCalledTimes(1);
    });

    it('requires the taps to be close in time and space', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onMoveStart = vi.fn();
      engine.registerDraggable(source, { activation: { type: 'double-click' }, onMoveStart });

      // Too slow.
      firePointer.down(source, { ...tap, pointerType: 'touch', pointerId: 1, timeStamp: 10 });
      firePointer.up(source, { ...tap, pointerType: 'touch', pointerId: 1, timeStamp: 40 });
      firePointer.down(source, { ...tap, pointerType: 'touch', pointerId: 2, timeStamp: 400 });
      expect(onMoveStart).not.toHaveBeenCalled();
      firePointer.up(source, { ...tap, pointerType: 'touch', pointerId: 2, timeStamp: 420 });

      // Too far: the second press lands 40px from the first.
      firePointer.down(source, {
        ...tap,
        pointerType: 'touch',
        pointerId: 3,
        clientX: 60,
        timeStamp: 500,
      });
      expect(onMoveStart).not.toHaveBeenCalled();
      firePointer.up(source, {
        ...tap,
        pointerType: 'touch',
        pointerId: 3,
        clientX: 60,
        timeStamp: 520,
      });

      // The pair has to be the same pointer type.
      firePointer.down(source, {
        ...tap,
        pointerType: 'pen',
        pointerId: 4,
        clientX: 60,
        timeStamp: 600,
      });
      expect(onMoveStart).not.toHaveBeenCalled();
    });

    it('does not pair a swipe or a canceled press with the next tap', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onMoveStart = vi.fn();
      engine.registerDraggable(source, { activation: { type: 'double-click' }, onMoveStart });

      // A press released far from where it landed is a swipe, not a tap.
      firePointer.down(source, { ...tap, pointerType: 'touch', pointerId: 1, timeStamp: 10 });
      firePointer.up(source, {
        ...tap,
        pointerType: 'touch',
        pointerId: 1,
        clientY: 80,
        timeStamp: 40,
      });
      firePointer.down(source, { ...tap, pointerType: 'touch', pointerId: 2, timeStamp: 100 });
      expect(onMoveStart).not.toHaveBeenCalled();
      firePointer.up(source, { ...tap, pointerType: 'touch', pointerId: 2, timeStamp: 120 });

      // Native scroll taking the gesture cancels the press.
      firePointer.down(source, { ...tap, pointerType: 'touch', pointerId: 3, timeStamp: 600 });
      fireEvent.pointerCancel(source, { pointerType: 'touch', pointerId: 3 });
      firePointer.down(source, { ...tap, pointerType: 'touch', pointerId: 4, timeStamp: 700 });
      expect(onMoveStart).not.toHaveBeenCalled();
    });

    it('enables double-tap per pointer type through the map form', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onBeforeMoveStart = vi.fn();
      const onMoveStart = vi.fn();
      engine.registerDraggable(source, {
        activation: { touch: { type: 'double-click' } },
        onBeforeMoveStart,
        onMoveStart,
      });
      // Mouse keeps its default distance activation: no double-click pickup.
      firePointer.down(source, { ...tap, pointerType: 'mouse', pointerId: 1, timeStamp: 10 });
      firePointer.up(source, { ...tap, pointerType: 'mouse', pointerId: 1, timeStamp: 30 });
      fireEvent.doubleClick(source, { detail: 2, button: 0 });
      expect(onMoveStart).not.toHaveBeenCalled();

      firePointer.down(source, { ...tap, pointerType: 'touch', pointerId: 2, timeStamp: 500 });
      firePointer.up(source, { ...tap, pointerType: 'touch', pointerId: 2, timeStamp: 530 });
      firePointer.down(source, { ...tap, pointerType: 'touch', pointerId: 3, timeStamp: 600 });
      expect(onMoveStart).toHaveBeenCalledTimes(1);
      expect(onBeforeMoveStart.mock.calls[0][1].reason).toBe('double-click');
    });

    it('ignores a dblclick synthesized from a touch double-tap', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const onMoveStart = vi.fn();
      engine.registerDraggable(source, { activation: { type: 'double-click' }, onMoveStart });

      // Chromium: `dblclick` is a `PointerEvent` reporting the touch.
      source.dispatchEvent(
        new PointerEvent('dblclick', { pointerType: 'touch', button: 0, detail: 2, bubbles: true }),
      );
      expect(onMoveStart).not.toHaveBeenCalled();

      // A `dblclick` with no `pointerType` is attributed to the press before it.
      firePointer.down(source, { ...tap, pointerType: 'touch', pointerId: 1, timeStamp: 10 });
      firePointer.up(source, { ...tap, pointerType: 'touch', pointerId: 1, timeStamp: 30 });
      fireEvent.doubleClick(source, { detail: 2, button: 0 });
      expect(onMoveStart).not.toHaveBeenCalled();

      firePointer.down(source, { ...tap, pointerType: 'mouse', pointerId: 5, timeStamp: 1000 });
      firePointer.up(source, { ...tap, pointerType: 'mouse', pointerId: 5, timeStamp: 1020 });
      fireEvent.doubleClick(source, { detail: 2, button: 0 });
      expect(onMoveStart).toHaveBeenCalledTimes(1);
    });
  });
});
