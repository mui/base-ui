import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { describeConformance } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer, testDragKind } from '../../../test/dndEngine';
import {
  cancel,
  drop,
  dragOver,
  fireDrag,
  flushRaf,
  lift,
  setupDragEngineTests,
} from '../../../test/dnd';
import { getActiveSession } from '../../utils/drag-and-drop/core/dragSession';

setupDragEngineTests();

const SOURCE_RECT = new DOMRect(20, 30, 200, 40);

function getTrigger() {
  const trigger = document.querySelector<HTMLElement>('[data-trigger]')!;
  trigger.getBoundingClientRect = () => SOURCE_RECT;
  return trigger;
}

function getPositioner() {
  return document.querySelector<HTMLElement>('[data-base-ui-drag-preview]');
}

/** Moves the active drag with raw events, which still reach the engine once the trigger is gone. */
async function moveTo(clientX: number, clientY: number) {
  await act(async () => {
    document.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerType: 'mouse',
        pointerId: 1,
        clientX,
        clientY,
        button: -1,
        buttons: 1,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await flushRaf();
}

describe('<Draggable.Positioner />', () => {
  const { renderDnd } = createDndRenderer();

  describeConformance(<Draggable.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    async render(node) {
      const view = await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" />
          {node}
        </Draggable.Root>,
      );
      fireDrag.dragStart(getTrigger());
      return view;
    },
  }));

  it('renders only while its item is dragged', async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind}>
        <Draggable.Trigger data-trigger="" />
        <Draggable.Positioner>
          <Draggable.Preview>Preview</Draggable.Preview>
        </Draggable.Positioner>
      </Draggable.Root>,
    );
    expect(getPositioner()).toBeNull();

    await lift(getTrigger());
    expect(getPositioner()).toHaveTextContent('Preview');

    cancel();
    expect(getPositioner()).toBeNull();
  });

  it('hides the preview from assistive technology and the pointer', async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind}>
        <Draggable.Trigger data-trigger="" />
        <Draggable.Positioner />
      </Draggable.Root>,
    );
    await lift(getTrigger());

    const positioner = getPositioner()!;
    expect(positioner).toHaveAttribute('aria-hidden', 'true');
    expect(positioner).toHaveAttribute('inert');
    expect(positioner.style.position).toBe('fixed');
    expect(positioner.style.pointerEvents).toBe('none');
  });

  it("sets the trigger's size as CSS variables", async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind}>
        <Draggable.Trigger data-trigger="" />
        <Draggable.Positioner />
      </Draggable.Root>,
    );
    await lift(getTrigger());

    const positioner = getPositioner()!;
    expect(positioner.style.getPropertyValue('--drag-source-width')).toBe('200px');
    expect(positioner.style.getPropertyValue('--drag-source-height')).toBe('40px');
  });

  it('moves with the pointer, keeping where the trigger was grabbed', async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind}>
        <Draggable.Trigger data-trigger="" />
        <Draggable.Positioner />
      </Draggable.Root>,
    );
    // Grabbed 10px right and 5px down from the trigger's corner.
    await lift(getTrigger(), { clientX: 30, clientY: 35 });
    const positioner = getPositioner()!;
    expect(positioner.style.translate).toBe('20px 30px');

    await dragOver(document.body, { clientX: 130, clientY: 85 });
    expect(positioner.style.translate).toBe('120px 80px');
  });

  it('applies its offset and modifiers', async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind}>
        <Draggable.Trigger data-trigger="" />
        <Draggable.Positioner offset="pointer" modifiers={Draggable.restrictToHorizontalAxis}>
          <Draggable.Preview>Preview</Draggable.Preview>
        </Draggable.Positioner>
      </Draggable.Root>,
    );
    await lift(getTrigger(), { clientX: 30, clientY: 35 });
    await dragOver(document.body, { clientX: 130, clientY: 85 });

    expect(getPositioner()!.style.translate).toBe('130px 35px');
  });

  it('keeps a copy following the pointer when its root unmounts mid-drag', async () => {
    function Fixture(props: { mounted: boolean }) {
      return props.mounted ? (
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" />
          <Draggable.Portal>
            <Draggable.Positioner>
              <Draggable.Preview>Preview</Draggable.Preview>
            </Draggable.Positioner>
          </Draggable.Portal>
        </Draggable.Root>
      ) : null;
    }
    const { setProps } = await renderDnd(<Fixture mounted />);
    await lift(getTrigger(), { clientX: 30, clientY: 35 });
    const positioner = getPositioner()!;

    // As when a virtualizer scrolls the row away.
    await setProps({ mounted: false });
    await flushRaf();
    expect(positioner.isConnected).toBe(false);
    const copy = getPositioner()!;
    expect(copy).toHaveTextContent('Preview');

    await moveTo(130, 85);
    expect(copy.style.translate).toBe('120px 80px');

    cancel();
    expect(getPositioner()).toBeNull();
  });

  it('takes over from the copy when the root remounts mid-drag', async () => {
    function Fixture(props: { mounted: boolean }) {
      return props.mounted ? (
        <Draggable.Root kind={testDragKind} payload="row">
          <Draggable.Trigger data-trigger="" />
          <Draggable.Positioner data-live="">
            <Draggable.Preview>Preview</Draggable.Preview>
          </Draggable.Positioner>
        </Draggable.Root>
      ) : null;
    }
    const { setProps } = await renderDnd(<Fixture mounted />);
    await lift(getTrigger());
    await setProps({ mounted: false });
    expect(document.querySelectorAll('[data-base-ui-drag-preview]')).toHaveLength(1);

    // The same payload identifies the remounted root as the drag's source.
    await setProps({ mounted: true });
    const previews = document.querySelectorAll('[data-base-ui-drag-preview]');
    expect(previews).toHaveLength(1);
    expect(previews[0]).toHaveAttribute('data-live');
    expect(getActiveSession()?.preview?.getPreviewElement()).toBe(previews[0]);
  });

  it('follows a new drag that starts before it unmounts', async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind}>
        <Draggable.Trigger data-trigger="" />
        <Draggable.Positioner />
      </Draggable.Root>,
    );
    const trigger = getTrigger();
    await lift(trigger);
    drop(document.body);
    // The preview settles on the next frame. A pickup before it keeps the positioner mounted.
    const positioner = getPositioner()!;
    fireDrag.dragStart(trigger);

    expect(getPositioner()).toBe(positioner);
    expect(getActiveSession()?.preview?.getPreviewElement()).toBe(positioner);
  });
});
