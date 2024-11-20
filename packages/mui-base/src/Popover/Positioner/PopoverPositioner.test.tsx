import * as React from 'react';
import { Popover } from '@base-ui-components/react/Popover';
import { createRenderer, describeConformance } from '#test-utils';
import { screen, act, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';

describe('<Popover.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Popover.Root open animated={false}>
          {node}
        </Popover.Root>,
      );
    },
  }));

  describe('prop: keepMounted', () => {
    it('has inert attribute when closed', async () => {
      await render(
        <Popover.Root animated={false}>
          <Popover.Positioner keepMounted data-testid="positioner" />
        </Popover.Root>,
      );

      expect(screen.getByTestId('positioner')).to.have.attribute('inert');
    });

    it('does not have inert attribute when open', async () => {
      await render(
        <Popover.Root open animated={false}>
          <Popover.Positioner keepMounted data-testid="positioner" />
        </Popover.Root>,
      );

      expect(screen.getByTestId('positioner')).not.to.have.attribute('inert');
    });
  });

  describe('prop: initial focus', () => {
    it('should focus the first focusable element within the popup by default', async () => {
      const { getByText, getByTestId } = await render(
        <div>
          <input />
          <Popover.Root animated={false}>
            <Popover.Trigger>Open</Popover.Trigger>
            <Popover.Positioner>
              <Popover.Popup data-testid="popover">
                <input data-testid="popover-input" />
                <button>Close</button>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Root>
          <input />
        </div>,
      );

      const trigger = getByText('Open');
      await act(async () => {
        trigger.click();
      });

      await waitFor(() => {
        const innerInput = getByTestId('popover-input');
        expect(innerInput).to.toHaveFocus();
      });
    });

    it('should focus the element provided to `initialFocus` as a ref when open', async () => {
      function TestComponent() {
        const input2Ref = React.useRef<HTMLInputElement | null>(null);
        return (
          <div>
            <input />
            <Popover.Root animated={false}>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Positioner initialFocus={input2Ref}>
                <Popover.Popup>
                  <input data-testid="input-1" />
                  <input data-testid="input-2" ref={input2Ref} />
                  <input data-testid="input-3" />
                  <button>Close</button>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Root>
            <input />
          </div>
        );
      }

      const { getByText, getByTestId } = await render(<TestComponent />);

      const trigger = getByText('Open');
      await act(async () => {
        trigger.click();
      });

      await waitFor(() => {
        const input2 = getByTestId('input-2');
        expect(input2).to.toHaveFocus();
      });
    });

    it('should focus the element provided to `initialFocus` as a function when open', async () => {
      function TestComponent() {
        const input2Ref = React.useRef<HTMLInputElement>(null);

        const getRef = React.useCallback(() => input2Ref, []);

        return (
          <div>
            <input />
            <Popover.Root animated={false}>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Positioner initialFocus={getRef}>
                <Popover.Popup>
                  <input data-testid="input-1" />
                  <input data-testid="input-2" ref={input2Ref} />
                  <input data-testid="input-3" />
                  <button>Close</button>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Root>
            <input />
          </div>
        );
      }

      const { getByText, getByTestId } = await render(<TestComponent />);

      const trigger = getByText('Open');
      await act(async () => {
        trigger.click();
      });

      await waitFor(() => {
        const input2 = getByTestId('input-2');
        expect(input2).to.toHaveFocus();
      });
    });
  });

  describe('prop: final focus', () => {
    it('should focus the trigger by default when closed', async () => {
      const { getByText } = await render(
        <div>
          <input />
          <Popover.Root animated={false}>
            <Popover.Trigger>Open</Popover.Trigger>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Close>Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Root>
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
            <Popover.Root animated={false}>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Positioner finalFocus={inputRef}>
                <Popover.Popup>
                  <Popover.Close>Close</Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Root>
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
