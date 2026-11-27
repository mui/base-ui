import { expect, describe, it } from 'vitest';
import { ListboxPreview as Listbox } from '@base-ui/react/listbox';
import { screen, within } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

describe('<Listbox.Collection />', () => {
  const { render } = createRenderer();

  const groups = [
    { label: 'Fruits', items: ['Apple', 'Banana'] },
    { label: 'Vegetables', items: ['Carrot'] },
  ];
  const groupedItems = Listbox.createItems(groups, {
    getValue: (item) => item,
    getLabel: (item) => item,
  });

  it('renders the root items next to other content', async () => {
    await render(
      <Listbox.Root items={['Apple', 'Banana']}>
        <Listbox.List>
          <div data-testid="header">Header</div>
          <Listbox.Collection>
            {(item: string) => (
              <Listbox.Item key={item} value={item}>
                {item}
              </Listbox.Item>
            )}
          </Listbox.Collection>
        </Listbox.List>
      </Listbox.Root>,
    );

    expect(screen.getByTestId('header')).toBeVisible();
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Apple',
      'Banana',
    ]);
  });

  it('renders the groups of grouped items, and the items of the group it is in', async () => {
    await render(
      <Listbox.Root items={groupedItems}>
        <Listbox.List>
          {(group: (typeof groups)[number]) => (
            <Listbox.Group key={group.label} items={group.items}>
              <Listbox.GroupLabel>{group.label}</Listbox.GroupLabel>
              <Listbox.Collection>
                {(item: string) => (
                  <Listbox.Item key={item} value={item}>
                    {item}
                  </Listbox.Item>
                )}
              </Listbox.Collection>
            </Listbox.Group>
          )}
        </Listbox.List>
      </Listbox.Root>,
    );

    const [fruits, vegetables] = screen.getAllByRole('group');
    expect(
      within(fruits)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Apple', 'Banana']);
    expect(
      within(vegetables)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Carrot']);
  });
});
