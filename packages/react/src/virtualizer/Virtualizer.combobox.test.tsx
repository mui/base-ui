import * as React from 'react';
import { expect, vi, describe, beforeEach, it } from 'vitest';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Combobox } from '@base-ui/react/combobox';
import { Virtualizer } from '@base-ui/react/virtualizer';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import {
  createRenderer,
  describeConformance,
  isJSDOM,
  createDOMRect,
  setElementClientHeight,
  setElementScrollState,
} from '#test-utils';

describe('<Virtualizer /> in Combobox', () => {
  const { render } = createRenderer();
  const { render: renderNonStrict } = createRenderer({ strict: false });

  describeConformance(
    <Virtualizer estimatedItemHeight={20}>
      {(item: string) => (
        <Combobox.Item key={item} value={item}>
          {item}
        </Combobox.Item>
      )}
    </Virtualizer>,
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

  it('selects the highlighted filtered item without explicit item indices', async () => {
    const { user } = await render(
      <Combobox.Root items={['one', 'two', 'three', 'four', 'five']}>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Virtualizer
                  estimatedItemHeight={20}
                  render={<div ref={setElementClientHeight(80)} />}
                >
                  {(item: string) => (
                    <Combobox.Item key={item} value={item} style={{ height: 20 }}>
                      {item}
                    </Combobox.Item>
                  )}
                </Virtualizer>
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
                <Virtualizer
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
                </Virtualizer>
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
          <Virtualizer
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
          </Virtualizer>
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

  it('skips disabled offscreen items when opening with ArrowDown', async () => {
    let scrollTop = 0;

    const { user } = await render(
      <Combobox.Root items={createItems(100)} isItemDisabled={(_, index) => index < 50}>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Virtualizer
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
                </Virtualizer>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await act(async () => input.focus());
    await user.keyboard('{ArrowDown}');

    await waitFor(() => expect(input.getAttribute('aria-activedescendant')).not.toBe(null));
    await waitFor(() => {
      const activeId = input.getAttribute('aria-activedescendant') as string;
      expect(input.ownerDocument.getElementById(activeId)).toHaveTextContent('Item 51');
    });
  });

  it('applies logical disabled state to rendered items', async () => {
    await render(
      <Combobox.Root defaultOpen items={createItems(3)} isItemDisabled={(_, index) => index === 0}>
        <Combobox.List>
          <Virtualizer estimatedItemHeight={20}>
            {(item: string) => <Combobox.Item value={item}>{item}</Combobox.Item>}
          </Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    expect(await screen.findByRole('option', { name: 'Item 1' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('auto-highlights the first enabled filtered item', async () => {
    const { user } = await render(
      <Combobox.Root
        items={['alpha', 'alpine', 'beta']}
        autoHighlight
        isItemDisabled={(item) => item === 'alpha'}
      >
        <Combobox.Input />
        <Combobox.List>
          <Virtualizer
            estimatedItemHeight={20}
            render={
              <div
                ref={setElementScrollState({
                  clientHeight: 60,
                  getScrollTop: () => 0,
                  scrollTo: () => {},
                })}
              />
            }
          >
            {(item: string) => <Combobox.Item value={item}>{item}</Combobox.Item>}
          </Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'al');

    const alpine = await screen.findByRole('option', { name: 'alpine' });
    expect(input).toHaveAttribute('aria-activedescendant', alpine.id);
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
          <Virtualizer
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
          </Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    await user.type(screen.getByTestId('input'), '1');

    expect(handleScrollTo).toHaveBeenCalledWith({ behavior: 'instant', top: 0 });
    expect(scrollTop).toBe(0);
  });

  it('keeps the virtual scroller reset when filtering a keyboard-highlighted list', async () => {
    let scrollTop = 0;
    const handleScrollTo = vi.fn((options: ScrollToOptions) => {
      scrollTop = options.top ?? scrollTop;
    });

    const { user } = await render(
      <Combobox.Root items={createItems(100)}>
        <Combobox.Input data-testid="input" />
        <Combobox.List>
          <Virtualizer
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
          </Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await user.click(input);
    await user.keyboard('{ArrowDown>11/}');

    await waitFor(() => expect(scrollTop).toBeGreaterThan(0));

    await user.type(input, '1');

    await waitFor(() => expect(scrollTop).toBe(0));
    expect(input).not.toHaveAttribute('aria-activedescendant');
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
                <Virtualizer
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
                    <Combobox.Item key={item} value={item} style={{ height: 20 }}>
                      {item}
                    </Combobox.Item>
                  )}
                </Virtualizer>
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

  // Not moved to the lean host: this claim only holds while the scroll request that opened at the
  // selection is still pending, which it is here because the rerender lands within the 150ms idle
  // window after opening. Once the adaptive estimate has settled the request is released, and the
  // same rewrite is handled by scroll anchoring — which keeps the topmost row in place and lets a
  // selection lower in the viewport drift by one pixel per row between them. A lean host settles
  // before the first read, so it cannot host the claim as written. Whether anchoring should prefer
  // the active row after settling is a product question, not one this test decides.
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
                    <Virtualizer
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
                    </Virtualizer>
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

      // Shrinking the rows to the estimate rewrites the geometry of every measured row, and the
      // alignment has to survive that rewrite. The virtual total reaches exactly `rows × estimate`
      // once the last of them is remeasured, so waiting for it observes the rewrite landing
      // instead of racing the refresh window with a fixed delay.
      await waitFor(() => expect(virtualizer.scrollHeight).toBe(10000 * 32));

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
                <Virtualizer
                  estimatedItemHeight={20}
                  overscanPx={0}
                  render={<div data-testid="virtualizer" style={{ height: 60, width: 200 }} />}
                >
                  {(item: string) => (
                    <Combobox.Item key={item} value={item} style={{ display: 'block', height: 20 }}>
                      {item}
                    </Combobox.Item>
                  )}
                </Virtualizer>
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
                    <Virtualizer
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
                    </Virtualizer>
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
            <Virtualizer
              estimatedItemHeight={20}
              overscanPx={0}
              render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
            >
              {(item: string) => (
                <Combobox.Item key={item} value={item} style={{ height: 20 }}>
                  {item}
                </Combobox.Item>
              )}
            </Virtualizer>
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
          <Virtualizer estimatedItemHeight={20} render={<div ref={setElementClientHeight(40)} />}>
            {(item: string) => <Item item={item} />}
          </Virtualizer>
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
          <Virtualizer
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
          </Virtualizer>
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

  describe('page keys', () => {
    it('pages the highlight through items that are not mounted', async () => {
      await render(
        <Combobox.Root defaultOpen items={createItems(200)}>
          <Combobox.Input data-testid="input" />
          <Combobox.List>
            <Virtualizer
              estimatedItemHeight={20}
              overscanPx={0}
              render={<div ref={setElementClientHeight(40)} />}
            >
              {(item: string) => <Combobox.Item value={item}>{item}</Combobox.Item>}
            </Virtualizer>
          </Combobox.List>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await act(async () => input.focus());

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      await waitFor(() => {
        const first = screen.getByRole('option', { name: 'Item 1' });
        expect(input).toHaveAttribute('aria-activedescendant', first.id);
      });

      // The destination is far outside the rendered window, so this only works if paging moves the
      // logical index and the virtualizer brings the row in — the keyboard path that stands in for
      // a focusable scroll container.
      fireEvent.keyDown(input, { key: 'PageDown' });

      await waitFor(() => {
        const paged = screen.getByRole('option', { name: 'Item 11' });
        expect(input).toHaveAttribute('aria-activedescendant', paged.id);
      });
    });
  });

  it('clears a highlight that falls outside a shortened collection', async () => {
    const allItems = createItems(10);

    function Test(props: { filteredItems: string[] }) {
      return (
        <Combobox.Root defaultOpen items={allItems} filteredItems={props.filteredItems}>
          <Combobox.Input data-testid="input" />
          <Combobox.List>
            <Virtualizer estimatedItemHeight={20} render={<div ref={setElementClientHeight(60)} />}>
              {(item: string) => (
                <Combobox.Item key={item} value={item}>
                  {item}
                </Combobox.Item>
              )}
            </Virtualizer>
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

  it('supports multiple selection', async () => {
    const handleValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root defaultOpen items={createItems(5)} multiple onValueChange={handleValueChange}>
        <Combobox.List>
          <Virtualizer estimatedItemHeight={20} render={<div ref={setElementClientHeight(40)} />}>
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Virtualizer>
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
            <Virtualizer<string>
              estimatedItemHeight={20}
              render={<div ref={setElementClientHeight(40)} />}
            >
              {(item: string, index) => (
                <Combobox.Item key={item} value={item} index={index + 10}>
                  {item}
                </Combobox.Item>
              )}
            </Virtualizer>
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
                    <Virtualizer
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
                    </Virtualizer>
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
              <Virtualizer estimatedItemHeight={20}>
                {(item: string) => <Combobox.Item value={item}>{item}</Combobox.Item>}
              </Virtualizer>
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
            <Virtualizer estimatedItemHeight={20}>
              {(item: string) => <Combobox.Item value={item}>{item}</Combobox.Item>}
            </Virtualizer>
            <Virtualizer estimatedItemHeight={20}>
              {(item: string) => <Combobox.Item value={item}>{item}</Combobox.Item>}
            </Virtualizer>
          </Combobox.List>
        </Combobox.Root>,
      );

      const messages = warnSpy.mock.calls.map(([message]) => String(message)).join('\n');
      expect(messages).toContain('must not contain more than one <Virtualizer>');
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
            <Virtualizer estimatedItemHeight={20}>
              {(item: string) => (
                <Combobox.Item value={item} disabled>
                  {item}
                </Combobox.Item>
              )}
            </Virtualizer>
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

  it('names Autocomplete parts in diagnostics raised inside an Autocomplete', async () => {
    // `Autocomplete.List` and `Autocomplete.Item` are the Combobox components under another name,
    // so a diagnostic that hard-coded one namespace would point an Autocomplete user at parts
    // that are not in their tree.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <Autocomplete.Root defaultOpen items={['one', 'two']} grid>
          <Autocomplete.List>
            <Virtualizer<string> estimatedItemHeight={20}>
              {(item) => (
                <React.Fragment>
                  <Autocomplete.Item value={item}>{item}</Autocomplete.Item>
                  <Autocomplete.Item value={item}>{item}</Autocomplete.Item>
                </React.Fragment>
              )}
            </Virtualizer>
          </Autocomplete.List>
        </Autocomplete.Root>,
      );

      const messages = warnSpy.mock.calls.map(([message]) => String(message)).join('\n');
      expect(messages).toContain('must render exactly one <Autocomplete.Item>');
      expect(messages).not.toContain('<Combobox.');
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
          <Combobox.List>
            <Virtualizer<string> estimatedItemHeight={20}>{() => <div />}</Virtualizer>
          </Combobox.List>
        </Combobox.Root>,
      );

      const messages = warnSpy.mock.calls.map(([message]) => String(message)).join('\n');
      expect(messages).toContain('does not currently support grouped collections');
      expect(messages).toContain('does not currently support grid mode');
      expect(messages).toContain('must not use the `virtualized` prop together');
      expect(messages).toContain('must render exactly one <Combobox.Item>');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('throws a descriptive error when rendered without a collection', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Combobox.Root defaultOpen items={['one']}>
            <Virtualizer<string> estimatedItemHeight={20}>
              {(item) => <Combobox.Item value={item}>{item}</Combobox.Item>}
            </Virtualizer>
          </Combobox.Root>,
        ),
      ).rejects.toThrow(
        'Base UI: <Virtualizer> was rendered without an `items` prop and outside of a list ' +
          'that supports virtualization',
      );
    } finally {
      errorSpy.mockRestore();
    }
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
                <Virtualizer<string>
                  estimatedItemHeight={20}
                  overscanPx={0}
                  render={<div ref={setElementClientHeight(40)} />}
                >
                  {(item: string, index) => (
                    <Combobox.Item value={item}>{`Country ${index + 1}`}</Combobox.Item>
                  )}
                </Virtualizer>
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
            <Virtualizer<string>
              estimatedItemHeight={20}
              overscanPx={0}
              render={<div data-testid="virtualizer" style={{ maxHeight: 60, width: 200 }} />}
            >
              {(item: string, index) => (
                <Combobox.Item value={item} style={{ display: 'block', height: 20 }}>
                  {`Country ${index + 1}`}
                </Combobox.Item>
              )}
            </Virtualizer>
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
                  <Virtualizer<string>
                    estimatedItemHeight={20}
                    overscanPx={0}
                    render={<div ref={setElementClientHeight(40)} />}
                  >
                    {renderItem}
                  </Virtualizer>
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

  // A disabled virtualizer renders the whole collection and scrolls no rows itself, so the DOM
  // scrolling that static lists rely on must stay enabled.
  it.skipIf(isJSDOM)(
    'restores DOM scrolling for highlighted items when disabled',
    async ({ onTestFinished }) => {
      vi.restoreAllMocks();
      const scrollIntoView = vi
        .spyOn(HTMLElement.prototype, 'scrollIntoView')
        .mockImplementation(() => {});
      onTestFinished(() => scrollIntoView.mockRestore());

      const { user } = await render(
        <Combobox.Root defaultOpen items={createItems(100)}>
          <Combobox.Input data-testid="input" />
          <Combobox.List>
            <Virtualizer
              enabled={false}
              estimatedItemHeight={20}
              render={<div style={{ height: 60, width: 200 }} />}
            >
              {(item: string) => (
                <Combobox.Item key={item} value={item} style={{ height: 20 }}>
                  {item}
                </Combobox.Item>
              )}
            </Virtualizer>
          </Combobox.List>
        </Combobox.Root>,
      );

      await user.click(screen.getByTestId('input'));
      await user.keyboard('{ArrowDown>11/}');

      await waitFor(() =>
        expect(
          scrollIntoView.mock.contexts.some(
            (element) => (element as HTMLElement).textContent === 'Item 11',
          ),
        ).toBe(true),
      );
    },
  );

  it('virtualizes an Autocomplete list', async () => {
    await render(
      <Autocomplete.Root defaultOpen items={createItems(100)}>
        <Autocomplete.Input />
        <Autocomplete.List>
          <Virtualizer
            estimatedItemHeight={20}
            overscanPx={0}
            render={<div ref={setElementClientHeight(40)} />}
          >
            {(item: string) => (
              <Autocomplete.Item key={item} value={item}>
                {item}
              </Autocomplete.Item>
            )}
          </Virtualizer>
        </Autocomplete.List>
      </Autocomplete.Root>,
    );

    await waitFor(() => expect(screen.getByRole('option', { name: 'Item 1' })).not.toBe(null));
    expect(screen.queryByRole('option', { name: 'Item 100' })).toBe(null);
    expect(screen.getByRole('option', { name: 'Item 1' })).toHaveAttribute('aria-setsize', '100');
  });
});

function createItems(count: number) {
  return Array.from({ length: count }, (_, index) => `Item ${index + 1}`);
}
