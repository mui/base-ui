import { expect, vi, describe, it } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { Listbox } from '@base-ui/react/listbox';
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
