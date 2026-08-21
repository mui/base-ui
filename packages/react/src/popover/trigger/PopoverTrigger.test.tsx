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

  describe.skipIf(isJSDOM)('exit animation', () => {
    const style = `
      @keyframes popover-close-test {
        to {
          opacity: 0;
        }
      }

      .animation-test-popup[data-ending-style] {
        animation: popover-close-test 500ms linear;
      }
    `;

    function AnimatedPopover(props: { onOpenChange?: Popover.Root.Props['onOpenChange'] }) {
      return (
        <React.Fragment>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <button type="button" data-testid="before">
            Before
          </button>
          <Popover.Root onOpenChange={props.onOpenChange}>
            <Popover.Trigger data-testid="trigger">Open</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup data-testid="popup" className="animation-test-popup">
                  <button type="button" data-testid="inside">
                    Inside
                  </button>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <button type="button" data-testid="after">
            After
          </button>
        </React.Fragment>
      );
    }

    it('does not strand focus when a hover-opened popup animates out', async ({
      onTestFinished,
    }) => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      onTestFinished(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      const { user } = await render(
        <React.Fragment>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <Popover.Root>
            <Popover.Trigger openOnHover delay={0} data-testid="trigger">
              Open
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner data-testid="positioner">
                <Popover.Popup data-testid="popup" className="animation-test-popup">
                  <button type="button" data-testid="inside">
                    Inside
                  </button>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </React.Fragment>,
      );

      await user.hover(screen.getByTestId('trigger'));
      const inside = await screen.findByTestId('inside');
      inside.focus();
      expect(inside).toHaveFocus();

      await user.keyboard('{Escape}');
      expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');

      // A hover-opened popup runs with its focus manager disabled, so nothing hands focus back on
      // close. Going inert would blur the focused element and leave nothing focused at all.
      expect(screen.getByTestId('positioner')).not.toHaveAttribute('inert');
      expect(inside).toHaveFocus();
    });

    it('keeps the trigger focus guards mounted while the popup animates out', async ({
      onTestFinished,
    }) => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      onTestFinished(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      const { user } = await render(<AnimatedPopover />);

      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);
      await waitFor(() => expect(screen.getByTestId('inside')).toHaveFocus());

      await user.keyboard('{Escape}');
      expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');

      // The guards have to outlive the close: shift-tabbing off an open trigger fires a focus-out
      // that closes the popup, and the guard must still be there to catch the focus already on its
      // way to it. Unmounting them at close instead drops that focus to `<body>`, which the tab
      // order assertions in this suite cannot see because they resolve through ordinary tab order
      // either way.
      expect(trigger.previousElementSibling).toHaveAttribute('data-base-ui-focus-guard');
      expect(trigger.nextElementSibling).toHaveAttribute('data-base-ui-focus-guard');
    });

    it('does not leave a focus guard in the tab order while the popup animates out', async ({
      onTestFinished,
    }) => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      onTestFinished(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      const { user } = await render(<AnimatedPopover />);

      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);
      await waitFor(() => expect(screen.getByTestId('inside')).toHaveFocus());

      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style'));
      await waitFor(() => expect(trigger).toHaveFocus());

      // The trigger's focus guards only steer focus into an open popup. While the popup animates
      // out they must not sit between the trigger and the next tabbable element.
      await user.keyboard('{Tab}');
      expect(screen.getByTestId('after')).toHaveFocus();
    });

    it('does not bounce focus back when tabbing towards the trigger while the popup animates out', async ({
      onTestFinished,
    }) => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      onTestFinished(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      const { user } = await render(<AnimatedPopover />);

      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);
      await waitFor(() => expect(screen.getByTestId('inside')).toHaveFocus());

      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style'));
      await waitFor(() => expect(trigger).toHaveFocus());

      screen.getByTestId('before').focus();
      expect(screen.getByTestId('before')).toHaveFocus();

      // Tabbing forwards past the leftover guard must continue on to the trigger rather than
      // bounce back to the element the focus came from.
      await user.keyboard('{Tab}');
      expect(trigger).toHaveFocus();
    });

    it('does not bounce focus back when shift-tabbing towards the trigger while the popup animates out', async ({
      onTestFinished,
    }) => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      onTestFinished(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      const { user } = await render(<AnimatedPopover />);

      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);
      await waitFor(() => expect(screen.getByTestId('inside')).toHaveFocus());

      // Tabbing forwards out of the popup closes it and lands past the trigger.
      await user.keyboard('{Tab}');
      await waitFor(() => expect(screen.getByTestId('after')).toHaveFocus());
      expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');

      // Shift-tabbing back past the leftover guard must reach the trigger rather than bounce
      // forwards to the element the focus came from.
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(trigger).toHaveFocus();
    });

    it('does not close again when tabbing off the trigger while the popup animates out', async ({
      onTestFinished,
    }) => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      onTestFinished(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      const onOpenChange = vi.fn();
      const { user } = await render(<AnimatedPopover onOpenChange={onOpenChange} />);

      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);
      await waitFor(() => expect(screen.getByTestId('inside')).toHaveFocus());

      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style'));
      await waitFor(() => expect(trigger).toHaveFocus());

      const callsAfterClose = onOpenChange.mock.calls.length;

      // The popup is already closed, so moving focus off the trigger must not emit another close.
      // A second `setOpen(false)` also stamps `data-instant`, which cancels the exit transition.
      await user.keyboard('{Tab}');

      expect(onOpenChange).toHaveBeenCalledTimes(callsAfterClose);
      expect(screen.getByTestId('popup')).not.toHaveAttribute('data-instant', 'focus');
    });
  });
});
