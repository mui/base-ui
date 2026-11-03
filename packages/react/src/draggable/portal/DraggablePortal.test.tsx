import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { describeConformance } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer, testDragKind } from '../../../test/dndEngine';
import { cancel, fireDrag, lift, setupDragEngineTests } from '../../../test/dnd';

setupDragEngineTests();

function getTrigger() {
  return document.querySelector<HTMLElement>('[data-trigger]')!;
}

describe('<Draggable.Portal />', () => {
  const { renderDnd } = createDndRenderer();

  describeConformance(<Draggable.Portal />, () => ({
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

  it('renders its children in the body only while its item is dragged', async () => {
    await renderDnd(
      <div data-testid="list">
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-trigger="" />
          <Draggable.Portal>
            <Draggable.Positioner>
              <Draggable.Preview>Preview</Draggable.Preview>
            </Draggable.Positioner>
          </Draggable.Portal>
        </Draggable.Root>
      </div>,
    );
    expect(screen.queryByText('Preview')).toBeNull();

    await lift(getTrigger());
    const preview = screen.getByText('Preview');
    expect(screen.getByTestId('list')).not.toContainElement(preview);
    expect(document.body).toContainElement(preview);

    cancel();
    expect(screen.queryByText('Preview')).toBeNull();
  });

  it('renders into its container', async () => {
    function Fixture() {
      const containerRef = React.useRef<HTMLDivElement>(null);
      return (
        <React.Fragment>
          <div data-testid="container" ref={containerRef} />
          <Draggable.Root kind={testDragKind}>
            <Draggable.Trigger data-trigger="" />
            <Draggable.Portal container={containerRef}>
              <Draggable.Positioner>
                <Draggable.Preview>Preview</Draggable.Preview>
              </Draggable.Positioner>
            </Draggable.Portal>
          </Draggable.Root>
        </React.Fragment>
      );
    }
    await renderDnd(<Fixture />);
    await lift(getTrigger());
    expect(screen.getByTestId('container')).toContainElement(screen.getByText('Preview'));
  });
});
