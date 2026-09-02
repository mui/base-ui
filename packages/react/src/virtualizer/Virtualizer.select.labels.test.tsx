import * as React from 'react';
import { expect, vi } from 'vitest';
import { Select } from '@base-ui/react/select';
import { Virtualizer } from '@base-ui/react/virtualizer';
import { flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, createDOMRect, setElementClientHeight } from '#test-utils';

interface Country {
  code: string;
  name: string;
}

function createCountries(count: number): Country[] {
  return Array.from({ length: count }, (_, index) => ({
    code: `c-${index}`,
    name: `Country ${index}`,
  }));
}

describe('Select virtualization — derived labels', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
      this: HTMLElement,
    ) {
      if (this.hasAttribute('data-index')) {
        return createDOMRect({ height: 20, width: 200 });
      }
      return createDOMRect({ height: 60, width: 200 });
    });
  });

  function LabelledSelect(props: {
    items: Country[];
    itemToStringLabel: (item: Country) => string;
    extra?: number;
  }) {
    return (
      <Select.Root<Country>
        defaultOpen
        items={props.items}
        itemToStringLabel={props.itemToStringLabel}
      >
        <Select.Trigger>
          <Select.Value />
          <span>{props.extra}</span>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                <Virtualizer<Country>
                  estimatedItemHeight={20}
                  getItemKey={(item) => item.code}
                  render={<div ref={setElementClientHeight(60)} />}
                >
                  {(item) => <Select.Item value={item}>{item.name}</Select.Item>}
                </Virtualizer>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    );
  }

  it('updates typeahead labels when the callback changes', async () => {
    const items = createCountries(40);

    const { setProps, user } = await render(
      <LabelledSelect items={items} itemToStringLabel={(item) => item.name} />,
    );

    await waitFor(() => {
      expect(screen.queryAllByRole('option').length).not.toBe(0);
    });

    // A different label for the same item; typeahead must match the new one.
    await setProps({ itemToStringLabel: (item: Country) => `Zulu ${item.code}` });
    await flushMicrotasks();

    await user.keyboard('Zulu c-3');

    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute('data-index', '3');
    });
  });

  it('reuses the projected values when only the label callback changes', async () => {
    const SIZE = 100;
    let valueReads = 0;
    // `{ label, value }` entries, so projecting a value is an observable property read.
    const items = Array.from({ length: SIZE }, (_, index) => {
      const item = { label: `Item ${index}` };
      Object.defineProperty(item, 'value', {
        enumerable: true,
        get() {
          valueReads += 1;
          return `v-${index}`;
        },
      });
      return item as { label: string; value: string };
    });

    function Tree(props: { itemToStringLabel: (value: string) => string; extra: number }) {
      return (
        <Select.Root defaultOpen items={items} itemToStringLabel={props.itemToStringLabel}>
          <Select.Trigger>
            <Select.Value />
            <span>{props.extra}</span>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  <Virtualizer
                    estimatedItemHeight={20}
                    getItemKey={(item: any) => item.label}
                    render={<div ref={setElementClientHeight(60)} />}
                  >
                    {(item: any) => <Select.Item value={item.value}>{item.label}</Select.Item>}
                  </Virtualizer>
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      );
    }

    const { setProps } = await render(<Tree itemToStringLabel={(v) => v} extra={0} />);
    await waitFor(() => {
      expect(screen.queryAllByRole('option').length).not.toBe(0);
    });
    await flushMicrotasks();

    // A render that does not touch the prefill effect, to price everything else in the tree that
    // walks the collection — `Select.Value`'s label lookup, mainly. Without this control the
    // measurement cannot separate the prefill's cost from the rest.
    valueReads = 0;
    await setProps({ extra: 1 });
    await flushMicrotasks();
    const baseline = valueReads;

    // The documented case: a new callback identity over the same collection.
    valueReads = 0;
    await setProps({ itemToStringLabel: (v: string) => `x${v}` });
    await flushMicrotasks();

    const prefillCost = valueReads - baseline;
    // Labels must re-derive — one value read per item — or the callback change was ignored.
    expect(prefillCost).toBeGreaterThanOrEqual(SIZE);
    // Values must not: without the collection-identity cache that is a second read per item.
    expect(prefillCost).toBeLessThan(3.5 * SIZE);
  });
});
