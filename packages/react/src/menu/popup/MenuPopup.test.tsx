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
});
