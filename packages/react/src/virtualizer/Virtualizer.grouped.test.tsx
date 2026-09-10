import * as React from 'react';
import { expect, vi, describe, beforeEach, it } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import {
  createRenderer,
  createDOMRect,
  isJSDOM,
  setElementClientHeight,
  TestGroupLabel,
  TestListItem,
  TestVirtualizedList,
  type VirtualizerTestItem,
} from '#test-utils';
import { Virtualizer } from './Virtualizer';

interface TestItem {
  id: number;
  label: string;
}

interface TestGroup {
  label: string;
  items: TestItem[];
}

function createGroups(sizes: number[]): TestGroup[] {
  let next = 0;
  return sizes.map((size, groupIndex) => ({
    label: `Group ${groupIndex + 1}`,
    items: Array.from({ length: size }, () => {
      const item = { id: next, label: `Item ${next + 1}` };
      next += 1;
      return item;
    }),
  }));
}

function renderGroupHeader(group: TestGroup, _: number, headerProps: Virtualizer.GroupHeaderProps) {
  return (
    <div {...headerProps} style={{ height: 20 }}>
      {group.label}
    </div>
  );
}

/**
 * A grouped listbox assembled from plain elements, so these tests exercise the `items` prop path
 * with a grouped collection end to end.
 */
function GroupedListbox(
  props: {
    groups: TestGroup[];
    activeIndex?: Virtualizer.ActiveIndex | null | undefined;
  } & Omit<Virtualizer.Props<TestItem>, 'children' | 'getItemKey' | 'items'>,
) {
  const { activeIndex, groups, ...virtualizerProps } = props;

  return (
    <Virtualizer<TestItem>
      activeIndex={activeIndex}
      getItemKey={(item) => item.id}
      items={groups}
      renderGroupHeader={renderGroupHeader}
      role="listbox"
      {...virtualizerProps}
    >
      {(item, _, itemProps) => (
        <div
          {...itemProps}
          role="option"
          aria-selected={false}
          tabIndex={-1}
          style={{ height: 20 }}
        >
          {item.label}
        </div>
      )}
    </Virtualizer>
  );
}

function getRow(element: HTMLElement) {
  return element.closest('[data-row-index]') as HTMLElement;
}

function getWrapperOf(element: HTMLElement) {
  return element.closest('[role="group"]') as HTMLElement;
}

