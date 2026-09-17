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
    expect(onBeforeMoveStart.mock.calls[0][1].activation).toBe('double-click');
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

  it('can veto double-click pickup before resolving the payload', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const getPayload = vi.fn(() => undefined);
    engine.registerDraggable(source, {
      activation: { type: 'double-click' },
      getPayload,
      onBeforeMoveStart: (_, details) => details.cancel(),
    });
    fireEvent.doubleClick(source, { detail: 2 });
    expect(getPayload).not.toHaveBeenCalled();
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
    expect(onBeforeMoveStart.mock.calls[0][1].activation).toBe('pointer');
    firePointer.up(source, { pointerType: 'mouse', pointerId: 1, timeStamp: 30 });
    fireEvent.click(source, { detail: 1 });
    fireEvent.doubleClick(source, { detail: 2 });
    expect(onBeforeMoveStart.mock.calls[1][1].activation).toBe('double-click');
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
});
