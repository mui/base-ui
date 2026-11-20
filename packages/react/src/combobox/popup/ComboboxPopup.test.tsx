import { expect, describe, it, vi } from 'vitest';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';

describe('<Combobox.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Combobox.Root open>
          <Combobox.Portal>
            <Combobox.Positioner>{node}</Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );
    },
  }));

  it('exposes open state via data attributes mapping', async () => {
    await render(
      <Combobox.Root defaultOpen>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup data-testid="popup" />
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const popup = await screen.findByTestId('popup');
    expect(popup).toHaveAttribute('data-open');
  });

  it('sets role to presentation when input renders outside the popup', async () => {
    await render(
      <Combobox.Root defaultOpen items={['Apple']}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup data-testid="popup" />
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const popup = await screen.findByTestId('popup');
    await waitFor(() => {
      expect(popup).toHaveAttribute('role', 'presentation');
    });
  });

  it('sets role to dialog when input renders inside the popup', async () => {
    await render(
      <Combobox.Root defaultOpen items={['Apple']}>
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup data-testid="popup">
              <Combobox.Input />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const popup = await screen.findByTestId('popup');
    await waitFor(() => {
      expect(popup).toHaveAttribute('role', 'dialog');
    });
  });

  it('focuses the popup instead of its input when opened by touch', async () => {
    await render(
      <Combobox.Root>
        <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup data-testid="popup">
              <Combobox.Input data-testid="input" />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const trigger = screen.getByTestId('trigger');
    fireEvent.pointerDown(trigger, { pointerType: 'touch' });
    fireEvent.mouseDown(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('popup')).toHaveFocus();
    });
    expect(screen.getByTestId('input')).not.toHaveFocus();
  });

  it('honors initialFocus={false}', async () => {
    await render(
      <Combobox.Root>
        <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup initialFocus={false}>
              <Combobox.Input data-testid="input" />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const trigger = screen.getByTestId('trigger');
    trigger.focus();
    fireEvent.click(trigger);

    await screen.findByTestId('input');
    expect(trigger).toHaveFocus();
  });

  it('passes the close type of an item press to a finalFocus function', async () => {
    const finalFocus = vi.fn(() => false);

    const { user } = await render(
      <Combobox.Root>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup finalFocus={finalFocus}>
              <Combobox.List>
                <Combobox.Item value="a">a</Combobox.Item>
                <Combobox.Item value="b">b</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');

    await user.click(input);
    // user-event's synthetic clicks carry no pointer type, so the mouse press is dispatched
    // directly.
    const option = await screen.findByRole('option', { name: 'a' });
    fireEvent.pointerDown(option, { pointerType: 'mouse' });
    fireEvent.click(option, { detail: 1 });
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBe(null);
    });
    expect(finalFocus).toHaveBeenLastCalledWith('mouse');

    await act(async () => {
      input.focus();
    });
    await user.keyboard('{ArrowDown}');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBe(null);
    });
    expect(finalFocus).toHaveBeenLastCalledWith('keyboard');
  });

  it('returns focus to an explicitly provided element when the popup closes', async () => {
    function Test() {
      const finalFocusRef = React.useRef<HTMLButtonElement | null>(null);
      return (
        <div>
          <button ref={finalFocusRef} type="button">
            final focus
          </button>
          <Combobox.Root defaultOpen>
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup finalFocus={finalFocusRef}>
                  <Combobox.List>
                    <Combobox.Item value="a">a</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </div>
      );
    }

    const { user } = await render(<Test />);
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'final focus' })).toHaveFocus();
    });
  });

  describe('with the input outside the popup', () => {
    function OutsideInputCombobox(props: {
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
    }) {
      return (
        <div>
          <div data-testid="outside">outside</div>
          <Combobox.Root items={['Apple', 'Banana']} {...props}>
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    {(item: string) => (
                      <Combobox.Item key={item} value={item}>
                        {item}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                  <button type="button" onClick={() => props.onOpenChange?.(false)}>
                    Manage
                  </button>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </div>
      );
    }

    it('returns focus to the input when the popup closes while focus is inside it', async () => {
      const { user } = await render(<OutsideInputCombobox />);
      const input = screen.getByTestId('input');

      await user.click(input);
      await screen.findByRole('listbox');
      await user.tab();
      expect(screen.getByRole('button', { name: 'Manage' })).toHaveFocus();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).toBe(null);
      });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it('returns focus to the input when controlled state closes the popup from inside', async () => {
      function Controlled() {
        const [open, setOpen] = React.useState(false);
        return <OutsideInputCombobox open={open} onOpenChange={setOpen} />;
      }

      const { user } = await render(<Controlled />);
      const input = screen.getByTestId('input');

      await user.click(input);
      await screen.findByRole('listbox');
      await user.tab();
      expect(screen.getByRole('button', { name: 'Manage' })).toHaveFocus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).toBe(null);
      });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    // jsdom's `focus()` ignores `preventScroll`, so the focus manager never returns focus on an
    // outside press there and this test couldn't fail.
    it.skipIf(isJSDOM)(
      'does not focus the input when an outside press closes the popup while the input is focused',
      async () => {
        const { user } = await render(<OutsideInputCombobox />);
        const input = screen.getByTestId('input');

        await user.click(input);
        await screen.findByRole('listbox');
        expect(input).toHaveFocus();

        await user.click(screen.getByTestId('outside'));

        await waitFor(() => {
          expect(screen.queryByRole('listbox')).toBe(null);
        });
        await flushMicrotasks();
        expect(input).not.toHaveFocus();
      },
    );
  });
});
