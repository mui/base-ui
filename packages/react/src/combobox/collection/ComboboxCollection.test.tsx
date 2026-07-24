import { expect, vi } from 'vitest';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer } from '#test-utils';
import { screen } from '@mui/internal-test-utils';

describe('<Combobox.Collection />', () => {
  const { render } = createRenderer();

  it('renders filtered items', async () => {
    await render(
      <Combobox.Root items={['alpha', 'beta', 'alpine']} defaultOpen>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Collection>
                  {(item) => (
                    <Combobox.Item key={item} value={item} data-testid={`item-${item}`}>
                      {item}
                    </Combobox.Item>
                  )}
                </Combobox.Collection>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(screen.getByTestId('item-alpha')).not.toBe(null);
    expect(screen.getByTestId('item-beta')).not.toBe(null);
    expect(screen.getByTestId('item-alpine')).not.toBe(null);
  });

  it('uses the source item as the value when the item value is omitted', async () => {
    const items = [
      { id: 1, label: 'alpha' },
      { id: 2, label: 'beta' },
    ];
    const onValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root items={items} defaultOpen onValueChange={onValueChange}>
        <Combobox.Input />
        <Combobox.List>
          {(item: (typeof items)[number]) => (
            <Combobox.Item key={item.id}>{item.label}</Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole('option', { name: 'beta' }));

    expect(onValueChange.mock.lastCall?.[0]).toBe(items[1]);
  });

  it('prefers an explicit item value over the source item', async () => {
    const items = ['alpha', 'beta'];
    const onValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root items={items} defaultOpen onValueChange={onValueChange}>
        <Combobox.Input />
        <Combobox.List>
          {(item: string) => (
            <Combobox.Item key={item} value={`explicit-${item}`}>
              {item}
            </Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole('option', { name: 'beta' }));

    expect(onValueChange.mock.lastCall?.[0]).toBe('explicit-beta');
  });

  it('keeps an omitted value on a static item using the existing null fallback', async () => {
    const onValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root defaultValue="selected" defaultOpen onValueChange={onValueChange}>
        <Combobox.Input />
        <Combobox.List>
          <Combobox.Item>Static item</Combobox.Item>
        </Combobox.List>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole('option', { name: 'Static item' }));

    expect(onValueChange.mock.lastCall?.[0]).toBe(null);
  });

  it('uses grouped source items as values', async () => {
    const groups = [
      {
        id: 'letters',
        items: [
          { id: 1, label: 'alpha' },
          { id: 2, label: 'beta' },
        ],
      },
    ];
    const onValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root items={groups} defaultOpen onValueChange={onValueChange}>
        <Combobox.Input />
        <Combobox.List>
          {(group: (typeof groups)[number]) => (
            <Combobox.Group key={group.id} items={group.items}>
              <Combobox.Collection>
                {(item: (typeof group.items)[number]) => (
                  <Combobox.Item key={item.id}>{item.label}</Combobox.Item>
                )}
              </Combobox.Collection>
            </Combobox.Group>
          )}
        </Combobox.List>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole('option', { name: 'beta' }));

    expect(onValueChange.mock.lastCall?.[0]).toBe(groups[0].items[1]);
  });

  it('does not pass an outer collection value into static group items', async () => {
    const onValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root
        items={['group']}
        defaultValue="selected"
        defaultOpen
        onValueChange={onValueChange}
      >
        <Combobox.Input />
        <Combobox.List>
          {(item: string) => (
            <Combobox.Group key={item}>
              <Combobox.Item>Static item</Combobox.Item>
            </Combobox.Group>
          )}
        </Combobox.List>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole('option', { name: 'Static item' }));

    expect(onValueChange.mock.lastCall?.[0]).toBe(null);
  });

  it('passes the source value through custom item components', async () => {
    const items = [{ id: 1, label: 'alpha' }];
    const onValueChange = vi.fn();

    function CustomItem(props: { item: (typeof items)[number] }) {
      return <Combobox.Item>{props.item.label}</Combobox.Item>;
    }

    const { user } = await render(
      <Combobox.Root items={items} defaultOpen onValueChange={onValueChange}>
        <Combobox.Input />
        <Combobox.List>
          {(item: (typeof items)[number]) => <CustomItem key={item.id} item={item} />}
        </Combobox.List>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole('option', { name: 'alpha' }));

    expect(onValueChange.mock.lastCall?.[0]).toBe(items[0]);
  });

  it('keeps source values aligned when filtered items reorder', async () => {
    const items = [
      { id: 1, label: 'alpha' },
      { id: 2, label: 'beta' },
    ];
    const onValueChange = vi.fn();

    function Test() {
      const [reversed, setReversed] = React.useState(false);
      const filteredItems = reversed ? [...items].reverse() : items;

      return (
        <React.Fragment>
          <button type="button" onClick={() => setReversed(true)}>
            Reverse
          </button>
          <Combobox.Root filteredItems={filteredItems} defaultOpen onValueChange={onValueChange}>
            <Combobox.Input />
            <Combobox.List>
              {(item: (typeof items)[number]) => (
                <Combobox.Item key={item.id}>{item.label}</Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        </React.Fragment>
      );
    }

    const { user } = await render(<Test />);
    await user.click(screen.getByRole('button', { name: 'Reverse' }));
    await user.click(screen.getByRole('option', { name: 'beta' }));

    expect(onValueChange.mock.lastCall?.[0]).toBe(items[1]);
  });

  it('supports omitted values in virtualized and multiple collections', async () => {
    const items = [
      { id: 1, label: 'alpha' },
      { id: 2, label: 'beta' },
    ];
    const onValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root items={items} multiple virtualized defaultOpen onValueChange={onValueChange}>
        <Combobox.Input />
        <Combobox.List>
          {(item: (typeof items)[number], index) => (
            <Combobox.Item key={item.id} index={index}>
              {item.label}
            </Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole('option', { name: 'alpha' }));
    await user.click(screen.getByRole('option', { name: 'beta' }));

    expect(onValueChange.mock.lastCall?.[0]).toEqual(items);
  });

  it('keeps creatable and ordinary selections in the source item domain', async () => {
    type LabelItem = { id: string; value: string; creatable?: string };
    const items: LabelItem[] = [
      { id: 'bug', value: 'bug' },
      { id: 'create-feature', value: 'feature', creatable: 'feature' },
    ];
    const onValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root items={items} multiple defaultOpen onValueChange={onValueChange}>
        <Combobox.Input />
        <Combobox.List>
          {(item: LabelItem) => (
            <Combobox.Item key={item.id}>
              {item.creatable ? `Create ${item.creatable}` : item.value}
            </Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole('option', { name: 'bug' }));
    await user.click(screen.getByRole('option', { name: 'Create feature' }));

    expect(onValueChange.mock.lastCall?.[0]).toEqual(items);
  });

  it('renders nothing when a nested group does not provide items', async () => {
    await render(
      <Combobox.Root defaultOpen>
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Group data-testid="group">
                  <Combobox.Collection>
                    {(item) => <span key={item}>{item}</span>}
                  </Combobox.Collection>
                </Combobox.Group>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(screen.getByTestId('group')).toBeEmptyDOMElement();
  });
});
