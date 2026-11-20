import { describe, it, expect, vi } from 'vitest';
import { describeConformance } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer, testDragKind } from '../../../test/dndEngine';
import { fireDrag, flushRaf, lift, setupDragEngineTests } from '../../../test/dnd';

setupDragEngineTests();

describe('Draggable.Trigger', () => {
  const { renderDnd } = createDndRenderer();

  describeConformance(<Draggable.Trigger />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return renderDnd(<Draggable.Root kind={testDragKind}>{node}</Draggable.Root>);
    },
  }));

  it('reports settling in its state while its preview settles after the drop', async () => {
    // `[data-dragging]` stays on the trigger until the preview has settled. A
    // component that renders it from React needs `dragging || settling`.
    const states: Draggable.Trigger.State[] = [];
    await renderDnd(
      <Draggable.Root kind={testDragKind}>
        <Draggable.Trigger
          data-trigger=""
          className={(state) => {
            states.push(state);
            return undefined;
          }}
        />
        <Draggable.Positioner />
      </Draggable.Root>,
    );
    const trigger = document.querySelector<HTMLElement>('[data-trigger]')!;
    trigger.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    await lift(trigger);
    expect(states.at(-1)).toMatchObject({ dragging: true, settling: false });

    fireDrag.drop(trigger);
    expect(trigger).toHaveAttribute('data-settling');
    expect(states.at(-1)).toMatchObject({ dragging: false, settling: true });

    await flushRaf();
    expect(trigger).not.toHaveAttribute('data-settling');
    expect(states.at(-1)).toMatchObject({ dragging: false, settling: false });
  });

  it('warns for a second mounted trigger', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger />
          <Draggable.Trigger />
        </Draggable.Root>,
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/more than one mounted Draggable\.Trigger/);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('does not warn when the trigger swaps its node', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      function Swappable({ swapped }: { swapped: boolean }) {
        return (
          <Draggable.Root kind={testDragKind}>
            <Draggable.Trigger render={(props) => <div key={swapped ? 'b' : 'a'} {...props} />} />
          </Draggable.Root>
        );
      }

      const { rerender } = await renderDnd(<Swappable swapped={false} />);
      await rerender(<Swappable swapped />);
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });
});
