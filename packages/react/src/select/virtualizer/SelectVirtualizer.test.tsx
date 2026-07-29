import * as React from 'react';
import { expect, vi } from 'vitest';
import { Select, type SelectItemData } from '@base-ui/react/select';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import {
  createRenderer,
  isJSDOM,
  createDOMRect,
  setElementClientHeight,
  setElementScrollState,
} from '#test-utils';

describe('<Select.Virtualizer />', () => {
  const { render } = createRenderer();
  const { render: renderNonStrict } = createRenderer({ strict: false });

  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
      this: HTMLElement,
    ) {
      if (this.hasAttribute('data-index')) {
        return createDOMRect({ height: 20, width: 200 });
      }

      return createDOMRect({ height: 60, width: 200 });
    });
  });

  it('does not warn about the intentionally windowed item collection', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await renderVirtualizedSelect({ items: createItems(100) });
      await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(isJSDOM ? 3 : 5));

      expect(
        warnSpy.mock.calls.some(([message]) =>
          String(message).includes('does not match the rendered <Select.Item>'),
        ),
      ).toBe(false);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('only renders the visible select items', async () => {
    await renderVirtualizedSelect({ items: createItems(100) });

    const expectedRenderedCount = isJSDOM ? 3 : 5;
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(expectedRenderedCount));

    expect(screen.getByRole('option', { name: 'Item 1' })).not.toBe(null);
    expect(screen.getByRole('option', { name: `Item ${expectedRenderedCount}` })).not.toBe(null);
    expect(screen.queryByRole('option', { name: 'Item 20' })).toBe(null);

    const virtualizer = screen.getByTestId('virtualizer');
    expect(virtualizer).toHaveStyle({ overflow: 'auto' });
    if (isJSDOM) {
      expect(virtualizer.style.getPropertyValue('--total-size')).toBe('3200px');
    } else {
      await waitFor(() =>
        expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2000px'),
      );
    }
  });

  it.skipIf(isJSDOM)('does not scroll keyboard highlights through DOM scrollIntoView', async () => {
    vi.restoreAllMocks();
    const scrollIntoViewSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollIntoView')
      .mockImplementation(() => {});

    try {
      const { user } = await render(
        <Select.Root defaultOpen items={createItems(1000)}>
          <Select.Trigger>Open</Select.Trigger>
          <Select.Positioner alignItemWithTrigger={false}>
            <Select.Popup>
              <Select.List>
                <Select.Virtualizer<string>
                  estimatedItemHeight={20}
                  overscanPx={0}
                  render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
                >
                  {(item) => (
                    <Select.Item value={item.value} style={{ height: 20 }}>
                      <Select.ItemText>{item.label}</Select.ItemText>
                    </Select.Item>
                  )}
                </Select.Virtualizer>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>,
      );

      for (let index = 0; index < 10; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        await user.keyboard('{ArrowDown}');
      }

      const virtualizer = screen.getByTestId('virtualizer');
      // The virtualizer itself brings the highlighted row into view.
      await waitFor(() => expect(virtualizer.scrollTop).toBeGreaterThan(0));

      // Wait out the frame-deferred list-navigation scroll before asserting.
      await act(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 60);
          }),
      );
      // A DOM scrollIntoView runs a frame late against a potentially stale window layout and can
      // drag the scroll position away from where the virtualizer just placed it, stranding the
      // highlight offscreen. It must stay disabled while the virtualizer owns scrolling.
      expect(
        scrollIntoViewSpy.mock.contexts.filter((element) =>
          virtualizer.contains(element as HTMLElement),
        ),
      ).toHaveLength(0);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('exposes imperative scrolling by logical item index', async () => {
    const actionsRef = React.createRef<Select.Virtualizer.Actions>();
    const handleScrollTo = vi.fn();

    await render(
      <Select.Root defaultOpen items={createItems(100)}>
        <Select.Positioner alignItemWithTrigger={false}>
          <Select.Popup>
            <Select.List>
              <Select.Virtualizer<string>
                actionsRef={actionsRef}
                estimatedItemHeight={20}
                overscanPx={0}
                render={
                  <div
                    ref={setElementScrollState({
                      clientHeight: 60,
                      getScrollTop: () => 0,
                      scrollTo: handleScrollTo,
                    })}
                  />
                }
              >
                {(item) => (
                  <Select.Item value={item.value} style={{ height: 20 }}>
                    {item.label}
                  </Select.Item>
                )}
              </Select.Virtualizer>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );

    act(() => actionsRef.current?.scrollToIndex(50, { align: 'start' }));

    expect(handleScrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 1000 });
  });

  it('passes logical collection metadata to items', async () => {
    await renderVirtualizedSelect({ items: createItems(10), overscanPx: 0 });

    const firstItem = await screen.findByRole('option', { name: 'Item 1' });
    expect(firstItem).toHaveAttribute('aria-posinset', '1');
    expect(firstItem).toHaveAttribute('aria-setsize', '10');
    expect(firstItem).toHaveAttribute('data-index', '0');
  });

  it('reuses rows when inline configuration callbacks return the same values', async () => {
    type Value = { id: string; size: number };
    const items = Array.from({ length: 10 }, (_, index) => ({
      value: { id: String(index), size: 20 },
      label: `Item ${index}`,
    }));
    const handleGetItemKey = vi.fn();
    const handleEstimatedItemHeight = vi.fn();
    const renderItem = vi.fn((item: SelectItemData<Value>) => (
      <Select.Item value={item.value} style={{ height: item.value.size }}>
        {item.label}
      </Select.Item>
    ));

    function Test() {
      return (
        <Select.Root defaultOpen items={items}>
          <Select.Positioner alignItemWithTrigger={false}>
            <Select.Popup>
              <Select.List>
                <Select.Virtualizer<Value>
                  estimatedItemHeight={(item) => {
                    handleEstimatedItemHeight(item);
                    return item.value.size;
                  }}
                  getItemKey={(item) => {
                    handleGetItemKey(item);
                    return item.value.id;
                  }}
                  render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
                >
                  {renderItem}
                </Select.Virtualizer>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>
      );
    }

    const { rerender } = await renderNonStrict(<Test />);
    await waitFor(() =>
      expect(screen.getByTestId('virtualizer').style.getPropertyValue('--total-size')).toBe(
        '200px',
      ),
    );
    handleGetItemKey.mockClear();
    handleEstimatedItemHeight.mockClear();
    renderItem.mockClear();

    await rerender(<Test />);

    expect(handleGetItemKey).toHaveBeenCalledTimes(items.length);
    expect(handleEstimatedItemHeight.mock.calls.length).toBeLessThan(items.length);
    expect(renderItem).not.toHaveBeenCalled();
  });

  it('updates row identity when a key callback changes behavior', async () => {
    type Value = { id: string; slug: string };
    type Item = SelectItemData<Value>;
    const items: Item[] = Array.from({ length: 3 }, (_, index) => ({
      value: { id: `id-${index}`, slug: `slug-${index}` },
      label: `Item ${index}`,
    }));
    const handleMount = vi.fn();

    function Item(props: { item: Item }) {
      React.useEffect(() => {
        handleMount();
      }, []);

      return <Select.Item value={props.item.value}>{props.item.label}</Select.Item>;
    }

    const renderItem = (item: Item) => <Item item={item} />;

    function Test(props: { keyBySlug: boolean }) {
      return (
        <Select.Root defaultOpen items={items}>
          <Select.Positioner alignItemWithTrigger={false}>
            <Select.Popup>
              <Select.List>
                <Select.Virtualizer<Value>
                  estimatedItemHeight={20}
                  getItemKey={(item) => (props.keyBySlug ? item.value.slug : item.value.id)}
                  render={<div ref={setElementClientHeight(60)} />}
                >
                  {renderItem}
                </Select.Virtualizer>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>
      );
    }

    const { rerender } = await renderNonStrict(<Test keyBySlug={false} />);

    await waitFor(() => expect(handleMount).toHaveBeenCalledTimes(items.length));
    handleMount.mockClear();

    await rerender(<Test keyBySlug />);

    await waitFor(() => expect(handleMount).toHaveBeenCalledTimes(items.length));
  });

  it('navigates to and selects offscreen items', async () => {
    const handleValueChange = vi.fn();
    const { user } = await render(
      <VirtualizedSelect
        items={createItems(100)}
        defaultValue="Item 1"
        onValueChange={handleValueChange}
        overscanPx={0}
      />,
    );

    const firstItem = await screen.findByRole('option', { name: 'Item 1' });
    await waitFor(() => expect(firstItem).toHaveFocus());

    await user.keyboard(
      '{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}',
    );

    const ninthItem = await screen.findByRole('option', { name: 'Item 9' });
    await waitFor(() => expect(ninthItem).toHaveFocus());
    expect(screen.getAllByRole('option').length).toBeLessThan(20);

    await user.keyboard('{Enter}');
    expect(handleValueChange.mock.lastCall?.[0]).toBe('Item 9');
  });

  it('matches offscreen items with typeahead', async () => {
    const items = [...createItems(100), { value: 'zebra', label: 'Zebra' }];
    const { user } = await render(
      <Select.Root defaultOpen items={items}>
        <Select.Trigger>Open</Select.Trigger>
        <Select.Positioner alignItemWithTrigger={false}>
          <Select.Popup>
            <Select.List>
              <Select.Virtualizer<string>
                estimatedItemHeight={20}
                overscanPx={0}
                render={<div ref={setElementClientHeight(60)} />}
              >
                {(item) => <Select.Item value={item.value}>{item.label}</Select.Item>}
              </Select.Virtualizer>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );

    const trigger = screen.getByRole('combobox');
    act(() => trigger.focus());
    await user.keyboard('z');

    await waitFor(() => expect(screen.getByRole('option', { name: 'Zebra' })).toHaveFocus());
  });

  it('matches item labels with typeahead while the popup is closed', async () => {
    const handleValueChange = vi.fn();
    const items = [...createItems(100), { value: 'zebra', label: 'Zebra' }];
    const { user } = await render(
      <Select.Root items={items} onValueChange={handleValueChange}>
        <Select.Trigger>Open</Select.Trigger>
        <Select.Positioner alignItemWithTrigger={false}>
          <Select.Popup>
            <Select.List>
              <Select.Virtualizer<string> estimatedItemHeight={20}>
                {(item) => <Select.Item value={item.value}>{item.label}</Select.Item>}
              </Select.Virtualizer>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );

    const trigger = screen.getByRole('combobox');
    act(() => trigger.focus());
    await user.keyboard('z');

    expect(handleValueChange.mock.lastCall?.[0]).toBe('zebra');
  });

  it('skips disabled offscreen items using isItemDisabled', async () => {
    const { user } = await render(
      <VirtualizedSelect
        items={createItems(100)}
        defaultValue="Item 1"
        isItemDisabled={(value) => value === 'Item 2'}
        overscanPx={0}
      />,
    );

    const firstItem = await screen.findByRole('option', { name: 'Item 1' });
    await waitFor(() => expect(firstItem).toHaveFocus());
    await user.keyboard('{ArrowDown}');

    await waitFor(() => expect(screen.getByRole('option', { name: 'Item 3' })).toHaveFocus());
    expect(screen.getByRole('option', { name: 'Item 2' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not scroll pointer highlights and resumes scrolling for keyboard highlights', async () => {
    const handleScrollTo = vi.fn();

    const { user } = await render(
      <Select.Root defaultOpen items={createItems(10)}>
        <Select.Trigger>Open</Select.Trigger>
        <Select.Positioner alignItemWithTrigger={false}>
          <Select.Popup>
            <Select.List>
              <Select.Virtualizer<string>
                estimatedItemHeight={20}
                overscanPx={0}
                render={
                  <div
                    ref={setElementScrollState({
                      clientHeight: 40,
                      getScrollTop: () => 0,
                      scrollTo: handleScrollTo,
                    })}
                  />
                }
              >
                {(item) => (
                  <Select.Item value={item.value} style={{ height: 20 }}>
                    {item.label}
                  </Select.Item>
                )}
              </Select.Virtualizer>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );

    const lastRenderedItem = await screen.findByRole('option', { name: 'Item 3' });
    await user.hover(lastRenderedItem);

    await waitFor(() => expect(lastRenderedItem).toHaveAttribute('data-highlighted'));
    expect(handleScrollTo).not.toHaveBeenCalled();

    await user.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(handleScrollTo).toHaveBeenLastCalledWith({
        behavior: 'instant',
        top: 40,
      }),
    );
  });

  it('supports object values with stable keys', async () => {
    const items = [
      { value: { id: 'a' }, label: 'Alpha' },
      { value: { id: 'b' }, label: 'Beta' },
    ];

    await render(
      <Select.Root defaultOpen items={items}>
        <Select.Positioner alignItemWithTrigger={false}>
          <Select.Popup>
            <Select.List>
              <Select.Virtualizer<{ id: string }>
                estimatedItemHeight={20}
                getItemKey={(item) => item.value.id}
                render={<div ref={setElementClientHeight(40)} />}
              >
                {(item) => (
                  <Select.Item value={item.value}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                  </Select.Item>
                )}
              </Select.Virtualizer>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );

    expect(await screen.findByRole('option', { name: 'Alpha' })).not.toBe(null);
    expect(screen.getByRole('option', { name: 'Beta' })).not.toBe(null);
  });

  it('warns when used without Select.List', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <Select.Root defaultOpen items={createItems(1)}>
          <Select.Positioner alignItemWithTrigger={false}>
            <Select.Popup>
              <Select.Virtualizer<string> estimatedItemHeight={20}>
                {(item) => <Select.Item value={item.value}>{item.label}</Select.Item>}
              </Select.Virtualizer>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>,
      );

      expect(
        warnSpy.mock.calls.some(([message]) =>
          String(message).includes('must be placed inside <Select.List>'),
        ),
      ).toBe(true);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns when a virtualized item is disabled without isItemDisabled', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <Select.Root defaultOpen items={createItems(1)}>
          <Select.Positioner alignItemWithTrigger={false}>
            <Select.Popup>
              <Select.List>
                <Select.Virtualizer<string> estimatedItemHeight={20}>
                  {(item) => (
                    <Select.Item value={item.value} disabled>
                      {item.label}
                    </Select.Item>
                  )}
                </Select.Virtualizer>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>,
      );

      expect(
        warnSpy.mock.calls.some(([message]) =>
          String(message).includes(
            'virtualized <Select.Item> is disabled, but <Select.Root> does not have an ' +
              '`isItemDisabled` prop',
          ),
        ),
      ).toBe(true);
    } finally {
      warnSpy.mockRestore();
    }
  });

  function renderVirtualizedSelect(props: {
    items: Array<{ value: string; label: string }>;
    overscanPx?: number;
  }) {
    return render(<VirtualizedSelect {...props} />);
  }
});

interface VirtualizedSelectProps {
  items: Array<{ value: string; label: string }>;
  defaultValue?: string;
  isItemDisabled?: (value: string, index: number) => boolean;
  onValueChange?: (value: string | null) => void;
  overscanPx?: number;
}

function VirtualizedSelect(props: VirtualizedSelectProps) {
  return (
    <Select.Root
      defaultOpen
      defaultValue={props.defaultValue}
      items={props.items}
      isItemDisabled={props.isItemDisabled}
      onValueChange={props.onValueChange}
    >
      <Select.Trigger>Open</Select.Trigger>
      <Select.Positioner alignItemWithTrigger={false}>
        <Select.Popup>
          <Select.List>
            <Select.Virtualizer<string>
              overscanPx={props.overscanPx ?? 20}
              render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
            >
              {(item) => (
                <Select.Item value={item.value} style={{ height: 20 }}>
                  <Select.ItemText>{item.label}</Select.ItemText>
                </Select.Item>
              )}
            </Select.Virtualizer>
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Root>
  );
}

function createItems(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const label = `Item ${index + 1}`;
    return { value: label, label };
  });
}
