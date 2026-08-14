import { expect } from 'vitest';
import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, isJSDOM } from '#test-utils';

const activeTrackers: Array<{ stop(): void }> = [];

/**
 * Records whether an element ever carries `[data-starting-style]`, which is what drives the enter
 * transition. Polls per frame because the attribute is only present for a single frame. Uses the
 * managed `AnimationFrame` scheduler so the loop cannot outlive its test: `stop()` cancels the
 * pending frame, and every tracker is also stopped in `afterEach` in case a test fails before
 * reaching `stop()`.
 */
function trackStartingStyle(testId: string) {
  let seen = false;
  let frame: number;

  function sample() {
    if (document.querySelector(`[data-testid="${testId}"][data-starting-style]`)) {
      seen = true;
    }
    frame = AnimationFrame.request(sample);
  }
  frame = AnimationFrame.request(sample);

  const tracker = {
    seen: () => seen,
    stop() {
      AnimationFrame.cancel(frame);
    },
  };
  activeTrackers.push(tracker);
  return tracker;
}

describe.skipIf(isJSDOM)('Menu enter transition', () => {
  const { render } = createRenderer();

  afterEach(() => {
    activeTrackers.splice(0).forEach((tracker) => tracker.stop());
  });

  it('plays the enter transition for a submenu that is open when its parent opens', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const submenuTracker = trackStartingStyle('submenu-popup');

    await render(
      <Menu.Root>
        <Menu.Trigger>Trigger</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup data-testid="menu-popup">
              <Menu.Item>Item</Menu.Item>
              <Menu.SubmenuRoot defaultOpen>
                <Menu.SubmenuTrigger>Submenu</Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup data-testid="submenu-popup">
                      <Menu.Item>Sub item</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Trigger' }));

    await waitFor(() => {
      expect(screen.queryByTestId('submenu-popup')).not.toBe(null);
    });
    await waitFor(() => {
      expect(submenuTracker.seen()).toBe(true);
    });
  });

  it('plays the enter transition for a controlled-open submenu when its parent opens', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const submenuTracker = trackStartingStyle('submenu-popup');

    await render(
      <Menu.Root>
        <Menu.Trigger>Trigger</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup data-testid="menu-popup">
              <Menu.Item>Item</Menu.Item>
              <Menu.SubmenuRoot open>
                <Menu.SubmenuTrigger>Submenu</Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup data-testid="submenu-popup">
                      <Menu.Item>Sub item</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Trigger' }));

    await waitFor(() => {
      expect(screen.queryByTestId('submenu-popup')).not.toBe(null);
    });
    await waitFor(() => {
      expect(submenuTracker.seen()).toBe(true);
    });
  });

  it('does not play the enter transition for a menu that is open on the first render', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const menuTracker = trackStartingStyle('menu-popup');

    await render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Trigger</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup data-testid="menu-popup">
              <Menu.Item>Item</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('menu-popup')).not.toBe(null);
    });

    // Wrapped in `act` because pending transition-status updates (e.g. the frame that clears
    // `'starting'`) may land during this window; unwrapped, they trigger React act warnings that
    // `vitest-fail-on-console` turns into failures.
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
    });

    expect(menuTracker.seen()).toBe(false);
  });

  it('does not play the enter transition for a submenu inside a menu that is open on the first render', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const menuTracker = trackStartingStyle('menu-popup');
    const submenuTracker = trackStartingStyle('submenu-popup');

    await render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Trigger</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup data-testid="menu-popup">
              <Menu.Item>Item</Menu.Item>
              <Menu.SubmenuRoot defaultOpen>
                <Menu.SubmenuTrigger>Submenu</Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup data-testid="submenu-popup">
                      <Menu.Item>Sub item</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('submenu-popup')).not.toBe(null);
    });

    // Wrapped in `act` because pending transition-status updates (e.g. the frame that clears
    // `'starting'`) may land during this window; unwrapped, they trigger React act warnings that
    // `vitest-fail-on-console` turns into failures.
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
    });

    expect(menuTracker.seen()).toBe(false);
    expect(submenuTracker.seen()).toBe(false);
  });

  it('does not play the enter transition for a submenu when the parent popup is kept mounted', async () => {
    // Known limitation: with a `keepMounted` parent the submenu subtree exists from page load, so
    // its mount cannot be tied to the parent's reveal and the submenu appears without a
    // transition when the parent opens. This test pins the current behavior; a fix needs a
    // visibility-based signal in the shared transition machinery.
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const submenuTracker = trackStartingStyle('submenu-popup');

    await render(
      <Menu.Root>
        <Menu.Trigger>Trigger</Menu.Trigger>
        <Menu.Portal keepMounted>
          <Menu.Positioner>
            <Menu.Popup data-testid="menu-popup">
              <Menu.Item>Item</Menu.Item>
              <Menu.SubmenuRoot defaultOpen>
                <Menu.SubmenuTrigger>Submenu</Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup data-testid="submenu-popup">
                      <Menu.Item>Sub item</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Trigger' }));

    await waitFor(() => {
      expect(screen.getByTestId('menu-popup')).toBeVisible();
    });

    // Wrapped in `act` because pending transition-status updates (e.g. the frame that clears
    // `'starting'`) may land during this window; unwrapped, they trigger React act warnings that
    // `vitest-fail-on-console` turns into failures.
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
    });

    expect(submenuTracker.seen()).toBe(false);
  });

  it('plays the enter transition for a submenu opened by the user', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const submenuTracker = trackStartingStyle('submenu-popup');

    await render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Trigger</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup data-testid="menu-popup">
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger>Submenu</Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup data-testid="submenu-popup">
                      <Menu.Item>Sub item</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    await userEvent.click(screen.getByRole('menuitem', { name: 'Submenu' }));

    await waitFor(() => {
      expect(screen.queryByTestId('submenu-popup')).not.toBe(null);
    });
    await waitFor(() => {
      expect(submenuTracker.seen()).toBe(true);
    });
  });

  it('marks an initially open submenu as instant when its parent opened instantly', async () => {
    await render(
      <Menu.Root>
        <Menu.Trigger>Trigger</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup data-testid="menu-popup">
              <Menu.Item>Item</Menu.Item>
              <Menu.SubmenuRoot defaultOpen>
                <Menu.SubmenuTrigger>Submenu</Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup data-testid="submenu-popup">
                      <Menu.Item>Sub item</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await act(async () => {
      trigger.focus();
    });
    await userEvent.keyboard('[Enter]');

    await waitFor(() => {
      expect(screen.queryByTestId('submenu-popup')).not.toBe(null);
    });
    expect(screen.getByTestId('menu-popup')).toHaveAttribute('data-instant', 'click');
    expect(screen.getByTestId('submenu-popup')).toHaveAttribute('data-instant', 'click');
  });

  it('does not mark a closed submenu as instant when it is later opened programmatically', async () => {
    // A submenu that mounts closed during the parent's enter transition must not inherit the
    // parent's `instantType`: a later programmatic open (controlled `open` flip) does not go
    // through `setOpen`, so a seeded value would never be cleared. `defaultOpen` is set alongside
    // the controlled prop to pin that the gate resolves the effective open state — the controlled
    // `open={false}` must win over `defaultOpen`.
    function App({ submenuOpen }: { submenuOpen: boolean }) {
      return (
        <Menu.Root>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup data-testid="menu-popup">
                <Menu.Item>Item</Menu.Item>
                <Menu.SubmenuRoot open={submenuOpen} defaultOpen>
                  <Menu.SubmenuTrigger>Submenu</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup data-testid="submenu-popup">
                        <Menu.Item>Sub item</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    const { setProps } = await render(<App submenuOpen={false} />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await act(async () => {
      trigger.focus();
    });
    await userEvent.keyboard('[Enter]');

    await waitFor(() => {
      expect(screen.queryByTestId('menu-popup')).not.toBe(null);
    });
    expect(screen.getByTestId('menu-popup')).toHaveAttribute('data-instant', 'click');

    await setProps({ submenuOpen: true });

    await waitFor(() => {
      expect(screen.queryByTestId('submenu-popup')).not.toBe(null);
    });
    expect(screen.getByTestId('submenu-popup')).not.toHaveAttribute('data-instant');
  });
});
