import * as React from 'react';
import { expect, type Mock, describe, beforeEach, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { advanceReactClock, createRenderer, firePointer } from '#test-utils';
import { SCROLL_IDLE_MS, useScrollGesture, type ScrollGesture } from './useScrollGesture';

/** A scroll event the caller does not recognize as one of its own corrective writes. */
const USER_SCROLL = () => false;
/** A scroll event that echoes a position the caller wrote itself. */
const PROGRAMMATIC_SCROLL = () => true;

describe('useScrollGesture', () => {
  const { clock, render } = createRenderer({ clockOptions: { shouldAdvanceTime: true } });

  clock.withFakeTimers();

  let gesture: ScrollGesture;
  let hydrateRowsMeta: Mock<() => void>;

  function Probe(props: { tag?: 'div' | 'section' }) {
    const { tag: Tag = 'div' } = props;
    const resolved = useScrollGesture({ settleGeometry: hydrateRowsMeta });

    useIsoLayoutEffect(() => {
      gesture = resolved;
    });

    return <Tag data-testid="scroller" ref={resolved.scrollElementRefCallback} />;
  }

  beforeEach(() => {
    hydrateRowsMeta = vi.fn();
  });

  it('ignores a scroll the caller recognizes as its own', async () => {
    await render(<Probe />);

    expect(gesture.noteScroll(PROGRAMMATIC_SCROLL)).toBe(false);
    expect(gesture.isScrolling()).toBe(false);
  });

  it('treats an unclaimed scroll as a gesture until it goes idle', async () => {
    await render(<Probe />);

    expect(gesture.noteScroll(USER_SCROLL)).toBe(true);
    expect(gesture.isScrolling()).toBe(true);

    await advanceReactClock(clock, SCROLL_IDLE_MS);

    expect(gesture.isScrolling()).toBe(false);
  });

  it('publishes a new settled revision once a gesture ends', async () => {
    await render(<Probe />);

    const initialRevision = gesture.settledRevision;
    gesture.noteScroll(USER_SCROLL);

    await advanceReactClock(clock, SCROLL_IDLE_MS);

    expect(gesture.settledRevision).not.toBe(initialRevision);
  });

  it('reads a scroll under a held pointer with no wheel input as a scrollbar drag', async () => {
    await render(<Probe />);

    firePointer.down(screen.getByTestId('scroller'), { timeStamp: 1 });
    gesture.noteScroll(USER_SCROLL);

    expect(gesture.isScrollbarDrag()).toBe(true);
  });

  it('does not read a wheel scroll as a scrollbar drag', async () => {
    await render(<Probe />);

    const scroller = screen.getByTestId('scroller');
    firePointer.down(scroller, { timeStamp: 1 });
    fireEvent.wheel(scroller);
    gesture.noteScroll(USER_SCROLL);

    expect(gesture.isScrollbarDrag()).toBe(false);
  });

  it('listens on the element the scroller ref is handed next', async () => {
    const { rerender } = await render(<Probe tag="div" />);

    // The root element is replaced without the hook remounting, as a changed `render` prop does.
    await rerender(<Probe tag="section" />);
    const scroller = screen.getByTestId('scroller');
    expect(scroller.tagName).toBe('SECTION');

    firePointer.down(scroller, { timeStamp: 1 });
    fireEvent.wheel(scroller);
    gesture.noteScroll(USER_SCROLL);

    expect(gesture.isScrollbarDrag()).toBe(false);
  });

  it("releases the previous element's listeners, its document ones included", async () => {
    const { rerender, unmount } = await render(<Probe tag="div" />);
    await rerender(<Probe tag="section" />);

    // Let the wheel input above the release window expire, so nothing masks a leaked press.
    firePointer.up(screen.getByTestId('scroller'), { timeStamp: 2 });
    await advanceReactClock(clock, 251);
    unmount();

    // A leaked `pointerdown` listener on the document would still record the press.
    firePointer.down(document.body, { timeStamp: 3 });
    gesture.noteScroll(USER_SCROLL);

    expect(gesture.isScrollbarDrag()).toBe(false);
  });

  it('holds a row measurement back for the duration of a drag', async () => {
    await render(<Probe />);

    firePointer.down(screen.getByTestId('scroller'), { timeStamp: 1 });
    gesture.noteScroll(USER_SCROLL);

    // The estimate is committed instead, so the geometry cannot move under the pointer.
    expect(gesture.deferRowHeight('row-1', 90, 30)).toBe(30);
    expect(gesture.releaseRowHeight('row-1')).toBe(90);
    // A released measurement is committed once and then forgotten.
    expect(gesture.releaseRowHeight('row-1')).toBe(undefined);
  });

  it('commits the measurements a drag deferred once the pointer is released', async () => {
    await render(<Probe />);

    const scroller = screen.getByTestId('scroller');
    firePointer.down(scroller, { timeStamp: 1 });
    gesture.noteScroll(USER_SCROLL);
    gesture.deferRowHeight('row-1', 90, 30);

    expect(hydrateRowsMeta).not.toHaveBeenCalled();

    firePointer.up(scroller, { timeStamp: 2 });

    await waitFor(() => {
      expect(hydrateRowsMeta).toHaveBeenCalledTimes(1);
    });
    expect(gesture.isScrollbarDrag()).toBe(false);
  });

  it('drops every deferred measurement on request', async () => {
    await render(<Probe />);

    firePointer.down(screen.getByTestId('scroller'), { timeStamp: 1 });
    gesture.noteScroll(USER_SCROLL);
    gesture.deferRowHeight('row-1', 90, 30);

    gesture.clearDeferredRowHeights();

    expect(gesture.releaseRowHeight('row-1')).toBe(undefined);
  });
});
