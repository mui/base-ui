import { describe, it, expect, vi } from 'vitest';
import { describeConformance } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer, testDragKind } from '../../../test/dndEngine';
import { setupDragEngineTests } from '../../../test/dnd';

setupDragEngineTests();

describe('Draggable.Trigger', () => {
  const { renderDnd } = createDndRenderer();

  describeConformance(<Draggable.Trigger />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return renderDnd(<Draggable.Root kind={testDragKind}>{node}</Draggable.Root>);
    },
  }));

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
