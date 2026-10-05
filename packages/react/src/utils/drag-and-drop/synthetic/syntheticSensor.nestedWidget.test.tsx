import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@mui/internal-test-utils';
import { firePointer } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { Slider } from '@base-ui/react/slider';
import { createDndRenderer, testDragKind } from '../../../../test/dndEngine';
import { flushRaf, setupDragEngineTests } from '../../../../test/dnd';
import { penDown, penMove, touchDown, touchMove, touchUp } from '../../../../test/syntheticPointer';
import { cancelDrag } from '../cancelDrag';

setupDragEngineTests();

type CaptureMethod = 'setPointerCapture' | 'hasPointerCapture' | 'releasePointerCapture';

/**
 * Synthetic pointer events have no active pointer to capture, and jsdom has no
 * pointer capture at all. A minimal model stands in for the browser's, one
 * capturing element per pointer, so the slider's `setPointerCapture` and the
 * sensor's check see the same state in both environments.
 */
const captures = new Map<number, Element>();
const fakeCapture: Record<CaptureMethod, (this: Element, pointerId: number) => unknown> = {
  setPointerCapture(pointerId) {
    captures.set(pointerId, this);
  },
  hasPointerCapture(pointerId) {
    return captures.get(pointerId) === this;
  },
  releasePointerCapture(pointerId) {
    if (captures.get(pointerId) === this) {
      captures.delete(pointerId);
    }
  },
};
const CAPTURE_METHODS = Object.keys(fakeCapture) as CaptureMethod[];
const originalDescriptors = CAPTURE_METHODS.map((method) =>
  Object.getOwnPropertyDescriptor(Element.prototype, method),
);

beforeEach(() => {
  for (const method of CAPTURE_METHODS) {
    Object.defineProperty(Element.prototype, method, {
      configurable: true,
      writable: true,
      value: fakeCapture[method],
    });
  }
});

afterEach(() => {
  captures.clear();
  CAPTURE_METHODS.forEach((method, index) => {
    const descriptor = originalDescriptors[index];
    if (descriptor) {
      Object.defineProperty(Element.prototype, method, descriptor);
    } else {
      Reflect.deleteProperty(Element.prototype, method);
    }
  });
});

describe('syntheticDrag nested pointer widgets', () => {
  const { renderDnd } = createDndRenderer();

  async function renderCard(onMoveStart: () => void) {
    await renderDnd(
      <Draggable.Root kind={testDragKind} onMoveStart={onMoveStart}>
        <Slider.Root defaultValue={50}>
          <Slider.Control data-testid="control">
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb data-testid="thumb" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
        <span data-testid="label">Card</span>
      </Draggable.Root>,
    );
    const control = screen.getByTestId('control');
    control.getBoundingClientRect = () => new DOMRect(0, 0, 200, 20);
    return { control, thumb: screen.getByTestId('thumb'), label: screen.getByTestId('label') };
  }

  it('leaves a mouse drag on a slider thumb to the slider', async () => {
    const onMoveStart = vi.fn();
    const { control, thumb } = await renderCard(onMoveStart);

    const input = { pointerType: 'mouse', pointerId: 1, clientY: 10 };
    firePointer.down(thumb, { ...input, button: 0, buttons: 1, clientX: 100, timeStamp: 10 });
    // The slider claimed the gesture, as it does in a browser.
    expect(control.hasPointerCapture(1)).toBe(true);
    firePointer.move(thumb, { ...input, buttons: 1, clientX: 130, timeStamp: 20 });
    await flushRaf();

    expect(onMoveStart).not.toHaveBeenCalled();
    // The slider keeps its capture, so it goes on receiving the pointer.
    expect(control.hasPointerCapture(1)).toBe(true);
    firePointer.up(thumb, { ...input, button: 0, buttons: 0, clientX: 130, timeStamp: 30 });
  });

  it('leaves a mouse drag on a control that captures itself to that control', async () => {
    const onMoveStart = vi.fn();
    // Like a scroll-area thumb, which takes capture on the pressed element.
    await renderDnd(
      <Draggable.Root kind={testDragKind} onMoveStart={onMoveStart}>
        <div
          data-testid="knob"
          onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
        />
      </Draggable.Root>,
    );
    const knob = screen.getByTestId('knob');

    const input = { pointerType: 'mouse', pointerId: 1, clientY: 10 };
    firePointer.down(knob, { ...input, button: 0, buttons: 1, clientX: 10, timeStamp: 10 });
    firePointer.move(knob, { ...input, buttons: 1, clientX: 40, timeStamp: 20 });
    await flushRaf();

    expect(onMoveStart).not.toHaveBeenCalled();
    // Abandoning the candidate must not release the control's capture.
    expect(knob.hasPointerCapture(1)).toBe(true);
    firePointer.up(knob, { ...input, button: 0, buttons: 0, clientX: 40, timeStamp: 30 });
  });

  it('leaves a pen drag on a slider thumb to the slider', async () => {
    const onMoveStart = vi.fn();
    const { thumb } = await renderCard(onMoveStart);

    // Pen implicitly captures the press target, which the slider then overrides.
    captures.set(1, thumb);
    penDown(thumb, 100, 10, 1, { timeStamp: 10 });
    penMove(130, 10, 1, { timeStamp: 20 });
    await flushRaf();

    expect(onMoveStart).not.toHaveBeenCalled();
  });

  it('leaves a touch press-hold on a slider thumb to the slider', async () => {
    const onMoveStart = vi.fn();
    const { thumb } = await renderCard(onMoveStart);

    captures.set(1, thumb);
    touchDown(thumb, 100, 10, 1, { timeStamp: 10 });
    // Past the default 250ms hold, within its 5px tolerance.
    touchMove(101, 10, 1, { timeStamp: 300 });
    await flushRaf();

    expect(onMoveStart).not.toHaveBeenCalled();
    touchUp(101, 10, 1, { timeStamp: 310 });
  });

  it('still starts a touch drag from plain content that holds the implicit capture', async () => {
    const onMoveStart = vi.fn();
    const { label } = await renderCard(onMoveStart);

    // Touch captures the press target before any `pointerdown` listener runs.
    // That capture is the browser's, not a widget's, so it must not block the drag.
    captures.set(1, label);
    touchDown(label, 250, 50, 1, { timeStamp: 10 });
    touchMove(251, 50, 1, { timeStamp: 300 });
    await flushRaf();

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    act(() => cancelDrag());
    touchUp(251, 50, 1, { timeStamp: 310 });
  });

  it('still starts a mouse drag from plain content', async () => {
    const onMoveStart = vi.fn();
    const { label } = await renderCard(onMoveStart);

    const input = { pointerType: 'mouse', pointerId: 1, clientY: 50 };
    firePointer.down(label, { ...input, button: 0, buttons: 1, clientX: 250, timeStamp: 10 });
    firePointer.move(label, { ...input, buttons: 1, clientX: 280, timeStamp: 20 });
    await flushRaf();

    expect(onMoveStart).toHaveBeenCalledTimes(1);
    firePointer.up(label, { ...input, button: 0, buttons: 0, clientX: 280, timeStamp: 30 });
  });
});
