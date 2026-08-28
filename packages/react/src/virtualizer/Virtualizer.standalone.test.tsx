import * as React from 'react';
import { expect, vi } from 'vitest';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, createDOMRect, setElementClientHeight } from '#test-utils';
import { Virtualizer } from './Virtualizer';

interface TestItem {
  id: number;
  label: string;
}

function createItems(count: number): TestItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    label: `Item ${index + 1}`,
  }));
}

/**
 * A listbox assembled from plain elements, standing in for an application that drops the
 * virtualizer into a list Base UI knows nothing about. Nothing here publishes a virtualization
 * host, so these tests exercise the `items` prop path end to end.
 */
function TestListbox(
  props: {
    items: TestItem[];
    activeIndex?: Virtualizer.ActiveIndex | null | undefined;
  } & Omit<Virtualizer.Props<TestItem>, 'children' | 'getItemKey' | 'items'>,
) {
  const { activeIndex, items, ...virtualizerProps } = props;
  const activeItemIndex = typeof activeIndex === 'object' ? activeIndex?.index : activeIndex;

  return (
    <Virtualizer<TestItem>
      activeIndex={activeIndex}
      getItemKey={(item) => item.id}
      items={items}
      role="listbox"
      {...virtualizerProps}
    >
      {(item, index, itemProps) => (
        <div
          {...itemProps}
          role="option"
          aria-selected={false}
          tabIndex={-1}
          style={{ height: 20 }}
        >
          {item.label}
          {index === activeItemIndex ? ' (active)' : ''}
        </div>
      )}
    </Virtualizer>
  );
}

