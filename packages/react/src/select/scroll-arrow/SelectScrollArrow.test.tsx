import { expect, vi } from 'vitest';
import { Select } from '@base-ui/react/select';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

/**
 * Installs a mutable `scrollTop` plus fixed `scrollHeight`/`clientHeight` on a scroller so the
 * hover auto-scroll can be exercised in both environments (jsdom reports zeroed geometry, and
 * Chromium won't lay out enough content to overflow at these sizes).
 */
function stubScroller(
  node: HTMLElement | null,
  geometry: { scrollHeight: number; clientHeight: number },
  readScrollTop: () => number,
  onScrollTopChange: (value: number) => void,
) {
  if (!node) {
    return;
  }

  Object.defineProperty(node, 'scrollTop', {
    configurable: true,
    get: readScrollTop,
    set: onScrollTopChange,
  });
  Object.defineProperty(node, 'scrollHeight', {
    value: geometry.scrollHeight,
    configurable: true,
  });
  Object.defineProperty(node, 'clientHeight', {
    value: geometry.clientHeight,
    configurable: true,
  });
}

function stubItem(node: HTMLElement | null, offsetTop: number, offsetHeight: number) {
  if (!node) {
    return;
  }

  Object.defineProperty(node, 'offsetTop', { value: offsetTop, configurable: true });
  Object.defineProperty(node, 'offsetHeight', { value: offsetHeight, configurable: true });
}

