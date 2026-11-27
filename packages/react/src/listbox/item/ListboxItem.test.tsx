import { expect, vi, describe, it } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { ListboxPreview as Listbox } from '@base-ui/react/listbox';
import { createRenderer, describeConformance, isJSDOM, resetBrowserPointer } from '#test-utils';

describe('<Listbox.Item />', () => {
  const { render } = createRenderer();

  describeConformance(<Listbox.Item value="a" />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Listbox.Root>
          <Listbox.List>{node}</Listbox.List>
        </Listbox.Root>,
      );
    },
  }));

  describe('prop: value', () => {
    it('selects the new value after the value of a rendered item changes', async () => {
      const handleValueChange = vi.fn();
      function App(props: { value: string }) {
        return (
          <Listbox.Root onValueChange={handleValueChange}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value={props.value}>b</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
        );
      }
      const { setProps, user } = await render(<App value="b" />);

      await setProps({ value: 'b2' });
      await user.click(screen.getByRole('option', { name: 'b' }));

      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual(['b2']);
    });
  });

  describe('prop: disabled', () => {
    it.each([
      { name: 'leaves the item out of', disabled: true, expected: ['a', 'c'] },
      { name: 'includes the item in', disabled: false, expected: ['a', 'b', 'c'] },
    ])('$name select all after it rendered enabled: $disabled', async ({ disabled, expected }) => {
      const handleValueChange = vi.fn();
      function App(props: { disabled: boolean }) {
        return (
          <Listbox.Root multiple onValueChange={handleValueChange}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b" disabled={props.disabled}>
                b
              </Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
        );
      }
      const { setProps } = await render(<App disabled={false} />);

      await setProps({ disabled });
      const itemA = screen.getByRole('option', { name: 'a' });
      await act(async () => itemA.focus());
      fireEvent.keyDown(itemA, { key: 'a', ctrlKey: true });

      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([expected]);
    });
  });

  describe('prop: nativeButton', () => {
    it.each([
      { name: 'a div', nativeButton: false, tagName: 'DIV' },
      { name: 'a button', nativeButton: true, tagName: 'BUTTON' },
    ])('selects the item rendered as $name when pressed', async ({ nativeButton, tagName }) => {
      const handleValueChange = vi.fn();
      const { user } = await render(
        <Listbox.Root onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item
              value="a"
              nativeButton={nativeButton}
              render={nativeButton ? <button type="button" /> : undefined}
            >
              a
            </Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const item = screen.getByRole('option', { name: 'a' });
      expect(item.tagName).toBe(tagName);

      await user.click(item);

      expect(handleValueChange.mock.lastCall?.[0]).toBe('a');
    });
  });

  describe('press with a modifier', () => {
    it.each([
      { name: 'an item', disabled: false },
      { name: 'a disabled item', disabled: true },
    ])('keeps the browser from selecting text and focuses $name', async ({ disabled }) => {
      await render(
        <Listbox.Root multiple>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled={disabled}>
              b
            </Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );
      const item = screen.getByRole('option', { name: 'b' });

      // `fireEvent` returns `false` when the default action was prevented.
      expect(fireEvent.mouseDown(item)).toBe(true);
      expect(item).not.toHaveFocus();

      expect(fireEvent.mouseDown(item, { shiftKey: true })).toBe(false);
      expect(item).toHaveFocus();
    });

    it('leaves a press with a modifier to the browser in single selection', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(
        fireEvent.mouseDown(screen.getByRole('option', { name: 'a' }), { shiftKey: true }),
      ).toBe(true);
    });
  });

  describe.skipIf(isJSDOM)('text selection', () => {
    it('selects a range of items without selecting their text on a Shift+press', async ({
      onTestFinished,
    }) => {
      const { userEvent } = await import('vitest/browser');
      onTestFinished(resetBrowserPointer);
      const handleValueChange = vi.fn();
      await render(
        <Listbox.Root multiple onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">Apple</Listbox.Item>
            <Listbox.Item value="b">Banana</Listbox.Item>
            <Listbox.Item value="c">Cherry</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      // Real browser input (vitest/browser) updates React state outside Testing Library's act.
      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await userEvent.click(screen.getByRole('option', { name: 'Apple' }));
        await userEvent.click(screen.getByRole('option', { name: 'Cherry' }), {
          modifiers: ['Shift'],
        });
      });

      await waitFor(() => {
        expect(handleValueChange.mock.lastCall?.[0]).toEqual(['a', 'b', 'c']);
      });
      expect(screen.getByRole('option', { name: 'Cherry' })).toHaveFocus();
      expect(window.getSelection()?.toString()).toBe('');
    });
  });
});