describe('<Virtualizer /> standalone', () => {
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

  it('windows a collection passed through the items prop', async () => {
    await render(
      <TestListbox
        estimatedItemHeight={20}
        overscanPx={20}
        render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
        items={createItems(100)}
      />,
    );

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(5));

    expect(screen.getByText('Item 5')).not.toBe(null);
    expect(screen.queryByText('Item 20')).toBe(null);
    expect(screen.getByTestId('virtualizer').style.getPropertyValue('--total-size')).toBe('2000px');
  });

  it('supplies accessibility metadata to the item renderer', async () => {
    await render(
      <TestListbox
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(60)} />}
        items={createItems(100)}
      />,
    );

    const firstOption = await screen.findByText('Item 1');

    expect(firstOption).toHaveAttribute('aria-posinset', '1');
    expect(firstOption).toHaveAttribute('aria-setsize', '100');
    expect(firstOption).toHaveAttribute('data-index', '0');
  });

  it('updates the metadata when the collection is filtered', async () => {
    const { setProps } = await render(
      <TestListbox
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(60)} />}
        items={createItems(100)}
      />,
    );

    await screen.findByText('Item 1');
    await setProps({ items: createItems(100).slice(0, 3) });

    await waitFor(() => expect(screen.getByText('Item 1')).toHaveAttribute('aria-setsize', '3'));
  });

  it('keeps the active item mounted outside the rendered window', async () => {
    await render(
      <TestListbox
        activeIndex={{ index: 50, scroll: false }}
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(40)} />}
        items={createItems(100)}
      />,
    );

    const activeOption = await screen.findByText(/Item 51/);

    expect(activeOption.parentElement).toHaveStyle({ position: 'absolute' });
  });

  it('keeps DOM focus on the active item when it re-enters the rendered window', async () => {
    const { setProps } = await render(
      <TestListbox
        activeIndex={{ index: 60, scroll: false }}
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
        items={createItems(100)}
      />,
    );

    const activeOption = await screen.findByText(/Item 61/);
    await act(async () => {
      activeOption.focus();
    });
    expect(document.activeElement).toBe(activeOption);

    // The activation now asks for the row to be scrolled in, so the retained proxy is replaced by
    // the real row. A list that moves DOM focus with a roving tabindex loses it here if the
    // element is remounted rather than reused.
    await setProps({ activeIndex: { index: 60 } });
    await waitFor(() => expect(screen.getByTestId('virtualizer').scrollTop).toBeGreaterThan(1000));

    // Guards against the assertion below passing vacuously: the row must genuinely have been
    // promoted out of the offscreen proxy and back into the laid-out window.
    expect(activeOption.parentElement).toHaveStyle({ display: 'flow-root' });
    expect(screen.getByText(/Item 61/)).toBe(activeOption);
    expect(document.activeElement).toBe(activeOption);
  });

  it('keeps DOM focus on the active item when it leaves the rendered window', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();
    await render(
      <TestListbox
        actionsRef={actionsRef}
        activeIndex={{ index: 0, scroll: false }}
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
        items={createItems(100)}
      />,
    );

    const activeOption = await screen.findByText(/Item 1 /);
    await act(async () => {
      activeOption.focus();
    });
    expect(document.activeElement).toBe(activeOption);

    await act(async () => {
      actionsRef.current?.scrollToIndex(80, { align: 'start' });
    });
    await waitFor(() => expect(screen.getByTestId('virtualizer').scrollTop).toBe(1600));

    // The row is now outside the window and retained only as the offscreen focus proxy.
    expect(activeOption.parentElement).toHaveStyle({ position: 'absolute' });
    expect(screen.getByText(/Item 1 /)).toBe(activeOption);
    expect(document.activeElement).toBe(activeOption);
  });

  it('scrolls the active item into view when it changes', async () => {
    const { setProps } = await render(
      <TestListbox
        activeIndex={0}
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
        items={createItems(100)}
      />,
    );

    await screen.findByText(/Item 1 /);
    await setProps({ activeIndex: 60 });

    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.scrollTop).toBeGreaterThan(1000));
    await waitFor(() => expect(screen.getByText(/Item 61/)).not.toBe(null));
  });

  it('does not scroll for an activation that opts out', async () => {
    const { setProps } = await render(
      <TestListbox
        activeIndex={{ index: 0, scroll: false }}
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
        items={createItems(100)}
      />,
    );

    await screen.findByText(/Item 1 /);
    await setProps({ activeIndex: { index: 60, scroll: false } });

    await screen.findByText(/Item 61/);
    expect(screen.getByTestId('virtualizer').scrollTop).toBe(0);
  });

  it('does not rescroll when an unchanged activation is passed as a new object', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();
    const { setProps } = await render(
      <TestListbox
        actionsRef={actionsRef}
        activeIndex={{ index: 60 }}
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
        items={createItems(100)}
      />,
    );

    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.scrollTop).toBeGreaterThan(1000));

    // Move the viewport elsewhere, then let an unrelated render pass an equal but fresh object.
    // Inline activations are recreated on every render, so identity must not count as a new one.
    await act(async () => {
      actionsRef.current?.scrollToIndex(0, { align: 'start' });
    });
    await waitFor(() => expect(virtualizer.scrollTop).toBe(0));

    await setProps({ activeIndex: { index: 60 } });
    await flushMicrotasks();

    expect(virtualizer.scrollTop).toBe(0);
  });

  it('honors the alignment carried by the activation', async () => {
    const { setProps } = await render(
      <TestListbox
        activeIndex={{ index: 0 }}
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
        items={createItems(100)}
      />,
    );

    await screen.findByText(/Item 1 /);
    await setProps({ activeIndex: { index: 60, align: 'start' } });

    // `start` puts the row's own offset at the top, rather than the bottom edge `auto` would pick.
    await waitFor(() => expect(screen.getByTestId('virtualizer').scrollTop).toBe(1200));
  });

  it('exposes imperative scrolling through actionsRef', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();

    await render(
      <TestListbox
        actionsRef={actionsRef}
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
        items={createItems(100)}
      />,
    );

    await screen.findByText('Item 1');

    await act(async () => {
      actionsRef.current?.scrollToIndex(80, { align: 'start' });
    });

    await waitFor(() => expect(screen.getByTestId('virtualizer').scrollTop).toBe(1600));
    await waitFor(() => expect(screen.getByText('Item 81')).not.toBe(null));
  });

  it('exposes item geometry through actionsRef, including outside the rendered window', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();

    await render(
      <TestListbox
        actionsRef={actionsRef}
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
        items={createItems(100)}
      />,
    );

    await screen.findByText('Item 1');

    // The point of the accessor: geometry for a row the window has never mounted.
    expect(screen.queryByText('Item 81')).toBe(null);
    expect(actionsRef.current?.getItemMetrics(80)).toEqual({ offset: 1600, size: 20 });
    expect(actionsRef.current?.getItemMetrics(0)).toEqual({ offset: 0, size: 20 });
    expect(actionsRef.current?.getItemMetrics(100)).toBe(null);
    expect(actionsRef.current?.getItemMetrics(-1)).toBe(null);
  });

  it('maps a scroll position back to the item at it', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();

    await render(
      <TestListbox
        actionsRef={actionsRef}
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
        items={createItems(100)}
      />,
    );

    await screen.findByText('Item 1');

    expect(actionsRef.current?.getIndexAtOffset(0)).toBe(0);
    expect(actionsRef.current?.getIndexAtOffset(19)).toBe(0);
    expect(actionsRef.current?.getIndexAtOffset(20)).toBe(1);
    expect(actionsRef.current?.getIndexAtOffset(1610)).toBe(80);

    // A scroll position cannot fall outside the collection, so both ends clamp.
    expect(actionsRef.current?.getIndexAtOffset(-100)).toBe(0);
    expect(actionsRef.current?.getIndexAtOffset(1_000_000)).toBe(99);
  });

  it('round-trips an index through its scroll position', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();

    await render(
      <TestListbox
        actionsRef={actionsRef}
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
        items={createItems(100)}
      />,
    );

    await screen.findByText('Item 1');

    for (const index of [0, 1, 37, 80, 99]) {
      const metrics = actionsRef.current?.getItemMetrics(index);
      expect(metrics).not.toBe(null);
      expect(actionsRef.current?.getIndexAtOffset(metrics!.offset)).toBe(index);
    }
  });

  it('reports geometry in scroll coordinates, offset by the scrollport padding', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();

    await render(
      <TestListbox
        actionsRef={actionsRef}
        estimatedItemHeight={20}
        overscanPx={0}
        style={{ paddingTop: 10, paddingBottom: 0 }}
        render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
        items={createItems(100)}
      />,
    );

    await screen.findByText('Item 1');

    // The engine counts rows alone; a consumer holds a `scrollTop`. The padding between the two
    // coordinate spaces is the component's to account for, not the caller's.
    await waitFor(() =>
      expect(actionsRef.current?.getItemMetrics(80)).toEqual({ offset: 1610, size: 20 }),
    );
    expect(actionsRef.current?.getIndexAtOffset(1610)).toBe(80);
    expect(actionsRef.current?.getIndexAtOffset(9)).toBe(0);
  });

  it('returns no geometry for an empty collection', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();

    await render(
      <TestListbox
        actionsRef={actionsRef}
        estimatedItemHeight={20}
        render={<div ref={setElementClientHeight(60)} />}
        items={[]}
      />,
    );

    expect(actionsRef.current?.getIndexAtOffset(0)).toBe(null);
    expect(actionsRef.current?.getItemMetrics(0)).toBe(null);
  });

  it('renders every item when virtualization is disabled', async () => {
    await render(
      <TestListbox
        enabled={false}
        estimatedItemHeight={20}
        render={<div ref={setElementClientHeight(60)} />}
        items={createItems(30)}
      />,
    );

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(30));
  });

  it('renders the empty state without a collection', async () => {
    await render(
      <TestListbox
        estimatedItemHeight={20}
        render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
        items={[]}
      />,
    );

    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByTestId('virtualizer')).toHaveAttribute('data-empty');
  });

  it('updates the rendered window when scrolled', async () => {
    await render(
      <TestListbox
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
        items={createItems(100)}
      />,
    );

    await screen.findByText('Item 1');

    const virtualizer = screen.getByTestId('virtualizer');
    virtualizer.scrollTop = 400;
    fireEvent.scroll(virtualizer);

    await waitFor(() => expect(screen.getByText('Item 21')).not.toBe(null));
    expect(screen.queryByText('Item 1')).toBe(null);
  });

  it('preserves row identity when items are recreated', async () => {
    const { setProps } = await render(
      <TestListbox
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(60)} />}
        items={createItems(100)}
      />,
    );

    const firstOption = await screen.findByText('Item 1');

    // `getItemKey` resolves the same keys, so recreating the item objects must update the mounted
    // rows in place rather than remount them.
    await setProps({ items: createItems(100) });

    await waitFor(() => expect(screen.getByText('Item 1')).toBe(firstOption));
  });
});
