import * as React from 'react';
import { expect, vi, describe, it } from 'vitest';
import {
  act,
  fireEvent,
  flushMicrotasks,
  ignoreActWarnings,
  screen,
  waitFor,
} from '@mui/internal-test-utils';
import { Menu } from '@base-ui/react/menu';
import { Popover } from '@base-ui/react/popover';
import { describeConformance, createRenderer, enterWithMouse, isJSDOM } from '#test-utils';
import { PATIENT_CLICK_THRESHOLD } from '../../internals/constants';

describe('<Menu.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testRenderPropWith: 'button',
    button: true,
    render: (node) => {
      return render(<Menu.Root open>{node}</Menu.Root>);
    },
  }));

  it('throws without Menu.Root or a handle', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Menu.Trigger />)).rejects.toThrow(
        'Base UI: <Menu.Trigger> must be either used within a <Menu.Root> component or provided with a handle.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  describe.skipIf(isJSDOM)('tabbing backward from the open trigger', () => {
    it.each([true, false])('focuses the preceding element when modal=%s', async (modal) => {
      ignoreActWarnings();
      const { userEvent: nativeUser } = await import('vitest/browser');
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      await render(
        <div>
          <button>Before</button>
          <Menu.Root modal={modal}>
            <Menu.Trigger>Toggle</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item>Item</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'Toggle' });
      await nativeUser.click(trigger);
      await waitFor(() => {
        expect(screen.getByRole('menu')).toHaveFocus();
      });

      // Menu normally closes on Shift+Tab from its content. Focus the trigger while it stays open.
      await act(async () => trigger.focus());
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      await nativeUser.tab({ shift: true });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
      });
      await waitFor(() => {
        expect(screen.queryByRole('menu')).toBe(null);
      });
    });
  });

  describe('prop: disabled', () => {
    it('should render a disabled button', async () => {
      await render(
        <Menu.Root>
          <Menu.Trigger disabled />
        </Menu.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveProperty('disabled', true);
    });

    it('should not open the menu when clicked', async () => {
      const { user } = await render(
        <Menu.Root>
          <Menu.Trigger disabled />
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup />
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.queryByRole('menu', { hidden: false })).toBe(null);
    });
  });

  it('removes the hover mouseup listener when unmounted before mouseup', async () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    try {
      const { user, unmount } = await render(
        <Menu.Root>
          <Menu.Trigger delay={0} openOnHover>
            Open
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup />
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      addEventListenerSpy.mockClear();
      await user.hover(trigger);
      await screen.findByRole('menu', { hidden: false });

      const mouseUpListener = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'mouseup',
      )?.[1];
      expect(mouseUpListener).toBeTypeOf('function');

      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', mouseUpListener);
    } finally {
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    }
  });

  describe('keyboard navigation', () => {
    const cases = [
      { buttonType: 'native', key: 'ArrowUp' },
      { buttonType: 'native', key: 'ArrowDown' },
      { buttonType: 'non-native', key: 'ArrowUp' },
      { buttonType: 'non-native', key: 'ArrowDown' },
      { buttonType: 'non-native', key: 'Enter' },
      { buttonType: 'non-native', key: 'Space' },
    ] as const;

    it.each(cases)(
      'opens the menu when pressing $key on a $buttonType button',
      async ({ buttonType, key }) => {
        const { user } = await render(
          <Menu.Root>
            {buttonType === 'native' ? (
              <Menu.Trigger>Open</Menu.Trigger>
            ) : (
              <Menu.Trigger render={<span />} nativeButton={false}>
                Open
              </Menu.Trigger>
            )}
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item>1</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>,
        );

        const button = screen.getByRole('button', { name: 'Open' });
        expect(button.tagName).toBe(buttonType === 'native' ? 'BUTTON' : 'SPAN');
        await act(async () => {
          button.focus();
        });

        await user.keyboard(`[${key}]`);

        expect(screen.getByRole('menu', { hidden: false })).toBeInTheDocument();
      },
    );
  });

  describe('style hooks', () => {
    it('should have the data-popup-open and data-pressed attributes when open', async () => {
      await render(
        <Menu.Root>
          <Menu.Trigger />
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button');

      await act(async () => {
        trigger.click();
      });

      expect(trigger).toHaveAttribute('data-popup-open');
      expect(trigger).toHaveAttribute('data-pressed');
    });

    it('keeps the data-popup-open attribute and handle.isOpen when a controlled close is vetoed', async () => {
      const handle = Menu.createHandle();

      function TestCase() {
        const [open, setOpen] = React.useState(false);

        return (
          <React.Fragment>
            <Menu.Root
              handle={handle}
              open={open}
              onOpenChange={(nextOpen) => {
                if (nextOpen) {
                  setOpen(true);
                }
              }}
            >
              <Menu.Trigger>Actions</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item>Item</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
            <button type="button">Outside</button>
          </React.Fragment>
        );
      }

      const { user } = await render(<TestCase />);

      const trigger = screen.getByRole('button', { name: 'Actions' });
      await user.click(trigger);

      await screen.findByRole('menu');
      expect(trigger).toHaveAttribute('data-popup-open');
      expect(handle.isOpen).toBe(true);

      await user.click(screen.getByRole('button', { name: 'Outside' }));

      expect(screen.getByRole('menu')).toHaveAttribute('data-open');
      expect(trigger).toHaveAttribute('data-popup-open');
      expect(handle.isOpen).toBe(true);
    });
  });

  describe('prop: openOnHover', () => {
    const { clock, render: renderFakeTimers } = createRenderer();

    clock.withFakeTimers();

    let setOpen: (nextOpen: boolean) => void = () => {};

    function ControlledMenu(props: { keepMounted?: boolean; closeDelay?: number }) {
      const [isOpen, setIsOpen] = React.useState(false);
      setOpen = setIsOpen;
      return (
        <Menu.Root open={isOpen} onOpenChange={setIsOpen}>
          <Menu.Trigger openOnHover delay={100} closeDelay={props.closeDelay}>
            Open
          </Menu.Trigger>
          <Menu.Portal keepMounted={props.keepMounted}>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>Item</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    function hover(trigger: HTMLElement) {
      enterWithMouse(trigger);
      clock.tick(100);
    }

    async function closeThroughProp() {
      await act(async () => setOpen(false));
      await flushMicrotasks();
      expect(screen.queryByRole('menu')).toBe(null);
    }

    it.each([
      {
        name: 'a click',
        open(trigger: HTMLElement) {
          fireEvent.click(trigger);
        },
      },
      { name: 'a hover', open: hover },
      {
        name: 'a hover pinned by a click',
        open(trigger: HTMLElement) {
          hover(trigger);
          fireEvent.click(trigger);
        },
      },
    ])(
      'opens on hover after a menu opened by $name is closed through the `open` prop',
      async ({ open }) => {
        await renderFakeTimers(<ControlledMenu />);
        const trigger = screen.getByRole('button', { name: 'Open' });

        open(trigger);
        await flushMicrotasks();
        expect(screen.queryByRole('menu')).not.toBe(null);

        await closeThroughProp();

        fireEvent.mouseLeave(trigger);
        hover(trigger);
        await flushMicrotasks();

        expect(screen.queryByRole('menu')).not.toBe(null);
      },
    );

    it('does not open from a pointer that leaves before the delay once a click-opened menu is closed through the `open` prop', async () => {
      await renderFakeTimers(<ControlledMenu />);
      const trigger = screen.getByRole('button', { name: 'Open' });

      fireEvent.click(trigger);
      await flushMicrotasks();
      expect(screen.queryByRole('menu')).not.toBe(null);

      await closeThroughProp();

      fireEvent.mouseLeave(trigger);
      enterWithMouse(trigger);
      clock.tick(50);
      fireEvent.mouseLeave(trigger);
      clock.tick(100);
      await flushMicrotasks();

      expect(screen.queryByRole('menu')).toBe(null);
    });

    it('does not reopen a retained menu from a hover delay that was pending when a click opened it, once it is closed through the `open` prop', async () => {
      // A popup that unmounts on close disposes of the pending timer with it.
      await renderFakeTimers(<ControlledMenu keepMounted />);
      const trigger = screen.getByRole('button', { name: 'Open' });

      enterWithMouse(trigger);
      clock.tick(50);
      fireEvent.click(trigger);
      await flushMicrotasks();
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      await act(async () => setOpen(false));
      await flushMicrotasks();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      clock.tick(100);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    describe('with a closeDelay', () => {
      // Strict Mode remounts the popup, which disposes of the shared hover timers and hides the
      // leftover close timer this covers.
      const { clock: nonStrictClock, render: renderNonStrict } = createRenderer({ strict: false });

      nonStrictClock.withFakeTimers();

      it('does not close a menu reopened within the closeDelay after a controlled close while the pointer left the trigger', async () => {
        await renderNonStrict(<ControlledMenu closeDelay={500} />);
        const trigger = screen.getByRole('button', { name: 'Open' });

        enterWithMouse(trigger);
        fireEvent.click(trigger);
        await flushMicrotasks();
        expect(trigger).toHaveAttribute('aria-expanded', 'true');

        await act(async () => setOpen(false));
        await flushMicrotasks();
        expect(trigger).toHaveAttribute('aria-expanded', 'false');

        fireEvent.mouseLeave(trigger);
        nonStrictClock.tick(60);

        fireEvent.click(trigger);
        await flushMicrotasks();
        expect(trigger).toHaveAttribute('aria-expanded', 'true');

        nonStrictClock.tick(600);
        await flushMicrotasks();

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('impatient clicks with `openOnHover=true`', () => {
    const { clock, render: renderFakeTimers } = createRenderer();

    clock.withFakeTimers();

    it('does not close the menu if the user clicks too quickly', async () => {
      await renderFakeTimers(
        <Menu.Root>
          <Menu.Trigger delay={0} openOnHover />
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseMove(trigger);

      clock.tick(PATIENT_CLICK_THRESHOLD - 1);

      fireEvent.click(trigger);

      expect(trigger).toHaveAttribute('data-popup-open');
    });

    it('closes the menu if the user clicks patiently', async () => {
      await renderFakeTimers(
        <Menu.Root>
          <Menu.Trigger delay={0} openOnHover />
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup />
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);

      clock.tick(PATIENT_CLICK_THRESHOLD);

      fireEvent.click(trigger);

      expect(trigger).not.toHaveAttribute('data-popup-open');

      // Leaving the trigger afterwards doesn't reopen it.
      fireEvent.mouseLeave(trigger);

      expect(trigger).not.toHaveAttribute('data-popup-open');
    });

    it('sticks if the user clicks impatiently', async () => {
      await renderFakeTimers(
        <Menu.Root>
          <Menu.Trigger delay={0} openOnHover />
        </Menu.Root>,
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

    it('sticks when clicked before the hover delay completes', async () => {
      await renderFakeTimers(
        <Menu.Root>
          <Menu.Trigger openOnHover delay={300}>
            Open
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>Content</Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
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

    it('should keep the menu open when re-hovered and clicked within the patient threshold', async () => {
      await render(
        <Menu.Root>
          <Menu.Trigger openOnHover delay={100}>
            Open
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>Content</Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
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
    'keeps a hover-opened menu open when mouseup lands outside the trigger DOM but within its bounds',
    async () => {
      const { user } = await render(
        <Menu.Root>
          <Menu.Trigger openOnHover delay={0} style={{ width: 120, height: 40, display: 'block' }}>
            Open
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup />
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      await user.hover(trigger);
      expect(screen.queryByRole('menu')).not.toBe(null);

      const rect = trigger.getBoundingClientRect();
      fireEvent.mouseUp(document.body, {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      });

      expect(screen.queryByRole('menu')).not.toBe(null);
    },
  );

  describe('preventBaseUIHandler', () => {
    it('prevents opening the menu with a mouse when `preventBaseUIHandler` is called in onMouseDown', async () => {
      const { user } = await render(
        <Menu.Root>
          <Menu.Trigger onMouseDown={(event) => event.preventBaseUIHandler()} />
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup />
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.queryByRole('menu', { hidden: false })).toBe(null);
    });

    it('prevents opening the menu with keyboard when `preventBaseUIHandler` is called in onClick', async () => {
      const { user } = await render(
        <Menu.Root>
          <Menu.Trigger onClick={(event) => event.preventBaseUIHandler()} />
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup />
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const button = screen.getByRole('button');
      await act(async () => {
        button.focus();
      });

      await user.keyboard('[Enter]');

      expect(screen.queryByRole('menu', { hidden: false })).toBe(null);
    });
  });

  it('does not have role prop inside a Popover', async () => {
    await render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Menu.Root>
                <Menu.Trigger data-testid="menu-trigger" />
              </Menu.Root>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    const button = screen.getByTestId('menu-trigger');
    expect(button).not.toHaveAttribute('role');
  });

  it('has a role prop inside a Popover when not a native button', async () => {
    await render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Menu.Root>
                <Menu.Trigger data-testid="menu-trigger" render={<span />} nativeButton={false} />
              </Menu.Root>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    const button = screen.getByTestId('menu-trigger');
    expect(button).toHaveAttribute('role', 'button');
  });
});
