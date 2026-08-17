import { expect } from 'vitest';
import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { Timeout } from '@base-ui/utils/useTimeout';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, isJSDOM } from '#test-utils';

const activeTrackers: Array<{ stop(): void }> = [];
const activeTimeouts: Timeout[] = [];

/**
 * Records whether `selector` ever matches an element. Polls per frame because the tracked
 * attributes may be present for only a single frame. Uses the managed `AnimationFrame` scheduler
 * so the loop cannot outlive its test: `stop()` cancels the pending frame, and every tracker is
 * also stopped in `afterEach` in case a test fails before reaching `stop()`.
 */
function trackSelector(selector: string) {
  let seen = false;
  let frame: number;

  function sample() {
    if (document.querySelector(selector)) {
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

/**
 * Records whether an element ever carries `[data-starting-style]`, which is what drives the enter
 * transition.
 */
function trackStartingStyle(testId: string) {
  return trackSelector(`[data-testid="${testId}"][data-starting-style]`);
}

/**
 * Waits using the managed timeout scheduler instead of a raw global timer, so an interrupted test
 * cannot leak a pending callback into a later one — every timeout is cleared in `afterEach`.
 * Wrapped in `act` because pending transition-status updates (e.g. the frame that clears
 * `'starting'`) may land during the window; unwrapped, they trigger React act warnings that
 * `vitest-fail-on-console` turns into failures.
 */
async function waitMs(ms: number) {
  const timeout = Timeout.create();
  activeTimeouts.push(timeout);
  await act(async () => {
    await new Promise<void>((resolve) => {
      timeout.start(ms, resolve);
    });
  });
}

describe.skipIf(isJSDOM)('Menu enter transition', () => {
  const { render } = createRenderer();

  afterEach(() => {
    activeTrackers.splice(0).forEach((tracker) => tracker.stop());
    activeTimeouts.splice(0).forEach((timeout) => timeout.clear());
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

    await waitMs(100);

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

    await waitMs(100);

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

    await waitMs(100);

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
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const submenuInstantTracker = trackSelector(
      '[data-testid="submenu-popup"][data-instant="click"]',
    );

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
    // The submenu carries the inherited value during its enter frames only: it is cleared once
    // the initial reveal settles, so it cannot suppress later transitions.
    await waitFor(() => {
      expect(submenuInstantTracker.seen()).toBe(true);
    });
    await waitFor(() => {
      expect(screen.getByTestId('submenu-popup')).not.toHaveAttribute('data-instant');
    });
  });

  it('clears the inherited instant type after the initial open', async () => {
    // The inherited `instantType` must not outlive the initial reveal: controlled `open` flips
    // bypass `setOpen`, so a value that stuck around would render `[data-instant]` on every
    // subsequent open and suppress transitions that should play.
    function App({ submenuOpen }: { submenuOpen: boolean }) {
      return (
        <Menu.Root>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup data-testid="menu-popup">
                <Menu.Item>Item</Menu.Item>
                <Menu.SubmenuRoot open={submenuOpen}>
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

    const { setProps } = await render(<App submenuOpen />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await act(async () => {
      trigger.focus();
    });
    await userEvent.keyboard('[Enter]');

    await waitFor(() => {
      expect(screen.queryByTestId('submenu-popup')).not.toBe(null);
    });
    await waitFor(() => {
      expect(screen.getByTestId('submenu-popup')).not.toHaveAttribute('data-instant');
    });

    await setProps({ submenuOpen: false });
    await waitFor(() => {
      expect(screen.queryByTestId('submenu-popup')).toBe(null);
    });

    await setProps({ submenuOpen: true });
    await waitFor(() => {
      expect(screen.queryByTestId('submenu-popup')).not.toBe(null);
    });
    expect(screen.getByTestId('submenu-popup')).not.toHaveAttribute('data-instant');
  });

  it('clears the inherited instant type when the popup is not initially rendered', async () => {
    // With the popup subtree omitted at mount (e.g. suspended or waiting on data), there is no
    // element for the animations-finished callback to watch, and a ref assignment alone never
    // reruns the clearing effect. The seed must still be cleared, so a popup rendered after the
    // reveal settles does not carry a stale `[data-instant]`.
    function App({ showPopup }: { showPopup: boolean }) {
      return (
        <Menu.Root>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup data-testid="menu-popup">
                <Menu.Item>Item</Menu.Item>
                <Menu.SubmenuRoot defaultOpen>
                  <Menu.SubmenuTrigger>Submenu</Menu.SubmenuTrigger>
                  {showPopup && (
                    <Menu.Portal>
                      <Menu.Positioner>
                        <Menu.Popup data-testid="submenu-popup">
                          <Menu.Item>Sub item</Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  )}
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    const { setProps } = await render(<App showPopup={false} />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await act(async () => {
      trigger.focus();
    });
    await userEvent.keyboard('[Enter]');

    await waitFor(() => {
      expect(screen.getByTestId('menu-popup')).toHaveAttribute('data-instant', 'click');
    });
    // Give the reveal time to settle while the submenu popup is absent.
    await waitMs(100);

    await setProps({ showPopup: true });
    await waitFor(() => {
      expect(screen.queryByTestId('submenu-popup')).not.toBe(null);
    });
    expect(screen.getByTestId('submenu-popup')).not.toHaveAttribute('data-instant');
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
