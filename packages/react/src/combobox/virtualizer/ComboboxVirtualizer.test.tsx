import * as React from 'react';
import { expect, vi } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import {
  createRenderer,
  describeConformance,
  isJSDOM,
  createDOMRect,
  setElementClientHeight,
  setElementScrollState,
} from '#test-utils';

describe('<Combobox.Virtualizer />', () => {
  const { render } = createRenderer();
  const { render: renderNonStrict } = createRenderer({ strict: false });

  describeConformance(
    <Combobox.Virtualizer estimatedItemHeight={20}>
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
            overscanPx={20}
            render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
          >
            {(item: string) => (
              <Combobox.Item key={item} value={item} style={{ height: 20 }}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

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

  it('exposes imperative scrolling by logical item index', async () => {
    const actionsRef = React.createRef<Combobox.Virtualizer.Actions>();
    const handleScrollTo = vi.fn();

    await render(
      <Combobox.Root defaultOpen items={createItems(100)}>
        <Combobox.List>
          <Combobox.Virtualizer
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
            {(item: string) => <Combobox.Item value={item}>{item}</Combobox.Item>}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    act(() => actionsRef.current?.scrollToIndex(50, { align: 'end' }));

    expect(handleScrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 960 });
  });

  it('passes virtual metadata to combobox items', async () => {
    await render(
      <Combobox.Root defaultOpen items={createItems(10)}>
        <Combobox.List>
          <Combobox.Virtualizer
            estimatedItemHeight={20}
            overscanPx={0}
            render={<div ref={setElementClientHeight(40)} />}
          >
            {(item: string) => (
              <Combobox.Item key={item} value={item} style={{ height: 20 }}>
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
  });

  it.skipIf(!isJSDOM)('updates estimated size when the prop changes', async () => {
    function Test(props: { estimatedItemHeight: number }) {
      return (
        <Combobox.Root defaultOpen items={createItems(3)}>
          <Combobox.List>
            <Combobox.Virtualizer
              estimatedItemHeight={props.estimatedItemHeight}
              render={<div ref={setElementClientHeight(20)} data-testid="virtualizer" />}
            >
              {(item: string) => <Combobox.Item value={item}>{item}</Combobox.Item>}
            </Combobox.Virtualizer>
          </Combobox.List>
        </Combobox.Root>
      );
    }

    const { rerender } = await render(<Test estimatedItemHeight={20} />);
    const virtualizer = screen.getByTestId('virtualizer');

    await waitFor(() => expect(virtualizer.style.getPropertyValue('--total-size')).toBe('60px'));

    await rerender(<Test estimatedItemHeight={40} />);

    await waitFor(() => expect(virtualizer.style.getPropertyValue('--total-size')).toBe('120px'));
  });

  it.skipIf(!isJSDOM)(
    'updates estimated size when an estimate callback changes behavior',
    async () => {
      const items = createItems(3);

      function Test(props: { estimatedItemHeight: number }) {
        return (
          <Combobox.Root defaultOpen items={items}>
            <Combobox.List>
              <Combobox.Virtualizer
                estimatedItemHeight={() => props.estimatedItemHeight}
                render={<div ref={setElementClientHeight(20)} data-testid="virtualizer" />}
              >
                {(item: string) => <Combobox.Item value={item}>{item}</Combobox.Item>}
              </Combobox.Virtualizer>
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { rerender } = await render(<Test estimatedItemHeight={20} />);
      const virtualizer = screen.getByTestId('virtualizer');

      await waitFor(() => expect(virtualizer.style.getPropertyValue('--total-size')).toBe('60px'));

      await rerender(<Test estimatedItemHeight={40} />);

      await waitFor(() => expect(virtualizer.style.getPropertyValue('--total-size')).toBe('120px'));
    },
  );

  it.skipIf(isJSDOM)('uses real browser geometry to measure and window rows', async () => {
    vi.restoreAllMocks();

    await render(
      <Combobox.Root defaultOpen items={createItems(100)}>
        <Combobox.List>
          <Combobox.Virtualizer
            estimatedItemHeight={20}
            overscanPx={0}
            render={<div data-testid="virtualizer" style={{ height: 60, width: 200 }} />}
          >
            {(item: string) => (
              <Combobox.Item key={item} value={item} style={{ display: 'block', height: 20 }}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2000px'));
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeLessThan(100));

    virtualizer.scrollTop = 200;
    fireEvent.scroll(virtualizer);

    await waitFor(() => expect(screen.queryByRole('option', { name: 'Item 1' })).toBe(null));
    expect(screen.getByRole('option', { name: 'Item 11' })).not.toBe(null);
  });

  it.skipIf(isJSDOM)('supports a max-height constraint without an explicit height', async () => {
    vi.restoreAllMocks();

    await render(
      <Combobox.Root defaultOpen items={createItems(100)}>
        <Combobox.List>
          <Combobox.Virtualizer
            estimatedItemHeight={20}
            render={<div data-testid="virtualizer" style={{ maxHeight: 60, width: 200 }} />}
          >
            {(item: string) => (
              <Combobox.Item key={item} value={item} style={{ display: 'block', height: 20 }}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.clientHeight).toBe(60));
    expect(screen.getAllByRole('option').length).toBeLessThan(100);
  });

  it.skipIf(isJSDOM)(
    'keeps the viewport covered before scroll events update the window',
    async () => {
      vi.restoreAllMocks();

      await render(
        <Combobox.Root defaultOpen items={createItems(1000)}>
          <Combobox.List>
            <Combobox.Virtualizer
              estimatedItemHeight={32}
              overscanPx={64}
              render={<div data-testid="virtualizer" style={{ height: 360, width: 200 }} />}
            >
              {(item: string) => (
                <Combobox.Item key={item} value={item} style={{ display: 'block', height: 32 }}>
                  {item}
                </Combobox.Item>
              )}
            </Combobox.Virtualizer>
          </Combobox.List>
        </Combobox.Root>,
      );

      const virtualizer = screen.getByTestId('virtualizer');
      await waitFor(() =>
        expect(virtualizer.style.getPropertyValue('--total-size')).toBe('32000px'),
      );
      await waitFor(() => expect(screen.getAllByRole('option').length).toBeLessThan(1000));

      virtualizer.scrollTop = 128;

      const viewportRect = virtualizer.getBoundingClientRect();
      const initiallyRenderedItems = screen.getAllByRole('option');
      const lastInitiallyRenderedItem = initiallyRenderedItems.at(-1) as HTMLElement;
      expect(lastInitiallyRenderedItem.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(
        viewportRect.bottom,
      );

      fireEvent.scroll(virtualizer);
      await waitFor(() => expect(screen.queryByRole('option', { name: 'Item 1' })).toBe(null));
      expect(screen.getAllByRole('option').length).toBeLessThan(20);

      virtualizer.scrollTop = 0;

      const firstDownwardItem = screen.getAllByRole('option')[0];
      expect(firstDownwardItem.getBoundingClientRect().top).toBeLessThanOrEqual(viewportRect.top);
    },
  );

  it.skipIf(isJSDOM)(
    'keeps the viewport covered when measured rows are shorter than their estimate',
    async () => {
      vi.restoreAllMocks();

      await render(
        <Combobox.Root defaultOpen items={createItems(100)}>
          <Combobox.List>
            <Combobox.Virtualizer
              estimatedItemHeight={100}
              overscanPx={0}
              render={<div data-testid="virtualizer" style={{ height: 60, width: 200 }} />}
            >
              {(item: string) => (
                <Combobox.Item key={item} value={item} style={{ display: 'block', height: 10 }}>
                  {item}
                </Combobox.Item>
              )}
            </Combobox.Virtualizer>
          </Combobox.List>
        </Combobox.Root>,
      );

      const virtualizer = screen.getByTestId('virtualizer');
      const viewportRect = virtualizer.getBoundingClientRect();
      await waitFor(() =>
        expect(virtualizer.style.getPropertyValue('--total-size')).toBe('1000px'),
      );
      await waitFor(() => {
        const renderedItems = screen.getAllByRole('option');
        const lastRenderedItem = renderedItems.at(-1) as HTMLElement;
        expect(lastRenderedItem.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(
          viewportRect.bottom + 10,
        );
      });

      virtualizer.scrollTop = 1;
      fireEvent.scroll(virtualizer);
      virtualizer.scrollTop = 20;
      fireEvent.scroll(virtualizer);

      const renderedItems = screen.getAllByRole('option');
      const lastRenderedItem = renderedItems.at(-1) as HTMLElement;
      expect(lastRenderedItem.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(
        viewportRect.bottom,
      );
    },
  );

  it('updates the rendered items when scrolled', async () => {
    let scrollTop = 0;

    await render(
      <Combobox.Root defaultOpen items={createItems(100)}>
        <Combobox.List>
          <Combobox.Virtualizer
            estimatedItemHeight={20}
            overscanPx={0}
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
                  estimatedItemHeight={20}
                  render={<div ref={setElementClientHeight(80)} />}
                >
                  {(item: string) => (
                    <Combobox.Item key={item} value={item} style={{ height: 20 }}>
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

  it('navigates to the last logical item when mounted in a portal', async () => {
    let scrollTop = 0;
    const handleScrollTo = vi.fn((options: ScrollToOptions) => {
      scrollTop = options.top ?? scrollTop;
    });

    const { user } = await render(
      <Combobox.Root items={createItems(100)}>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Virtualizer
                  estimatedItemHeight={20}
                  overscanPx={0}
                  render={
                    <div
                      ref={setElementScrollState({
                        clientHeight: 60,
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
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await user.click(input);
    await user.keyboard('{ArrowUp}');

    await waitFor(() => {
      const activeId = input.getAttribute('aria-activedescendant');
      expect(activeId).not.toBe(null);
      expect(input.ownerDocument.getElementById(activeId as string)).toHaveTextContent('Item 100');
    });
    expect(handleScrollTo).toHaveBeenCalled();
  });

  it.skipIf(isJSDOM)(
    'corrects keyboard scrolling after the highlighted row is measured',
    async () => {
      const resizeObserver = mockResizeObserver();
      let scrollTop = 0;
      const handleScrollTo = vi.fn((options: ScrollToOptions) => {
        scrollTop = options.top ?? scrollTop;
      });
      const items = createItems(100);

      function Test(props: { inputLabel: string }) {
        return (
          <Combobox.Root defaultOpen items={[...items]}>
            <Combobox.Input aria-label={props.inputLabel} data-testid="input" />
            <Combobox.List>
              <Combobox.Virtualizer
                estimatedItemHeight={() => 20}
                getItemKey={(item: string) => item}
                overscanPx={0}
                render={
                  <div
                    ref={setElementScrollState({
                      clientHeight: 60,
                      getScrollTop: () => scrollTop,
                      scrollTo: handleScrollTo,
                    })}
                    data-testid="virtualizer"
                  />
                }
              >
                {(item: string) => (
                  <Combobox.Item value={item} style={{ height: 100 }}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.Virtualizer>
            </Combobox.List>
          </Combobox.Root>
        );
      }

      try {
        const { rerender, user } = await render(<Test inputLabel="initial" />);

        const input = screen.getByTestId('input');
        await user.click(input);
        handleScrollTo.mockClear();
        await user.keyboard('{ArrowUp}');

        await waitFor(() => expect(handleScrollTo).toHaveBeenCalled());
        const estimatedScrollTop = handleScrollTo.mock.lastCall?.[0].top ?? 0;

        fireEvent.scroll(screen.getByTestId('virtualizer'));

        const activeId = input.getAttribute('aria-activedescendant');
        expect(activeId).not.toBe(null);
        await waitFor(() => {
          const activeItem = input.ownerDocument.getElementById(activeId as string);
          expect(activeItem?.parentElement).not.toHaveStyle({ position: 'absolute' });
        });

        const activeItem = input.ownerDocument.getElementById(activeId as string);
        expect(activeItem).not.toBe(null);
        expect(activeItem).toHaveTextContent('Item 100');

        await rerender(<Test inputLabel="updated" />);
        handleScrollTo.mockClear();

        await act(async () => resizeObserver.notify(activeItem?.parentElement as HTMLElement, 100));

        await waitFor(() => expect(handleScrollTo).toHaveBeenCalled());
        const correctedScrollTop = handleScrollTo.mock.lastCall?.[0].top ?? 0;
        expect(correctedScrollTop).toBeGreaterThan(estimatedScrollTop);
      } finally {
        resizeObserver.restore();
      }
    },
  );

  it('skips disabled offscreen items during keyboard navigation', async () => {
    let scrollTop = 0;

    const { user } = await render(
      <Combobox.Root
        defaultOpen
        items={createItems(100)}
        isItemDisabled={(_, index) => index === 99}
      >
        <Combobox.Input data-testid="input" />
        <Combobox.List>
          <Combobox.Virtualizer
            estimatedItemHeight={20}
            overscanPx={0}
            render={
              <div
                ref={setElementScrollState({
                  clientHeight: 60,
                  getScrollTop: () => scrollTop,
                  scrollTo(options) {
                    scrollTop = options.top ?? scrollTop;
                  },
                })}
              />
            }
          >
            {(item: string) => <Combobox.Item value={item}>{item}</Combobox.Item>}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await user.click(input);
    await user.keyboard('{ArrowUp}');

    await waitFor(() => {
      const activeId = input.getAttribute('aria-activedescendant');
      expect(activeId).not.toBe(null);
      expect(input.ownerDocument.getElementById(activeId as string)).toHaveTextContent('Item 99');
    });
  });

  it('applies logical disabled state to rendered items', async () => {
    await render(
      <Combobox.Root defaultOpen items={createItems(3)} isItemDisabled={(_, index) => index === 0}>
        <Combobox.List>
          <Combobox.Virtualizer estimatedItemHeight={20}>
            {(item: string) => <Combobox.Item value={item}>{item}</Combobox.Item>}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    expect(await screen.findByRole('option', { name: 'Item 1' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('resets the virtual scroller when filtering without auto-highlight', async () => {
    let scrollTop = 200;
    const handleScrollTo = vi.fn((options: ScrollToOptions) => {
      scrollTop = options.top ?? scrollTop;
    });

    const { user } = await render(
      <Combobox.Root items={createItems(100)}>
        <Combobox.Input data-testid="input" />
        <Combobox.List>
          <Combobox.Virtualizer
            estimatedItemHeight={20}
            render={
              <div
                ref={setElementScrollState({
                  clientHeight: 60,
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

    await user.type(screen.getByTestId('input'), '1');

    expect(handleScrollTo).toHaveBeenCalledWith({ behavior: 'instant', top: 0 });
    expect(scrollTop).toBe(0);
  });

  it('scrolls an initially selected offscreen item into view', async () => {
    let scrollTop = 0;
    const handleScrollTo = vi.fn((options: ScrollToOptions) => {
      scrollTop = options.top ?? scrollTop;
    });

    const { user } = await render(
      <Combobox.Root defaultValue="Item 50" items={createItems(100)}>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Virtualizer
                  estimatedItemHeight={20}
                  overscanPx={0}
                  render={
                    <div
                      ref={setElementScrollState({
                        clientHeight: 60,
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
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    await user.click(screen.getByTestId('input'));

    await waitFor(() =>
      expect(handleScrollTo).toHaveBeenLastCalledWith({
        behavior: 'instant',
        top: 940,
      }),
    );
    expect(
      screen.getByRole('option', { name: 'Item 50' }).closest<HTMLElement>('[data-row-index]')
        ?.style.position,
    ).toBe('');
    expect(scrollTop).toBeGreaterThan(0);
  });

  it.skipIf(isJSDOM)(
    'renders a distant selection immediately without changing its alignment',
    async () => {
      vi.restoreAllMocks();

      function Test(props: { rowHeight: number }) {
        return (
          <Combobox.Root defaultValue="Item 4000" items={createItems(10000)}>
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Virtualizer
                      estimatedItemHeight={32}
                      overscanPx={640}
                      render={<div data-testid="virtualizer" style={{ height: 352, width: 256 }} />}
                    >
                      {(item: string) => (
                        <Combobox.Item
                          value={item}
                          style={{ display: 'block', height: props.rowHeight }}
                        >
                          {item}
                        </Combobox.Item>
                      )}
                    </Combobox.Virtualizer>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        );
      }

      const { user, rerender } = await render(<Test rowHeight={33} />);

      await user.click(screen.getByTestId('input'));

      const virtualizer = screen.getByTestId('virtualizer');
      const selectedItem = screen.getByRole('option', { name: 'Item 4000' });
      expect(selectedItem.closest<HTMLElement>('[data-row-index]')?.style.position).toBe('');
      const viewport = virtualizer.getBoundingClientRect();
      const selectedRect = selectedItem.getBoundingClientRect();
      expect(selectedRect.bottom > viewport.top && selectedRect.top < viewport.bottom).toBe(true);
      const initialBottomOffset = viewport.bottom - selectedRect.bottom;

      await rerender(<Test rowHeight={32} />);
      await act(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 250);
          }),
      );

      const settledViewport = virtualizer.getBoundingClientRect();
      const settledRect = selectedItem.getBoundingClientRect();
      expect(settledViewport.bottom - settledRect.bottom).toBeCloseTo(initialBottomOffset);
    },
  );

  it.skipIf(isJSDOM)('scrolls to the selected item when ArrowDown reopens the popup', async () => {
    vi.restoreAllMocks();

    const { user } = await render(
      <Combobox.Root defaultValue="Item 50" items={createItems(100)}>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Virtualizer
                  estimatedItemHeight={20}
                  overscanPx={0}
                  render={<div data-testid="virtualizer" style={{ height: 60, width: 200 }} />}
                >
                  {(item: string) => (
                    <Combobox.Item key={item} value={item} style={{ display: 'block', height: 20 }}>
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
    await screen.findByRole('option', { name: 'Item 50' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));

    await user.keyboard('{ArrowDown}');

    const virtualizer = await screen.findByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.scrollTop).toBeGreaterThan(0));
    await waitFor(() =>
      expect(
        screen.getByRole('option', { name: 'Item 50' }).closest<HTMLElement>('[data-row-index]')
          ?.style.position,
      ).toBe(''),
    );
    await waitFor(() => {
      const viewport = virtualizer.getBoundingClientRect();
      const selectedItem = screen.getByRole('option', { name: 'Item 50' });
      const rect = selectedItem.getBoundingClientRect();
      expect(rect.bottom > viewport.top && rect.top < viewport.bottom).toBe(true);
    });
  });

  it.skipIf(isJSDOM)(
    'keeps a filtered selection visible when reopening a variable-height list',
    async () => {
      vi.restoreAllMocks();

      function Test() {
        const [expanded, setExpanded] = React.useState(false);

        return (
          <Combobox.Root items={createItems(10000)}>
            <Combobox.Input data-testid="input" />
            <Combobox.Trigger data-testid="trigger" onClick={() => setExpanded(true)} />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Virtualizer
                      estimatedItemHeight={12}
                      overscanPx={0}
                      render={
                        <div
                          data-testid="virtualizer"
                          style={{
                            border: '1px solid transparent',
                            boxSizing: 'border-box',
                            height: expanded ? 352 : 32,
                            scrollPaddingBlock: 4,
                            width: 200,
                          }}
                        />
                      }
                    >
                      {(item: string) => {
                        const itemNumber = Number(item.slice('Item '.length));
                        const hasLargeText = itemNumber % 3 === 0;
                        const hasTwoLines = itemNumber % 5 === 0;
                        let height = 32;
                        if (hasLargeText && hasTwoLines) {
                          height = 64;
                        } else if (hasTwoLines) {
                          height = 48;
                        } else if (hasLargeText) {
                          height = 40;
                        }

                        return (
                          <Combobox.Item
                            key={item}
                            value={item}
                            style={{ display: 'block', height }}
                          >
                            {item}
                          </Combobox.Item>
                        );
                      }}
                    </Combobox.Virtualizer>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        );
      }

      const { user } = await render(<Test />);

      const input = screen.getByTestId('input');
      await user.type(input, 'Item 9997');
      await user.click(await screen.findByRole('option', { name: 'Item 9997' }));
      await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));

      await user.click(screen.getByTestId('trigger'));

      const virtualizer = await screen.findByTestId('virtualizer');
      const selectedItem = await screen.findByRole('option', { name: 'Item 9997' });
      await waitFor(() => expect(virtualizer.scrollHeight).toBeGreaterThan(300000));
      await waitFor(() =>
        expect(selectedItem.closest<HTMLElement>('[data-row-index]')?.style.position).toBe(''),
      );
      await waitFor(() => {
        const viewport = virtualizer.getBoundingClientRect();
        const rect = selectedItem.getBoundingClientRect();
        expect(rect.bottom > viewport.top && rect.top < viewport.bottom).toBe(true);
      });
    },
  );

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
            estimatedItemHeight={20}
            overscanPx={20}
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
              <Combobox.Item key={item} value={item} style={{ height: 20 }}>
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

    await waitFor(() =>
      expect(handleScrollTo).toHaveBeenLastCalledWith({
        behavior: 'instant',
        top: 20,
      }),
    );
    expect(scrollTop).toBe(20);
  });

  it.skipIf(isJSDOM)('does not scroll keyboard highlights through DOM scrollIntoView', async () => {
    vi.restoreAllMocks();
    const scrollIntoViewSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollIntoView')
      .mockImplementation(() => {});

    try {
      const { user } = await render(
        <Combobox.Root defaultOpen items={createItems(1000)}>
          <Combobox.Input data-testid="input" />
          <Combobox.List>
            <Combobox.Virtualizer
              estimatedItemHeight={20}
              overscanPx={0}
              render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
            >
              {(item: string) => (
                <Combobox.Item key={item} value={item} style={{ height: 20 }}>
                  {item}
                </Combobox.Item>
              )}
            </Combobox.Virtualizer>
          </Combobox.List>
        </Combobox.Root>,
      );

      await user.click(screen.getByTestId('input'));
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

  it('uses computed CSS scroll padding when scrolling the highlighted item', async () => {
    let scrollTop = 0;
    const handleScrollTo = vi.fn((options: ScrollToOptions) => {
      scrollTop = options.top ?? scrollTop;
    });

    const { user } = await render(
      <Combobox.Root defaultOpen items={createItems(10)}>
        <Combobox.Input data-testid="input" />
        <Combobox.List>
          <Combobox.Virtualizer
            estimatedItemHeight={20}
            overscanPx={0}
            style={{ scrollPaddingBottom: 8, scrollPaddingTop: 8 }}
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
              <Combobox.Item key={item} value={item} style={{ height: 20 }}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    await user.click(screen.getByTestId('input'));
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

    await waitFor(() =>
      expect(handleScrollTo).toHaveBeenLastCalledWith({
        behavior: 'instant',
        top: 28,
      }),
    );
    expect(scrollTop).toBe(28);
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
            estimatedItemHeight={80}
            overscanPx={0}
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

  it('does not scroll pointer highlights and resumes scrolling for keyboard highlights', async () => {
    const handleScrollTo = vi.fn();

    const { user } = await render(
      <Combobox.Root defaultOpen items={createItems(10)}>
        <Combobox.Input data-testid="input" />
        <Combobox.List>
          <Combobox.Virtualizer
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
            {(item: string) => (
              <Combobox.Item key={item} value={item} style={{ height: 20 }}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const lastRenderedItem = await screen.findByRole('option', { name: 'Item 3' });
    await user.click(screen.getByTestId('input'));
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

  it('does not rerun item renderers when the highlight stays within the rendered window', async () => {
    const renderItem = vi.fn((item: string) => (
      <Combobox.Item key={item} value={item} style={{ height: 20 }}>
        {item}
      </Combobox.Item>
    ));

    const { user } = await render(
      <Combobox.Root defaultOpen items={createItems(10)}>
        <Combobox.List>
          <Combobox.Virtualizer
            estimatedItemHeight={20}
            render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
          >
            {renderItem}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const firstItem = await screen.findByRole('option', { name: 'Item 1' });
    await waitFor(() =>
      expect(screen.getByTestId('virtualizer').style.getPropertyValue('--total-size')).toBe(
        '200px',
      ),
    );
    renderItem.mockClear();
    await user.hover(firstItem);

    await waitFor(() => expect(firstItem).toHaveAttribute('data-highlighted'));
    expect(renderItem).not.toHaveBeenCalled();
  });

  it('reuses rows when inline configuration callbacks return the same values', async () => {
    type Item = { id: string; label: string; size: number };
    const items: Item[] = Array.from({ length: 10 }, (_, index) => ({
      id: String(index),
      label: `Item ${index}`,
      size: 20,
    }));
    const handleGetItemKey = vi.fn();
    const handleEstimatedItemHeight = vi.fn();
    const itemToStringLabel = (item: Item) => item.label;
    const renderItem = vi.fn((item: Item) => (
      <Combobox.Item value={item} style={{ height: item.size }}>
        {item.label}
      </Combobox.Item>
    ));

    function Test() {
      return (
        <Combobox.Root defaultOpen items={items} itemToStringLabel={itemToStringLabel}>
          <Combobox.List>
            <Combobox.Virtualizer
              estimatedItemHeight={(item: Item) => {
                handleEstimatedItemHeight(item);
                return item.size;
              }}
              getItemKey={(item: Item) => {
                handleGetItemKey(item);
                return item.id;
              }}
              render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
            >
              {renderItem}
            </Combobox.Virtualizer>
          </Combobox.List>
        </Combobox.Root>
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
          <Combobox.Virtualizer
            estimatedItemHeight={20}
            render={<div ref={setElementClientHeight(40)} />}
          >
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
            estimatedItemHeight={20}
            overscanPx={0}
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

  it('keeps an offscreen highlighted item layout-neutral and unmeasured', async () => {
    let scrollTop = 0;
    const handleScrollTo = vi.fn((options: ScrollToOptions) => {
      scrollTop = options.top ?? scrollTop;
    });

    const { user } = await render(
      <Combobox.Root defaultOpen items={createItems(100)}>
        <Combobox.Input data-testid="input" />
        <Combobox.List>
          <Combobox.Virtualizer
            estimatedItemHeight={32}
            overscanPx={0}
            render={
              <div
                ref={setElementScrollState({
                  clientHeight: 64,
                  getScrollTop: () => scrollTop,
                  scrollTo: handleScrollTo,
                })}
                data-testid="virtualizer"
              />
            }
          >
            {(item: string) => (
              <Combobox.Item
                key={item}
                value={item}
                style={{ boxSizing: 'border-box', height: 32, paddingBlock: 8 }}
              >
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    const activeId = input.getAttribute('aria-activedescendant');
    expect(activeId).not.toBe(null);

    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.style.getPropertyValue('--total-size')).toBe('3200px'));
    scrollTop = 320;
    fireEvent.scroll(virtualizer);

    const activeItem = input.ownerDocument.getElementById(activeId as string);
    await waitFor(() => expect(activeItem).not.toBe(null));
    expect(activeItem?.parentElement).toHaveStyle({ position: 'absolute' });
    expect(activeItem?.parentElement?.style.transform).toBe('translateX(-10000px)');
    expect(virtualizer.style.getPropertyValue('--total-size')).toBe('3200px');
  });

  it('does not remount an item when it becomes the offscreen focus proxy', async () => {
    let scrollTop = 0;
    const handleItemMount = vi.fn();

    function Item(props: { item: string }) {
      React.useEffect(() => {
        if (props.item === 'Item 1') {
          handleItemMount();
        }
      }, [props.item]);

      return <Combobox.Item value={props.item}>{props.item}</Combobox.Item>;
    }

    const { user } = await renderNonStrict(
      <Combobox.Root defaultOpen items={createItems(100)}>
        <Combobox.Input data-testid="input" />
        <Combobox.List>
          <Combobox.Virtualizer
            estimatedItemHeight={32}
            overscanPx={0}
            render={
              <div
                ref={setElementScrollState({
                  clientHeight: 64,
                  getScrollTop: () => scrollTop,
                  scrollTo(options) {
                    scrollTop = options.top ?? scrollTop;
                  },
                })}
                data-testid="virtualizer"
              />
            }
          >
            {(item: string) => <Item item={item} />}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    expect(handleItemMount).toHaveBeenCalledTimes(1);

    scrollTop = 320;
    fireEvent.scroll(screen.getByTestId('virtualizer'));

    await waitFor(() => {
      const activeId = input.getAttribute('aria-activedescendant');
      const activeItem = input.ownerDocument.getElementById(activeId as string);
      expect(activeItem?.parentElement).toHaveStyle({ position: 'absolute' });
    });
    expect(handleItemMount).toHaveBeenCalledTimes(1);
  });

  it('passes the item and filtered index to estimatedItemHeight', async () => {
    const estimatedItemHeight = vi.fn((item: string, index: number) => item.length + index + 10);

    await render(
      <Combobox.Root defaultOpen items={['a', 'longer']}>
        <Combobox.List>
          <Combobox.Virtualizer estimatedItemHeight={estimatedItemHeight}>
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    await waitFor(() => expect(estimatedItemHeight).toHaveBeenCalledWith('a', 0));
    expect(estimatedItemHeight).toHaveBeenCalledWith('longer', 1);
  });

  it('uses stable item keys for object values', async () => {
    const items = [
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Beta' },
    ];
    const getItemKey = vi.fn((item: (typeof items)[number]) => item.id);

    await render(
      <Combobox.Root
        defaultOpen
        items={items}
        itemToStringLabel={(item: (typeof items)[number]) => item.label}
      >
        <Combobox.List>
          <Combobox.Virtualizer
            estimatedItemHeight={20}
            getItemKey={getItemKey}
            render={<div ref={setElementClientHeight(40)} />}
          >
            {(item: (typeof items)[number]) => (
              <Combobox.Item value={item}>{item.label}</Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    await waitFor(() => expect(getItemKey).toHaveBeenCalledWith(items[0]));
    expect(getItemKey.mock.calls.every((call) => call.length === 1)).toBe(true);
  });

  it('preserves row identity when object items are recreated and reordered', async () => {
    type Item = { id: string; label: string; size: number };

    function Test(props: { items: Item[] }) {
      return (
        <Combobox.Root
          defaultOpen
          items={props.items}
          itemToStringLabel={(item: Item) => item.label}
        >
          <Combobox.List>
            <Combobox.Virtualizer
              estimatedItemHeight={(item: Item) => item.size}
              getItemKey={(item: Item) => item.id}
              render={<div ref={setElementClientHeight(200)} />}
            >
              {(item: Item) => (
                <Combobox.Item value={item} style={{ height: item.size }}>
                  {item.label}
                </Combobox.Item>
              )}
            </Combobox.Virtualizer>
          </Combobox.List>
        </Combobox.Root>
      );
    }

    const initialItems = [
      { id: 'a', label: 'Alpha', size: 20 },
      { id: 'b', label: 'Beta', size: 40 },
      { id: 'c', label: 'Gamma', size: 60 },
    ];
    const { rerender } = await render(<Test items={initialItems} />);
    const alpha = await screen.findByRole('option', { name: 'Alpha' });

    await rerender(<Test items={[...initialItems].reverse().map((item) => ({ ...item }))} />);

    expect(screen.getByRole('option', { name: 'Alpha' })).toBe(alpha);
    expect(alpha).toHaveAttribute('data-index', '2');
  });

  it('warns about duplicate item keys', async () => {
    const items = [
      { id: 'same', label: 'Alpha' },
      { id: 'same', label: 'Beta' },
    ];
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await render(
        <Combobox.Root
          defaultOpen
          items={items}
          itemToStringLabel={(item: (typeof items)[number]) => item.label}
        >
          <Combobox.List>
            <Combobox.Virtualizer
              estimatedItemHeight={20}
              getItemKey={(item: (typeof items)[number]) => item.id}
            >
              {(item: (typeof items)[number]) => (
                <Combobox.Item value={item}>{item.label}</Combobox.Item>
              )}
            </Combobox.Virtualizer>
          </Combobox.List>
        </Combobox.Root>,
      );

      expect(
        warnSpy.mock.calls.some(([message]) =>
          String(message).includes('received the duplicate item key `same`'),
        ),
      ).toBe(true);
    } finally {
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });

  it('keeps primitive values with the same string representation distinct', async () => {
    const firstSymbol = Symbol('same');
    const secondSymbol = Symbol('same');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await render(
        <Combobox.Root defaultOpen items={[1, '1', firstSymbol, secondSymbol]}>
          <Combobox.List>
            <Combobox.Virtualizer<string | number | symbol> estimatedItemHeight={20}>
              {(item: string | number | symbol, index) => (
                <Combobox.Item value={item}>{`${typeof item} ${index}`}</Combobox.Item>
              )}
            </Combobox.Virtualizer>
          </Combobox.List>
        </Combobox.Root>,
      );

      expect(screen.getAllByRole('option')).toHaveLength(4);
      expect(errorSpy.mock.calls.some(([message]) => String(message).includes('same key'))).toBe(
        false,
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('updates virtual metadata and empty state after filtering', async () => {
    const { user } = await render(
      <Combobox.Root defaultOpen items={createItems(10)}>
        <Combobox.Input data-testid="input" />
        <Combobox.List>
          <Combobox.Virtualizer
            estimatedItemHeight={20}
            className={(state) => (state.empty ? 'empty' : undefined)}
            render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
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

    const input = screen.getByTestId('input');
    const virtualizer = screen.getByTestId('virtualizer');

    await user.type(input, '10');
    const item = await screen.findByRole('option', { name: 'Item 10' });
    expect(item).toHaveAttribute('aria-posinset', '1');
    expect(item).toHaveAttribute('aria-setsize', '1');
    expect(item).toHaveAttribute('data-index', '0');

    await user.clear(input);
    await user.type(input, 'missing');

    await waitFor(() => expect(screen.queryAllByRole('option')).toHaveLength(0));
    expect(virtualizer).toHaveAttribute('data-empty');
    expect(virtualizer).toHaveClass('empty');
  });

  it('clears a highlight that falls outside a shortened collection', async () => {
    const allItems = createItems(10);

    function Test(props: { filteredItems: string[] }) {
      return (
        <Combobox.Root defaultOpen items={allItems} filteredItems={props.filteredItems}>
          <Combobox.Input data-testid="input" />
          <Combobox.List>
            <Combobox.Virtualizer
              estimatedItemHeight={20}
              render={<div ref={setElementClientHeight(60)} />}
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

    const { rerender, user } = await render(<Test filteredItems={allItems} />);
    const input = screen.getByTestId('input');
    await user.click(input);
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant');

    await rerender(<Test filteredItems={allItems.slice(0, 1)} />);

    await waitFor(() => expect(input).not.toHaveAttribute('aria-activedescendant'));
    expect(screen.getByRole('option', { name: 'Item 1' })).toHaveAttribute('aria-setsize', '1');
  });

  it('does not restore a retained highlight when the collection length changes', async () => {
    const allItems = createItems(10);
    let scrollTop = 0;
    const handleScrollTo = vi.fn((options: ScrollToOptions) => {
      scrollTop = options.top ?? scrollTop;
    });

    function Test(props: { filteredItems: string[] }) {
      return (
        <Combobox.Root defaultOpen items={allItems} filteredItems={props.filteredItems}>
          <Combobox.Input data-testid="input" />
          <Combobox.List>
            <Combobox.Virtualizer
              estimatedItemHeight={20}
              overscanPx={0}
              render={
                <div
                  ref={setElementScrollState({
                    clientHeight: 40,
                    getScrollTop: () => scrollTop,
                    scrollTo: handleScrollTo,
                  })}
                  data-testid="virtualizer"
                />
              }
            >
              {(item: string) => (
                <Combobox.Item key={item} value={item} style={{ height: 20 }}>
                  {item}
                </Combobox.Item>
              )}
            </Combobox.Virtualizer>
          </Combobox.List>
        </Combobox.Root>
      );
    }

    const { rerender, user } = await render(<Test filteredItems={allItems} />);
    await user.click(screen.getByTestId('input'));
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    await waitFor(() => expect(handleScrollTo).toHaveBeenCalled());

    handleScrollTo.mockClear();
    scrollTop = 100;
    fireEvent.scroll(screen.getByTestId('virtualizer'));
    await rerender(<Test filteredItems={allItems.slice(0, 9)} />);
    await waitFor(() => expect(screen.queryByRole('option', { name: 'Item 10' })).toBe(null));

    expect(handleScrollTo).not.toHaveBeenCalled();
  });

  it('supports multiple selection', async () => {
    const handleValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root defaultOpen items={createItems(5)} multiple onValueChange={handleValueChange}>
        <Combobox.List>
          <Combobox.Virtualizer
            estimatedItemHeight={20}
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

    await user.click(await screen.findByRole('option', { name: 'Item 2' }));

    expect(handleValueChange.mock.lastCall?.[0]).toEqual(['Item 2']);
  });

  it('uses the virtualizer index when Combobox.Item receives a conflicting index', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const { user } = await render(
        <Combobox.Root defaultOpen items={['one', 'two']}>
          <Combobox.Input data-testid="input" />
          <Combobox.List>
            <Combobox.Virtualizer<string>
              estimatedItemHeight={20}
              render={<div ref={setElementClientHeight(40)} />}
            >
              {(item: string, index) => (
                <Combobox.Item key={item} value={item} index={index + 10}>
                  {item}
                </Combobox.Item>
              )}
            </Combobox.Virtualizer>
          </Combobox.List>
        </Combobox.Root>,
      );

      await user.click(screen.getByTestId('input'));
      await user.keyboard('{ArrowDown}');

      expect(screen.getByRole('option', { name: 'one' })).toHaveAttribute('data-highlighted');
      expect(warnSpy.mock.calls[0]?.[0]).toContain(
        'Base UI: <Combobox.Item> received an `index` prop that conflicts',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('does not expose totalSize as a data attribute', async () => {
    await render(
      <Combobox.Root defaultOpen items={[]}>
        <Combobox.List>
          <Combobox.Virtualizer estimatedItemHeight={20} data-testid="virtualizer">
            {(item: string) => <Combobox.Item value={item}>{item}</Combobox.Item>}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const virtualizer = screen.getByTestId('virtualizer');
    expect(virtualizer).toHaveAttribute('data-empty');
    expect(virtualizer).not.toHaveAttribute('data-totalsize');
  });

  it('warns when the virtualizer is not height-constrained', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <Combobox.Root defaultOpen items={createItems(100)}>
          <Combobox.List>
            <Combobox.Virtualizer
              estimatedItemHeight={20}
              render={<div ref={setElementClientHeight(2000)} />}
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

      await waitFor(() =>
        expect(
          warnSpy.mock.calls.some(([message]) =>
            String(message).includes('must have a constrained height or maximum height'),
          ),
        ).toBe(true),
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it.skipIf(isJSDOM)(
    'does not warn while an animated narrow filtered list closes',
    async ({ onTestFinished }) => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      onTestFinished(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      onTestFinished(() => warnSpy.mockRestore());

      const style = `
        @keyframes combobox-virtualizer-close-test {
          to {
            opacity: 0;
          }
        }

        .animation-test-popup[data-ending-style] {
          animation: combobox-virtualizer-close-test 100ms linear;
        }
      `;

      const { user } = await render(
        <React.Fragment>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <Combobox.Root items={createItems(100)}>
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup data-testid="popup" className="animation-test-popup">
                  <Combobox.List>
                    <Combobox.Virtualizer
                      estimatedItemHeight={20}
                      render={
                        <div
                          style={{
                            height: 'min(80px, var(--total-size))',
                            maxHeight: 80,
                          }}
                        />
                      }
                    >
                      {(item: string) => (
                        <Combobox.Item key={item} value={item} style={{ height: 20 }}>
                          {item}
                        </Combobox.Item>
                      )}
                    </Combobox.Virtualizer>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </React.Fragment>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);
      await user.type(input, '100');
      await user.click(await screen.findByRole('option', { name: 'Item 100' }));
      await waitFor(() => expect(screen.queryByTestId('popup')).toBe(null));

      expect(
        warnSpy.mock.calls.some(([message]) =>
          String(message).includes('must have a constrained height or maximum height'),
        ),
      ).toBe(false);
    },
  );

  it('cleans up its list registration when unmounted', async () => {
    function Test(props: { enabled: boolean }) {
      return (
        <Combobox.Root defaultOpen items={['one']}>
          <Combobox.List>
            {props.enabled ? (
              <Combobox.Virtualizer estimatedItemHeight={20}>
                {(item: string) => <Combobox.Item value={item}>{item}</Combobox.Item>}
              </Combobox.Virtualizer>
            ) : (
              <Combobox.Item value="one">one</Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Root>
      );
    }

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const { rerender } = await render(<Test enabled />);
      await rerender(<Test enabled={false} />);
      await screen.findByRole('option', { name: 'one' });

      expect(
        warnSpy.mock.calls.some(([message]) =>
          String(message).includes('must not render static <Combobox.Item> elements alongside'),
        ),
      ).toBe(false);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns about multiple virtualizers and static items', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <Combobox.Root defaultOpen items={['one']}>
          <Combobox.List>
            <Combobox.Item value="static">static</Combobox.Item>
            <Combobox.Virtualizer estimatedItemHeight={20}>
              {(item: string) => <Combobox.Item value={item}>{item}</Combobox.Item>}
            </Combobox.Virtualizer>
            <Combobox.Virtualizer estimatedItemHeight={20}>
              {(item: string) => <Combobox.Item value={item}>{item}</Combobox.Item>}
            </Combobox.Virtualizer>
          </Combobox.List>
        </Combobox.Root>,
      );

      const messages = warnSpy.mock.calls.map(([message]) => String(message)).join('\n');
      expect(messages).toContain('must not contain more than one <Combobox.Virtualizer>');
      expect(messages).toContain('must not render static <Combobox.Item> elements alongside');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns when a virtualized item is disabled without isItemDisabled', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <Combobox.Root defaultOpen items={['one']}>
          <Combobox.List>
            <Combobox.Virtualizer estimatedItemHeight={20}>
              {(item: string) => (
                <Combobox.Item value={item} disabled>
                  {item}
                </Combobox.Item>
              )}
            </Combobox.Virtualizer>
          </Combobox.List>
        </Combobox.Root>,
      );

      expect(
        warnSpy.mock.calls.some(([message]) =>
          String(message).includes(
            'virtualized <Combobox.Item> is disabled, but <Combobox.Root> does not have an ' +
              '`isItemDisabled` prop',
          ),
        ),
      ).toBe(true);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns about unsupported modes and invalid composition', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <Combobox.Root
          defaultOpen
          grid
          items={[
            {
              value: 'group',
              items: ['one'],
            },
          ]}
          virtualized
        >
          <Combobox.Virtualizer<string> estimatedItemHeight={20}>
            {() => <div />}
          </Combobox.Virtualizer>
        </Combobox.Root>,
      );

      const messages = warnSpy.mock.calls.map(([message]) => String(message)).join('\n');
      expect(messages).toContain('must be placed inside <Combobox.List>');
      expect(messages).toContain('does not currently support grouped collections');
      expect(messages).toContain('does not currently support grid mode');
      expect(messages).toContain('must not use the `virtualized` prop together');
      expect(messages).toContain('must render exactly one <Combobox.Item>');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('requires getItemKey for object values at the type level', () => {
    function TypeTest() {
      return (
        // @ts-expect-error object values require getItemKey
        <Combobox.Virtualizer estimatedItemHeight={20}>
          {(value: { id: number }) => <Combobox.Item value={value}>{value.id}</Combobox.Item>}
        </Combobox.Virtualizer>
      );
    }

    expect(TypeTest).toBeDefined();
  });

  it('requires getItemKey when the item type cannot be inferred', () => {
    const item = { id: 1 };

    function TypeTest() {
      return (
        // @ts-expect-error unknown item types require getItemKey
        <Combobox.Virtualizer estimatedItemHeight={20}>
          {() => <Combobox.Item value={item}>{item.id}</Combobox.Item>}
        </Combobox.Virtualizer>
      );
    }

    expect(TypeTest).toBeDefined();
  });

  it('does not allow item renderers to omit a row', () => {
    function TypeTest() {
      return (
        <Combobox.Virtualizer<string> estimatedItemHeight={20}>
          {
            // @ts-expect-error virtualized item renderers must return an element
            () => null
          }
        </Combobox.Virtualizer>
      );
    }

    expect(TypeTest).toBeDefined();
  });

  it('collects offscreen rendered labels for browser autofill', async () => {
    const items = Array.from({ length: 100 }, (_, index) => `V${index + 1}`);
    const onValueChange = vi.fn();

    const { user } = await render(
      <Combobox.Root name="country" items={items} onValueChange={onValueChange}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Virtualizer<string>
                  estimatedItemHeight={20}
                  overscanPx={0}
                  render={<div ref={setElementClientHeight(40)} />}
                >
                  {(item: string, index) => (
                    <Combobox.Item value={item}>{`Country ${index + 1}`}</Combobox.Item>
                  )}
                </Combobox.Virtualizer>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const hiddenInput = screen
      .getAllByDisplayValue('')
      .find((element) => element.getAttribute('name') === 'country') as HTMLInputElement;

    fireEvent.change(hiddenInput, { target: { value: 'Country 50' } });
    await flushMicrotasks();

    expect(onValueChange).toHaveBeenCalledWith('V50', expect.objectContaining({ reason: 'none' }));
    expect(screen.queryByRole('listbox')).toBe(null);

    await user.click(screen.getByRole('combobox'));
    await waitFor(() => expect(screen.getByRole('listbox')).not.toBe(null));
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeLessThan(items.length));
  });

  it.skipIf(isJSDOM)(
    'restores an open max-height virtual window after rendered-label autofill',
    async () => {
      vi.restoreAllMocks();
      const items = Array.from({ length: 100 }, (_, index) => `V${index + 1}`);
      const onValueChange = vi.fn();

      await render(
        <Combobox.Root
          defaultOpen
          filter={null}
          name="country"
          items={items}
          onValueChange={onValueChange}
        >
          <Combobox.Input />
          <Combobox.List>
            <Combobox.Virtualizer<string>
              estimatedItemHeight={20}
              overscanPx={0}
              render={<div data-testid="virtualizer" style={{ maxHeight: 60, width: 200 }} />}
            >
              {(item: string, index) => (
                <Combobox.Item value={item} style={{ display: 'block', height: 20 }}>
                  {`Country ${index + 1}`}
                </Combobox.Item>
              )}
            </Combobox.Virtualizer>
          </Combobox.List>
        </Combobox.Root>,
      );

      const virtualizer = screen.getByTestId('virtualizer');
      await waitFor(() => expect(virtualizer.clientHeight).toBe(60));
      await waitFor(() => expect(screen.getAllByRole('option').length).toBeLessThan(items.length));

      const hiddenInput = screen
        .getAllByDisplayValue('')
        .find((element) => element.getAttribute('name') === 'country') as HTMLInputElement;
      fireEvent.change(hiddenInput, { target: { value: 'Country 50' } });
      await flushMicrotasks();

      expect(onValueChange).toHaveBeenCalledWith(
        'V50',
        expect.objectContaining({ reason: 'none' }),
      );
      await waitFor(() => expect(screen.getAllByRole('option').length).toBeLessThan(items.length));
      await waitFor(() => expect(virtualizer.clientHeight).toBe(60));
      expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2000px');
    },
  );

  it('collects rendered labels from large non-virtualized lists for browser autofill', async () => {
    const items = Array.from({ length: 1001 }, (_, index) => `V${index + 1}`);
    const onValueChange = vi.fn();

    await render(
      <Combobox.Root name="country" items={items} onValueChange={onValueChange}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {items.map((item, index) => (
                  <Combobox.Item key={item} value={item}>
                    {`Country ${index + 1}`}
                  </Combobox.Item>
                ))}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const hiddenInput = screen
      .getAllByDisplayValue('')
      .find((element) => element.getAttribute('name') === 'country') as HTMLInputElement;
    fireEvent.change(hiddenInput, { target: { value: 'Country 1001' } });
    await flushMicrotasks();

    expect(onValueChange).toHaveBeenCalledWith(
      'V1001',
      expect.objectContaining({ reason: 'none' }),
    );
    expect(screen.queryByRole('listbox')).toBe(null);
  });

  it('does not render every item for an unmatched large autofill value', async () => {
    const items = Array.from({ length: 1001 }, (_, index) => `V${index + 1}`);
    const renderItem = vi.fn((item: string, index: number) => (
      <Combobox.Item value={item}>{`Country ${index + 1}`}</Combobox.Item>
    ));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <Combobox.Root name="country" items={items}>
          <Combobox.Input />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Virtualizer<string>
                    estimatedItemHeight={20}
                    overscanPx={0}
                    render={<div ref={setElementClientHeight(40)} />}
                  >
                    {renderItem}
                  </Combobox.Virtualizer>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const hiddenInput = screen
        .getAllByDisplayValue('')
        .find((element) => element.getAttribute('name') === 'country') as HTMLInputElement;
      renderItem.mockClear();

      fireEvent.change(hiddenInput, { target: { value: 'Country 1000' } });

      expect(renderItem).toHaveBeenCalled();
      expect(renderItem.mock.calls.length).toBeLessThan(items.length);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Browser autofill could not match a rendered item label'),
      );
      await flushMicrotasks();
      expect(screen.queryByRole('listbox')).toBe(null);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('renders all items when disabled', async () => {
    await render(
      <Combobox.Root defaultOpen items={createItems(20)}>
        <Combobox.List>
          <Combobox.Virtualizer
            enabled={false}
            estimatedItemHeight={20}
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
              estimatedItemHeight={20}
              overscanPx={0}
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

    await waitFor(() => expect(screen.queryByRole('option', { name: 'Item 20' })).toBe(null));

    await rerender(<Test enabled={false} />);
    await waitFor(() => expect(screen.getByRole('option', { name: 'Item 20' })).not.toBe(null));

    await rerender(<Test enabled />);
    await waitFor(() => expect(screen.queryByRole('option', { name: 'Item 20' })).toBe(null));
  });
});

function createItems(count: number) {
  return Array.from({ length: count }, (_, index) => `Item ${index + 1}`);
}

function mockResizeObserver() {
  const originalResizeObserver = window.ResizeObserver;
  const observers = new Set<TestResizeObserver>();

  class TestResizeObserver implements ResizeObserver {
    readonly elements = new Set<Element>();

    constructor(readonly callback: ResizeObserverCallback) {
      observers.add(this);
    }

    observe(element: Element) {
      this.elements.add(element);
    }

    unobserve(element: Element) {
      this.elements.delete(element);
    }

    disconnect() {
      this.elements.clear();
      observers.delete(this);
    }

    takeRecords() {
      return [];
    }
  }

  window.ResizeObserver = TestResizeObserver;

  return {
    notify(element: HTMLElement, height: number) {
      const size = { blockSize: height, inlineSize: element.clientWidth };
      const entry = {
        borderBoxSize: [size],
        contentBoxSize: [size],
        contentRect: createDOMRect({ height, width: element.clientWidth }),
        devicePixelContentBoxSize: [size],
        target: element,
      } satisfies ResizeObserverEntry;

      observers.forEach((observer) => {
        if (observer.elements.has(element)) {
          observer.callback([entry], observer);
        }
      });
    },
    restore() {
      window.ResizeObserver = originalResizeObserver;
    },
  };
}
