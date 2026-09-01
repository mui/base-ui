import { expect, vi } from 'vitest';
import type { CDPSession } from '@vitest/browser-playwright';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { Field } from '@base-ui/react/field';
import { REASONS } from '../../internals/reasons';

function PopupCombobox() {
  const items = ['apple', 'banana', 'cherry'];
  return (
    <Combobox.Root items={items}>
      <Combobox.Trigger data-testid="trigger">
        <Combobox.Value placeholder="Select a fruit" />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup aria-label="Fruits">
            <Combobox.Input data-testid="input" />
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

describe('<Combobox.Input />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Input />, () => ({
    refInstanceof: window.HTMLInputElement,
    render(node) {
      return render(<Combobox.Root>{node}</Combobox.Root>);
    },
  }));

  describe('prop: disabled', () => {
    it('should render aria-disabled attribute when disabled', async () => {
      await render(
        <Combobox.Root>
          <Combobox.Input disabled data-testid="input" />
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('disabled');
    });

    it('should inherit disabled state from ComboboxRoot', async () => {
      await render(
        <Combobox.Root disabled>
          <Combobox.Input data-testid="input" />
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('disabled');
    });

    it('should inherit disabled state from Field.Root', async () => {
      await render(
        <Field.Root disabled>
          <Combobox.Root>
            <Combobox.Input data-testid="input" />
          </Combobox.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('disabled');
    });

    it('should not open popup when disabled', async () => {
      const { user } = await render(
        <Combobox.Root>
          <Combobox.Input disabled data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
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

      expect(screen.queryByRole('listbox')).toBe(null);
    });

    it('should prioritize local disabled over root disabled', async () => {
      await render(
        <Combobox.Root disabled={false}>
          <Combobox.Input disabled data-testid="input" />
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('disabled');
    });
  });

  describe('rendering as a different element', () => {
    // The injected `type: 'text'` was removed so the input can be rendered as a
    // `<textarea>` without receiving an attribute that element does not support.
    it('renders as a <textarea> without an invalid `type` attribute and stays editable', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana']}>
          <Combobox.Input data-testid="input" render={<textarea />} />
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
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId<HTMLTextAreaElement>('input');
      expect(input.tagName).toBe('TEXTAREA');
      expect(input).not.toHaveAttribute('type');

      await user.type(input, 'app');
      expect(input.value).toBe('app');
    });

    // A non-input control only carries the combobox ARIA attributes while the popup
    // is open; a native <input> exposes them even when closed.
    it('applies combobox aria attributes to a <textarea> only while the popup is open', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana']}>
          <Combobox.Input data-testid="input" render={<textarea />} />
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
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');

      // Closed: combobox semantics are not exposed on a non-input control.
      expect(input).not.toHaveAttribute('role', 'combobox');
      expect(input).not.toHaveAttribute('aria-expanded');
      expect(input).not.toHaveAttribute('aria-controls');

      await user.type(input, 'a');
      const listbox = await screen.findByRole('listbox');

      // Open: the combobox ARIA contract is applied to the textarea.
      expect(input).toHaveAttribute('role', 'combobox');
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(input).toHaveAttribute('aria-controls', listbox.id);
    });

    // An inline list is exposed for as long as it's rendered, so a non-input control carries
    // the combobox ARIA attributes from the start rather than waiting for the open state.
    it('applies combobox aria attributes to an inline <textarea> before it is interacted with', async () => {
      await render(
        <Combobox.Root inline items={['apple', 'banana']}>
          <Combobox.Input data-testid="input" render={<textarea />} />
          <Combobox.List>
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      const listbox = screen.getByRole('listbox');

      expect(input).toHaveAttribute('role', 'combobox');
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(input).toHaveAttribute('aria-controls', listbox.id);
      expect(input).toHaveAttribute('aria-haspopup', 'listbox');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
    });
  });

  describe('prop: readOnly', () => {
    it('should render aria-readonly and readonly attributes when readOnly', async () => {
      await render(
        <Combobox.Root readOnly>
          <Combobox.Input data-testid="input" />
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-readonly', 'true');
      expect(input).toHaveAttribute('readonly');
    });

    it('should open popup when readOnly', async () => {
      const { user } = await render(
        <Combobox.Root readOnly>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
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

      expect(await screen.findByRole('listbox')).toHaveAttribute('aria-readonly', 'true');
    });

    it('should not change the input value when typing while readOnly', async () => {
      const onInputValueChange = vi.fn();
      const { user } = await render(
        <Combobox.Root readOnly onInputValueChange={onInputValueChange}>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
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

      await user.type(input, 'a');

      expect(input).toHaveValue('');
      expect(onInputValueChange).not.toHaveBeenCalled();
    });

    it('allows interactions when readOnly={false}', async () => {
      const { user } = await render(
        <Combobox.Root readOnly={false}>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="a">a</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.toBe(null));

      await waitFor(() => {
        screen.getByRole('option', { name: 'a' });
      });
      await user.click(screen.getByRole('option', { name: 'a' }));
      expect(input).toHaveValue('a');
    });
  });

  describe('prop: required', () => {
    it('sets aria-required attribute when required', async () => {
      await render(
        <Combobox.Root required>
          <Combobox.Input data-testid="input" />
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('onOpenChange reason', () => {
    it('fires with reason input-press when Input is clicked', async () => {
      const onOpenChange = vi.fn();

      const { user } = await render(
        <Combobox.Root items={['apple', 'banana']} onOpenChange={onOpenChange}>
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
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);

      expect(onOpenChange.mock.calls.length).toBeGreaterThan(0);
      expect(onOpenChange.mock.lastCall?.[0]).toBe(true);
      expect(onOpenChange.mock.lastCall?.[1].reason).toBe(REASONS.inputPress);
    });
  });

  describe('interaction behavior', () => {
    it('clears selected value when input text is cleared (single selection)', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana']} defaultValue="apple">
          <Combobox.Input />
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
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      expect(input.value).toBe('apple');

      await user.clear(input);

      expect(input.value).toBe('');

      await user.type(input, 'a');
      await waitFor(() => expect(screen.getByRole('listbox')).not.toBe(null));

      const options = screen.getAllByRole('option');
      options.forEach((opt) => {
        expect(opt).not.toHaveAttribute('aria-selected', 'true');
      });
    });

    it('should open popup on typing when enabled', async () => {
      const { user } = await render(
        <Combobox.Root>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="apple">apple</Combobox.Item>
                  <Combobox.Item value="banana">banana</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.type(input, 'a');

      expect(screen.getByRole('listbox')).not.toBe(null);
    });

    it('should handle multiple selection with chips when disabled', async () => {
      const { user } = await render(
        <Combobox.Root multiple disabled defaultValue={['apple']}>
          <Combobox.Input data-testid="input" />
          <Combobox.Chips>
            <Combobox.Chip data-testid="chip">
              apple
              <Combobox.ChipRemove data-testid="remove" />
            </Combobox.Chip>
          </Combobox.Chips>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="apple">apple</Combobox.Item>
                  <Combobox.Item value="banana">banana</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      const chip = screen.getByTestId('chip');
      const remove = screen.getByTestId('remove');

      expect(input).toHaveAttribute('disabled');
      expect(chip).toHaveAttribute('aria-disabled', 'true');
      expect(remove).toHaveAttribute('aria-disabled', 'true');

      await user.type(input, '{backspace}');
      expect(screen.getByTestId('chip')).not.toBe(null);
    });

    it('should handle multiple selection with chips when readOnly', async () => {
      const { user } = await render(
        <Combobox.Root multiple readOnly defaultValue={['apple']}>
          <Combobox.Input data-testid="input" />
          <Combobox.Chips>
            <Combobox.Chip data-testid="chip">
              apple
              <Combobox.ChipRemove data-testid="remove" />
            </Combobox.Chip>
          </Combobox.Chips>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="apple">apple</Combobox.Item>
                  <Combobox.Item value="banana">banana</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      const chip = screen.getByTestId('chip');

      expect(input).toHaveAttribute('aria-readonly', 'true');
      expect(chip).toHaveAttribute('aria-readonly', 'true');

      await user.type(input, '{backspace}');
      expect(screen.getByTestId('chip')).not.toBe(null);
    });

    it('should move focus to clear button when pressing Escape and popup is closed', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana']} defaultValue="apple">
          <Combobox.Input data-testid="input" />
          <Combobox.Clear data-testid="clear" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="apple">apple</Combobox.Item>
                  <Combobox.Item value="banana">banana</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      input.focus();
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(input.value).toBe('');
      });

      await user.type(input, 'a');

      await waitFor(() => {
        expect(screen.getByRole('listbox')).not.toBe(null);
      });
      await user.click(screen.getByRole('option', { name: 'apple' }));

      await user.type(input, 'a');
      await waitFor(() => {
        expect(screen.getByRole('listbox')).not.toBe(null);
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(input.value).toBe('apple');
      });
      expect(screen.queryByRole('listbox')).toBe(null);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('pressing Home moves caret to start', async () => {
      const { user } = await render(
        <Combobox.Root>
          <Combobox.Input />
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      input.focus();
      await user.type(input, 'banana');
      expect(input.value).toBe('banana');

      await user.keyboard('{Home}');

      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(0);
    });

    it('pressing End moves caret to end', async () => {
      const { user } = await render(
        <Combobox.Root>
          <Combobox.Input />
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      input.focus();
      await user.type(input, 'apple');
      expect(input.value).toBe('apple');

      await user.keyboard('{End}');

      expect(input.selectionStart).toBe(input.value.length);
      expect(input.selectionEnd).toBe(input.value.length);
    });

    // `banana` sits between `apple` and `cherry`, so a jump in either direction fails.
    it.each([
      ['Shift', 'Home'],
      ['Shift', 'End'],
      ['Control', 'Home'],
      ['Control', 'End'],
    ])(
      'does not move the highlight when %s+%s is pressed inside the popup',
      async (modifier, key) => {
        const { user } = await render(<PopupCombobox />);

        await user.click(screen.getByTestId('trigger'));
        const input = await screen.findByTestId('input');
        await waitFor(() => expect(input).toHaveFocus());

        await user.keyboard('{ArrowDown}{ArrowDown}');

        const banana = screen.getByRole('option', { name: 'banana' });
        await waitFor(() => expect(banana).toHaveAttribute('data-highlighted'));

        await user.keyboard(`{${modifier}>}{${key}}{/${modifier}}`);

        expect(banana).toHaveAttribute('data-highlighted');
      },
    );

    // Unmodified Home/End belong to the caret: the input handles them itself and stops
    // the event, so the list highlight must stay put.
    it('moves the caret without moving the highlight when Home is pressed inside the popup', async () => {
      const { user } = await render(<PopupCombobox />);

      await user.click(screen.getByTestId('trigger'));
      const input = (await screen.findByTestId('input')) as HTMLInputElement;
      await waitFor(() => expect(input).toHaveFocus());

      await user.type(input, 'an');
      await user.keyboard('{ArrowDown}');

      const banana = screen.getByRole('option', { name: 'banana' });
      await waitFor(() => expect(banana).toHaveAttribute('data-highlighted'));

      await user.keyboard('{Home}');

      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(0);
      expect(banana).toHaveAttribute('data-highlighted');
    });

    it('moves the caret without moving the highlight when End is pressed inside the popup', async () => {
      const { user } = await render(<PopupCombobox />);

      await user.click(screen.getByTestId('trigger'));
      const input = (await screen.findByTestId('input')) as HTMLInputElement;
      await waitFor(() => expect(input).toHaveFocus());

      await user.type(input, 'an');
      await user.keyboard('{ArrowDown}');

      const banana = screen.getByRole('option', { name: 'banana' });
      await waitFor(() => expect(banana).toHaveAttribute('data-highlighted'));

      input.setSelectionRange(0, 0);

      await user.keyboard('{End}');

      expect(input.selectionStart).toBe(input.value.length);
      expect(input.selectionEnd).toBe(input.value.length);
      expect(banana).toHaveAttribute('data-highlighted');
    });

    // The native caret/selection behavior only survives if the key is neither
    // `preventDefault()`-ed nor stopped before it leaves the component.
    it.each(['Home', 'End'])('lets Shift+%s reach the browser inside the popup', async (key) => {
      const { user } = await render(<PopupCombobox />);

      await user.click(screen.getByTestId('trigger'));
      const input = await screen.findByTestId('input');
      await waitFor(() => expect(input).toHaveFocus());

      const seen: boolean[] = [];
      function handleKeyDown(event: KeyboardEvent) {
        if (event.key === key) {
          seen.push(event.defaultPrevented);
        }
      }

      document.addEventListener('keydown', handleKeyDown);
      try {
        await user.keyboard(`{Shift>}{${key}}{/Shift}`);
      } finally {
        document.removeEventListener('keydown', handleKeyDown);
      }

      expect(seen).toEqual([false]);
    });

    // `user-event` emulates Home/End by collapsing the caret, so the selection outcome
    // this fix exists for can only be asserted with real browser key events.
    it.skipIf(isJSDOM).each([
      ['Home', 36],
      ['End', 35],
    ])('extends the text selection with Shift+%s inside the popup', async (key, keyCode) => {
      const { user } = await render(<PopupCombobox />);

      await user.click(screen.getByTestId('trigger'));
      const input = (await screen.findByTestId('input')) as HTMLInputElement;
      await waitFor(() => expect(input).toHaveFocus());

      await user.type(input, 'an');
      await screen.findByRole('option', { name: 'banana' });

      if (key === 'End') {
        input.setSelectionRange(0, 0);
      }

      const { cdp } = await import('vitest/browser');
      const session = cdp() as CDPSession;
      const event = {
        windowsVirtualKeyCode: keyCode,
        nativeVirtualKeyCode: keyCode,
        key,
        code: key,
        modifiers: 8,
      };

      await act(async () => {
        await session.send('Input.dispatchKeyEvent', { ...event, type: 'rawKeyDown' });
        await session.send('Input.dispatchKeyEvent', { ...event, type: 'keyUp' });
      });

      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(input.value.length);
    });

    it.skipIf(isJSDOM)(
      'scrolls to the start and end when pressing Home/End on overflowing input',
      async () => {
        const { user } = await render(
          <Combobox.Root>
            <Combobox.Input style={{ width: 64, fontSize: 20 }} />
          </Combobox.Root>,
        );

        const input = screen.getByRole<HTMLInputElement>('combobox');
        input.focus();

        await user.type(input, 'this is a very long combobox value');

        expect(input.scrollWidth).toBeGreaterThan(input.clientWidth);

        const expectedScroll = input.scrollWidth - input.clientWidth;

        expect(expectedScroll).toBeGreaterThan(0);

        input.scrollLeft = expectedScroll;
        input.setSelectionRange(input.value.length, input.value.length);

        await user.keyboard('{Home}');
        expect(input.selectionStart).toBe(0);
        expect(input.selectionEnd).toBe(0);
        expect(input.scrollLeft).toBe(0);

        await user.keyboard('{End}');
        expect(input.selectionStart).toBe(input.value.length);
        expect(input.selectionEnd).toBe(input.value.length);
        expect(Math.abs(input.scrollLeft - expectedScroll)).toBeLessThanOrEqual(2);
      },
    );

    it('preserves caret position when controlled and inserting in the middle', async () => {
      function Controlled() {
        const [value, setValue] = React.useState('');
        return (
          <Combobox.Root inputValue={value} onInputValueChange={setValue}>
            <Combobox.Input />
          </Combobox.Root>
        );
      }

      const { user } = await render(<Controlled />);

      const input = screen.getByRole<HTMLInputElement>('combobox');

      await user.type(input, 'abcd');
      expect(input.value).toBe('abcd');

      // Move caret left twice to position after "ab"
      await user.keyboard('{ArrowLeft}{ArrowLeft}');
      expect(input.selectionStart).toBe(2);
      expect(input.selectionEnd).toBe(2);

      await user.keyboard('xxx');
      expect(input.value).toBe('abxxxcd');
      expect(input.selectionStart).toBe(5);
      expect(input.selectionEnd).toBe(5);

      await user.keyboard('y');
      expect(input.value).toBe('abxxxycd');
      expect(input.selectionStart).toBe(6);
      expect(input.selectionEnd).toBe(6);
    });

    it('navigates an existing chip highlight when focus returns to the input', async () => {
      const { user } = await render(
        <Combobox.Root multiple defaultValue={['apple', 'banana', 'cherry']}>
          <Combobox.Chips>
            <Combobox.Chip data-testid="chip-apple">apple</Combobox.Chip>
            <Combobox.Chip data-testid="chip-banana">banana</Combobox.Chip>
            <Combobox.Chip data-testid="chip-cherry">cherry</Combobox.Chip>
            <Combobox.Input data-testid="input" />
          </Combobox.Chips>
        </Combobox.Root>,
      );

      const input = screen.getByTestId<HTMLInputElement>('input');
      const apple = screen.getByTestId('chip-apple');
      const banana = screen.getByTestId('chip-banana');
      const cherry = screen.getByTestId('chip-cherry');

      input.focus();
      input.setSelectionRange(0, 0);
      await user.keyboard('{ArrowLeft}');
      expect(cherry).toHaveFocus();

      input.focus();
      await user.keyboard('{ArrowLeft}');
      expect(banana).toHaveFocus();

      input.focus();
      await user.keyboard('{ArrowRight}');
      expect(cherry).toHaveFocus();

      input.focus();
      await user.keyboard('{ArrowRight}');
      expect(input).toHaveFocus();

      input.setSelectionRange(0, 0);
      await user.keyboard('{ArrowLeft}');
      input.focus();
      await user.keyboard('{ArrowLeft}');
      input.focus();
      await user.keyboard('{ArrowLeft}');
      expect(apple).toHaveFocus();

      input.focus();
      await user.keyboard('{ArrowLeft}');
      expect(input).toHaveFocus();

      input.setSelectionRange(0, 0);
      await user.keyboard('{ArrowLeft}');
      input.focus();
      await user.keyboard('{Delete}');
      expect(banana).toHaveFocus();

      input.focus();
      await user.keyboard('{Backspace}');
      expect(banana).toHaveFocus();

      input.focus();
      await user.keyboard('x');
      expect(input).toHaveValue('x');
    });

    it('keeps focus on the input when navigating toward chips but none are rendered', async () => {
      const { user } = await render(
        <Combobox.Root multiple defaultValue={['apple']}>
          <Combobox.Chips>
            <Combobox.Input />
          </Combobox.Chips>
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      input.focus();
      input.setSelectionRange(0, 0);
      await user.keyboard('{ArrowLeft}');

      expect(input).toHaveFocus();
    });

    it('treats a null selectionStart as the beginning of a custom input', async () => {
      const { user } = await render(
        <Combobox.Root multiple defaultValue={['apple']}>
          <Combobox.Chips>
            <Combobox.Chip data-testid="chip">apple</Combobox.Chip>
            <Combobox.Input render={<input type="number" />} />
          </Combobox.Chips>
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      expect(input.selectionStart).toBe(null);
      input.focus();
      await user.keyboard('{ArrowLeft}');

      expect(screen.getByTestId('chip')).toHaveFocus();
    });

    it('keeps the popup open after modified keyboard navigation', async () => {
      const { user } = await render(
        <Combobox.Root defaultOpen>
          <Combobox.Input />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="apple">apple</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole('combobox');
      input.focus();

      await user.keyboard('{Control>}{ArrowDown}{/Control}');
      expect(screen.getByRole('listbox')).not.toBe(null);
    });

    it('does not select an item for an IME keydown without a highlight', async () => {
      const onValueChange = vi.fn();
      await render(
        <Combobox.Root defaultOpen onValueChange={onValueChange}>
          <Combobox.Input />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="apple">apple</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole('combobox');
      input.focus();
      fireEvent.keyDown(input, { key: 'Enter', keyCode: 229, which: 229 });
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('does not restore an inline highlight after the highlighted slot is removed', async () => {
      function Test() {
        const [items, setItems] = React.useState(['apple']);
        return (
          <div>
            <Combobox.Root inline open items={items}>
              <Combobox.Input />
              <Combobox.List>
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Root>
            <button type="button" onClick={() => setItems([])}>
              remove items
            </button>
          </div>
        );
      }

      const { user } = await render(<Test />);
      const input = screen.getByRole('combobox');
      input.focus();
      await user.keyboard('{ArrowDown}');
      expect(input).toHaveAttribute('aria-activedescendant');

      await user.click(screen.getByRole('button', { name: 'remove items' }));
      await user.click(input);

      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('clears a closed multiple value on Escape and stops propagation', async () => {
      const onValueChange = vi.fn();
      const onOuterKeyDown = vi.fn();
      const { user } = await render(
        <div onKeyDown={onOuterKeyDown}>
          <Combobox.Root multiple defaultValue={['apple']} onValueChange={onValueChange}>
            <Combobox.Input />
          </Combobox.Root>
        </div>,
      );

      screen.getByRole('combobox').focus();
      await user.keyboard('{Escape}');

      expect(onValueChange).toHaveBeenCalledWith([], expect.anything());
      expect(onOuterKeyDown).not.toHaveBeenCalled();
    });

    it('lets Escape propagate when a closed multiple value is already empty', async () => {
      const onOuterKeyDown = vi.fn();
      const { user } = await render(
        <div onKeyDown={onOuterKeyDown}>
          <Combobox.Root multiple defaultValue={[]}>
            <Combobox.Input />
          </Combobox.Root>
        </div>,
      );

      screen.getByRole('combobox').focus();
      await user.keyboard('{Escape}');

      expect(onOuterKeyDown).toHaveBeenCalled();
    });

    it('lets Escape propagate from a closed inline combobox', async () => {
      const onOuterKeyDown = vi.fn();
      const { user } = await render(
        <div onKeyDown={onOuterKeyDown}>
          <Combobox.Root inline defaultValue="apple">
            <Combobox.Input />
          </Combobox.Root>
        </div>,
      );

      screen.getByRole('combobox').focus();
      await user.keyboard('{Escape}');

      expect(onOuterKeyDown).toHaveBeenCalled();
    });

    it('closes on an empty composition update when input clicks do not open the popup', async () => {
      await render(
        <Combobox.Root
          defaultOpen
          defaultInputValue="x"
          openOnInputClick={false}
          filter={null}
          items={['apple']}
        >
          <Combobox.Input />
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
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole('combobox');
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).toBe(null);
      });
    });

    it('clears the highlight on an empty composition update while staying open', async () => {
      const { user } = await render(
        <Combobox.Root defaultOpen defaultInputValue="x" filter={null} items={['apple']}>
          <Combobox.Input />
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
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole('combobox');
      input.focus();
      await user.keyboard('{ArrowDown}');
      expect(input).toHaveAttribute('aria-activedescendant');

      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: '' } });

      expect(screen.getByRole('listbox')).not.toBe(null);
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('removes the last rendered chip when pressing Backspace in an empty input', async () => {
      const handleValueChange = vi.fn();
      const { user } = await render(
        <Combobox.Root
          multiple
          defaultValue={['apple', 'banana', 'cherry']}
          onValueChange={handleValueChange}
        >
          <Combobox.Chips>
            <Combobox.Value>
              {(value: string[]) => (
                <React.Fragment>
                  {value.slice(0, 2).map((item) => (
                    <Combobox.Chip key={item}>{item}</Combobox.Chip>
                  ))}
                  <Combobox.Input data-testid="input" />
                </React.Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');

      await user.click(input);
      await user.keyboard('{Backspace}');

      expect(handleValueChange.mock.calls.length).toBe(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['apple', 'cherry']);
    });

    it('removes the last selected value when no chips are rendered', async () => {
      const handleValueChange = vi.fn();
      const { user } = await render(
        <Combobox.Root
          multiple
          defaultValue={['apple', 'banana']}
          onValueChange={handleValueChange}
        >
          <Combobox.Chips>
            <Combobox.Value>
              {(value: string[]) => (
                <React.Fragment>
                  <span>{`+${value.length} selected`}</span>
                  <Combobox.Input data-testid="input" />
                </React.Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');

      await user.click(input);
      await user.keyboard('{Backspace}');

      expect(handleValueChange.mock.calls.length).toBe(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['apple']);
    });

    it('closes the popup when tabbing out', async () => {
      const { user } = await render(
        <div>
          <Combobox.Root>
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Item value="apple">apple</Combobox.Item>
                    <Combobox.Item value="banana">banana</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
          <button type="button" data-testid="button">
            button
          </button>
        </div>,
      );

      const input = screen.getByRole('combobox');
      const button = screen.getByTestId('button');

      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).not.toBe(null);
      });

      await user.tab();

      await waitFor(() => {
        expect(button).toHaveFocus();
      });
      expect(screen.queryByRole('listbox')).toBe(null);

      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).not.toBe(null);
      });

      await user.tab();

      await waitFor(() => {
        expect(button).toHaveFocus();
      });
      expect(screen.queryByRole('listbox')).toBe(null);
    });
  });

  describe('data state attributes', () => {
    it.skipIf(isJSDOM)('sets data-popup-side to the current popup side', async () => {
      const { user } = await render(
        <Combobox.Root items={['apple']}>
          <Combobox.Input />
          <Combobox.Portal>
            <Combobox.Positioner side="right">
              <Combobox.Popup>
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
        </Combobox.Root>,
      );

      const input = screen.getByRole('combobox');
      expect(input).not.toHaveAttribute('data-popup-side');

      await user.click(input);

      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBe(null));
      expect(input).toHaveAttribute('data-popup-side', 'right');

      await user.click(document.body);

      await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));
      expect(input).not.toHaveAttribute('data-popup-side');
    });

    it('toggles data-empty when the filtered list is empty', async () => {
      const { user } = await render(
        <Combobox.Root items={[]}>
          <Combobox.Input />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List />
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole('combobox');

      await user.click(input);

      await waitFor(() => expect(screen.getByRole('listbox')).not.toBe(null));
      expect(input).toHaveAttribute('data-list-empty');
    });
  });
});
