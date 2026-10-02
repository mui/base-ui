import * as React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ignoreActWarnings, screen, waitFor } from '@mui/internal-test-utils';
import { isJSDOM } from '@base-ui/utils/testUtils';
import { holdExit } from './holdExit';
import { resetBrowserPointer } from './resetBrowserPointer';
import type { PopupTestConfig, TestedComponentProps } from './popupConformanceTests';

type Interactions = Pick<
  Awaited<ReturnType<PopupTestConfig['render']>>['user'],
  'click' | 'keyboard' | 'tab'
>;

/**
 * Asserts how a popup behaves between the moment it closes and the end of its exit animation:
 * it's out of reach for Tab and assistive tech, and focus returns as soon as it closes.
 * Only public behavior is checked: DOM attributes, the focused element and `onOpenChange`.
 *
 * Exits are held with a real CSS animation in browsers and with a stubbed one in jsdom.
 */
export function closingPopupConformanceTests(config: ClosingPopupTestConfig) {
  const {
    createComponent,
    render,
    triggerMouseAction,
    alwaysMounted = false,
    combobox = false,
    closing: { inert, returnFocus, focusGuards },
  } = config;

  const opensWithClick = triggerMouseAction === 'click';

  let nativeUser: Interactions | null = null;

  async function renderClosingPopup(
    props: { open?: boolean; onOpenChange?: (open: boolean) => void } = {},
  ) {
    const view = await render(<ClosingPopup {...props} createComponent={createComponent} />);
    let user: Interactions = view.user;
    if (nativeUser) {
      // Native events are dispatched outside `act()`.
      ignoreActWarnings();
      user = nativeUser;
    }
    return { ...view, user };
  }

  function getInertElement() {
    return inert === 'positioner' ? screen.getByTestId('positioner') : getPopup()!;
  }

  function expectExitFinished() {
    if (alwaysMounted) {
      expect(getPopup()).toBeInaccessible();
    } else {
      expect(getPopup()).toBe(null);
    }
  }

  /** Opens the popup like a user would and waits for focus to move in. */
  async function open(user: Interactions) {
    const trigger = getTrigger();
    await user.click(trigger);
    await waitFor(() => {
      expect(getPopup()).not.toBe(null);
    });
    // The input that opens a combobox keeps focus.
    if (!combobox) {
      await waitFor(() => {
        expect(getPopupContainer()).toContainElement(getActiveElement());
      });
    }
    return trigger;
  }

  /** Closes the popup with Escape and waits for focus to land on the trigger. */
  async function closeWithEscape(user: Interactions, trigger: HTMLElement) {
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  }

  describe('while closing', () => {
    // Native events in browsers: only the browser's own Tab follows `inert` and the focus guards.
    beforeAll(async () => {
      if (!isJSDOM) {
        ({ userEvent: nativeUser } = await import('vitest/browser'));
      }
    });

    // The native pointer stays where these tests left it, and would hover whatever renders there
    // in the next test.
    afterEach(resetBrowserPointer);

    it('keeps the popup mounted until its exit animation finishes', async () => {
      const exit = holdExit();
      const { setProps } = await renderClosingPopup({ open: true });

      await setProps({ open: false });

      expect(getPopup()).not.toBe(null);
      expect(getPopup()).not.toBeInaccessible();

      await exit.release();

      expectExitFinished();
    });

    if (inert) {
      it(`makes the ${inert} inert until the popup reopens`, async () => {
        holdExit();
        const { setProps } = await renderClosingPopup({ open: true });
        const popup = getPopup();
        expect(getInertElement()).not.toHaveAttribute('inert');

        await setProps({ open: false });

        expect(getInertElement()).toHaveAttribute('inert');

        await setProps({ open: true });

        expect(getPopup()).toBe(popup);
        expect(getInertElement()).not.toHaveAttribute('inert');
      });
    }

    it('leaves no focus guard tabbable', async () => {
      holdExit();
      const { setProps } = await renderClosingPopup({ open: true });
      if (focusGuards) {
        expect(getTabbableFocusGuards()).not.toEqual([]);
      }

      await setProps({ open: false });

      expect(getPopup()).not.toBe(null);
      expect(getTabbableFocusGuards()).toEqual([]);
    });

    if (opensWithClick && returnFocus) {
      it('returns focus to the trigger when it closes, before the exit animation finishes', async () => {
        const exit = holdExit();
        const { user } = await renderClosingPopup();
        const trigger = await open(user);
        const focusSpy = vi.spyOn(trigger, 'focus');

        await closeWithEscape(user, trigger);

        expect(getPopup()).not.toBe(null);
        if (!combobox) {
          // A keyboard close shows the focus ring on the trigger.
          // eslint-disable-next-line vitest/no-conditional-expect -- focus never leaves a combobox's input, so nothing returns it
          expect(focusSpy).toHaveBeenCalledWith(expect.objectContaining({ focusVisible: true }));
        }
        const focusCallsAtClose = focusSpy.mock.calls.length;

        await exit.release();

        expectExitFinished();
        expect(trigger).toHaveFocus();
        // The unmount doesn't return focus a second time.
        expect(focusSpy).toHaveBeenCalledTimes(focusCallsAtClose);
      });
    }

    if (opensWithClick && inert) {
      it(`removes inert from the ${inert} when the trigger reopens the popup`, async () => {
        holdExit();
        const { user } = await renderClosingPopup();
        const trigger = await open(user);
        const popup = getPopup();
        await closeWithEscape(user, trigger);
        expect(getInertElement()).toHaveAttribute('inert');

        await user.click(trigger);

        await waitFor(() => {
          expect(getInertElement()).not.toHaveAttribute('inert');
        });
        expect(getPopup()).toBe(popup);
        if (!combobox) {
          await waitFor(() => {
            // eslint-disable-next-line vitest/no-conditional-expect -- a combobox keeps focus in its input
            expect(getPopupContainer()).toContainElement(getActiveElement());
          });
        }
        if (focusGuards) {
          // eslint-disable-next-line vitest/no-conditional-expect -- only some popups render focus guards
          expect(getTabbableFocusGuards()).not.toEqual([]);
        }
      });
    }

    if (opensWithClick && returnFocus && inert) {
      // `@testing-library`'s Tab picks the next element itself and doesn't skip `inert`.
      describe.skipIf(isJSDOM)('Tab', () => {
        it('skips the closing popup when tabbing forward from the trigger', async () => {
          const exit = holdExit();
          const onOpenChange = vi.fn();
          const { user } = await renderClosingPopup({ onOpenChange });
          const trigger = await open(user);
          await closeWithEscape(user, trigger);

          await user.tab();

          expect(screen.getByTestId('after')).toHaveFocus();
          expect(getPopup()).not.toBe(null);
          // Focus leaving the trigger doesn't count as another close.
          expect(onOpenChange.mock.calls.map(([nextOpen]) => nextOpen)).toEqual([true, false]);

          await exit.release();

          expect(screen.getByTestId('after')).toHaveFocus();
        });

        it('moves focus before the trigger when tabbing backward from the trigger', async () => {
          holdExit();
          const { user } = await renderClosingPopup();
          const trigger = await open(user);
          await closeWithEscape(user, trigger);

          await user.tab({ shift: true });

          expect(screen.getByTestId('before')).toHaveFocus();
          expect(getPopup()).not.toBe(null);
        });
      });
    }
  });

  /** The popup's outermost element: the positioner, or the popup when there is none. */
  function getPopupContainer() {
    return inert === 'positioner' ? screen.getByTestId('positioner') : getPopup();
  }
}