describe('<Virtualizer /> grouped', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
      this: HTMLElement,
    ) {
      if (this.hasAttribute('data-row-index')) {
        return createDOMRect({ height: 20, width: 200 });
      }

      return createDOMRect({ height: 60, width: 200 });
    });
  });

  it('wraps each group in a named group element headed by its header', async () => {
    await render(
      <GroupedListbox
        estimatedItemHeight={20}
        groups={createGroups([2, 3])}
        render={<div ref={setElementClientHeight(1000)} />}
      />,
    );

    const wrappers = screen.getAllByRole('group');
    expect(wrappers).toHaveLength(2);

    const firstHeader = screen.getByText('Group 1');
    expect(firstHeader).toHaveAttribute('aria-hidden', 'true');
    expect(wrappers[0]).toHaveAttribute('aria-labelledby', firstHeader.id);
    expect(wrappers[0].firstElementChild).toBe(getRow(firstHeader));
    expect(getRow(firstHeader)).not.toHaveAttribute('hidden');
    expect(wrappers[1]).toHaveAttribute('aria-labelledby', screen.getByText('Group 2').id);

    expect(getWrapperOf(screen.getByText('Item 2'))).toBe(wrappers[0]);
    expect(getWrapperOf(screen.getByText('Item 3'))).toBe(wrappers[1]);
    expect(screen.getAllByRole('option')).toHaveLength(5);
  });

  it('renders the header of an empty group', async () => {
    await render(
      <GroupedListbox
        estimatedItemHeight={20}
        groups={createGroups([1, 0, 1])}
        render={<div ref={setElementClientHeight(1000)} />}
      />,
    );

    expect(screen.getAllByRole('group')).toHaveLength(3);
    expect(screen.getByText('Group 2')).not.toBe(null);
  });

  it('keeps the whole-collection basis for item metadata', async () => {
    await render(
      <GroupedListbox
        estimatedItemHeight={20}
        groups={createGroups([2, 3])}
        render={<div ref={setElementClientHeight(1000)} />}
      />,
    );

    const option = screen.getByText('Item 4');
    expect(option).toHaveAttribute('aria-posinset', '4');
    expect(option).toHaveAttribute('aria-setsize', '5');
    expect(option).toHaveAttribute('data-index', '3');
  });

  it('is empty when every group is empty, and still renders the headers', async () => {
    await render(
      <GroupedListbox
        estimatedItemHeight={20}
        groups={createGroups([0, 0])}
        render={<div ref={setElementClientHeight(1000)} data-testid="virtualizer" />}
      />,
    );

    expect(screen.getByTestId('virtualizer')).toHaveAttribute('data-empty');
    expect(screen.getAllByRole('group')).toHaveLength(2);
  });

  it('does not report the end of a collection that has no items', async () => {
    const onEndReached = vi.fn();
    await render(
      <GroupedListbox
        estimatedItemHeight={20}
        groups={createGroups([0, 0])}
        onEndReached={onEndReached}
        render={<div ref={setElementClientHeight(1000)} />}
      />,
    );

    expect(screen.getAllByRole('group')).toHaveLength(2);
    expect(onEndReached).not.toHaveBeenCalled();
  });

  it('keeps the grouped structure when virtualization is disabled', async () => {
    await render(
      <GroupedListbox
        enabled={false}
        estimatedItemHeight={20}
        groups={createGroups([2, 3])}
        render={<div ref={setElementClientHeight(40)} />}
      />,
    );

    expect(screen.getAllByRole('group')).toHaveLength(2);
    expect(screen.getAllByRole('option')).toHaveLength(5);
  });

  it('warns and renders the items flat without a header renderer', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <Virtualizer<TestItem>
          estimatedItemHeight={20}
          getItemKey={(item) => item.id}
          items={createGroups([2, 1])}
          render={<div ref={setElementClientHeight(1000)} />}
          role="listbox"
        >
          {(item, _, itemProps) => (
            <div {...itemProps} role="option" aria-selected={false}>
              {item.label}
            </div>
          )}
        </Virtualizer>,
      );

      expect(screen.queryAllByRole('group')).toHaveLength(0);
      expect(screen.getAllByRole('option')).toHaveLength(3);
      expect(warnSpy.mock.calls.map(([message]) => String(message)).join('\n')).toContain(
        'received a grouped collection but no `renderGroupHeader` prop',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('ignores a header renderer given a flat collection', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <Virtualizer<TestItem>
          estimatedItemHeight={20}
          getItemKey={(item) => item.id}
          items={createGroups([3]).flatMap((group) => group.items)}
          render={<div ref={setElementClientHeight(1000)} />}
          renderGroupHeader={renderGroupHeader}
          role="listbox"
        >
          {(item, _, itemProps) => (
            <div {...itemProps} role="option" aria-selected={false}>
              {item.label}
            </div>
          )}
        </Virtualizer>,
      );

      expect(screen.queryAllByRole('group')).toHaveLength(0);
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('answers offsets and metrics in item indexes', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();
    await render(
      <GroupedListbox
        actionsRef={actionsRef}
        estimatedItemHeight={20}
        estimatedGroupHeaderHeight={20}
        groups={createGroups([2, 0, 1])}
        render={<div ref={setElementClientHeight(1000)} />}
      />,
    );

    // Rows: header, item 0, item 1, header, header, item 2 — 20px each.
    expect(actionsRef.current?.getItemMetrics(2)).toEqual({ offset: 100, size: 20 });
    expect(actionsRef.current?.getItemMetrics(3)).toBe(null);
    expect(actionsRef.current?.getIndexAtOffset(5)).toBe(0);
    expect(actionsRef.current?.getIndexAtOffset(45)).toBe(1);
    // A header answers with its group's first item; an empty group's, with the item that follows.
    expect(actionsRef.current?.getIndexAtOffset(65)).toBe(2);
    expect(actionsRef.current?.getIndexAtOffset(85)).toBe(2);
    expect(actionsRef.current?.getIndexAtOffset(105)).toBe(2);
  });

  it('scrolls to an item by its item index', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();
    await render(
      <GroupedListbox
        actionsRef={actionsRef}
        estimatedItemHeight={20}
        estimatedGroupHeaderHeight={20}
        groups={createGroups([50, 50])}
        overscanPx={0}
        render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
      />,
    );

    await act(async () => {
      actionsRef.current?.scrollToIndex(60, { align: 'start' });
    });

    // Item 60 sits at row 62: two headers precede it.
    await waitFor(() => expect(screen.getByTestId('virtualizer').scrollTop).toBe(1240));
    expect(screen.getByText('Item 61')).not.toBe(null);
  });

  it('retains the header of a group whose header is outside the window', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();
    await render(
      <GroupedListbox
        actionsRef={actionsRef}
        estimatedItemHeight={20}
        estimatedGroupHeaderHeight={20}
        groups={createGroups([2, 50, 2])}
        overscanPx={0}
        render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
      />,
    );

    await act(async () => {
      actionsRef.current?.scrollToIndex(30, { align: 'start' });
    });
    await waitFor(() => expect(screen.getByText('Item 31')).not.toBe(null));

    const header = screen.getByText('Group 2');
    const wrapper = getWrapperOf(screen.getByText('Item 31'));
    expect(getRow(header)).toHaveAttribute('hidden');
    expect(getRow(header).style.display).toBe('');
    expect(wrapper.firstElementChild).toBe(getRow(header));
    expect(wrapper).toHaveAttribute('aria-labelledby', header.id);
    expect(document.getElementById(header.id)).toBe(header);
    expect(screen.getAllByText('Group 2')).toHaveLength(1);

    // Scrolling back to the group's start promotes the same header element into layout.
    await act(async () => {
      actionsRef.current?.scrollToIndex(2, { align: 'start' });
    });
    await waitFor(() => expect(screen.getByTestId('virtualizer').scrollTop).toBe(80));
    expect(screen.getByText('Group 2')).toBe(header);
    expect(getRow(header)).not.toHaveAttribute('hidden');
  });

  it('gives a pinned item in a distant group its own named wrapper', async () => {
    await render(
      <GroupedListbox
        activeIndex={{ index: 53, scroll: false }}
        estimatedItemHeight={20}
        estimatedGroupHeaderHeight={20}
        groups={createGroups([2, 50, 2])}
        overscanPx={0}
        render={<div ref={setElementClientHeight(40)} />}
      />,
    );

    const pinned = await screen.findByText('Item 54');
    expect(getRow(pinned)).toHaveStyle({ position: 'absolute' });

    const wrapper = getWrapperOf(pinned);
    const header = screen.getByText('Group 3');
    expect(wrapper).toHaveAttribute('aria-labelledby', header.id);
    expect(getRow(header)).toHaveAttribute('hidden');
    expect(wrapper.firstElementChild).toBe(getRow(header));
  });

  it('keeps a group and its focused item when a preceding group is removed', async () => {
    const groups = createGroups([2, 2]);
    const { setProps } = await render(
      <GroupedListbox
        estimatedItemHeight={20}
        getGroupKey={(group: TestGroup) => group.label}
        groups={groups}
        render={<div ref={setElementClientHeight(1000)} />}
      />,
    );

    const option = screen.getByText('Item 3');
    const wrapper = getWrapperOf(option);
    await act(async () => {
      option.focus();
    });
    expect(document.activeElement).toBe(option);

    await setProps({ groups: [groups[1]] });

    expect(screen.getByText('Item 3')).toBe(option);
    expect(getWrapperOf(option)).toBe(wrapper);
    expect(document.activeElement).toBe(option);
  });

  it('uses the host collection and its groups inside a list', async () => {
    const groups = createGroups([2, 1]) as unknown as {
      label: string;
      items: VirtualizerTestItem[];
    }[];
    const items = groups.flatMap((group) => group.items);

    await render(
      <TestVirtualizedList
        estimatedItemHeight={20}
        groups={groups}
        items={items}
        render={<div ref={setElementClientHeight(1000)} />}
        renderGroupHeader={(group: TestGroup) => <TestGroupLabel>{group.label}</TestGroupLabel>}
      >
        {(item: VirtualizerTestItem) => <TestListItem>{item.label}</TestListItem>}
      </TestVirtualizedList>,
    );

    const wrappers = screen.getAllByRole('group');
    expect(wrappers).toHaveLength(2);
    expect(wrappers[0]).toHaveAttribute('aria-labelledby', screen.getByText('Group 1').id);
    expect(screen.getByText('Item 3')).toHaveAttribute('aria-posinset', '3');
  });

  it('renders the host collection flat when its groups do not cover it', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const groups = createGroups([2, 1]) as unknown as {
        label: string;
        items: VirtualizerTestItem[];
      }[];
      const items = groups.flatMap((group) => group.items).slice(0, 2);

      await render(
        <TestVirtualizedList
          estimatedItemHeight={20}
          groups={groups}
          items={items}
          render={<div ref={setElementClientHeight(1000)} />}
          renderGroupHeader={(group: TestGroup) => <TestGroupLabel>{group.label}</TestGroupLabel>}
        >
          {(item: VirtualizerTestItem) => <TestListItem>{item.label}</TestListItem>}
        </TestVirtualizedList>,
      );

      expect(screen.queryAllByRole('group')).toHaveLength(0);
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
      expect(warnSpy.mock.calls.map(([message]) => String(message)).join('\n')).toContain(
        'describe different collections',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  describe('types', () => {
    it('infers the item type from a grouped collection', () => {
      function TypeTest() {
        return (
          <Virtualizer
            estimatedItemHeight={20}
            getItemKey={(item) => item.id}
            items={createGroups([1])}
            renderGroupHeader={(group: TestGroup, _, headerProps) => (
              <div {...headerProps}>{group.label}</div>
            )}
          >
            {(item) => <div>{item.label.toUpperCase()}</div>}
          </Virtualizer>
        );
      }

      expect(TypeTest).toBeDefined();
    });

    it('infers a primitive item type from a grouped collection', () => {
      const letterGroups: { label: string; items: string[] }[] = [
        { label: 'a', items: ['x', 'y'] },
      ];

      function TypeTest() {
        return (
          <Virtualizer
            estimatedItemHeight={20}
            items={letterGroups}
            renderGroupHeader={(group: { label: string; items: string[] }, _, headerProps) => (
              <div {...headerProps}>{group.label}</div>
            )}
          >
            {(item) => <div>{item.toUpperCase()}</div>}
          </Virtualizer>
        );
      }

      expect(TypeTest).toBeDefined();
    });

    it('requires getItemKey for grouped object items', () => {
      function TypeTest() {
        return (
          // @ts-expect-error object items require getItemKey, grouped or not
          <Virtualizer estimatedItemHeight={20} items={createGroups([1])}>
            {(item) => <div>{item.label}</div>}
          </Virtualizer>
        );
      }

      expect(TypeTest).toBeDefined();
    });
  });
});

