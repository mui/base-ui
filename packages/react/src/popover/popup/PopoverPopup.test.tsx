import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { Toolbar } from '@base-ui/react/toolbar';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM, popupFocusPropsTests } from '#test-utils';

describe('<Popover.Popup />', () => {
  const { render, clock } = createRenderer();

  describeConformance(<Popover.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>{node}</Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );
    },
  }));

  it('throws a descriptive error when rendered outside <Popover.Root>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Popover.Popup />)).rejects.toThrow(
        'Base UI: PopoverRootContext is missing. Popover parts must be placed within <Popover.Root>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('throws a descriptive error when rendered outside <Popover.Positioner>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Popover.Root open>
            <Popover.Portal>
              <Popover.Popup />
            </Popover.Portal>
          </Popover.Root>,
        ),
      ).rejects.toThrow(
        'Base UI: PopoverPositionerContext is missing. PopoverPositioner parts must be placed within <Popover.Positioner>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('should render the children', async () => {
    await render(
      <Popover.Root open>
        <Popover.Trigger>Trigger</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    expect(screen.getByText('Content')).not.toBe(null);
  });

  popupFocusPropsTests({
    render,
    createComponent: ({ children, ...focusProps }) => (
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup {...focusProps}>
              {children}
              <Popover.Close>Close</Popover.Close>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ),
  });

  it.skipIf(isJSDOM)('focuses the popup when the active element becomes display:none', async () => {
    function TestComponent() {
      const [hidden, setHidden] = React.useState(false);

      return (
        <Popover.Root open>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup data-testid="popup">
                <button
                  data-testid="hide-button"
                  style={{ display: hidden ? 'none' : undefined }}
                  onClick={() => setHidden(true)}
                >
                  Hide
                </button>
                <input />
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    const { user } = await render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('hide-button')).toHaveFocus();
    });

    await user.click(screen.getByTestId('hide-button'));

    await waitFor(() => {
      expect(screen.getByTestId('popup')).toHaveFocus();
    });
  });

  describe('openOnHover: delay + click', () => {
    clock.withFakeTimers();

    it('returns focus to the trigger if opened by click before the hover delay completes', async () => {
      await render(
        <Popover.Root>
          <Popover.Trigger openOnHover delay={300}>
            Open
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Close>Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByText('Open');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(100);

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(screen.getByText('Close')).not.toBe(null);

      clock.tick(1000);
      await flushMicrotasks();

      fireEvent.click(screen.getByText('Close'));
      await flushMicrotasks();

      expect(trigger).toHaveFocus();
    });
  });

  describe('inside a toolbar', () => {
    function ToolbarPopover({ children }: { children: React.ReactNode }) {
      return (
        <Toolbar.Root>
          <Toolbar.Button>First</Toolbar.Button>
          <Popover.Root>
            <Toolbar.Button render={<Popover.Trigger />}>Open</Toolbar.Button>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>{children}</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <Toolbar.Button>Last</Toolbar.Button>
        </Toolbar.Root>
      );
    }

    // The popup is portaled but still bubbles React events up to `Toolbar.Root`, whose composite
    // handler would move the roving highlight and pull focus out of the open popup.
    it('does not relay composite keys from the popup to the toolbar', async () => {
      const { user } = await render(
        <ToolbarPopover>
          <button type="button">Inside</button>
        </ToolbarPopover>,
      );

      // The toolbar itself still navigates with the same key, so a passing assertion below can't
      // come from an inert toolbar.
      await user.keyboard('[Tab]');
      expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
      await user.keyboard('[ArrowRight]');
      const trigger = screen.getByRole('button', { name: 'Open' });
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });

      await user.keyboard('[Enter]');
      const insideButton = screen.getByRole('button', { name: 'Inside' });
      await waitFor(() => {
        expect(insideButton).toHaveFocus();
      });

      await user.keyboard('[ArrowRight]');
      await flushMicrotasks();

      expect(insideButton).toHaveFocus();
      expect(screen.getByRole('button', { name: 'Last' })).not.toHaveFocus();
    });

    // Shielding the toolbar must not disable the keys inside the popup: only propagation is
    // stopped, so native caret movement in popup content keeps working.
    it('keeps composite keys working inside the popup content', async () => {
      const { user } = await render(
        <ToolbarPopover>
          <input defaultValue="ab" />
        </ToolbarPopover>,
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await act(async () => {
        input.setSelectionRange(0, 0);
      });
      await user.keyboard('[ArrowRight]');

      expect(input.selectionStart).toBe(1);
      expect(screen.getByRole('button', { name: 'Last' })).not.toHaveFocus();
    });
  });
});