describe('<Select.ScrollArrow />', () => {
  const { render } = createRenderer();

  /**
   * Renders a scrollable select whose list geometry is fully stubbed, and returns a live view of
   * the scroll offset the component writes back.
   */
  async function renderScrollableSelect(options: {
    initialScrollTop: number;
    scrollHeight?: number;
    clientHeight?: number;
    itemOffsets?: number[];
    itemHeight?: number;
  }) {
    const {
      initialScrollTop,
      scrollHeight = 400,
      clientHeight = 200,
      itemOffsets = [0, 40, 80, 120, 160, 200, 240, 280, 320, 360],
      itemHeight = 40,
    } = options;

    let scrollTop = initialScrollTop;
    let scrollWrites = 0;

    await render(
      <Select.Root open>
        <Select.Trigger>Open</Select.Trigger>
        <Select.Portal>
          <Select.Positioner alignItemWithTrigger={false}>
            <Select.Popup>
              <Select.ScrollUpArrow keepMounted />
              <Select.List
                ref={(node) =>
                  stubScroller(
                    node,
                    { scrollHeight, clientHeight },
                    () => scrollTop,
                    (value) => {
                      scrollWrites += 1;
                      scrollTop = value;
                    },
                  )
                }
              >
                {itemOffsets.map((offsetTop, index) => (
                  <Select.Item
                    key={index}
                    value={`item-${index}`}
                    ref={(node) => stubItem(node, offsetTop, itemHeight)}
                  >
                    Item {index}
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow keepMounted />
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const downArrow = screen.getByText('▼');
    const upArrow = screen.getByText('▲');
    Object.defineProperty(downArrow, 'offsetHeight', { value: 0, configurable: true });
    Object.defineProperty(upArrow, 'offsetHeight', { value: 0, configurable: true });

    return {
      downArrow,
      upArrow,
      getScrollTop: () => scrollTop,
      getScrollWrites: () => scrollWrites,
    };
  }

  it('does not start auto-scrolling for a mouse move that did not move the pointer', async () => {
    vi.useFakeTimers();
    try {
      const { downArrow, getScrollTop } = await renderScrollableSelect({ initialScrollTop: 0 });

      // Browsers dispatch a zero-movement `mousemove` when content scrolls beneath a stationary
      // cursor; that must not kick off the hover scroll.
      fireEvent.mouseMove(downArrow, { movementX: 0, movementY: 0 });

      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(getScrollTop()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not let continuous pointer movement postpone the scheduled scroll', async () => {
    vi.useFakeTimers();
    try {
      const { downArrow, getScrollTop } = await renderScrollableSelect({ initialScrollTop: 0 });

      fireEvent.mouseMove(downArrow, { movementX: 0, movementY: 1 });

      act(() => {
        vi.advanceTimersByTime(30);
      });

      // A second move arrives before the first scroll fires. Restarting the timer here would
      // mean a user who keeps jiggling the pointer never scrolls at all.
      fireEvent.mouseMove(downArrow, { movementX: 1, movementY: 1 });

      act(() => {
        vi.advanceTimersByTime(15);
      });

      expect(getScrollTop()).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops auto-scrolling once the pointer leaves the arrow', async () => {
    vi.useFakeTimers();
    try {
      const { downArrow, getScrollTop } = await renderScrollableSelect({ initialScrollTop: 0 });

      fireEvent.mouseMove(downArrow, { movementX: 0, movementY: 1 });

      act(() => {
        vi.advanceTimersByTime(40);
      });

      const scrollTopAfterFirstStep = getScrollTop();
      expect(scrollTopAfterFirstStep).toBeGreaterThan(0);

      fireEvent.mouseLeave(downArrow);

      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(getScrollTop()).toBe(scrollTopAfterFirstStep);
    } finally {
      vi.useRealTimers();
    }
  });

  it('snaps a sub-pixel offset to the exact top edge and then stops scrolling', async () => {
    vi.useFakeTimers();
    try {
      // Within `SCROLL_EDGE_TOLERANCE_PX` of the top, so the offset normalizes to exactly 0.
      const { upArrow, getScrollTop, getScrollWrites } = await renderScrollableSelect({
        initialScrollTop: 0.4,
      });

      fireEvent.mouseMove(upArrow, { movementX: 0, movementY: -1 });

      act(() => {
        vi.advanceTimersByTime(40);
      });

      expect(getScrollTop()).toBe(0);

      const writesAtEdge = getScrollWrites();

      // Reaching the edge must cancel the loop rather than spin on no-op scroll writes every
      // 40ms for as long as the pointer rests on the arrow.
      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(getScrollTop()).toBe(0);
      expect(getScrollWrites()).toBe(writesAtEdge);
    } finally {
      vi.useRealTimers();
    }
  });

  it('scrolls the popup itself when no Select.List is rendered', async () => {
    vi.useFakeTimers();
    try {
      let scrollTop = 0;

      await render(
        <Select.Root open>
          <Select.Trigger>Open</Select.Trigger>
          <Select.Portal>
            <Select.Positioner alignItemWithTrigger={false}>
              <Select.Popup
                ref={(node) =>
                  stubScroller(
                    node,
                    { scrollHeight: 400, clientHeight: 200 },
                    () => scrollTop,
                    (value) => {
                      scrollTop = value;
                    },
                  )
                }
              >
                <Select.ScrollUpArrow keepMounted />
                {[0, 40, 80, 120, 160, 200, 240, 280, 320, 360].map((offsetTop, index) => (
                  <Select.Item
                    key={index}
                    value={`item-${index}`}
                    ref={(node) => stubItem(node, offsetTop, 40)}
                  >
                    Item {index}
                  </Select.Item>
                ))}
                <Select.ScrollDownArrow keepMounted />
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const arrow = screen.getByText('▼');
      Object.defineProperty(arrow, 'offsetHeight', { value: 0, configurable: true });

      fireEvent.mouseMove(arrow, { movementX: 0, movementY: 1 });

      act(() => {
        vi.advanceTimersByTime(40);
      });

      expect(scrollTop).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reflects scrollability on the arrows when the popup has no registered items', async () => {
    vi.useFakeTimers();
    try {
      let scrollTop = 100;

      await render(
        <Select.Root open>
          <Select.Trigger>Open</Select.Trigger>
          <Select.Portal>
            <Select.Positioner alignItemWithTrigger={false}>
              <Select.Popup
                ref={(node) =>
                  stubScroller(
                    node,
                    { scrollHeight: 400, clientHeight: 200 },
                    () => scrollTop,
                    (value) => {
                      scrollTop = value;
                    },
                  )
                }
              >
                <Select.ScrollUpArrow keepMounted data-testid="up" />
                <Select.ScrollDownArrow keepMounted data-testid="down" />
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const down = screen.getByTestId('down');
      Object.defineProperty(down, 'offsetHeight', { value: 0, configurable: true });

      fireEvent.mouseMove(down, { movementX: 0, movementY: 1 });

      act(() => {
        vi.advanceTimersByTime(40);
      });

      // Mid-scroller with nothing to step through: the down arrow still reports that more
      // content lies below rather than silently disappearing.
      expect(down).toHaveAttribute('data-visible');
    } finally {
      vi.useRealTimers();
    }
  });

  it('reflects scrollability on the up arrow when the popup has no registered items', async () => {
    vi.useFakeTimers();
    try {
      let scrollTop = 100;

      await render(
        <Select.Root open>
          <Select.Trigger>Open</Select.Trigger>
          <Select.Portal>
            <Select.Positioner alignItemWithTrigger={false}>
              <Select.Popup
                ref={(node) =>
                  stubScroller(
                    node,
                    { scrollHeight: 400, clientHeight: 200 },
                    () => scrollTop,
                    (value) => {
                      scrollTop = value;
                    },
                  )
                }
              >
                <Select.ScrollUpArrow keepMounted data-testid="up" />
                <Select.ScrollDownArrow keepMounted data-testid="down" />
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const up = screen.getByTestId('up');
      Object.defineProperty(up, 'offsetHeight', { value: 0, configurable: true });

      fireEvent.mouseMove(up, { movementX: 0, movementY: -1 });

      act(() => {
        vi.advanceTimersByTime(40);
      });

      expect(up).toHaveAttribute('data-visible');
    } finally {
      vi.useRealTimers();
    }
  });

  it('hides the arrow when an item-less popup is already scrolled to its edge', async () => {
    vi.useFakeTimers();
    try {
      let scrollTop = 200;

      await render(
        <Select.Root open>
          <Select.Trigger>Open</Select.Trigger>
          <Select.Portal>
            <Select.Positioner alignItemWithTrigger={false}>
              <Select.Popup
                ref={(node) =>
                  stubScroller(
                    node,
                    { scrollHeight: 400, clientHeight: 200 },
                    () => scrollTop,
                    (value) => {
                      scrollTop = value;
                    },
                  )
                }
              >
                <Select.ScrollUpArrow keepMounted data-testid="up" />
                <Select.ScrollDownArrow keepMounted data-testid="down" />
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const down = screen.getByTestId('down');
      Object.defineProperty(down, 'offsetHeight', { value: 0, configurable: true });

      fireEvent.mouseMove(down, { movementX: 0, movementY: 1 });

      act(() => {
        vi.advanceTimersByTime(40);
      });

      expect(down).not.toHaveAttribute('data-visible');
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores pointer interaction when the arrow has no scrollable popup', async () => {
    vi.useFakeTimers();
    try {
      await render(
        <Select.Root open>
          <Select.Trigger>Open</Select.Trigger>
          <Select.Portal>
            <Select.Positioner alignItemWithTrigger={false}>
              <Select.ScrollDownArrow keepMounted data-testid="down" />
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const down = screen.getByTestId('down');

      fireEvent.mouseMove(down, { movementX: 0, movementY: 1 });

      // Without a popup there is nothing to scroll; the loop must bail out instead of
      // dereferencing a missing scroller.
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(400);
        });
      }).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });
});
