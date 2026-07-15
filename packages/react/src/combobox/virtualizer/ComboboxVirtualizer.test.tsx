import * as React from 'react';
import { expect, vi } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Combobox.Virtualizer />', () => {
  const { render } = createRenderer();
  const { render: renderNonStrict } = createRenderer({ strict: false });

  describeConformance(
    <Combobox.Virtualizer estimateSize={20}>
      {(item: string) => (
        <Combobox.Item key={item} value={item}>
          {item}
        </Combobox.Item>
      )}
    </Combobox.Virtualizer>,
    () => ({
      refInstanceof: window.HTMLDivElement,
      render(node) {
        return render(
          <Combobox.Root defaultOpen items={['one']}>
            <Combobox.List>{node}</Combobox.List>
          </Combobox.Root>,
        );
      },
    }),
  );

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

  it('only renders the visible combobox items', async () => {
    await render(
      <Combobox.Root defaultOpen items={createItems(100)}>
        <Combobox.List>
          <Combobox.Virtualizer
            estimateSize={20}
            overscan={1}
            render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
          >
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(5));

    expect(screen.getByRole('option', { name: 'Item 1' })).not.toBe(null);
    expect(screen.getByRole('option', { name: 'Item 5' })).not.toBe(null);
    expect(screen.queryByRole('option', { name: 'Item 20' })).toBe(null);

    const virtualizer = screen.getByTestId('virtualizer');
    expect(virtualizer).toHaveStyle({ overflow: 'auto' });
    expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2000px');
  });

  it('passes virtual metadata to combobox items', async () => {
    await render(
      <Combobox.Root defaultOpen items={createItems(10)}>
        <Combobox.List>
          <Combobox.Virtualizer
            estimateSize={20}
            paddingStart={4}
            overscan={0}
            render={<div ref={setElementClientHeight(40)} />}
          >
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const firstItem = await screen.findByRole('option', { name: 'Item 1' });

    expect(firstItem).toHaveAttribute('aria-posinset', '1');
    expect(firstItem).toHaveAttribute('aria-setsize', '10');
    expect(firstItem).toHaveAttribute('data-index', '0');
    expect(firstItem).toHaveStyle({ marginTop: '4px' });
  });

  it.skipIf(isJSDOM)('updates the total size after measuring items', async () => {
    await render(
      <Combobox.Root defaultOpen items={createItems(3)}>
        <Combobox.List>
          <Combobox.Virtualizer
            estimateSize={10}
            overscan={0}
            render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
          >
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() =>
      expect(Number.parseFloat(virtualizer.style.getPropertyValue('--total-size'))).toBeGreaterThan(
        30,
      ),
    );
  });

  it('updates the rendered items when scrolled', async () => {
    let scrollTop = 0;

    await render(
      <Combobox.Root defaultOpen items={createItems(100)}>
        <Combobox.List>
          <Combobox.Virtualizer
            estimateSize={20}
            overscan={0}
            render={
              <div
                ref={setElementScrollState({
                  clientHeight: 60,
                  getScrollTop: () => scrollTop,
                  scrollTo: vi.fn(),
                })}
                data-testid="virtualizer"
              />
            }
          >
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const virtualizer = screen.getByTestId('virtualizer');
    scrollTop = 200;
    fireEvent.scroll(virtualizer);

    await waitFor(() => expect(screen.queryByRole('option', { name: 'Item 1' })).toBe(null));
    expect(screen.getByRole('option', { name: 'Item 11' })).not.toBe(null);
  });

  it('selects the highlighted filtered item without explicit item indices', async () => {
    const { user } = await render(
      <Combobox.Root items={['one', 'two', 'three', 'four', 'five']}>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Virtualizer
                  estimateSize={20}
                  render={<div ref={setElementClientHeight(80)} />}
                >
                  {(item: string) => (
                    <Combobox.Item key={item} value={item}>
                      {item}
                    </Combobox.Item>
                  )}
                </Combobox.Virtualizer>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await user.click(input);
    await waitFor(() => expect(screen.getByRole('listbox')).not.toBe(null));

    await user.type(input, 'f');
    await waitFor(() => expect(screen.queryByRole('option', { name: 'one' })).toBe(null));
    expect(screen.getByRole('option', { name: 'four' })).not.toBe(null);

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(input).toHaveValue('four'));
    expect(screen.queryByRole('listbox')).toBe(null);
  });

  it('scrolls the highlighted item into view', async () => {
    let scrollTop = 0;
    const handleScrollTo = vi.fn((options: ScrollToOptions) => {
      scrollTop = options.top ?? scrollTop;
    });

    const { user } = await render(
      <Combobox.Root defaultOpen items={createItems(10)}>
        <Combobox.Input data-testid="input" />
        <Combobox.List>
          <Combobox.Virtualizer
            estimateSize={20}
            overscan={1}
            render={
              <div
                ref={setElementScrollState({
                  clientHeight: 40,
                  getScrollTop: () => scrollTop,
                  scrollTo: handleScrollTo,
                })}
              />
            }
          >
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    await user.click(screen.getByTestId('input'));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');

    await waitFor(() => expect(handleScrollTo).toHaveBeenCalled());
    expect(scrollTop).toBeGreaterThan(0);
  });

  it('aligns an oversized highlighted item with the start of the viewport', async () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockImplementation(function mockRect(
      this: HTMLElement,
    ) {
      if (this.hasAttribute('data-index')) {
        return createDOMRect({ height: 80, width: 200 });
      }

      return createDOMRect({ height: 40, width: 200 });
    });

    let scrollTop = 0;
    const handleScrollTo = vi.fn((options: ScrollToOptions) => {
      scrollTop = options.top ?? scrollTop;
    });

    const { user } = await render(
      <Combobox.Root defaultOpen items={createItems(3)}>
        <Combobox.Input data-testid="input" />
        <Combobox.List>
          <Combobox.Virtualizer
            estimateSize={80}
            overscan={0}
            render={
              <div
                ref={setElementScrollState({
                  clientHeight: 40,
                  getScrollTop: () => scrollTop,
                  scrollTo: handleScrollTo,
                })}
              />
            }
          >
            {(item: string) => (
              <Combobox.Item key={item} value={item} style={{ height: 80 }}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    await user.click(screen.getByTestId('input'));
    await user.keyboard('{ArrowDown}');

    await waitFor(() => expect(handleScrollTo).toHaveBeenCalled());
    expect(scrollTop).toBe(0);
  });

  it('does not scroll an item highlighted with the pointer', async () => {
    const handleScrollTo = vi.fn();

    const { user } = await render(
      <Combobox.Root defaultOpen items={createItems(10)}>
        <Combobox.List>
          <Combobox.Virtualizer
            estimateSize={20}
            overscan={0}
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
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const lastRenderedItem = await screen.findByRole('option', { name: 'Item 3' });
    await user.hover(lastRenderedItem);

    await waitFor(() => expect(lastRenderedItem).toHaveAttribute('data-highlighted'));
    expect(handleScrollTo).not.toHaveBeenCalled();
  });

  it('does not rerun item renderers when the highlight stays within the rendered window', async () => {
    const renderItem = vi.fn((item: string) => (
      <Combobox.Item key={item} value={item}>
        {item}
      </Combobox.Item>
    ));

    const { user } = await render(
      <Combobox.Root defaultOpen items={createItems(10)}>
        <Combobox.List>
          <Combobox.Virtualizer estimateSize={20} render={<div ref={setElementClientHeight(60)} />}>
            {renderItem}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const firstItem = await screen.findByRole('option', { name: 'Item 1' });
    const initialRenderCount = renderItem.mock.calls.length;
    await user.hover(firstItem);

    await waitFor(() => expect(firstItem).toHaveAttribute('data-highlighted'));
    expect(renderItem).toHaveBeenCalledTimes(initialRenderCount);
  });

  it('does not remount items when the built-in virtualizer takes over', async () => {
    const handleFirstItemMount = vi.fn();

    function Item(props: { item: string }) {
      const { item } = props;

      React.useEffect(() => {
        if (item === 'Item 1') {
          handleFirstItemMount();
        }
      }, [item]);

      return <Combobox.Item value={item}>{item}</Combobox.Item>;
    }

    await renderNonStrict(
      <Combobox.Root defaultOpen items={createItems(20)}>
        <Combobox.List>
          <Combobox.Virtualizer estimateSize={20} render={<div ref={setElementClientHeight(40)} />}>
            {(item: string) => <Item item={item} />}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    await screen.findByRole('option', { name: 'Item 1' });
    expect(handleFirstItemMount).toHaveBeenCalledTimes(1);
  });

  it('keeps an offscreen highlighted item mounted for selection', async () => {
    const handleItemClick = vi.fn();
    const { user } = await render(
      <Combobox.Root defaultOpen items={createItems(20)}>
        <Combobox.Input data-testid="input" />
        <Combobox.List>
          <Combobox.Virtualizer
            estimateSize={20}
            overscan={0}
            render={
              <div
                ref={setElementScrollState({
                  clientHeight: 40,
                  getScrollTop: () => 0,
                  scrollTo: vi.fn(),
                })}
              />
            }
          >
            {(item: string) => (
              <Combobox.Item key={item} value={item} onClick={handleItemClick}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await user.click(input);
    await user.keyboard(
      '{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}',
    );

    const activeId = input.getAttribute('aria-activedescendant');
    expect(activeId).not.toBe(null);

    const activeItem = input.ownerDocument.getElementById(activeId as string);
    expect(activeItem).toHaveTextContent('Item 8');
    expect(screen.getAllByRole('option').length).toBeLessThan(20);

    await user.keyboard('{Enter}');
    await waitFor(() => expect(input).toHaveValue('Item 8'));
    expect(handleItemClick).toHaveBeenCalledTimes(1);
  });

  it('renders all items when disabled', async () => {
    await render(
      <Combobox.Root defaultOpen items={createItems(20)}>
        <Combobox.List>
          <Combobox.Virtualizer
            enabled={false}
            estimateSize={20}
            render={<div ref={setElementClientHeight(40)} />}
          >
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(20));
  });

  it('updates the rendered items when enabled changes', async () => {
    function Test(props: { enabled: boolean }) {
      return (
        <Combobox.Root defaultOpen items={createItems(20)}>
          <Combobox.List>
            <Combobox.Virtualizer
              enabled={props.enabled}
              estimateSize={20}
              overscan={0}
              render={<div ref={setElementClientHeight(40)} />}
            >
              {(item: string) => (
                <Combobox.Item key={item} value={item}>
                  {item}
                </Combobox.Item>
              )}
            </Combobox.Virtualizer>
          </Combobox.List>
        </Combobox.Root>
      );
    }

    const { rerender } = await render(<Test enabled />);

    await waitFor(() => expect(screen.queryByRole('option', { name: 'Item 20' })).toBe(null), {
      timeout: 2000,
    });

    await rerender(<Test enabled={false} />);
    await waitFor(() => expect(screen.getByRole('option', { name: 'Item 20' })).not.toBe(null));

    await rerender(<Test enabled />);
    await waitFor(() => expect(screen.queryByRole('option', { name: 'Item 20' })).toBe(null), {
      timeout: 2000,
    });
  });
});

function createItems(count: number) {
  return Array.from({ length: count }, (_, index) => `Item ${index + 1}`);
}

function setElementClientHeight(clientHeight: number) {
  return (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }

    Object.defineProperty(element, 'clientHeight', {
      configurable: true,
      value: clientHeight,
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
