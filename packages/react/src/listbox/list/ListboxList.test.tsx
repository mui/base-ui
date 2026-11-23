import { expect, vi, describe, it } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { Listbox } from '@base-ui/react/listbox';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Listbox.List />', () => {
  const { render } = createRenderer();

  describeConformance(<Listbox.List />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Listbox.Root>{node}</Listbox.Root>);
    },
  }));

  describe('prop: children', () => {
    it('renders each of the root items with a function child', async () => {
      await render(
        <Listbox.Root items={['Apple', 'Banana']}>
          <Listbox.List>
            {(item: string, index: number) => (
              <Listbox.Item key={item} value={item}>
                {`${index}: ${item}`}
              </Listbox.Item>
            )}
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
        '0: Apple',
        '1: Banana',
      ]);
    });

    it('passes the objects of a plain array to a function child', async () => {
      await render(
        <Listbox.Root items={[{ value: 'apple', label: 'Apple' }]}>
          <Listbox.List>
            {(item: { value: string; label: string }) => (
              <Listbox.Item key={item.value} value={item.value}>
                {item.label}
              </Listbox.Item>
            )}
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('option', { name: 'Apple' })).toBeVisible();
    });

    it('passes the data given to createItems to a function child', async () => {
      const items = Listbox.createItems([{ id: 'apple', name: 'Apple' }], {
        getValue: (fruit) => fruit.id,
        getLabel: (fruit) => fruit.name,
      });

      await render(
        <Listbox.Root items={items}>
          <Listbox.List>
            {(fruit: { id: string; name: string }) => (
              <Listbox.Item key={fruit.id} value={fruit.id}>
                {fruit.name}
              </Listbox.Item>
            )}
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('option', { name: 'Apple' })).toBeVisible();
    });

    it('renders nothing and logs an error when the root has no items', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const renderItem = vi.fn(() => null);

      await render(
        <Listbox.Root>
          <Listbox.List>{renderItem}</Listbox.List>
        </Listbox.Root>,
      );

      expect(renderItem).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Pass `items` to <Listbox.Root>'),
      );
    });
  });
});
