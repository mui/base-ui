import * as React from 'react';
import { expect, vi, describe, beforeEach, it } from 'vitest';
import { Select } from '@base-ui/react/select';
import { Virtualizer } from '@base-ui/react/virtualizer';
import { fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, createDOMRect, setElementClientHeight } from '#test-utils';

function getOptions() {
  return screen.queryAllByRole('option');
}

function createItems(count: number) {
  return Array.from({ length: count }, (_, index) => `item-${index}`);
}

describe('Select virtualization — selection pruning', () => {
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

  function VirtualizedSelect(props: { items: string[]; value: string; onValueChange: any }) {
    return (
      <Select.Root
        defaultOpen
        items={props.items}
        value={props.value}
        onValueChange={props.onValueChange}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                <Virtualizer<string>
                  estimatedItemHeight={20}
                  getItemKey={(item) => item}
                  render={<div ref={setElementClientHeight(60)} />}
                >
                  {(item: string) => <Select.Item value={item}>{item}</Select.Item>}
                </Virtualizer>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    );
  }

  it('clears a selected value that leaves the collection', async () => {
    const onValueChange = vi.fn();
    const { setProps } = await render(
      <VirtualizedSelect items={createItems(50)} value="item-40" onValueChange={onValueChange} />,
    );

    await waitFor(() => {
      expect(getOptions().length).not.toBe(0);
    });
    await setProps({ items: createItems(10) });

    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalled();
    });
    expect(onValueChange.mock.calls[0][0]).toBe(null);
  });

  it('keeps the selection while the collection is still empty', async () => {
    const onValueChange = vi.fn();
    const { setProps } = await render(
      <VirtualizedSelect items={[]} value="item-3" onValueChange={onValueChange} />,
    );

    await flushMicrotasks();

    // An empty projection means the collection has not arrived, not that the selection left it.
    await setProps({ items: createItems(6) });
    await flushMicrotasks();

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps a selection whose value has not loaded yet', async () => {
    const onValueChange = vi.fn();
    // A progressively loaded collection: the value belongs to a page that has not arrived. The
    // first collection an owned session sees is the one it was handed, not evidence the selection
    // left it.
    const { setProps } = await render(
      <VirtualizedSelect items={createItems(50)} value="item-120" onValueChange={onValueChange} />,
    );

    await waitFor(() => {
      expect(getOptions().length).not.toBe(0);
    });
    expect(onValueChange).not.toHaveBeenCalled();

    await setProps({ items: createItems(200) });
    await flushMicrotasks();

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('still prunes after the collection passes through empty', async () => {
    const onValueChange = vi.fn();
    const { setProps } = await render(
      <VirtualizedSelect items={createItems(10)} value="item-4" onValueChange={onValueChange} />,
    );

    await waitFor(() => {
      expect(getOptions().length).not.toBe(0);
    });

    // A refetch: the collection empties and comes back without the selected value. Passing through
    // empty must not buy the replacement a first-population exemption.
    await setProps({ items: [] });
    await flushMicrotasks();
    await setProps({ items: createItems(3) });

    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalled();
    });
    expect(onValueChange.mock.calls[0][0]).toBe(null);
  });

  // A collection that renders the virtualizer only once its items arrive — the ordinary async
  // pattern. The virtualizer registers on the same commit the collection becomes non-empty, so the
  // exemption must survive the follow-up commit that lands the registration state.
  function ConditionalSelect(props: {
    items: string[];
    value: string;
    onValueChange: any;
    enabled?: boolean;
  }) {
    return (
      <Select.Root
        defaultOpen
        items={props.items}
        value={props.value}
        onValueChange={props.onValueChange}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                {props.items.length === 0 ? (
                  <div>loading</div>
                ) : (
                  <Virtualizer<string>
                    enabled={props.enabled ?? true}
                    estimatedItemHeight={20}
                    getItemKey={(item) => item}
                    render={<div ref={setElementClientHeight(60)} />}
                  >
                    {(item: string) => <Select.Item value={item}>{item}</Select.Item>}
                  </Virtualizer>
                )}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    );
  }

  it('keeps a first-population selection across the commit that registers the virtualizer', async () => {
    const onValueChange = vi.fn();
    // The virtualizer mounts on the same commit the collection arrives, and the registration state
    // lands on the next one. Both must be exempt: the value is on a page not loaded yet.
    const { setProps } = await render(
      <ConditionalSelect items={[]} value="item-120" onValueChange={onValueChange} />,
    );
    await flushMicrotasks();

    await setProps({ items: createItems(50) });
    await waitFor(() => {
      expect(getOptions().length).not.toBe(0);
    });
    await flushMicrotasks();

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps a first-population selection when the virtualizer is toggled disabled', async () => {
    const onValueChange = vi.fn();
    const { setProps } = await render(
      <ConditionalSelect items={createItems(50)} value="item-120" onValueChange={onValueChange} />,
    );
    await waitFor(() => {
      expect(getOptions().length).not.toBe(0);
    });
    await flushMicrotasks();
    expect(onValueChange).not.toHaveBeenCalled();

    // Toggling `enabled` re-registers the handle, re-running the prune against an unchanged
    // collection. The exemption is per collection, not per run, so the selection survives.
    await setProps({ enabled: false });
    await flushMicrotasks();

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps a value set after first population that is outside the loaded collection', async () => {
    const onValueChange = vi.fn();
    const { setProps } = await render(
      <ConditionalSelect items={createItems(50)} value="item-3" onValueChange={onValueChange} />,
    );
    await waitFor(() => {
      expect(getOptions().length).not.toBe(0);
    });
    await flushMicrotasks();

    // The saved selection arrives after the first page and belongs to one not loaded yet. A `value`
    // change is not a collection change, so — like a static list — the value is retained, not pruned.
    await setProps({ value: 'item-120' });
    await flushMicrotasks();

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps the surviving values when one of several leaves the collection', async () => {
    const onValueChange = vi.fn();

    function MultipleSelect(props: { items: string[] }) {
      return (
        <Select.Root
          defaultOpen
          multiple
          items={props.items}
          value={['item-1', 'item-4']}
          onValueChange={onValueChange}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  <Virtualizer<string>
                    estimatedItemHeight={20}
                    getItemKey={(item) => item}
                    render={<div ref={setElementClientHeight(60)} />}
                  >
                    {(item: string) => <Select.Item value={item}>{item}</Select.Item>}
                  </Virtualizer>
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      );
    }

    const { setProps } = await render(<MultipleSelect items={createItems(6)} />);

    await waitFor(() => {
      expect(getOptions().length).not.toBe(0);
    });

    // `item-4` leaves; `item-1` must survive.
    await setProps({ items: createItems(3) });

    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalled();
    });
    expect(onValueChange.mock.calls[0][0]).toEqual(['item-1']);
  });

  it('does not rescan the whole collection on a pure window commit', async () => {
    // Mounted rows legitimately compare their own value, so a raw call count cannot distinguish a
    // full-collection scan from ordinary per-row work. What can: whether the cost of one scroll
    // grows with the collection. A prune running per window commit would scale with it.
    async function countComparesDuringScroll(size: number) {
      const isItemEqualToValue = vi.fn((a: string, b: string) => a === b);

      const view = await render(
        <Select.Root
          defaultOpen
          items={createItems(size)}
          // The last item, so the lookup cannot short-circuit and a full scan really would scale.
          value={`item-${size - 1}`}
          isItemEqualToValue={isItemEqualToValue}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  <Virtualizer<string>
                    estimatedItemHeight={20}
                    getItemKey={(item) => item}
                    render={<div ref={setElementClientHeight(60)} data-testid="scrollport" />}
                  >
                    {(item: string) => <Select.Item value={item}>{item}</Select.Item>}
                  </Virtualizer>
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      await waitFor(() => {
        expect(getOptions().length).not.toBe(0);
      });

      isItemEqualToValue.mockClear();
      fireEvent.scroll(screen.getByTestId('scrollport'), { target: { scrollTop: 400 } });
      await flushMicrotasks();

      const count = isItemEqualToValue.mock.calls.length;
      view.unmount();
      return count;
    }

    const small = await countComparesDuringScroll(60);
    const large = await countComparesDuringScroll(600);

    // Ten times the collection, comparable work.
    expect(large).toBeLessThan(small + 60);
  });

  it('keeps the selection through a static-to-virtualized handover', async () => {
    const onValueChange = vi.fn();

    function HandoverSelect(props: { virtualized: boolean }) {
      return (
        <Select.Root
          defaultOpen
          items={createItems(6)}
          value="item-3"
          onValueChange={onValueChange}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  {props.virtualized ? (
                    <Virtualizer<string>
                      estimatedItemHeight={20}
                      getItemKey={(item) => item}
                      render={<div ref={setElementClientHeight(60)} />}
                    >
                      {(item: string) => <Select.Item value={item}>{item}</Select.Item>}
                    </Virtualizer>
                  ) : (
                    createItems(6).map((item) => (
                      <Select.Item key={item} value={item}>
                        {item}
                      </Select.Item>
                    ))
                  )}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      );
    }

    const { setProps } = await render(<HandoverSelect virtualized={false} />);

    await waitFor(() => {
      expect(getOptions().length).toBe(6);
    });

    // The static items unmount and delete their `valuesRef` entries before the root's prefill
    // replaces them. A prune that ran in that window would clear a valid selection.
    await setProps({ virtualized: true });
    await flushMicrotasks();

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
