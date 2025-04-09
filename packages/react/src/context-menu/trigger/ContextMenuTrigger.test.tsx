import * as React from 'react';
import { expect } from 'chai';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { spy } from 'sinon';
import { ContextMenu } from '@base-ui-components/react/context-menu';
import { Menu } from '@base-ui-components/react/menu';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<ContextMenu.Trigger />', () => {
  const { render, clock } = createRenderer();

  clock.withFakeTimers();

  describeConformance(<ContextMenu.Trigger />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<ContextMenu.Root>{node}</ContextMenu.Root>);
    },
  }));

  it('should open menu on right click (context menu event)', async () => {
    await render(
      <ContextMenu.Root>
        <ContextMenu.Trigger data-testid="trigger">Right click me</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup />
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );

    const trigger = screen.getByTestId('trigger');
    fireEvent.contextMenu(trigger);
    await flushMicrotasks();

    expect(screen.queryByRole('menu')).not.to.equal(null);
  });

  it('should call onOpenChange when menu is opened via right click', async () => {
    const onOpenChange = spy();

    await render(
      <ContextMenu.Root onOpenChange={onOpenChange}>
        <ContextMenu.Trigger data-testid="trigger">Right click me</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup />
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );

    const trigger = screen.getByTestId('trigger');
    fireEvent.contextMenu(trigger);
    await flushMicrotasks();

    expect(onOpenChange.lastCall.args[0]).to.equal(true);
  });

  describe.skipIf(isJSDOM)('long press', () => {
    it('should open menu on long press on touchscreen devices', async () => {
      await render(
        <ContextMenu.Root>
          <ContextMenu.Trigger data-testid="trigger">Long press me</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup />
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      const touchObj = new Touch({
        identifier: 0,
        target: trigger,
        clientX: 100,
        clientY: 100,
      });

      fireEvent.touchStart(trigger, {
        touches: [touchObj],
      });

      clock.tick(500);

      expect(screen.queryByRole('menu')).not.to.equal(null);
    });

    it('should cancel long press when touch moves beyond threshold', async () => {
      const onOpenChange = spy();

      await render(
        <ContextMenu.Root onOpenChange={onOpenChange}>
          <ContextMenu.Trigger data-testid="trigger">Long press me</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup />
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      const touchStartObj = new Touch({
        identifier: 0,
        target: trigger,
        clientX: 100,
        clientY: 100,
      });

      fireEvent.touchStart(trigger, {
        touches: [touchStartObj],
      });

      // Simulate touch move (more than 10px movement)
      // This should cancel the long press
      const touchMoveObj = new Touch({
        identifier: 0,
        target: trigger,
        clientX: 120,
        clientY: 100,
      });

      fireEvent.touchMove(trigger, {
        touches: [touchMoveObj],
      });

      clock.tick(500);

      expect(screen.queryByRole('menu')).to.equal(null);
      expect(onOpenChange.callCount).to.equal(0);
    });
  });
});
