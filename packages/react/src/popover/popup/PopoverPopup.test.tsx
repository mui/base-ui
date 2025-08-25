import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Popover.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Popover.Root open>
          <Popover.Portal>
            <Popover.Positioner>{node}</Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );
    },
  }));

  it('should render the children', async () => {
    await render(
      <Popover.Root open>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    expect(screen.getByText('Content')).not.to.equal(null);
  });

  describe('prop: initialFocus', () => {
    it('should focus the first focusable element within the popup by default', async () => {
      const { getByText, getByTestId } = await render(
        <div>
          <input />
          <Popover.Root>
            <Popover.Trigger>Open</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup data-testid="popover">
                  <input data-testid="popover-input" />
                  <button>Close</button>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
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
            <Popover.Root>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup initialFocus={input2Ref}>
                    <input data-testid="input-1" />
                    <input data-testid="input-2" ref={input2Ref} />
                    <input data-testid="input-3" />
                    <button>Close</button>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
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

        const getRef = React.useCallback(() => input2Ref.current, []);

        return (
          <div>
            <input />
            <Popover.Root>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup initialFocus={getRef}>
                    <input data-testid="input-1" />
                    <input data-testid="input-2" ref={input2Ref} />
                    <input data-testid="input-3" />
                    <button>Close</button>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
            <input />
          </div>
        );
      }

      const { getByText, getByTestId, user } = await render(<TestComponent />);

      const trigger = getByText('Open');
      await user.click(trigger);

      await waitFor(() => {
        const input2 = getByTestId('input-2');
        expect(input2).to.toHaveFocus();
      });
    });

    it('should support element-returning function and no-op via null/void for initialFocus', async () => {
      function TestComponent() {
        const input2Ref = React.useRef<HTMLInputElement>(null);

        const getEl = React.useCallback((type: string) => {
          if (type === 'keyboard') {
            return input2Ref.current;
          }
          return undefined;
        }, []);

        return (
          <div>
            <Popover.Root>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popover" initialFocus={getEl}>
                    <input data-testid="input-1" />
                    <input data-testid="input-2" ref={input2Ref} />
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { getByText, getByTestId, user } = await render(<TestComponent />);

      const trigger = getByText('Open');
      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });

      await user.keyboard('{Escape}');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(getByTestId('input-2')).toHaveFocus();
      });
    });

    it('should not move focus when initialFocus is null', async () => {
      function TestComponent() {
        return (
          <div>
            <Popover.Root>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popover" initialFocus={null}>
                    <input data-testid="input-1" />
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { getByText, user } = await render(<TestComponent />);
      const trigger = getByText('Open');
      await user.click(trigger);
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('should not move focus when initialFocus returns null', async () => {
      function TestComponent() {
        return (
          <div>
            <Popover.Root>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popover" initialFocus={() => null}>
                    <input data-testid="input-1" />
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { getByText, user } = await render(<TestComponent />);
      const trigger = getByText('Open');
      await user.click(trigger);
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });
  });

  describe('prop: finalFocus', () => {
    it('should focus the trigger by default when closed', async () => {
      const { getByText } = await render(
        <div>
          <input />
          <Popover.Root>
            <Popover.Trigger>Open</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>
                  <Popover.Close>Close</Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
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
            <Popover.Root>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup finalFocus={inputRef}>
                    <Popover.Close>Close</Popover.Close>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
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

    it('should focus the element provided to `finalFocus` as a function when closed', async () => {
      function TestComponent() {
        const ref = React.useRef<HTMLInputElement>(null);
        const getRef = React.useCallback(() => ref.current, []);
        return (
          <div>
            <Popover.Root>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup finalFocus={getRef}>
                    <Popover.Close>Close</Popover.Close>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
            <input data-testid="input-to-focus" ref={ref} />
          </div>
        );
      }

      const { getByText, getByTestId, user } = await render(<TestComponent />);

      const trigger = getByText('Open');
      await user.click(trigger);

      const closeButton = getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(getByTestId('input-to-focus')).toHaveFocus();
      });
    });

    it('should not move focus when finalFocus is null', async () => {
      function TestComponent() {
        return (
          <div>
            <Popover.Root>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup finalFocus={null}>
                    <Popover.Close>Close</Popover.Close>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { getByText, user } = await render(<TestComponent />);
      const trigger = getByText('Open');

      await user.click(trigger);
      await user.click(getByText('Close'));

      await waitFor(() => {
        expect(trigger).not.toHaveFocus();
      });
    });

    it('should not move focus when finalFocus returns null', async () => {
      function TestComponent() {
        return (
          <div>
            <Popover.Root>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup finalFocus={() => null}>
                    <Popover.Close>Close</Popover.Close>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { getByText, user } = await render(<TestComponent />);
      const trigger = getByText('Open');

      await user.click(trigger);
      await user.click(getByText('Close'));

      await waitFor(() => {
        expect(trigger).not.toHaveFocus();
      });
    });

    it('should support element-returning function and no-op via null/void for finalFocus based on closeType', async () => {
      function TestComponent() {
        const inputRef = React.useRef<HTMLInputElement>(null);
        const getEl = React.useCallback((type: string) => {
          if (type === 'keyboard') {
            return inputRef.current;
          }
          return null;
        }, []);

        return (
          <div>
            <Popover.Root>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup finalFocus={getEl}>
                    <Popover.Close>Close</Popover.Close>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
            <input data-testid="final-input" ref={inputRef} />
          </div>
        );
      }

      const { getByText, getByTestId, user } = await render(<TestComponent />);

      const trigger = getByText('Open');

      // Close via pointer: should NOT move focus to final-input (no-op)
      await user.click(trigger);
      await user.click(getByText('Close'));
      await waitFor(() => {
        expect(getByTestId('final-input')).not.toHaveFocus();
      });
      await waitFor(() => {
        expect(trigger).not.toHaveFocus();
      });

      // Close via keyboard: should move focus to final-input
      await user.click(trigger);
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(getByTestId('final-input')).toHaveFocus();
      });
    });
  });
});
