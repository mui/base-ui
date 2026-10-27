import { expect, describe, it, vi } from 'vitest';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';

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

  describe('data-instant', () => {
    function TestCombobox() {
      return (
        <Combobox.Root items={['Apple', 'Banana']}>
          <Combobox.Input data-testid="input" />
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
          <Combobox.Portal keepMounted>
            <Combobox.Positioner>
              <Combobox.Popup data-testid="popup">
                <Combobox.List>
                  {(item: string) => (
                    <Combobox.Item key={item} value={item}>
                      {item}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      );
    }

    it('is "dismiss" when Escape closes the popup', async () => {
      const { user } = await render(<TestCombobox />);

      await user.click(screen.getByTestId('input'));
      expect(screen.getByTestId('popup')).toHaveAttribute('data-open');
      expect(screen.getByTestId('popup')).not.toHaveAttribute('data-instant');

      await user.keyboard('{Escape}');

      expect(screen.getByTestId('popup')).not.toHaveAttribute('data-open');
      expect(screen.getByTestId('popup')).toHaveAttribute('data-instant', 'dismiss');
    });

    it('is "click" when a keyboard press on the trigger opens the popup', async () => {
      const { user } = await render(<TestCombobox />);

      await act(async () => {
        screen.getByTestId('trigger').focus();
      });
      await user.keyboard('{Enter}');

      expect(screen.getByTestId('popup')).toHaveAttribute('data-open');
      expect(screen.getByTestId('popup')).toHaveAttribute('data-instant', 'click');
    });

    it('is "click" when Enter selects the highlighted item', async () => {
      const { user } = await render(<TestCombobox />);

      await user.click(screen.getByTestId('input'));
      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('popup')).not.toHaveAttribute('data-instant');

      await user.keyboard('{Enter}');

      expect(screen.getByTestId('input')).toHaveValue('Apple');
      expect(screen.getByTestId('popup')).not.toHaveAttribute('data-open');
      expect(screen.getByTestId('popup')).toHaveAttribute('data-instant', 'click');
    });

    it('is removed when a pointer press opens the popup after a dismissal', async () => {
      const { user } = await render(<TestCombobox />);

      await user.click(screen.getByTestId('input'));
      await user.keyboard('{Escape}');
      expect(screen.getByTestId('popup')).toHaveAttribute('data-instant', 'dismiss');

      await user.click(screen.getByTestId('trigger'));

      expect(screen.getByTestId('popup')).toHaveAttribute('data-open');
      expect(screen.getByTestId('popup')).not.toHaveAttribute('data-instant');
    });
  });
});