describe.skipIf(isJSDOM)('<Virtualizer /> grouped layout', () => {
  const { render } = createRenderer();

  function renderTallHeader(
    group: TestGroup,
    _: number,
    headerProps: Virtualizer.GroupHeaderProps,
  ) {
    return (
      <div {...headerProps} style={{ height: 200 }}>
        {group.label}
      </div>
    );
  }

  it('sizes the content from the header estimate and the item average separately', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();
    await render(
      <GroupedListbox
        actionsRef={actionsRef}
        estimatedItemHeight={10}
        estimatedGroupHeaderHeight={200}
        groups={createGroups([50, 50, 50, 50])}
        overscanPx={0}
        render={<div data-testid="virtualizer" style={{ height: 300, width: 200 }} />}
        renderGroupHeader={renderTallHeader}
      />,
    );

    const virtualizer = screen.getByTestId('virtualizer');

    // Items are estimated at half their 20px height, so the total starts short and the window —
    // the first 200px header plus five items — supplies the samples the average needs. Refined
    // from items alone it converges on 200 × 20 + 4 × 200; a 200px header among the samples would
    // push every unmeasured item's estimate far above 20px.
    await waitFor(() => expect(virtualizer.scrollHeight).toBe(4800));
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });
    });
    expect(virtualizer.scrollHeight).toBe(4800);

    // Measure the second group's header, then leave it behind. The refresh demotes every
    // measured row it did not sample to the item average; a header must keep its own height.
    await act(async () => {
      actionsRef.current?.scrollToIndex(49, { align: 'start' });
    });
    await waitFor(() => expect(screen.getByText('Group 2')).not.toBe(null));
    await act(async () => {
      actionsRef.current?.scrollToIndex(0, { align: 'start' });
    });
    // Item 0 sits below the first header.
    await waitFor(() => expect(virtualizer.scrollTop).toBe(200));
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });
    });

    // Item 50 starts after the first header, fifty items, and the second header at its full height.
    expect(actionsRef.current?.getItemMetrics(50)).toEqual({
      offset: 200 + 50 * 20 + 200,
      size: 20,
    });
    expect(virtualizer.scrollHeight).toBe(4800);
  });

  it('keeps the scroll position across remeasure', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();
    await render(
      <GroupedListbox
        actionsRef={actionsRef}
        estimatedItemHeight={20}
        estimatedGroupHeaderHeight={20}
        groups={createGroups([50, 50])}
        overscanPx={0}
        render={<div data-testid="virtualizer" style={{ height: 60, width: 200 }} />}
      />,
    );

    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.scrollHeight).toBe(2040));

    await act(async () => {
      actionsRef.current?.scrollToIndex(60, { align: 'start' });
    });
    await waitFor(() => expect(virtualizer.scrollTop).toBe(1240));

    await act(async () => {
      actionsRef.current?.remeasure();
    });
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });
    });

    expect(virtualizer.scrollTop).toBe(1240);
    expect(virtualizer.scrollHeight).toBe(2040);
  });

  it('follows a pending request through headers inserted above its item', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();
    const groups = createGroups([100]);

    function Test(props: { prepended?: boolean }) {
      return (
        <GroupedListbox
          actionsRef={actionsRef}
          estimatedItemHeight={20}
          estimatedGroupHeaderHeight={20}
          getGroupKey={(group: TestGroup) => group.label}
          groups={
            props.prepended
              ? [
                  ...Array.from({ length: 50 }, (_, index) => ({
                    label: `Empty ${index}`,
                    items: [],
                  })),
                  ...groups,
                ]
              : groups
          }
          overscanPx={0}
          render={<div data-testid="virtualizer" style={{ height: 60, width: 200 }} />}
        />
      );
    }

    const { rerender } = await render(<Test />);
    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.scrollHeight).toBe(2020));

    await act(async () => {
      actionsRef.current?.scrollToIndex(30, { align: 'start' });
    });
    await rerender(<Test prepended />);

    // Item 30 moved from row 31 to row 81; the request lands on the item, not on the row index.
    await waitFor(() => expect(virtualizer.scrollTop).toBe(1620));
    expect(screen.getByText('Item 31')).not.toBe(null);
  });

  it('settles a request when the destination window cannot refine the estimate', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();
    function Test(props: { activeIndex: number | null }) {
      return (
        <GroupedListbox
          actionsRef={actionsRef}
          activeIndex={
            props.activeIndex == null ? null : { index: props.activeIndex, align: 'start' }
          }
          estimatedItemHeight={20}
          estimatedGroupHeaderHeight={200}
          groups={createGroups(Array.from({ length: 100 }, () => 1))}
          overscanPx={0}
          render={<div data-testid="virtualizer" style={{ height: 128, width: 200 }} />}
          renderGroupHeader={renderTallHeader}
        />
      );
    }

    const { setProps } = await render(<Test activeIndex={null} />);
    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.scrollHeight).toBe(100 * 220));

    await setProps({ activeIndex: 30 });

    // Item 30 starts after 30 groups of header plus item, plus its own header.
    await waitFor(() => expect(virtualizer.scrollTop).toBe(30 * 220 + 200));
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });
    });
    expect(virtualizer.scrollTop).toBe(30 * 220 + 200);

    // The request must have settled by now: a request still waiting for an average treats a
    // scroll with no direct input as an echo of its own writes rather than a takeover, and
    // re-applies its destination on the next geometry update. A settled one leaves the list where
    // it was put.
    virtualizer.scrollTop = 0;
    fireEvent.scroll(virtualizer);
    await act(async () => {
      actionsRef.current?.remeasure();
    });
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    });
    expect(virtualizer.scrollTop).toBe(0);
  });

  it('keeps the trailing content after the last header, outside every group', async () => {
    await render(
      <GroupedListbox
        estimatedItemHeight={20}
        estimatedGroupHeaderHeight={20}
        groups={createGroups([2, 0])}
        overscanPx={0}
        render={<div data-testid="virtualizer" style={{ height: 60, width: 200 }} />}
        trailing={<div data-testid="trailing" style={{ height: 30 }} />}
      />,
    );

    const virtualizer = screen.getByTestId('virtualizer');
    // Header, two items, an empty group's header, then the trailing content.
    await waitFor(() => expect(virtualizer.scrollHeight).toBe(4 * 20 + 30));

    const trailing = screen.getByTestId('trailing');
    expect(trailing.closest('[role="group"]')).toBe(null);
    virtualizer.scrollTop = virtualizer.scrollHeight;
    fireEvent.scroll(virtualizer);
    await waitFor(() =>
      expect(trailing.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        screen.getByText('Group 2').getBoundingClientRect().bottom - 1,
      ),
    );
  });

  it('counts items, not headers, towards the end threshold', async () => {
    const onEndReached = vi.fn();
    await render(
      <GroupedListbox
        endReachedThreshold={2}
        estimatedItemHeight={20}
        estimatedGroupHeaderHeight={20}
        groups={createGroups([10, 10, 0, 0])}
        onEndReached={onEndReached}
        overscanPx={0}
        render={<div data-testid="virtualizer" style={{ height: 60, width: 200 }} />}
      />,
    );

    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.scrollHeight).toBe(480));
    expect(onEndReached).not.toHaveBeenCalled();

    // Items 17 and 18 fill the viewport: two items short of the end, headers or not.
    virtualizer.scrollTop = 380;
    fireEvent.scroll(virtualizer);

    await waitFor(() => expect(onEndReached).toHaveBeenCalledTimes(1));
  });
});
