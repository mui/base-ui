import * as React from 'react';
import { expect, vi } from 'vitest';
import { Select } from '@base-ui/react/select';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

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
      await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(5));

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

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(5));

    expect(screen.getByRole('option', { name: 'Item 1' })).not.toBe(null);
    expect(screen.getByRole('option', { name: 'Item 5' })).not.toBe(null);
    expect(screen.queryByRole('option', { name: 'Item 20' })).toBe(null);

    const virtualizer = screen.getByTestId('virtualizer');
    expect(virtualizer).toHaveStyle({ overflow: 'auto' });
    expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2000px');
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

  it('does not rebuild rows when inline configuration callbacks change identity', async () => {
    type Value = { id: string; size: number };
    const items = Array.from({ length: 10 }, (_, index) => ({
      value: { id: String(index), size: 20 },
      label: `Item ${index}`,
    }));
    const handleGetItemKey = vi.fn();
    const handleEstimatedItemHeight = vi.fn();

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
                  {(item) => (
                    <Select.Item value={item.value} style={{ height: item.value.size }}>
                      {item.label}
                    </Select.Item>
                  )}
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

    await rerender(<Test />);

    expect(handleGetItemKey).not.toHaveBeenCalled();
    expect(handleEstimatedItemHeight.mock.calls.length).toBeLessThan(items.length);
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
              estimatedItemHeight={20}
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

function setElementClientHeight(clientHeight: number) {
  return (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }

    element.style.height = `${clientHeight}px`;
    Object.defineProperty(element, 'clientHeight', {
      configurable: true,
      value: clientHeight,
    });
    Object.defineProperty(element, 'scrollTo', {
      configurable: true,
      value: (options: ScrollToOptions) => {
        element.scrollTop = options.top ?? element.scrollTop;
      },
    });
  };
}

function setElementScrollState(options: {
  clientHeight: number;
  getScrollTop: () => number;
  scrollTo: (options: ScrollToOptions) => void;
}) {
  return (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }

    element.style.height = `${options.clientHeight}px`;
    Object.defineProperty(element, 'clientHeight', {
      configurable: true,
      value: options.clientHeight,
    });
    Object.defineProperty(element, 'scrollTop', {
      configurable: true,
      get: options.getScrollTop,
    });
    Object.defineProperty(element, 'scrollTo', {
      configurable: true,
      value: options.scrollTo,
    });
  };
}

function createDOMRect(rect: Partial<DOMRectInit>) {
  return {
    x: rect.x ?? 0,
    y: rect.y ?? 0,
    width: rect.width ?? 0,
    height: rect.height ?? 0,
    top: rect.y ?? 0,
    left: rect.x ?? 0,
    right: (rect.x ?? 0) + (rect.width ?? 0),
    bottom: (rect.y ?? 0) + (rect.height ?? 0),
    toJSON() {
      return this;
    },
  } as DOMRect;
}
