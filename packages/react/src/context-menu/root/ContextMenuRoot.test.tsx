import { expect } from 'chai';
import {
  fireEvent,
  flushMicrotasks,
  ignoreActWarnings,
  reactMajor,
  screen,
  waitFor,
} from '@mui/internal-test-utils';
import { spy } from 'sinon';
import { ContextMenu } from '@base-ui/react/context-menu';
import { createRenderer, isJSDOM } from '#test-utils';
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
      await flushMicrotasks();

      await screen.findByTestId('context-root-popup');

      const submenuTrigger = screen.getByTestId('context-submenu-trigger');
      await user.hover(submenuTrigger);

      await screen.findByTestId('context-submenu-popup');

      const submenuItem = screen.getByTestId('context-submenu-item');
      fireEvent.mouseUp(submenuItem, { button: 2 });
      await flushMicrotasks();

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
      if (reactMajor <= 18) {
        ignoreActWarnings();
      }

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
      if (reactMajor <= 18) {
        ignoreActWarnings();
      }

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
      if (reactMajor <= 18) {
        ignoreActWarnings();
      }

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

    it('does not open when disabled', async () => {
      const onOpenChange = spy();

      await render(
        <ContextMenu.Root disabled onOpenChange={onOpenChange}>
          <ContextMenu.Trigger data-testid="context-trigger">Surface</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup data-testid="context-popup">
                <ContextMenu.Item>Action</ContextMenu.Item>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      const trigger = screen.getByTestId('context-trigger');

      fireEvent.contextMenu(trigger, { clientX: 10, clientY: 10, button: 2 });
      await flushMicrotasks();

      expect(screen.queryByTestId('context-popup')).to.equal(null);
      expect(onOpenChange.callCount).to.equal(0);
    });
  });

  describe.skipIf(isJSDOM)('prop: collisionAvoidance', () => {
    const popupHeight = 100;
    const popupWidth = 150;
    const popupStyle = { width: popupWidth, height: popupHeight };

    it('flips to the opposite side when side: flip is set and there is no space', async () => {
      const viewportHeight = window.innerHeight;

      await render(
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 50 }}>
          <ContextMenu.Root open>
            <ContextMenu.Trigger data-testid="context-trigger">Surface</ContextMenu.Trigger>
            <ContextMenu.Portal>
              <ContextMenu.Positioner
                data-testid="positioner"
                collisionAvoidance={{ side: 'flip' }}
                // Anchor near the bottom of the viewport so there's no space below
                anchor={{
                  getBoundingClientRect: () =>
                    DOMRect.fromRect({
                      width: 0,
                      height: 0,
                      x: 100,
                      y: viewportHeight - 20,
                    }),
                }}
              >
                <ContextMenu.Popup data-testid="context-popup" style={popupStyle}>
                  <ContextMenu.Item>Action 1</ContextMenu.Item>
                  <ContextMenu.Item>Action 2</ContextMenu.Item>
                  <ContextMenu.Item>Action 3</ContextMenu.Item>
                </ContextMenu.Popup>
              </ContextMenu.Positioner>
            </ContextMenu.Portal>
          </ContextMenu.Root>
        </div>,
      );

      const positioner = screen.getByTestId('positioner');

      await waitFor(() => {
        // When collisionAvoidance={{ side: 'flip' }} is set and there's no space below,
        // the menu should flip to the top
        expect(positioner.getAttribute('data-side')).to.equal('top');
      });
    });
  });
});
