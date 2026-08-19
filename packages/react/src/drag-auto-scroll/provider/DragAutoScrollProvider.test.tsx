import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer, testDragKind } from '#test-utils';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import { Draggable } from '@base-ui/react/draggable';
import { flushRaf, lift, setupDragEngineTests } from '../../../test/dnd';

setupDragEngineTests();

describe('DragAutoScroll.Provider', () => {
  const { renderDnd } = createDndRenderer();

  function ScrollingApp(props: { providers?: number; disabled?: boolean; configured?: boolean }) {
    const { providers = 1, disabled = false, configured = false } = props;
    const scrollBy = React.useMemo(() => vi.fn(), []);
    const scrollerRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        if (!node) {
          return;
        }
        node.style.overflow = 'auto';
        node.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
        Object.defineProperties(node, {
          clientHeight: { configurable: true, value: 200 },
          scrollHeight: { configurable: true, value: 1000 },
          scrollTop: { configurable: true, value: 400, writable: true },
        });
        node.scrollBy = scrollBy;
      },
      [scrollBy],
    );

    let activators: React.ReactNode = null;
    for (let index = 0; index < providers; index += 1) {
      activators = (
        <React.Fragment>
          {activators}
          <DragAutoScroll.Provider disabled={disabled} />
        </React.Fragment>
      );
    }

    const source = (
      <Draggable.Root kind={testDragKind} data-testid="source">
        Card
      </Draggable.Root>
    );

    return (
      <React.Fragment>
        {activators}
        {configured ? (
          <DragAutoScroll.Root ref={scrollerRef} data-testid="scroller" maxSpeed={300}>
            {source}
          </DragAutoScroll.Root>
        ) : (
          <div ref={scrollerRef} data-testid="scroller">
            {source}
          </div>
        )}
      </React.Fragment>
    );
  }

  async function dragIntoBottomEdge(): Promise<void> {
    const source = screen.getByTestId('source');
    const scroller = screen.getByTestId('scroller');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 40);
    await lift(source, { clientX: 100, clientY: 20 });
    fireEvent.dragOver(scroller, { clientX: 100, clientY: 190 });
    await flushRaf();
    await flushRaf();
    await flushRaf();
  }

  function getScrollBy(): ReturnType<typeof vi.fn> {
    return screen.getByTestId('scroller').scrollBy as ReturnType<typeof vi.fn>;
  }

  it('renders no element of its own', async () => {
    await renderDnd(
      <div data-testid="parent">
        <DragAutoScroll.Provider>
          <span data-testid="child" />
        </DragAutoScroll.Provider>
      </div>,
    );

    expect(screen.getByTestId('parent').children).toHaveLength(1);
    expect(screen.getByTestId('parent').firstElementChild).toBe(screen.getByTestId('child'));
  });

  it('enables inferred scrolling without annotating the scroll container', async () => {
    await renderDnd(<ScrollingApp />);

    await dragIntoBottomEdge();

    expect(getScrollBy()).toHaveBeenCalled();
  });

  it('wakes an inferred scroller when content growth creates scroll room', async () => {
    const scrollBy = vi.fn();
    let scrollHeight = 200;
    const scrollerRef = (node: HTMLDivElement | null) => {
      if (!node) {
        return;
      }
      node.style.overflow = 'auto';
      node.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
      Object.defineProperties(node, {
        clientHeight: { configurable: true, value: 200 },
        scrollHeight: { configurable: true, get: () => scrollHeight },
        scrollTop: { configurable: true, value: 0, writable: true },
      });
      node.scrollBy = scrollBy;
    };
    await renderDnd(
      <React.Fragment>
        <DragAutoScroll.Provider />
        <div ref={scrollerRef} data-testid="scroller">
          <Draggable.Root kind={testDragKind} data-testid="source">
            Card
          </Draggable.Root>
        </div>
      </React.Fragment>,
    );

    await dragIntoBottomEdge();
    expect(scrollBy).not.toHaveBeenCalled();

    await act(async () => {
      scrollHeight = 1000;
      screen.getByTestId('scroller').appendChild(document.createElement('div'));
      await Promise.resolve();
    });
    await flushRaf();
    await flushRaf();

    expect(scrollBy).toHaveBeenCalled();
  });

  it('does not enable inferred scrolling when disabled', async () => {
    await renderDnd(<ScrollingApp disabled />);

    await dragIntoBottomEdge();

    expect(getScrollBy()).not.toHaveBeenCalled();
  });

  it('enables inferred scrolling when activated during a drag', async () => {
    const { rerender } = await renderDnd(<ScrollingApp disabled />);
    await dragIntoBottomEdge();
    expect(getScrollBy()).not.toHaveBeenCalled();

    await rerender(<ScrollingApp />);
    await flushRaf();
    await flushRaf();

    expect(getScrollBy()).toHaveBeenCalled();
  });

  it('keeps scrolling enabled until the last provider unmounts', async () => {
    const { rerender } = await renderDnd(<ScrollingApp providers={2} />);
    await rerender(<ScrollingApp providers={1} />);

    await dragIntoBottomEdge();

    expect(getScrollBy()).toHaveBeenCalled();
  });

  it('keeps inferred scrolling enabled when a configured root unmounts', async () => {
    const { rerender } = await renderDnd(<ScrollingApp configured />);
    await rerender(<ScrollingApp />);
    await Promise.resolve();

    await dragIntoBottomEdge();

    expect(getScrollBy()).toHaveBeenCalled();
  });

  it('disables inferred scrolling after the last provider unmounts', async () => {
    const { rerender } = await renderDnd(<ScrollingApp />);
    await rerender(<ScrollingApp providers={0} />);
    await Promise.resolve();

    await dragIntoBottomEdge();

    expect(getScrollBy()).not.toHaveBeenCalled();
  });
});
