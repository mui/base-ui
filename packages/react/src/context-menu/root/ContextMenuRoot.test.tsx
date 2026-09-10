import { vi, expect, describe, beforeEach, it } from 'vitest';
import {
  act,
  fireEvent,
  flushMicrotasks,
  ignoreActWarnings,
  reactMajor,
  screen,
  waitFor,
} from '@mui/internal-test-utils';
import { ContextMenu } from '@base-ui/react/context-menu';
import { createRenderer, isJSDOM } from '#test-utils';
import { REASONS } from '../../internals/reasons';

vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    ...actual,
    platform: {
      ...actual.platform,
      os: { ...actual.platform.os, mac: true, apple: true },
    },
  };
});

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
      const rootOnOpenChange = vi.fn();
      const submenuOnOpenChange = vi.fn();

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
        expect(screen.queryByTestId('context-submenu-popup')).toBe(null);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('context-root-popup')).toBe(null);
      });

      expect(submenuOnOpenChange.mock.lastCall?.[0]).toBe(false);
      expect(submenuOnOpenChange.mock.lastCall?.[1].reason).toBe(REASONS.itemPress);
      expect(rootOnOpenChange.mock.lastCall?.[0]).toBe(false);
      expect(rootOnOpenChange.mock.lastCall?.[1].reason).toBe(REASONS.itemPress);
    });

    it('does not activate a submenu trigger when releasing the context menu pointer over it', async () => {
      if (reactMajor <= 18) {
        ignoreActWarnings();
      }

      const submenuOnOpenChange = vi.fn();

      await render(
        <ContextMenu.Root>
          <ContextMenu.Trigger data-testid="context-trigger">Surface</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup data-testid="context-root-popup">
                <ContextMenu.SubmenuRoot onOpenChange={submenuOnOpenChange}>
                  <ContextMenu.SubmenuTrigger
                    data-testid="context-submenu-trigger"
                    openOnHover={false}
                  >
                    More options
                  </ContextMenu.SubmenuTrigger>
                  <ContextMenu.Portal>
                    <ContextMenu.Positioner>
                      <ContextMenu.Popup data-testid="context-submenu-popup">
                        <ContextMenu.Item>Deep action</ContextMenu.Item>
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
      fireEvent.contextMenu(trigger, { clientX: 20, clientY: 20, button: 2 });
      await screen.findByTestId('context-root-popup');

      fireEvent.pointerMove(document.body, { clientX: 24, clientY: 24 });
      fireEvent.mouseUp(screen.getByTestId('context-submenu-trigger'), {
        button: 2,
        clientX: 24,
        clientY: 24,
      });
      await flushMicrotasks();

      expect(screen.queryByTestId('context-submenu-popup')).toBe(null);
      expect(submenuOnOpenChange).not.toHaveBeenCalled();
    });

    it('ignores mouseup directly under the cursor when the context menu spawns there', async () => {
      if (reactMajor <= 18) {
        ignoreActWarnings();
      }

      const onOpenChange = vi.fn();

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
        expect(screen.queryByTestId('context-popup')).not.toBe(null);
      });

      expect(onOpenChange.mock.calls.length).toBe(1);
    });

    it('ignores mouseup directly under the cursor when alignOffset is negative', async () => {
      if (reactMajor <= 18) {
        ignoreActWarnings();
      }

      const onOpenChange = vi.fn();

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
        expect(screen.queryByTestId('context-popup')).not.toBe(null);
      });

      expect(onOpenChange.mock.calls.length).toBe(1);
    });

    it('allows mouseup after leaving the initial cursor point', async () => {
      if (reactMajor <= 18) {
        ignoreActWarnings();
      }

      const onOpenChange = vi.fn();

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
        expect(screen.queryByTestId('context-popup')).toBe(null);
      });

      expect(onOpenChange.mock.lastCall?.[0]).toBe(false);
    });

    it('does not open when disabled', async () => {
      const onOpenChange = vi.fn();

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

      expect(screen.queryByTestId('context-popup')).toBe(null);
      expect(onOpenChange.mock.calls.length).toBe(0);
    });
  });

  describe('data-instant', () => {
    // Shift+F10 and the Menu key only raise a `contextmenu` when focus is inside the trigger, so
    // the fixture carries a focusable child to drive them from.
    function Fixture() {
      return (
        <ContextMenu.Root>
          <ContextMenu.Trigger data-testid="context-trigger">
            <button type="button" data-testid="focusable">
              Surface
            </button>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup data-testid="context-popup">
                <ContextMenu.Item>Action</ContextMenu.Item>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      );
    }

    it('does not mark the popup as instant when opened with a mouse right-click', async () => {
      await render(<Fixture />);

      const trigger = screen.getByTestId('context-trigger');

      // A mouse `contextmenu` reports `detail === 0` just like a keyboard click, so the gesture
      // that produced it — the `pointerdown` from pressing the secondary button — is what
      // identifies it as pointer-driven.
      fireEvent.pointerDown(trigger, {
        pointerType: 'mouse',
        button: 2,
        clientX: 10,
        clientY: 10,
      });
      fireEvent.contextMenu(trigger, { clientX: 10, clientY: 10, button: 2 });

      const popup = await screen.findByTestId('context-popup');
      expect(popup).not.toHaveAttribute('data-instant');
    });

    it('does not mark the popup as instant when no pointerdown reached the trigger', async () => {
      await render(<Fixture />);

      // The recorded gesture is best-effort, so the secondary button on the `contextmenu` itself
      // has to be enough on its own — the keyboard never reports one.
      fireEvent.contextMenu(screen.getByTestId('context-trigger'), {
        clientX: 10,
        clientY: 10,
        button: 2,
      });

      const popup = await screen.findByTestId('context-popup');
      expect(popup).not.toHaveAttribute('data-instant');
    });

    it('does not mark the popup as instant when a descendant swallows the pointerdown', async () => {
      // A drag handle or editor widget inside the trigger may stop `pointerdown` from
      // propagating; recording it in the capture phase keeps the gesture visible anyway. Uses
      // a macOS Ctrl+click, which reports the primary button, so the secondary-button shortcut
      // cannot decide this case.
      await render(
        <ContextMenu.Root>
          <ContextMenu.Trigger data-testid="context-trigger">
            <div data-testid="draggable" onPointerDown={(event) => event.stopPropagation()}>
              Drag me
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup data-testid="context-popup">
                <ContextMenu.Item>Action</ContextMenu.Item>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      const draggable = screen.getByTestId('draggable');
      fireEvent.pointerDown(draggable, {
        pointerType: 'mouse',
        button: 0,
        ctrlKey: true,
        clientX: 10,
        clientY: 10,
      });
      fireEvent.contextMenu(draggable, {
        clientX: 10,
        clientY: 10,
        button: 0,
        ctrlKey: true,
      });

      const popup = await screen.findByTestId('context-popup');
      expect(popup).not.toHaveAttribute('data-instant');
    });

    it('marks the popup as instant when opened from the keyboard', async () => {
      await render(<Fixture />);

      const focusable = screen.getByTestId('focusable');
      await act(async () => {
        focusable.focus();
      });

      // Shift+F10 raises the `contextmenu` from this key press, with no pointer gesture behind it.
      fireEvent.keyDown(focusable, { key: 'F10', shiftKey: true });
      fireEvent.contextMenu(focusable, { button: 0 });

      const popup = await screen.findByTestId('context-popup');
      expect(popup).toHaveAttribute('data-instant', 'click');
    });

    it('marks the popup as instant when a keyboard contextmenu carries the focused element coordinates', async () => {
      await render(<Fixture />);

      const focusable = screen.getByTestId('focusable');
      await act(async () => {
        focusable.focus();
      });

      // Gecko and WebKit position a keyboard-invoked native menu against the focused element, so
      // the event carries real coordinates. Classification must not read them as a pointer.
      fireEvent.keyDown(focusable, { key: 'F10', shiftKey: true });
      fireEvent.contextMenu(focusable, { clientX: 120, clientY: 64, button: 0 });

      const popup = await screen.findByTestId('context-popup');
      expect(popup).toHaveAttribute('data-instant', 'click');
    });

    it('marks the popup as instant when a key press follows an earlier pointer gesture', async () => {
      await render(<Fixture />);

      const focusable = screen.getByTestId('focusable');

      // Focusing by mouse and then invoking the menu by keyboard: the key press ends the earlier
      // pointer gesture, so it must not be credited with opening the menu.
      fireEvent.pointerDown(focusable, { pointerType: 'mouse', button: 0 });
      fireEvent.pointerUp(focusable, { pointerType: 'mouse', button: 0 });
      await act(async () => {
        focusable.focus();
      });

      fireEvent.keyDown(focusable, { key: 'F10', shiftKey: true });
      fireEvent.contextMenu(focusable, { clientX: 120, clientY: 64, button: 0 });

      const popup = await screen.findByTestId('context-popup');
      expect(popup).toHaveAttribute('data-instant', 'click');
    });

    it('does not mark the popup as instant when a pointer gesture follows a key press', async () => {
      await render(<Fixture />);

      const focusable = screen.getByTestId('focusable');
      await act(async () => {
        focusable.focus();
      });

      // The reverse of the case above: a key press clears the recorded gesture, and only a later
      // `pointerdown` restores pointer classification. Uses the primary button so the decision
      // rests on that recorded gesture rather than on the secondary-button shortcut.
      fireEvent.keyDown(focusable, { key: 'a' });
      fireEvent.pointerDown(focusable, {
        pointerType: 'mouse',
        button: 0,
        clientX: 10,
        clientY: 10,
      });
      fireEvent.contextMenu(focusable, { clientX: 10, clientY: 10, button: 0 });

      const popup = await screen.findByTestId('context-popup');
      expect(popup).not.toHaveAttribute('data-instant');
    });

    // Chromium dispatches `contextmenu` as a `PointerEvent`. Measured on Chromium 151, both a
    // right-click and a Shift+F10 report `pointerType: 'mouse'` and coordinates inside the
    // focused element — only the button and the gesture before the event differ. These reproduce
    // that shape exactly; jsdom has no `PointerEvent` constructor, so they run in the browser.
    function dispatchChromiumContextMenu(trigger: HTMLElement, button: number) {
      return act(async () => {
        trigger.dispatchEvent(
          new PointerEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            pointerType: 'mouse',
            button,
            buttons: 0,
            clientX: 123,
            clientY: 98,
          }),
        );
      });
    }

    it.skipIf(isJSDOM)('does not mark a Chromium right-click as instant', async () => {
      await render(<Fixture />);

      const trigger = screen.getByTestId('context-trigger');
      fireEvent.pointerDown(trigger, { pointerType: 'mouse', button: 2 });
      await dispatchChromiumContextMenu(trigger, 2);

      const popup = await screen.findByTestId('context-popup');
      expect(popup).not.toHaveAttribute('data-instant');
    });

    it.skipIf(isJSDOM)('marks a Chromium keyboard contextmenu as instant', async () => {
      await render(<Fixture />);

      const focusable = screen.getByTestId('focusable');
      await act(async () => {
        focusable.focus();
      });

      // Chromium reports `button === -1` here and, critically, `pointerType: 'mouse'` — the same
      // value a right-click reports — so only the preceding `keydown` marks this as a keyboard
      // open.
      fireEvent.keyDown(focusable, { key: 'F10', shiftKey: true });
      await dispatchChromiumContextMenu(screen.getByTestId('context-trigger'), -1);

      const popup = await screen.findByTestId('context-popup');
      expect(popup).toHaveAttribute('data-instant', 'click');
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
        expect(positioner.getAttribute('data-side')).toBe('top');
      });
    });
  });
});
