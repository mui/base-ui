import { expect, vi, describe, it } from 'vitest';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { ListboxPreview as Listbox } from '@base-ui/react/listbox';
import { createRenderer, describeConformance } from '#test-utils';

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
});
