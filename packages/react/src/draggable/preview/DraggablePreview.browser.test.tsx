import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { isJSDOM } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer, testDragKind } from '../../../test/dndEngine';
import { lift, setupDragEngineTests } from '../../../test/dnd';

setupDragEngineTests();

function getTrigger() {
  return document.querySelector<HTMLElement>('[data-trigger]')!;
}

function getPreview() {
  return document.querySelector<HTMLElement>('[data-drag-preview]');
}

describe.skipIf(isJSDOM)('<Draggable.Preview /> in a browser', () => {
  const { renderDnd } = createDndRenderer();

  it("renders a scaled trigger again at the trigger's rendered size", async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind}>
        <Draggable.Trigger
          data-trigger=""
          style={{ position: 'fixed', left: 100, top: 100, width: 120, height: 30, scale: '2' }}
        />
        <Draggable.Portal>
          <Draggable.Positioner>
            <Draggable.Preview />
          </Draggable.Positioner>
        </Draggable.Portal>
      </Draggable.Root>,
    );
    const trigger = getTrigger().getBoundingClientRect();
    expect(trigger.width).toBeCloseTo(240, 0);
    await lift(getTrigger(), { clientX: 110, clientY: 110 });

    const preview = getPreview()!.getBoundingClientRect();
    expect(preview.width).toBeCloseTo(240, 0);
    expect(preview.height).toBeCloseTo(60, 0);
  });

  it.each([
    { name: 'its own zoom', triggerZoom: 2, ancestorZoom: 1, portaled: true },
    {
      name: 'a zoomed ancestor, previewed in place',
      triggerZoom: 1,
      ancestorZoom: 2,
      portaled: false,
    },
    {
      name: 'a zoomed ancestor, previewed in a portal',
      triggerZoom: 1,
      ancestorZoom: 2,
      portaled: true,
    },
  ])(
    "renders a trigger with $name again at the trigger's rendered size",
    async ({ triggerZoom, ancestorZoom, portaled }) => {
      const positioner = (
        <Draggable.Positioner>
          <Draggable.Preview />
        </Draggable.Positioner>
      );
      await renderDnd(
        <div style={{ zoom: ancestorZoom }}>
          <Draggable.Root kind={testDragKind}>
            <Draggable.Trigger
              data-trigger=""
              style={{
                position: 'fixed',
                left: 50,
                top: 50,
                width: 60,
                height: 15,
                zoom: triggerZoom,
              }}
            />
            {portaled ? <Draggable.Portal>{positioner}</Draggable.Portal> : positioner}
          </Draggable.Root>
        </div>,
      );
      const trigger = getTrigger().getBoundingClientRect();
      expect(trigger.width).toBeCloseTo(120, 0);
      await lift(getTrigger(), { clientX: 110, clientY: 110 });

      const preview = getPreview()!.getBoundingClientRect();
      expect(preview.width).toBeCloseTo(120, 0);
      expect(preview.height).toBeCloseTo(30, 0);
    },
  );
});