interface ClosingPopupProps {
  createComponent: PopupTestConfig['createComponent'];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function ClosingPopup(props: ClosingPopupProps) {
  const { createComponent, open, onOpenChange } = props;
  const containerRef = React.useRef<HTMLDivElement>(null);

  const componentProps: TestedComponentProps = {
    root: { open, onOpenChange },
    trigger: { 'data-testid': 'trigger' },
    portal: { container: containerRef },
    positioner: { 'data-testid': 'positioner' },
    popup: {
      'data-testid': 'popup',
      // Gives the popup tabbable content, so Tab would reach a closing popup that isn't inert.
      render: (popupProps) => (
        <div {...popupProps}>
          {popupProps.children}
          <button type="button">Inside</button>
        </div>
      ),
    },
  };

  return (
    <div>
      <input aria-label="Before" data-testid="before" />
      {createComponent(componentProps)}
      {/* The popup is portaled right after the trigger, first in line for Tab. */}
      <div ref={containerRef} />
      <input aria-label="After" data-testid="after" />
    </div>
  );
}

function getTrigger() {
  return screen.getByTestId('trigger');
}

function getPopup() {
  return screen.queryByTestId('popup');
}

function getActiveElement() {
  return document.activeElement as HTMLElement | null;
}

function getTabbableFocusGuards() {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-base-ui-focus-guard]')).filter(
    (guard) => guard.tabIndex >= 0 && guard.closest('[inert]') === null,
  );
}

export interface ClosingPopupConfig {
  /**
   * The element made `inert` while the popup closes: its positioner, or the popup itself for
   * popups without one (Dialog, Drawer). `false` if neither is (Tooltip).
   */
  inert: 'positioner' | 'popup' | false;
  /**
   * Whether closing returns focus to the trigger.
   */
  returnFocus: boolean;
  /**
   * Whether the open popup renders focus guards.
   */
  focusGuards: boolean;
}

export interface ClosingPopupTestConfig extends Pick<
  PopupTestConfig,
  'createComponent' | 'render' | 'triggerMouseAction' | 'alwaysMounted' | 'combobox'
> {
  closing: ClosingPopupConfig;
}
