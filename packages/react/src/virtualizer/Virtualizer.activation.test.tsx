import * as React from 'react';
import { expect, vi, describe, it, beforeEach } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
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
