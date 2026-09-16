import * as React from 'react';
import { expect, vi, describe, beforeEach, it } from 'vitest';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import {
  createRenderer,
  createDOMRect,
  setElementClientHeight,
  setElementScrollState,
  TestListItem,
  TestVirtualizedList,
  createVirtualizerItems as createItems,
  type VirtualizerTestItem as TestItem,
} from '#test-utils';
import { Virtualizer } from './Virtualizer';

describe('<Virtualizer /> activation', () => {
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

  it('does not scroll pointer highlights and resumes scrolling for keyboard highlights', async () => {
    const handleScrollTo = vi.fn();

    // A pointer highlight is an activation that must leave the viewport alone; a keyboard
    // highlight that follows it must scroll. Both are the same `activeIndex` channel, told apart
    // by `scrollActiveIntoView`.
    function Test(props: { activeIndex: number; scrollActiveIntoView: boolean }) {
      return (
        <TestVirtualizedList
          activeIndex={props.activeIndex}
          scrollActiveIntoView={props.scrollActiveIntoView}
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
          items={createItems(10)}
        >
          {(item: TestItem) => <TestListItem style={{ height: 20 }}>{item.label}</TestListItem>}
        </TestVirtualizedList>
      );
    }

    const { rerender } = await render(<Test activeIndex={2} scrollActiveIntoView={false} />);

    await screen.findByText('Item 3');
    expect(handleScrollTo).not.toHaveBeenCalled();

    await rerender(<Test activeIndex={3} scrollActiveIntoView />);
    await waitFor(() =>
      expect(handleScrollTo).toHaveBeenLastCalledWith({
        behavior: 'instant',
        top: 40,
      }),
    );
  });

  it('lets a host publish the scroll decision with the index', async () => {
    let scrollTop = 0;
    const handleScrollTo = vi.fn((options: ScrollToOptions) => {
      scrollTop = options.top ?? scrollTop;
    });

    // The decision travels with the index, so a host has the same activation the `activeIndex`
    // prop takes: the flag that describes the host as a whole is not the only way to say it.
    function Test(props: { activeIndex: Virtualizer.ActiveIndex }) {
      return (
        <TestVirtualizedList
          activeIndex={props.activeIndex}
          estimatedItemHeight={20}
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
          items={createItems(100)}
        >
          {(item: TestItem) => <TestListItem style={{ height: 20 }}>{item.label}</TestListItem>}
        </TestVirtualizedList>
      );
    }

    const { rerender } = await render(<Test activeIndex={{ index: 40, scroll: false }} />);

    await screen.findByText('Item 41');
    expect(handleScrollTo).not.toHaveBeenCalled();

    // An activation of its own scrolls, wherever the collection came from, and carries the
    // alignment and the inset the host wants left at the edge.
    await rerender(<Test activeIndex={{ index: 60, align: 'start', paddingStart: 12 }} />);
    await waitFor(() =>
      expect(handleScrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 1188 }),
    );

    // Re-publishing an equal activation is not a new one. A request still standing may re-apply
    // the position it asked for, so what must hold is that nothing moves the viewport elsewhere.
    handleScrollTo.mockClear();
    await rerender(<Test activeIndex={{ index: 60, align: 'start', paddingStart: 12 }} />);
    await flushMicrotasks();
    expect(handleScrollTo.mock.calls.every(([options]) => options?.top === 1188)).toBe(true);
    expect(scrollTop).toBe(1188);

    // And an activation that declines to scroll leaves the viewport where it is, rather than
    // taking it to whatever was pointed at — which is what a flag describing the host as a whole
    // cannot express.
    await rerender(<Test activeIndex={{ index: 20, scroll: false }} />);
    await flushMicrotasks();
    expect(scrollTop).toBe(1188);
    await screen.findByText('Item 21');
  });

  it('does not rerun item renderers when the highlight stays within the rendered window', async () => {
    const renderItem = vi.fn((item: TestItem) => (
      <TestListItem style={{ height: 20 }}>{item.label}</TestListItem>
    ));
    // Held outside the wrapper: only the highlight changes between renders, not the collection.
    const items = createItems(10);

    function Test(props: { pinnedRowIndex?: number }) {
      return (
        <TestVirtualizedList
          estimatedItemHeight={20}
          pinnedRowIndex={props.pinnedRowIndex}
          render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
          items={items}
        >
          {renderItem}
        </TestVirtualizedList>
      );
    }

    const { rerender } = await render(<Test />);

    await screen.findByText('Item 1');
    await waitFor(() =>
      expect(screen.getByTestId('virtualizer').style.getPropertyValue('--total-size')).toBe(
        '200px',
      ),
    );
    renderItem.mockClear();

    await rerender(<Test pinnedRowIndex={0} />);

    await screen.findByText('Item 1');
    expect(renderItem).not.toHaveBeenCalled();
  });

  it('keeps an offscreen highlighted item layout-neutral and unmeasured', async () => {
    let scrollTop = 0;
    const handleScrollTo = vi.fn((options: ScrollToOptions) => {
      scrollTop = options.top ?? scrollTop;
    });

    await render(
      <TestVirtualizedList
        estimatedItemHeight={32}
        overscanPx={0}
        scrollToRowIndex={0}
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
        items={createItems(100)}
      >
        {(item: TestItem) => (
          <TestListItem style={{ boxSizing: 'border-box', height: 32, paddingBlock: 8 }}>
            {item.label}
          </TestListItem>
        )}
      </TestVirtualizedList>,
    );

    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.style.getPropertyValue('--total-size')).toBe('3200px'));

    // Highlighting a row keeps its scroll request pending until the row is measured, even when the
    // row already sits in view and no scrolling is needed. Let that request resolve before
    // simulating a user scroll: retried afterwards, it realigns the highlighted row with the top of
    // the viewport and pulls the list straight back to where it started.
    await act(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 250);
        }),
    );

    scrollTop = 320;
    fireEvent.scroll(virtualizer);

    // The scroll event re-renders the window asynchronously, and the highlighted row is remounted
    // as the retained proxy, so the row has to be looked up again on every attempt.
    const getHighlightedRow = () => virtualizer.querySelector<HTMLElement>('[data-row-index="0"]');

    await waitFor(() => expect(getHighlightedRow()).toHaveStyle({ position: 'absolute' }));
    expect(getHighlightedRow()?.style.transform).toBe('translateX(-10000px)');
    expect(virtualizer.style.getPropertyValue('--total-size')).toBe('3200px');
  });

  it('does not restore a retained highlight when the collection length changes', async () => {
    const allItems = createItems(10);
    let scrollTop = 0;
    const handleScrollTo = vi.fn((options: ScrollToOptions) => {
      scrollTop = options.top ?? scrollTop;
    });

    function Test(props: { items: TestItem[] }) {
      return (
        <TestVirtualizedList
          estimatedItemHeight={20}
          overscanPx={0}
          scrollToRowIndex={2}
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
          items={props.items}
        >
          {(item: TestItem) => <TestListItem style={{ height: 20 }}>{item.label}</TestListItem>}
        </TestVirtualizedList>
      );
    }

    const { rerender } = await render(<Test items={allItems} />);
    await waitFor(() => expect(handleScrollTo).toHaveBeenCalled());

    handleScrollTo.mockClear();
    scrollTop = 100;
    fireEvent.scroll(screen.getByTestId('virtualizer'));
    await rerender(<Test items={allItems.slice(0, 9)} />);
    await waitFor(() => expect(screen.queryByText('Item 10')).toBe(null));

    expect(handleScrollTo).not.toHaveBeenCalled();
  });
});
