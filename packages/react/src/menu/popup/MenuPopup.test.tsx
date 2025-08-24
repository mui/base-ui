import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { expect } from 'chai';
import { createRenderer, describeConformance } from '#test-utils';
import { act, waitFor } from '@mui/internal-test-utils';

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

  describe('prop: finalFocus', () => {
    it('should focus the trigger by default when closed', async () => {
      const { getByText } = await render(
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

      const trigger = getByText('Open');
      await act(async () => {
        trigger.click();
      });

      const closeButton = getByText('Close');
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

      const { getByText, getByTestId } = await render(<TestComponent />);

      const trigger = getByText('Open');
      await act(async () => {
        trigger.click();
      });

      const closeButton = getByText('Close');
      await act(async () => {
        closeButton.click();
      });

      const inputToFocus = getByTestId('input-to-focus');

      await waitFor(() => {
        expect(inputToFocus).toHaveFocus();
      });
    });
  });

  describe('focus management', () => {
    it('should focus first focusable item when menu opened via keyboard and first item is disabled', async () => {
      const { getByRole, user } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item disabled>Disabled Item</Menu.Item>
                <Menu.Item>Focusable Item</Menu.Item>
                <Menu.Item>Another Item</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{Enter}');

      await waitFor(() => {
        const focusableItem = getByRole('menuitem', { name: 'Focusable Item' });
        expect(focusableItem).toHaveFocus();
      });
    });

    it('should skip disabled items during arrow key navigation', async () => {
      const { getByRole, user } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>First Item</Menu.Item>
                <Menu.Item disabled>Disabled Item</Menu.Item>
                <Menu.Item>Third Item</Menu.Item>
                <Menu.Item disabled>Another Disabled</Menu.Item>
                <Menu.Item>Last Item</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      await waitFor(() => {
        getByRole('menu');
      });

      const firstItem = getByRole('menuitem', { name: 'First Item' });
      const thirdItem = getByRole('menuitem', { name: 'Third Item' });
      const lastItem = getByRole('menuitem', { name: 'Last Item' });

      await user.keyboard('{ArrowDown}');
      await waitFor(() => {
        expect(firstItem).toHaveFocus();
      });

      await user.keyboard('{ArrowDown}');
      await waitFor(() => {
        expect(thirdItem).toHaveFocus();
      });

      await user.keyboard('{ArrowDown}');
      await waitFor(() => {
        expect(lastItem).toHaveFocus();
      });

      await user.keyboard('{ArrowUp}');
      await waitFor(() => {
        expect(thirdItem).toHaveFocus();
      });

      await user.keyboard('{ArrowUp}');
      await waitFor(() => {
        expect(firstItem).toHaveFocus();
      });
    });
  });
});
