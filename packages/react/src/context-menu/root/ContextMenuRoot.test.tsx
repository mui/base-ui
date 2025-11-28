import { expect } from 'chai';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { spy } from 'sinon';
import { ContextMenu } from '@base-ui-components/react/context-menu';
import { createRenderer } from '#test-utils';
import { REASONS } from '../../utils/reasons';

describe('<ContextMenu.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render, clock } = createRenderer({
    clockOptions: {
      shouldAdvanceTime: true,
    },
  });

  describe('interactions', () => {
    clock.withFakeTimers();

    it('closes nested submenus when releasing the context menu pointer over an item', async () => {
      const rootOnOpenChange = spy();
      const submenuOnOpenChange = spy();

      const { user } = await render(
        <ContextMenu.Root onOpenChange={rootOnOpenChange}>
          <ContextMenu.Trigger data-testid="context-trigger">Surface</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup data-testid="context-root-popup">
                <ContextMenu.SubmenuRoot defaultOpen onOpenChange={submenuOnOpenChange}>
                  <ContextMenu.SubmenuTrigger delay={1} data-testid="context-submenu-trigger">
                    More options
                  </ContextMenu.SubmenuTrigger>
                  <ContextMenu.Portal>
                    <ContextMenu.Positioner>
                      <ContextMenu.Popup data-testid="context-submenu-popup">
                        <ContextMenu.Item data-testid="context-submenu-item">
                          Deep action
                        </ContextMenu.Item>
                      </ContextMenu.Popup>
                    </ContextMenu.Positioner>
                  </ContextMenu.Portal>
                </ContextMenu.SubmenuRoot>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      const trigger = screen.getByTestId('context-trigger');

      fireEvent.contextMenu(trigger, { clientX: 10, clientY: 10, button: 2 });

      await screen.findByTestId('context-root-popup');

      const submenuTrigger = screen.getByTestId('context-submenu-trigger');
      await user.hover(submenuTrigger);

      await screen.findByTestId('context-submenu-popup');

      const submenuItem = screen.getByTestId('context-submenu-item');
      fireEvent.mouseUp(submenuItem, { button: 2 });

      await waitFor(() => {
        expect(screen.queryByTestId('context-submenu-popup')).to.equal(null);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('context-root-popup')).to.equal(null);
      });

      expect(submenuOnOpenChange.lastCall?.args[0]).to.equal(false);
      expect(submenuOnOpenChange.lastCall?.args[1].reason).to.equal(REASONS.itemPress);
      expect(rootOnOpenChange.lastCall?.args[0]).to.equal(false);
      expect(rootOnOpenChange.lastCall?.args[1].reason).to.equal(REASONS.itemPress);
    });

    it('ignores mouseup directly under the cursor when the context menu spawns there', async () => {
      const onOpenChange = spy();

      await render(
        <ContextMenu.Root onOpenChange={onOpenChange}>
          <ContextMenu.Trigger data-testid="context-trigger">Surface</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner alignOffset={0}>
              <ContextMenu.Popup data-testid="context-popup">
                <ContextMenu.Item data-testid="context-item">Action</ContextMenu.Item>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      const trigger = screen.getByTestId('context-trigger');

      fireEvent.contextMenu(trigger, { clientX: 12, clientY: 12, button: 2 });

      await screen.findByTestId('context-popup');
      const item = screen.getByTestId('context-item');

      fireEvent.mouseUp(item, { button: 2, clientX: 12, clientY: 12 });

      await waitFor(() => {
        expect(screen.queryByTestId('context-popup')).not.to.equal(null);
      });

      expect(onOpenChange.callCount).to.equal(1);
    });

    it('ignores mouseup directly under the cursor when alignOffset is negative', async () => {
      const onOpenChange = spy();

      await render(
        <ContextMenu.Root onOpenChange={onOpenChange}>
          <ContextMenu.Trigger data-testid="context-trigger">Surface</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner alignOffset={-5}>
              <ContextMenu.Popup data-testid="context-popup">
                <ContextMenu.Item data-testid="context-item">Action</ContextMenu.Item>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      const trigger = screen.getByTestId('context-trigger');

      fireEvent.contextMenu(trigger, { clientX: 18, clientY: 18, button: 2 });

      await screen.findByTestId('context-popup');
      const item = screen.getByTestId('context-item');

      fireEvent.mouseUp(item, { button: 2, clientX: 18, clientY: 18 });

      await waitFor(() => {
        expect(screen.queryByTestId('context-popup')).not.to.equal(null);
      });

      expect(onOpenChange.callCount).to.equal(1);
    });

    it('allows mouseup after leaving the initial cursor point', async () => {
      const onOpenChange = spy();

      await render(
        <ContextMenu.Root onOpenChange={onOpenChange}>
          <ContextMenu.Trigger data-testid="context-trigger">Surface</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner alignOffset={0}>
              <ContextMenu.Popup data-testid="context-popup">
                <ContextMenu.Item data-testid="context-item">Action</ContextMenu.Item>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      const trigger = screen.getByTestId('context-trigger');

      fireEvent.contextMenu(trigger, { clientX: 20, clientY: 20, button: 2 });

      await screen.findByTestId('context-popup');
      const item = screen.getByTestId('context-item');

      fireEvent.pointerMove(document.body, { clientX: 24, clientY: 24 });
      fireEvent.mouseUp(item, { button: 2, clientX: 24, clientY: 24 });

      await waitFor(() => {
        expect(screen.queryByTestId('context-popup')).to.equal(null);
      });

      expect(onOpenChange.lastCall?.args[0]).to.equal(false);
    });
  });
});
