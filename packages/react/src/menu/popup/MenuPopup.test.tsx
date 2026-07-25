import { expect, vi } from 'vitest';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, describeConformance } from '#test-utils';
import { act, fireEvent, waitFor, screen } from '@mui/internal-test-utils';
import { ToolbarRootContext } from '../../toolbar/root/ToolbarRootContext';

describe('<Menu.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Popup />, () => ({
    render: (node) => {
      return render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>{node}</Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));

  it('throws when rendered outside Menu.Positioner', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Menu.Root open>
            <Menu.Popup />
          </Menu.Root>,
        ),
      ).rejects.toThrow(
        'Base UI: MenuPositionerContext is missing. MenuPositioner parts must be placed within <Menu.Positioner>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('stops toolbar navigation keys without blocking ordinary key events', async () => {
    const onParentKeyDown = vi.fn();

    await render(
      <ToolbarRootContext.Provider value={{ disabled: false, orientation: 'horizontal' }}>
        <div onKeyDown={onParentKeyDown}>
          <Menu.Root>
            <Menu.Portal keepMounted>
              <Menu.Positioner>
                <Menu.Popup data-testid="popup" />
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </ToolbarRootContext.Provider>,
    );

    const popup = screen.getByTestId('popup');
    fireEvent(
      popup,
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }),
    );
    expect(onParentKeyDown).not.toHaveBeenCalled();

    fireEvent(popup, new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'F1' }));
    expect(onParentKeyDown).toHaveBeenCalled();
    expect(onParentKeyDown.mock.calls.every(([event]) => event.key === 'F1')).toBe(true);
  });

  describe('prop: finalFocus', () => {
    it('should focus the trigger by default when closed', async () => {
      await render(
        <div>
          <input />
          <Menu.Root>
            <Menu.Trigger>Open</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item>Close</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <input />
        </div>,
      );

      const trigger = screen.getByText('Open');
      await act(async () => {
        trigger.click();
      });

      const closeButton = screen.getByText('Close');
      await act(async () => {
        closeButton.click();
      });

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('should focus the element provided to the prop when closed', async () => {
      function TestComponent() {
        const inputRef = React.useRef<HTMLInputElement | null>(null);
        return (
          <div>
            <input />
            <Menu.Root>
              <Menu.Trigger>Open</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup finalFocus={inputRef}>
                    <Menu.Item>Close</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
            <input />
            <input data-testid="input-to-focus" ref={inputRef} />
            <input />
          </div>
        );
      }

      const { user } = await render(<TestComponent />);

      const trigger = screen.getByText('Open');
      await user.click(trigger);

      const closeButton = await screen.findByText('Close');
      await user.click(closeButton);

      const inputToFocus = screen.getByTestId('input-to-focus');

      await waitFor(() => {
        expect(inputToFocus).toHaveFocus();
      });
    });

    it('should focus the element provided to `finalFocus` as a function when closed', async () => {
      function TestComponent() {
        const ref = React.useRef<HTMLInputElement>(null);
        const getRef = React.useCallback(() => ref.current, []);
        return (
          <div>
            <Menu.Root>
              <Menu.Trigger>Open</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup finalFocus={getRef}>
                    <Menu.Item>Close</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
            <input data-testid="input-to-focus" ref={ref} />
          </div>
        );
      }

      const { user } = await render(<TestComponent />);

      const trigger = screen.getByText('Open');
      await user.click(trigger);

      const closeButton = await screen.findByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.getByTestId('input-to-focus')).toHaveFocus();
      });
    });

    it('should not move focus when finalFocus is false', async () => {
      function TestComponent() {
        return (
          <div>
            <Menu.Root>
              <Menu.Trigger>Open</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup finalFocus={false}>
                    <Menu.Item>Close</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        );
      }

      const { user } = await render(<TestComponent />);
      const trigger = screen.getByText('Open');

      await user.click(trigger);
      await user.click(await screen.findByText('Close'));

      await waitFor(() => {
        expect(trigger).not.toHaveFocus();
      });
    });

    it('should move focus to trigger when finalFocus returns true', async () => {
      function TestComponent() {
        return (
          <div>
            <Menu.Root>
              <Menu.Trigger>Open</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup finalFocus={() => true}>
                    <Menu.Item>Close</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        );
      }

      const { user } = await render(<TestComponent />);
      const trigger = screen.getByText('Open');

      await user.click(trigger);
      await user.click(await screen.findByText('Close'));

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('uses default behavior when finalFocus returns null', async () => {
      function TestComponent() {
        return (
          <div>
            <Menu.Root>
              <Menu.Trigger>Open</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup finalFocus={() => null}>
                    <Menu.Item>Close</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        );
      }

      const { user } = await render(<TestComponent />);
      const trigger = screen.getByText('Open');
      await user.click(trigger);
      await user.click(await screen.findByText('Close'));
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });
  });
});
