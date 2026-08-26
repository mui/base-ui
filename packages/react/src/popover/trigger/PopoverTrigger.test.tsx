import { expect, vi } from 'vitest';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import {
  createRenderer,
  describeConformance,
  enterWithMouse,
  isJSDOM,
  resetBrowserPointer,
} from '#test-utils';
import {
  act,
  fireEvent,
  flushMicrotasks,
  ignoreActWarnings,
  screen,
  waitFor,
} from '@mui/internal-test-utils';
import { PATIENT_CLICK_THRESHOLD } from '../../internals/constants';

describe('<Popover.Trigger />', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  describeConformance(<Popover.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render(node) {
      return render(<Popover.Root open>{node}</Popover.Root>);
    },
  }));

  it('throws a descriptive error when rendered without a root or a handle', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Popover.Trigger>Toggle</Popover.Trigger>)).rejects.toThrow(
        'Base UI: <Popover.Trigger> must be either used within a <Popover.Root> component or provided with a handle.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  describe('prop: disabled', () => {
    it('disables the popover', async () => {
      const { user } = await render(
        <Popover.Root>
          <Popover.Trigger disabled />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('disabled');
      expect(trigger).toHaveAttribute('data-disabled');

      await user.click(trigger);
      expect(screen.queryByText('Content')).toBe(null);

      await user.keyboard('[Tab]');
      expect(document.activeElement).not.toBe(trigger);
    });

    it('custom element', async () => {
      const { user } = await render(
        <Popover.Root>
          <Popover.Trigger disabled render={<span />} nativeButton={false} />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');
      expect(trigger).not.toHaveAttribute('disabled');
      expect(trigger).toHaveAttribute('data-disabled');
      expect(trigger).toHaveAttribute('aria-disabled', 'true');

      await user.click(trigger);
      expect(screen.queryByText('Content')).toBe(null);

      await user.keyboard('[Tab]');
      expect(document.activeElement).not.toBe(trigger);
    });

    it('does not open on hover when disabled', async () => {
      const { user } = await render(
        <Popover.Root>
          <Popover.Trigger disabled openOnHover delay={0} render={<span />} nativeButton={false} />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('data-disabled');

      await user.hover(trigger);
      await flushMicrotasks();

      expect(screen.queryByText('Content')).toBe(null);
      expect(trigger).not.toHaveAttribute('data-popup-open');
    });
  });

  describe('openOnHover opened by touch', () => {
    function MultiTriggerPopover() {
      return (
        <Popover.Root>
          {({ payload }) => (
            <React.Fragment>
              <Popover.Trigger
                payload="One"
                openOnHover
                delay={0}
                closeDelay={0}
                style={{ pointerEvents: 'none' }}
              >
                One
              </Popover.Trigger>
              <Popover.Trigger
                payload="Two"
                openOnHover
                delay={0}
                closeDelay={0}
                style={{ pointerEvents: 'none' }}
              >
                Two
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>
                    <span data-testid="content">{payload as string}</span>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </React.Fragment>
          )}
        </Popover.Root>
      );
    }

    async function pressTrigger(trigger: HTMLElement, pointerType: 'mouse' | 'touch') {
      // eslint-disable-next-line testing-library/no-unnecessary-act -- flush the complete synthetic press before the browser can dispatch physical pointer movement
      await act(async () => {
        fireEvent.pointerDown(trigger, { pointerType });
        fireEvent.mouseDown(trigger);
        fireEvent.click(trigger, { detail: 1 });
      });
    }

    function hoverTrigger(trigger: HTMLElement) {
      enterWithMouse(trigger);
    }

    // A touch tap leaves the pointer parked wherever the cursor happens to be, so hover must stay
    // disarmed until the popover is reopened by some other means. Otherwise a stray hover over a
    // sibling trigger silently swaps the content the user just tapped for.
    it('keeps ownership on the tapped trigger when a sibling trigger is hovered', async () => {
      await render(<MultiTriggerPopover />);

      const one = screen.getByRole('button', { name: 'One' });
      const two = screen.getByRole('button', { name: 'Two' });

      await pressTrigger(one, 'touch');

      expect(screen.getByTestId('content')).toHaveTextContent('One');

      hoverTrigger(two);
      await flushMicrotasks();

      expect(screen.getByTestId('content')).toHaveTextContent('One');
      expect(two).toHaveAttribute('aria-expanded', 'false');
    });

    // The same hover must still take over when the popover was opened with a mouse, so the guard
    // above can't be a blanket disable.
    it('hands ownership to a hovered sibling trigger when opened by mouse', async () => {
      await render(<MultiTriggerPopover />);

      const one = screen.getByRole('button', { name: 'One' });
      const two = screen.getByRole('button', { name: 'Two' });

      await pressTrigger(one, 'mouse');

      expect(screen.getByTestId('content')).toHaveTextContent('One');

      hoverTrigger(two);
      await flushMicrotasks();

      expect(screen.getByTestId('content')).toHaveTextContent('Two');
      expect(two).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('style hooks', () => {
    it('should have the data-popup-open and data-pressed attributes when open by clicking', async () => {
      await render(
        <Popover.Root>
          <Popover.Trigger />
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');

      await act(async () => {
        trigger.click();
      });

      expect(trigger).toHaveAttribute('data-popup-open');
      expect(trigger).toHaveAttribute('data-pressed');
    });

    it('should have the data-popup-open but not the data-pressed attribute when open by hover', async () => {
      const { user } = await render(
        <Popover.Root>
          <Popover.Trigger openOnHover delay={0} />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup />
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');

      await user.hover(trigger);

      expect(trigger).toHaveAttribute('data-popup-open');
      expect(trigger).not.toHaveAttribute('data-pressed');
    });

    it('should not have the data-popup-open and data-pressed attributes when open by click when `openOnHover=true` and `delay=0`', async () => {
      const { user } = await render(
        <Popover.Root>
          <Popover.Trigger delay={0} openOnHover />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup />
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');

      await user.hover(trigger);

      await act(async () => {
        trigger.click();
      });

      expect(trigger).toHaveAttribute('data-popup-open');
    });

    it('should have the data-popup-open and data-pressed attributes when open by click when `openOnHover=true`', async () => {
      const { user } = await render(
        <Popover.Root>
          <Popover.Trigger openOnHover />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup />
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');

      await user.hover(trigger);
      await act(async () => {
        trigger.click();
      });

      expect(trigger).toHaveAttribute('data-popup-open');
      expect(trigger).toHaveAttribute('data-pressed');
    });
  });

  describe('impatient clicks with `openOnHover=true`', () => {
    const { clock, render: renderFakeTimers } = createRenderer();

    clock.withFakeTimers();

    it('does not close the popover if the user clicks too quickly', async () => {
      await renderFakeTimers(
        <Popover.Root>
          <Popover.Trigger delay={0} openOnHover />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup />
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseMove(trigger);

      clock.tick(PATIENT_CLICK_THRESHOLD - 1);

      fireEvent.click(trigger);

      expect(trigger).toHaveAttribute('data-popup-open');
    });

    it('closes the popover if the user clicks patiently', async () => {
      await renderFakeTimers(
        <Popover.Root>
          <Popover.Trigger delay={0} openOnHover />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup />
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);

      clock.tick(PATIENT_CLICK_THRESHOLD);

      fireEvent.click(trigger);

      expect(trigger).not.toHaveAttribute('data-popup-open');
    });

    it('sticks if the user clicks impatiently', async () => {
      await renderFakeTimers(
        <Popover.Root>
          <Popover.Trigger delay={0} openOnHover />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup />
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);

      clock.tick(PATIENT_CLICK_THRESHOLD - 1);

      fireEvent.click(trigger);
      fireEvent.mouseLeave(trigger);

      expect(trigger).toHaveAttribute('data-popup-open');

      clock.tick(1);

      expect(trigger).toHaveAttribute('data-popup-open');
    });

    it('does not stick if the user clicks patiently', async () => {
      await renderFakeTimers(
        <Popover.Root>
          <Popover.Trigger delay={0} openOnHover />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup />
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);

      clock.tick(PATIENT_CLICK_THRESHOLD);

      fireEvent.click(trigger);
      fireEvent.mouseLeave(trigger);

      expect(trigger).not.toHaveAttribute('data-popup-open');
    });

    it('sticks when clicked before the hover delay completes', async () => {
      await renderFakeTimers(
        <Popover.Root>
          <Popover.Trigger openOnHover delay={300}>
            Open
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(100);

      // User clicks impatiently to open
      fireEvent.click(trigger);

      expect(trigger).toHaveAttribute('data-popup-open');

      fireEvent.mouseLeave(trigger);

      expect(trigger).toHaveAttribute('data-popup-open');
    });

    it('should keep the popover open when re-hovered and clicked within the patient threshold', async () => {
      await render(
        <Popover.Root>
          <Popover.Trigger openOnHover delay={100}>
            Open
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(100);
      await flushMicrotasks();

      expect(screen.getByText('Content')).not.toBe(null);

      clock.tick(PATIENT_CLICK_THRESHOLD);

      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      fireEvent.click(trigger);
      expect(screen.getByText('Content')).not.toBe(null);
    });
  });

  it.skipIf(isJSDOM)(
    'should toggle closed with Enter or Space when rendering a <div>',
    async () => {
      ignoreActWarnings();
      const { userEvent: user } = await import('vitest/browser');
      const { render: vbrRender, cleanup } = await import('vitest-browser-react');

      try {
        await vbrRender(
          <div>
            <Popover.Root>
              <Popover.Trigger render={<div />} nativeButton={false} data-testid="div-trigger">
                Toggle
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>Content</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
            <button data-testid="other-button">Other button</button>
          </div>,
        );

        const trigger = screen.getByTestId('div-trigger');

        await act(async () => trigger.focus());
        await user.keyboard('[Enter]');
        expect(screen.queryByText('Content')).not.toBe(null);

        await user.tab({ shift: true });
        expect(document.activeElement).toBe(trigger);

        await user.keyboard('[Enter]');
        await waitFor(() => {
          expect(screen.queryByText('Content')).toBe(null);
        });

        await user.keyboard('[Enter]');
        expect(screen.queryByText('Content')).not.toBe(null);

        await user.tab({ shift: true });
        expect(document.activeElement).toBe(trigger);

        await user.keyboard('[Space]');
        expect(screen.queryByText('Content')).toBe(null);

        await user.keyboard('[Space]');
        expect(screen.queryByText('Content')).not.toBe(null);

        await user.tab({ shift: true });
        expect(document.activeElement).toBe(trigger);

        await user.keyboard('[Space]');
        expect(screen.queryByText('Content')).toBe(null);
      } finally {
        await cleanup();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'moves focus before the trigger when tabbing backwards out of an open popover',
    async () => {
      const { userEvent: browserUserEvent } = await import('vitest/browser');

      await render(
        <div>
          <button data-testid="before">before</button>
          <Popover.Root>
            <Popover.Trigger openOnHover delay={0}>
              Open
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>
                  <button type="button">Inside</button>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <button data-testid="after">after</button>
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      const before = screen.getByTestId('before');

      // Hover-opening leaves focus on the trigger, which is what makes the pre-trigger focus
      // guard reachable by a backwards Tab.
      await act(async () => trigger.focus());
      enterWithMouse(trigger);

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBe(null));
      expect(trigger).toHaveFocus();

      const focusedGuards: Element[] = [];
      const recordGuard = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        if (target.hasAttribute?.('data-base-ui-focus-guard')) {
          focusedGuards.push(target);
        }
      };
      document.addEventListener('focusin', recordGuard, true);

      try {
        // The pre-trigger guard's handler closes the popover, which unmounts that guard inside the
        // same `flushSync`. The destination must have been resolved before the close, otherwise
        // focus is stranded on the removed guard.
        await act(async () => {
          await browserUserEvent.tab({ shift: true });
        });

        await waitFor(() => expect(before).toHaveFocus());
      } finally {
        document.removeEventListener('focusin', recordGuard, true);
      }

      // A guard is traversed on the way out, but focus must never come to rest on one.
      expect(focusedGuards.length).toBeGreaterThan(0);
      expect(
        (document.activeElement as HTMLElement | null)?.hasAttribute('data-base-ui-focus-guard') ??
          false,
      ).toBe(false);
    },
  );

  describe.skipIf(isJSDOM)('sequential focus navigation while closing', () => {
    beforeEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    });

    afterEach(() => {
      finishClosingAnimation();
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    });

    // A deliberately long exit animation holds the popup mounted-but-closed for the whole
    // sequence. Without it the window this guards against is ~0ms and the test proves nothing.
    const closingStyle = `
      @keyframes popover-trigger-close-test {
        to {
          opacity: 0;
        }
      }

      .closing-test-popup[data-ending-style] {
        animation: popover-trigger-close-test 5s linear;
      }
    `;

    function TabApp() {
      return (
        <div>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: closingStyle }} />
          <button data-testid="before">before</button>
          <Popover.Root>
            <Popover.Trigger>Open</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup data-testid="popup" className="closing-test-popup">
                  <button data-testid="inside">Inside</button>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <button data-testid="after">after</button>
        </div>
      );
    }

    function finishClosingAnimation() {
      screen
        .queryAllByTestId('popup')
        .forEach((popup) => popup.getAnimations().forEach((animation) => animation.finish()));
    }

    /** Tabs in one direction until the popover is logically closed, bounded so a genuine
     * failure surfaces as an assertion rather than a timeout. `data-ending-style` rather than a
     * role query, because the popup stays in the DOM (and matchable) while it animates out. */
    async function tabUntilClosed(
      browserUserEvent: { tab: (options?: { shift?: boolean }) => Promise<void> },
      shift: boolean,
    ) {
      for (let step = 0; step < 6; step += 1) {
        if (screen.getByTestId('popup').hasAttribute('data-ending-style')) {
          return;
        }
        // eslint-disable-next-line no-await-in-loop
        await act(async () => {
          await browserUserEvent.tab({ shift });
        });
      }
      await waitFor(() => expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style'));
    }

    /** Records every element that receives focus during the sequence, so the test can assert on
     * where focus went, not only where it ended up. */
    function recordFocus() {
      const seen: HTMLElement[] = [];
      const handler = (event: FocusEvent) => seen.push(event.target as HTMLElement);
      document.addEventListener('focusin', handler, true);
      return {
        seen,
        reset: () => {
          seen.length = 0;
        },
        stop: () => document.removeEventListener('focusin', handler, true),
      };
    }

    /** Focus guards are `aria-hidden` and `tabindex=0`. While the popup is logically closed none
     * may remain reachable by sequential focus navigation — that is the `aria-hidden-focus`
     * violation in mui/base-ui#5519. Guards inside an `inert` subtree are already excluded. */
    function expectNoTabbableGuards() {
      const reachable = (
        Array.from(document.querySelectorAll('[data-base-ui-focus-guard]')) as HTMLElement[]
      ).filter((guard) => guard.tabIndex >= 0 && guard.closest('[inert]') === null);
      expect(reachable).toHaveLength(0);
    }

    function assertNoGuardRetainedFocus(seen: HTMLElement[]) {
      const active = document.activeElement as HTMLElement | null;
      expect(active?.hasAttribute('data-base-ui-focus-guard') ?? false).toBe(false);
      expect(active).not.toBe(document.body);
      // Sequential navigation must never walk back into the popup that is animating out — this is
      // what the recording is for, since focus could enter and leave again before the end state.
      const popup = screen.queryByTestId('popup');
      expect(seen.filter((el) => popup !== null && popup.contains(el))).toHaveLength(0);
    }

    it('tabs out of an open popover and back with Shift+Tab', async () => {
      const { userEvent: browserUserEvent } = await import('vitest/browser');
      await render(<TabApp />);

      const trigger = screen.getByRole('button', { name: 'Open' });
      await act(async () => trigger.focus());
      fireEvent.click(trigger);
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBe(null));
      // Native Tab acts on whatever is focused right now, so the popup's own initial focus has
      // to have landed before the sequence starts — otherwise the tab count is a race.
      await waitFor(() => expect(screen.getByTestId('inside')).toHaveFocus());

      const recorder = recordFocus();
      try {
        // Tab forward until focus leaves the popup, which closes it. The number of stops
        // depends on the guards the manager renders, so drive it by the outcome rather than
        // by a fixed count.
        await tabUntilClosed(browserUserEvent, false);
        // Logically closed, still mounted for the exit animation: this is the window where a
        // stale `aria-hidden` guard would still be in the tab order.
        await waitFor(() =>
          expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style'),
        );

        expectNoTabbableGuards();
        expect(screen.getByTestId('popup').closest('[inert]')).not.toBe(null);
        // Only post-close navigation is interesting; focus was legitimately inside while open.
        recorder.reset();

        // Coming back must reach a real control, not a guard and not the body.
        await act(async () => {
          await browserUserEvent.tab({ shift: true });
        });

        assertNoGuardRetainedFocus(recorder.seen);
      } finally {
        recorder.stop();
      }
    });

    it('shift-tabs out of an open popover and back with Tab', async () => {
      const { userEvent: browserUserEvent } = await import('vitest/browser');
      await render(<TabApp />);

      const trigger = screen.getByRole('button', { name: 'Open' });
      await act(async () => trigger.focus());
      fireEvent.click(trigger);
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBe(null));
      // Native Tab acts on whatever is focused right now, so the popup's own initial focus has
      // to have landed before the sequence starts — otherwise the tab count is a race.
      await waitFor(() => expect(screen.getByTestId('inside')).toHaveFocus());

      const recorder = recordFocus();
      try {
        await tabUntilClosed(browserUserEvent, true);
        await waitFor(() =>
          expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style'),
        );

        expectNoTabbableGuards();
        expect(screen.getByTestId('popup').closest('[inert]')).not.toBe(null);
        recorder.reset();

        await act(async () => {
          await browserUserEvent.tab();
        });

        assertNoGuardRetainedFocus(recorder.seen);
      } finally {
        recorder.stop();
      }
    });
  });
});
