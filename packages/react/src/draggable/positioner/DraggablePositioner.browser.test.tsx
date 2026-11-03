import * as React from 'react';
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { isJSDOM } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer, testDragKind } from '../../../test/dndEngine';
import { dragOver, drop, flushRaf, lift, setupDragEngineTests } from '../../../test/dnd';

setupDragEngineTests();

function getTrigger() {
  return document.querySelector<HTMLElement>('[data-trigger]')!;
}

function getPreview() {
  return document.querySelector<HTMLElement>('[data-drag-preview]');
}

const triggerStyle: React.CSSProperties = {
  position: 'fixed',
  left: 100,
  top: 100,
  width: 120,
  height: 30,
};

describe.skipIf(isJSDOM)('<Draggable.Positioner /> in a browser', () => {
  const { renderDnd } = createDndRenderer();
  const animationsFlag = globalThis as { BASE_UI_ANIMATIONS_DISABLED?: boolean | undefined };

  beforeEach(() => {
    animationsFlag.BASE_UI_ANIMATIONS_DISABLED = false;
  });

  afterEach(() => {
    animationsFlag.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  it('lifts the preview off where the trigger sits', async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind}>
        <Draggable.Trigger data-trigger="" style={triggerStyle} />
        <Draggable.Portal>
          {/* A table header row sits above the row preview inside the positioner. */}
          <Draggable.Positioner render={<table />}>
            <thead>
              <tr style={{ height: 40 }}>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              <Draggable.Preview render={<tr />}>
                <td>Report</td>
              </Draggable.Preview>
            </tbody>
          </Draggable.Positioner>
        </Draggable.Portal>
      </Draggable.Root>,
    );
    await lift(getTrigger(), { clientX: 110, clientY: 110 });

    const preview = getPreview()!.getBoundingClientRect();
    expect(preview.left).toBeCloseTo(100, 0);
    expect(preview.top).toBeCloseTo(100, 0);

    await dragOver(document.body, { clientX: 160, clientY: 210 });
    const moved = getPreview()!.getBoundingClientRect();
    expect(moved.left).toBeCloseTo(150, 0);
    expect(moved.top).toBeCloseTo(200, 0);
  });

  it('keeps the preview mounted until its drop transition onto the trigger ends', async () => {
    const style = document.createElement('style');
    style.textContent = '.positioner[data-ending-style] { transition: translate 100s linear; }';
    document.head.appendChild(style);
    try {
      await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" style={triggerStyle} />
          <Draggable.Portal>
            <Draggable.Positioner className="positioner">
              <Draggable.Preview>Report</Draggable.Preview>
            </Draggable.Positioner>
          </Draggable.Portal>
        </Draggable.Root>,
      );
      const trigger = getTrigger();
      await lift(trigger, { clientX: 110, clientY: 110 });
      await dragOver(document.body, { clientX: 400, clientY: 400 });
      drop(document.body, { clientX: 400, clientY: 400 });
      await flushRaf();

      const positioner = document.querySelector<HTMLElement>('.positioner')!;
      expect(positioner).toHaveAttribute('data-ending-style');
      expect(getPreview()).toHaveAttribute('data-ending-style');
      expect(trigger).toHaveAttribute('data-settling');
      const animations = positioner.getAnimations();
      expect(animations.length).toBeGreaterThan(0);
      for (const animation of animations) {
        animation.pause();
        animation.currentTime = 99999;
      }
      const preview = getPreview()!.getBoundingClientRect();
      expect(preview.left).toBeCloseTo(100, 0);
      expect(preview.top).toBeCloseTo(100, 0);

      // Settling ends from the animations' promises, which update React state.
      await act(async () => {
        for (const animation of animations) {
          animation.finish();
        }
        await Promise.allSettled(animations.map((animation) => animation.finished));
      });
      expect(getPreview()).toBeNull();
      expect(trigger).not.toHaveAttribute('data-settling');
    } finally {
      style.remove();
    }
  });
});
