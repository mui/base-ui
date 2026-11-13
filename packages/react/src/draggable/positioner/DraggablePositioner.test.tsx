import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { describeConformance } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer, testDragKind } from '../../../test/dndEngine';
import {
  cancel,
  createElement,
  drop,
  dragOver,
  fireDrag,
  flushRaf,
  lift,
  registerCleanup,
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

/** Gives `element` an ending animation that runs until the test ends, so it stays mounted. */
function mockEndingAnimation(element: HTMLElement) {
  let finish!: () => void;
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  registerCleanup(() => finish());
  element.getAnimations = () =>
    [{ effect: { getTiming: () => ({ iterations: 1 }) }, finished }] as unknown as Animation[];
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

  it('unmounts once its preview settles after a drop', async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind}>
        <Draggable.Trigger data-trigger="" />
        <Draggable.Positioner />
      </Draggable.Root>,
    );
    await lift(getTrigger());
    drop(document.body);
    // Without an ending animation, the preview settles on the next frame.
    expect(getPositioner()).not.toBeNull();

    await flushRaf();
    expect(getPositioner()).toBeNull();
  });

  it.each([
    { name: 'a drop on a target', onTarget: true },
    { name: 'a release outside every target', onTarget: false },
  ])(
    'sets data-ending-style after $name, and data-dropped only for a drop on a target',
    async ({ onTarget }) => {
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      registerCleanup(() => vi.unstubAllGlobals());
      const { engine } = await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" />
          <Draggable.Positioner />
        </Draggable.Root>,
      );
      const target = createElement();
      if (onTarget) {
        engine.registerTarget(target, {});
      }
      await lift(getTrigger());
      await dragOver(target);
      // An ending animation keeps the positioner mounted to inspect it.
      const positioner = getPositioner()!;
      mockEndingAnimation(positioner);
      fireDrag.drop(target);
      await flushRaf();

      expect(positioner).toHaveAttribute('data-ending-style');
      expect(positioner.hasAttribute('data-dropped')).toBe(onTarget);
    },
  );

  it('does not set data-dropped when the release enters a target that cancels the drag', async () => {
    vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
    registerCleanup(() => vi.unstubAllGlobals());
    const onMoveEnd = vi.fn();
    const { engine } = await renderDnd(
      <Draggable.Root kind={testDragKind} onMoveEnd={onMoveEnd}>
        <Draggable.Trigger data-trigger="" />
        <Draggable.Positioner />
      </Draggable.Root>,
    );
    const target = createElement();
    engine.registerTarget(target, { onDraggableEnter: () => engine.cancelDrag() });
    await lift(getTrigger());
    const positioner = getPositioner()!;
    mockEndingAnimation(positioner);
    // No frame runs between the move and the release, so the target is first
    // entered by the release itself.
    fireDrag.dragEnter(target);
    fireDrag.drop(target);
    await flushRaf();

    expect(onMoveEnd.mock.calls[0][0].canceled).toBe(true);
    expect(positioner).toHaveAttribute('data-ending-style');
    expect(positioner).not.toHaveAttribute('data-dropped');
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

  it('positions the copy for the zoom of the parent it moves to', async () => {
    function Fixture(props: { mounted: boolean }) {
      return props.mounted ? (
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" />
          <Draggable.Portal style={{ zoom: 2 }}>
            <Draggable.Positioner>
              <Draggable.Preview>Preview</Draggable.Preview>
            </Draggable.Positioner>
          </Draggable.Portal>
        </Draggable.Root>
      ) : null;
    }
    const { setProps } = await renderDnd(<Fixture mounted />);
    await lift(getTrigger(), { clientX: 30, clientY: 35 });
    await dragOver(document.body, { clientX: 130, clientY: 85 });
    // `translate` and the size variables are in the zoomed portal's pixels.
    expect(getPositioner()!.style.translate).toBe('60px 40px');
    expect(getPositioner()!.style.getPropertyValue('--drag-source-width')).toBe('100px');

    // The portal leaves with the root, so the copy moves to `<body>`, which has no zoom.
    // The pointer doesn't move.
    await setProps({ mounted: false });
    await flushRaf();
    const copy = getPositioner()!;
    expect(copy.parentElement).toBe(document.body);
    expect(copy.style.translate).toBe('120px 80px');
    expect(copy.style.getPropertyValue('--drag-source-width')).toBe('200px');
  });

  it('keeps the scroll offsets of the preview in its copy', async () => {
    function Fixture(props: { mounted: boolean }) {
      return props.mounted ? (
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" />
          <Draggable.Portal>
            <Draggable.Positioner>
              <Draggable.Preview>
                <div data-scroller="" style={{ width: 50, height: 20, overflow: 'auto' }}>
                  <div style={{ width: 200, height: 200 }} />
                </div>
              </Draggable.Preview>
            </Draggable.Positioner>
          </Draggable.Portal>
        </Draggable.Root>
      ) : null;
    }
    const { setProps } = await renderDnd(<Fixture mounted />);
    await lift(getTrigger());
    const scroller = document.querySelector<HTMLElement>('[data-scroller]')!;
    scroller.scrollTop = 80;
    scroller.scrollLeft = 25;
    expect([scroller.scrollTop, scroller.scrollLeft]).toEqual([80, 25]);
    // The scroll event fires on the next frame.
    await flushRaf();

    // The portal leaves with the root, so the copy is inserted twice.
    await setProps({ mounted: false });
    await flushRaf();
    const copy = getPositioner()!.querySelector<HTMLElement>('[data-scroller]')!;
    expect(copy).not.toBe(scroller);
    expect([copy.scrollTop, copy.scrollLeft]).toEqual([80, 25]);
  });

  it('keeps the select selection and indeterminate checkboxes of the preview in its copy', async () => {
    function Fixture(props: { mounted: boolean }) {
      return props.mounted ? (
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" />
          <Draggable.Positioner>
            <Draggable.Preview>
              <select value="b" onChange={() => {}}>
                <option value="a">A</option>
                <option value="b">B</option>
              </select>
              <input
                type="checkbox"
                ref={(input) => {
                  if (input) {
                    input.indeterminate = true;
                  }
                }}
              />
            </Draggable.Preview>
          </Draggable.Positioner>
        </Draggable.Root>
      ) : null;
    }
    const { setProps } = await renderDnd(<Fixture mounted />);
    await lift(getTrigger());
    expect(getPositioner()!.querySelector('select')!.value).toBe('b');

    await setProps({ mounted: false });
    await flushRaf();
    const copy = getPositioner()!;
    expect(copy.querySelector('select')!.value).toBe('b');
    expect(copy.querySelector('input')!.indeterminate).toBe(true);
  });

  it('positions a new element the preview renders mid-drag', async () => {
    const PREVIEW_RECT = new DOMRect(0, 0, 120, 30);
    function mockRect(element: HTMLElement | null) {
      if (element) {
        element.getBoundingClientRect = () => PREVIEW_RECT;
      }
    }
    function Fixture(props: { swapped: boolean }) {
      return (
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" />
          <Draggable.Positioner>
            <Draggable.Preview render={props.swapped ? <div ref={mockRect} /> : <span />}>
              Preview
            </Draggable.Preview>
          </Draggable.Positioner>
        </Draggable.Root>
      );
    }
    const { setProps } = await renderDnd(<Fixture swapped={false} />);
    await lift(getTrigger());
    const preview = getActiveSession()!.preview!;
    expect(preview.getPreviewRect()).not.toBe(PREVIEW_RECT);

    await setProps({ swapped: true });
    expect(preview.getPreviewRect()).toBe(PREVIEW_RECT);
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
