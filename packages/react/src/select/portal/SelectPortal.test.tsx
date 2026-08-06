import { expect } from 'vitest';
import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, wait } from '#test-utils';

describe('<Select.Portal />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  describeConformance(<Select.Portal />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Select.Root open>{node}</Select.Root>);
    },
  }));

  describe('prop: keepMounted', () => {
    function App(props: { keepMounted?: boolean }) {
      return (
        <div>
          <Select.Root>
            <Select.Trigger data-testid="trigger">
              <Select.Value data-testid="value" />
            </Select.Trigger>
            <Select.Portal keepMounted={props.keepMounted}>
              <Select.Positioner data-testid="positioner">
                <Select.Popup>
                  <Select.Item value="apple">apple</Select.Item>
                  <Select.Item value="banana">banana</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <button data-testid="outside">outside</button>
        </div>
      );
    }

    it('removes the popup from the DOM once the select is closed and the trigger is blurred', async () => {
      const { user } = await render(<App />);
      const trigger = screen.getByTestId('trigger');

      expect(screen.queryByTestId('positioner')).not.toBeInTheDocument();

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByTestId('positioner')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });

      await act(async () => {
        screen.getByTestId('outside').focus();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('positioner')).not.toBeInTheDocument();
      });
    });

    it('keeps the popup mounted while the closed trigger stays focused, then removes it on blur', async () => {
      const { user } = await render(<App />);
      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByTestId('positioner')).toBeInTheDocument();
      });

      const positionerBeforeClose = screen.getByTestId('positioner');

      // Selecting with the keyboard closes the popup and returns focus to the trigger, so the
      // item DOM must stay available for closed-trigger typeahead.
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });

      // Let the close settle before asserting the popup is still there. The node identity
      // check guards against a transient unmount/remount cycle during the close.
      await wait(50);
      expect(screen.getByTestId('positioner')).toBe(positionerBeforeClose);
      expect(screen.getByTestId('positioner')).toHaveAttribute('hidden');

      await act(async () => {
        screen.getByTestId('outside').focus();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('positioner')).not.toBeInTheDocument();
      });
    });

    it('keeps the popup mounted when the select is closed and blurred', async () => {
      const { user } = await render(<App keepMounted />);
      const trigger = screen.getByTestId('trigger');

      expect(screen.getByTestId('positioner')).toHaveAttribute('hidden');

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByTestId('positioner')).not.toHaveAttribute('hidden');
      });

      await user.keyboard('{Escape}');
      await act(async () => {
        screen.getByTestId('outside').focus();
      });

      await waitFor(() => {
        expect(screen.getByTestId('positioner')).toHaveAttribute('hidden');
      });
      expect(screen.getByTestId('positioner')).toBeInTheDocument();
    });

    it('commits closed-trigger typeahead after an open, select and close cycle', async () => {
      const { user } = await render(<App />);
      const trigger = screen.getByTestId('trigger');
      const value = screen.getByTestId('value');

      await user.click(trigger);
      await user.click(await screen.findByRole('option', { name: 'apple' }));

      await waitFor(() => {
        expect(value).toHaveTextContent('apple');
      });

      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('b');

      await waitFor(() => {
        expect(value).toHaveTextContent('banana');
      });
    });

    it('preserves the selected value across an unmounted close and reopen', async () => {
      const { user } = await render(<App />);
      const trigger = screen.getByTestId('trigger');
      const value = screen.getByTestId('value');

      await user.click(trigger);
      await user.click(await screen.findByRole('option', { name: 'banana' }));

      await waitFor(() => {
        expect(value).toHaveTextContent('banana');
      });

      await act(async () => {
        screen.getByTestId('outside').focus();
      });
      await waitFor(() => {
        expect(screen.queryByTestId('positioner')).not.toBeInTheDocument();
      });

      expect(value).toHaveTextContent('banana');

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'banana' })).toHaveAttribute('data-selected');
      });
      expect(value).toHaveTextContent('banana');
    });

    // The animation handbook's Motion select demo conditionally renders a `keepMounted`
    // portal once the popup has been opened. Motion's `initial={false}` variant relies on
    // the popup element persisting across close and reopen.
    it('keeps the same popup element across close, blur and reopen when conditionally rendered with keepMounted', async () => {
      function ControlledApp() {
        const [open, setOpen] = React.useState(false);
        const [everMounted, setEverMounted] = React.useState(false);

        const positionerRef = React.useCallback((element: HTMLElement | null) => {
          if (element) {
            setEverMounted(true);
          }
        }, []);

        return (
          <div>
            <Select.Root open={open} onOpenChange={setOpen}>
              <Select.Trigger data-testid="trigger">
                <Select.Value />
              </Select.Trigger>
              {(open || everMounted) && (
                <Select.Portal keepMounted>
                  <Select.Positioner data-testid="positioner" ref={positionerRef}>
                    <Select.Popup>
                      <Select.Item value="apple">apple</Select.Item>
                      <Select.Item value="banana">banana</Select.Item>
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              )}
            </Select.Root>
            <button data-testid="outside">outside</button>
          </div>
        );
      }

      const { user } = await render(<ControlledApp />);
      const trigger = screen.getByTestId('trigger');

      expect(screen.queryByTestId('positioner')).not.toBeInTheDocument();

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByTestId('positioner')).toBeInTheDocument();
      });

      const positioner = screen.getByTestId('positioner');

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });

      await act(async () => {
        screen.getByTestId('outside').focus();
      });

      // Let the deferred force-mount release settle: `keepMounted` must keep the node alive.
      await wait(50);
      expect(screen.getByTestId('positioner')).toBe(positioner);

      await user.click(trigger);
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
      expect(screen.getByTestId('positioner')).toBe(positioner);
    });
  });
});
