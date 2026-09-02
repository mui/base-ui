import * as React from 'react';
import { expect, vi, describe, beforeEach, it } from 'vitest';
import { Select } from '@base-ui/react/select';
import { Virtualizer } from '@base-ui/react/virtualizer';
import { fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, createDOMRect, isJSDOM, setElementClientHeight } from '#test-utils';

function createItems(count: number) {
  return Array.from({ length: count }, (_, index) => `item-${index}`);
}

function getOptions() {
  return screen.queryAllByRole('option');
}

/**
 * jsdom performs no layout, so `scrollHeight` is `0` and nothing can ever appear scrollable.
 * Arrow visibility is derived from it, so it has to be supplied.
 */
function setScrollGeometry(clientHeight: number, scrollHeight: number) {
  return (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }
    setElementClientHeight(clientHeight)(element);
    Object.defineProperty(element, 'scrollHeight', { configurable: true, value: scrollHeight });
  };
}

describe('<Virtualizer /> inside Select', () => {
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

  function renderAlignedSelect(enabled: boolean) {
    function AlignedSelect(props: { enabled: boolean }) {
      return (
        <Select.Root defaultOpen items={createItems(20)}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner data-testid="positioner">
              <Select.Popup>
                <Select.List>
                  <Virtualizer
                    enabled={props.enabled}
                    estimatedItemHeight={20}
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

    return render(<AlignedSelect enabled={enabled} />);
  }

  function renderSelect(
    props: Partial<React.ComponentProps<typeof Select.Root>> = {},
    items = createItems(100),
  ) {
    return render(
      <Select.Root defaultOpen items={items} {...props}>
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                <Virtualizer
                  overscanPx={20}
                  estimatedItemHeight={20}
                  render={<div ref={setElementClientHeight(60)} data-testid="scrollport" />}
                >
                  {(item: string) => (
                    <Select.Item value={item}>
                      <Select.ItemText>{item}</Select.ItemText>
                    </Select.Item>
                  )}
                </Virtualizer>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );
  }

  it('mounts a window rather than the whole collection', async () => {
    await renderSelect();

    await waitFor(() => {
      expect(getOptions().length).not.toBe(0);
    });
    expect(getOptions().length).toBeLessThan(100);
  });

  it('gives each row its logical index and collection metadata', async () => {
    await renderSelect();

    await waitFor(() => {
      expect(getOptions().length).not.toBe(0);
    });

    const first = getOptions()[0];
    expect(first).toHaveAttribute('data-index', '0');
    expect(first).toHaveAttribute('aria-posinset', '1');
    expect(first).toHaveAttribute('aria-setsize', '100');
  });

  it('keeps the scroll container on the virtualizer, not on the list', async () => {
    await renderSelect();

    const scrollport = screen.getByTestId('scrollport');
    expect(scrollport.style.overflow).toBe('auto');

    const list = screen.getByRole('listbox');
    expect(list).not.toBe(scrollport);
    expect(list.contains(scrollport)).toBe(true);
  });

  it('turns off alignItemWithTrigger, which a window cannot measure', async () => {
    await renderSelect();

    // The aligned mode renders the positioner with `side="none"`; the fallback keeps a real side.
    await waitFor(() => {
      expect(screen.getByRole('listbox')).not.toBe(null);
    });
    const positioner = screen.getByRole('listbox').closest('[data-side]');
    expect(positioner).not.toHaveAttribute('data-side', 'none');
  });

  it('derives values for the whole collection, so an unmounted item can be selected', async () => {
    const onValueChange = vi.fn();
    const { user } = await renderSelect({ onValueChange });

    await waitFor(() => {
      expect(getOptions().length).not.toBe(0);
    });

    // `End` travels to the last item, which was never in the initial window.
    await user.keyboard('{End}');
    await waitFor(() => {
      expect(screen.queryByText('item-99')).not.toBe(null);
    });

    await user.keyboard('{Enter}');

    // The value comes from the root-derived collection, not from anything the row registered.
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalled();
    });
    expect(onValueChange.mock.calls[0][0]).toBe('item-99');
  });

  it('skips a disabled item that is outside the rendered window', async () => {
    // `item-98` is far past the initial window, so only the root predicate can classify it.
    const { user } = await renderSelect({
      isItemDisabled: (itemValue: unknown) => itemValue === 'item-98',
    });

    await waitFor(() => {
      expect(getOptions().length).not.toBe(0);
    });

    await user.keyboard('{End}');
    await waitFor(() => {
      expect(screen.queryByText('item-99')).not.toBe(null);
    });

    // `End` lands on the last row; stepping back must skip the disabled one entirely.
    await user.keyboard('{ArrowUp}');

    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute('data-index', '97');
    });
  });

  it('shows the scroll arrows for a virtualized list', async () => {
    await render(
      <Select.Root defaultOpen items={createItems(100)}>
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.ScrollUpArrow data-testid="up-arrow" />
            <Select.Popup>
              <Select.List>
                <Virtualizer
                  estimatedItemHeight={20}
                  render={<div ref={setScrollGeometry(60, 2000)} data-testid="scrollport" />}
                >
                  {(item: string) => (
                    <Select.Item value={item}>
                      <Select.ItemText>{item}</Select.ItemText>
                    </Select.Item>
                  )}
                </Virtualizer>
              </Select.List>
            </Select.Popup>
            <Select.ScrollDownArrow data-testid="down-arrow" />
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    // The popup seeds arrow visibility from the virtualizer's own scrollport. Without that seeding
    // `initialPlacedRef` never flips, and no arrow can ever become visible.
    await waitFor(() => {
      expect(screen.queryByTestId('down-arrow')).not.toBe(null);
    });
  });

  it('has complete metadata on the first commit of a defaultOpen select', async () => {
    // The virtualizer registers from a descendant layout effect, after the root and the positioner
    // have already rendered. If that registration only reached them after paint, the root would not
    // have prefilled `valuesRef` in time for `syncSelectedIndex`, and the far-off selected row would
    // not be the one the list points at.
    await renderSelect({ value: 'item-80' });

    // Asserted synchronously: if registration only reached the root after paint, the metadata
    // would settle on a later commit and a `waitFor` would hide exactly the defect this pins.
    const selected = getOptions().find((option) => option.textContent === 'item-80');
    expect(selected).toBeDefined();
    expect(selected).toHaveAttribute('aria-selected', 'true');
    expect(selected).toHaveAttribute('data-index', '80');
  });

  it('does not move focus to another row when a selection is removed', async () => {
    // `selectedIndex` now tracks the whole collection while open, and `useListNavigation` reacts to
    // every change of it by bringing the selected row into view. Deselecting must not therefore
    // teleport focus to whichever value happens to be last in `value`.
    const { user } = await renderSelect({ multiple: true, defaultValue: [] });

    await waitFor(() => {
      expect(getOptions().length).not.toBe(0);
    });

    await user.keyboard('{End}{Enter}');
    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute('data-index', '99');
    });

    await user.keyboard('{Home}{Enter}');
    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute('data-index', '0');
    });

    // Deselecting `item-0` leaves `item-99` as the last selected value; focus must stay put.
    await user.keyboard('{Enter}');
    await flushMicrotasks();

    expect(document.activeElement).toHaveAttribute('data-index', '0');
  });

  it('mounts the whole collection for a disabled virtualizer', async () => {
    await renderAlignedSelect(false);

    await waitFor(() => {
      expect(getOptions().length).toBe(20);
    });
  });

  it('runs a Select.List onScroll handler in both static and virtualized lists', async () => {
    const onScroll = vi.fn();

    function renderWithList(virtualized: boolean) {
      return (
        <Select.Root defaultOpen items={createItems(20)}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List onScroll={onScroll} data-testid="list">
                  {virtualized ? (
                    <Virtualizer
                      estimatedItemHeight={20}
                      render={<div ref={setElementClientHeight(60)} data-testid="scrollport" />}
                    >
                      {(item: string) => <Select.Item value={item}>{item}</Select.Item>}
                    </Virtualizer>
                  ) : (
                    createItems(20).map((item) => (
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

    const view = await render(renderWithList(false));
    fireEvent.scroll(screen.getByTestId('list'));
    expect(onScroll).toHaveBeenCalledTimes(1);
    view.unmount();

    onScroll.mockClear();

    // Virtualized, the handler has moved onto the element that actually scrolls — a scroll event
    // does not bubble, so leaving it on the list would silently stop it firing.
    await render(renderWithList(true));
    fireEvent.scroll(screen.getByTestId('scrollport'));
    expect(onScroll).toHaveBeenCalledTimes(1);
  });

  it('does not re-render a static Select.List when the highlight moves', async () => {
    const listRenderSpy = vi.fn();

    const { user } = await render(
      <Select.Root defaultOpen items={createItems(5)}>
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List
                render={(props) => {
                  listRenderSpy();
                  return <div {...props} />;
                }}
              >
                {createItems(5).map((item) => (
                  <Select.Item key={item} value={item}>
                    {item}
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    await waitFor(() => {
      expect(getOptions().length).toBe(5);
    });

    // The highlight state a virtualizer needs is subscribed to below the list, so moving the
    // highlight must not re-render the list itself — a cost a static Select never paid.
    const before = listRenderSpy.mock.calls.length;
    await user.keyboard('{ArrowDown}');
    await flushMicrotasks();

    expect(listRenderSpy.mock.calls.length).toBe(before);
  });

  it('keeps a static Select highlighting the selected row when the items reorder', async () => {
    // The virtualized regime pins the index `useListNavigation` sees for an open session. A static
    // list's `selectedIndex` is owned by its mounted items and legitimately moves when the
    // collection reorders, so the pin must not reach it.
    function StaticSelect({ items }: { items: string[] }) {
      return (
        <Select.Root defaultOpen value="b" items={items}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  {items.map((item) => (
                    <Select.Item key={item} value={item}>
                      {item}
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      );
    }

    const { setProps } = await render(<StaticSelect items={['a', 'b', 'c']} />);

    await waitFor(() => {
      expect(getOptions().length).toBe(3);
    });

    await setProps({ items: ['b', 'a', 'c'] });
    await flushMicrotasks();

    const tabbable = getOptions().find((option) => option.getAttribute('tabindex') === '0');
    expect(tabbable?.textContent).toBe('b');
  });

  describe('diagnostics', () => {
    it('warns when the root has no items', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await renderSelect({ items: undefined } as any, undefined as any);
        await waitFor(() => {
          expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('requires the `items` prop on <Select.Root>'),
          );
        });
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('warns for a grouped collection', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await renderSelect({}, [{ items: ['a', 'b'] }] as any);
        await waitFor(() => {
          expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('does not currently support grouped collections'),
          );
        });
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('warns for a record-map items prop, which has no order to window', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await renderSelect({}, { a: 'A', b: 'B' } as any);
        await waitFor(() => {
          expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('to be an array'));
        });
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('warns when alignItemWithTrigger was asked for explicitly', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await render(
          <Select.Root defaultOpen items={createItems(100)}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner alignItemWithTrigger>
                <Select.Popup>
                  <Select.List>
                    <Virtualizer
                      estimatedItemHeight={20}
                      render={<div ref={setElementClientHeight(60)} />}
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
          expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('`alignItemWithTrigger`'));
        });
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('warns when placed directly in the popup rather than the list', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await render(
          <Select.Root defaultOpen items={createItems(10)}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Virtualizer
                    items={createItems(10)}
                    estimatedItemHeight={20}
                    render={<div ref={setElementClientHeight(60)} />}
                  >
                    {(item: string, _index: number, itemProps) => <div {...itemProps}>{item}</div>}
                  </Virtualizer>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>,
        );

        await waitFor(() => {
          expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('must be placed inside <Select.List>'),
          );
        });
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  describe.skipIf(isJSDOM)('real focus', () => {
    it('focuses a row that was never in the initial window', async () => {
      const { user } = await renderSelect();

      await waitFor(() => {
        expect(getOptions().length).not.toBe(0);
      });

      await user.keyboard('{End}');

      await waitFor(() => {
        expect(document.activeElement).toHaveAttribute('data-index', '99');
      });
    });
  });
});
