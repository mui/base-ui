import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { screen } from '@testing-library/react';
import { createDndRenderer, isJSDOM, testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { flushRaf, registerCleanup, setupDragEngineTests } from '../../../test/dnd';

setupDragEngineTests();

/**
 * The consumer contract against a real style engine: the delta only applies
 * under the starting style, and the transition only applies once it is gone, so
 * a mid-flight rewrite is spec-guaranteed to land instantly.
 */
const SHEET = `
  [data-displacing][data-starting-style] {
    translate: var(--drag-displacement-x) var(--drag-displacement-y);
  }
  [data-displacing]:not([data-starting-style]) {
    transition: translate 600ms linear;
  }
`;

/** Frame-polling with `act`, so React work between frames is flushed too. */
async function until(predicate: () => boolean, label: string): Promise<void> {
  const deadline = Date.now() + 4000;
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for: ${label}`);
    }
    // eslint-disable-next-line no-await-in-loop
    await flushRaf();
  }
}

describe.skipIf(isJSDOM)('displacement (real layout and transitions)', () => {
  const { renderDnd } = createDndRenderer();

  // The shared setup disables animation waiting engine-wide; this suite exists
  // to exercise the real thing.
  const animationsFlag = globalThis as { BASE_UI_ANIMATIONS_DISABLED?: boolean | undefined };
  beforeEach(() => {
    animationsFlag.BASE_UI_ANIMATIONS_DISABLED = false;
  });
  afterEach(() => {
    animationsFlag.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  function setup(extraCss = '') {
    const style = document.createElement('style');
    style.textContent = SHEET + extraCss;
    document.head.appendChild(style);
    registerCleanup(() => style.remove());
  }

  function pointer(type: string, target: EventTarget, x: number, y: number): void {
    act(() => {
      target.dispatchEvent(
        new PointerEvent(type, {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: x,
          clientY: y,
          button: 0,
          buttons: type === 'pointerup' ? 0 : 1,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
  }

  function Rows({ onApi }: { onApi: (setTop: (top: number) => void) => void }) {
    const [top, setTop] = React.useState(200);
    onApi(setTop);
    return (
      <div>
        <Draggable.Root
          kind={testDragKind}
          data-testid="held"
          pointerActivation={{ mouse: { type: 'immediate' } }}
          style={{ position: 'fixed', left: 0, top: 0, width: 100, height: 40 }}
        />
        <Draggable.Root
          kind={testDragKind}
          data-testid="row"
          style={{ position: 'fixed', left: 0, top, width: 100, height: 40 }}
        >
          <Draggable.Displacement />
        </Draggable.Root>
      </div>
    );
  }

  interface ListApi {
    swap: () => void;
  }

  /** A keyed two-row list plus a separate held draggable: the demo's shape. */
  function List({
    onApi,
    axis = 'y',
    itemClassName,
  }: {
    onApi: (api: ListApi) => void;
    axis?: 'x' | 'y';
    itemClassName?: string;
  }) {
    const [order, setOrder] = React.useState(['a', 'b']);
    onApi({ swap: () => setOrder((previous) => [...previous].reverse()) });
    return (
      <div>
        <Draggable.Root
          kind={testDragKind}
          data-testid="held"
          pointerActivation={{ mouse: { type: 'immediate' } }}
          style={{ position: 'fixed', left: 0, top: 0, width: 100, height: 40 }}
        />
        {order.map((id, index) => (
          <Draggable.Root
            key={id}
            kind={testDragKind}
            data-testid={`item-${id}`}
            className={itemClassName}
            style={{
              position: 'fixed',
              left: axis === 'x' ? 100 + index * 50 : 0,
              top: axis === 'y' ? 100 + index * 50 : 100,
              width: 40,
              height: 40,
            }}
          >
            <Draggable.Displacement />
          </Draggable.Root>
        ))}
      </div>
    );
  }

  async function renderList(props?: { axis?: 'x' | 'y'; itemClassName?: string }) {
    let api: ListApi = { swap: () => {} };
    await renderDnd(
      <List
        onApi={(a) => {
          api = a;
        }}
        axis={props?.axis}
        itemClassName={props?.itemClassName}
      />,
    );
    const held = screen.getByTestId('held');
    pointer('pointerdown', held, 50, 20);
    await flushRaf();
    return {
      held,
      // Async act: the sweep latch clears in a microtask, and back-to-back
      // commits must not be read before it (and any trailing sweep) ran.
      swap: () => act(async () => api.swap()),
      item: (id: string) => screen.getByTestId(`item-${id}`),
      release: async () => {
        pointer('pointerup', held, 50, 20);
        await flushRaf();
      },
    };
  }

  it('plays a real transition from the published delta and cleans up after it', async () => {
    setup();
    let setTop: (top: number) => void = () => {};
    await renderDnd(
      <Rows
        onApi={(api) => {
          setTop = api;
        }}
      />,
    );
    const held = screen.getByTestId('held');
    const row = () =>
      screen.getAllByTestId('row').find((el) => !el.hasAttribute('data-drag-preview'))!;

    pointer('pointerdown', held, 50, 20);
    await flushRaf();

    // The reorder: the row jumps up 80px; displacement should play it back.
    act(() => setTop(120));

    expect(row()).toHaveAttribute('data-displacing');
    expect(row().style.getPropertyValue('--drag-displacement-y')).toBe('80px');
    // Starting frame: the element still renders at its old position.
    expect(getComputedStyle(row()).translate).toBe('0px 80px');

    // The starting style comes off and the real transition runs.
    await until(() => !row().hasAttribute('data-starting-style'), 'starting style removed');
    await until(() => row().getAnimations().length > 0, 'transition running');

    // The transition finishing removes the play state entirely.
    await until(() => !row().hasAttribute('data-displacing'), 'play state cleaned up');
    expect(row().style.getPropertyValue('--drag-displacement-y')).toBe('');
    expect(getComputedStyle(row()).translate).toBe('none');

    pointer('pointerup', held, 50, 20);
    await flushRaf();
  });

  it('publishes the layout delta, not its own animation, when several tracked rows commit together', async () => {
    setup();
    const { swap, item, release } = await renderList();

    // Both tracked rows re-render in this commit, so the sweep latch absorbs
    // the second request and the trailing sweep runs in the same frame. It must
    // not misread the just-armed `translate` as another displacement.
    await swap();

    // `b` moved up 50px, so it plays from +50px; `a` moved down, from -50px.
    expect(item('b').style.getPropertyValue('--drag-displacement-y')).toBe('50px');
    expect(item('a').style.getPropertyValue('--drag-displacement-y')).toBe('-50px');
    expect(getComputedStyle(item('b')).translate).toBe('0px 50px');
    expect(getComputedStyle(item('a')).translate).toBe('0px -50px');

    await until(() => !item('b').hasAttribute('data-displacing'), 'plays cleaned up');
    expect(getComputedStyle(item('b')).translate).toBe('none');
    expect(getComputedStyle(item('a')).translate).toBe('none');

    await release();
  });

  it('measures layout, not transforms, when the rows carry a resting translate', async () => {
    // A consumer translate at rest: it must not leak into the measurement (the
    // baseline and the sweep read layout offsets), and the play must still both
    // start from the published delta and settle back onto the resting value.
    setup(`
      .resting { translate: 0px 6px; }
    `);
    const { swap, item, release } = await renderList({ itemClassName: 'resting' });

    await swap();

    expect(item('b').style.getPropertyValue('--drag-displacement-y')).toBe('50px');
    expect(item('a').style.getPropertyValue('--drag-displacement-y')).toBe('-50px');

    // Interrupt mid-flight with the reverse swap: the fresh delta must be the
    // layout diff alone (a measurement counting the resting or the in-flight
    // translate would drift by 6px or by the animated remainder).
    await swap();
    expect(item('b').style.getPropertyValue('--drag-displacement-y')).toBe('-50px');
    expect(item('a').style.getPropertyValue('--drag-displacement-y')).toBe('50px');

    await until(() => !item('b').hasAttribute('data-displacing'), 'plays cleaned up');
    expect(getComputedStyle(item('b')).translate).toBe('0px 6px');
    expect(getComputedStyle(item('a')).translate).toBe('0px 6px');

    await release();
  });

  it('publishes horizontal deltas with their sign intact', async () => {
    setup();
    const { swap, item, release } = await renderList({ axis: 'x' });

    await swap();

    expect(item('b').style.getPropertyValue('--drag-displacement-x')).toBe('50px');
    expect(item('b').style.getPropertyValue('--drag-displacement-y')).toBe('0px');
    expect(item('a').style.getPropertyValue('--drag-displacement-x')).toBe('-50px');
    expect(getComputedStyle(item('b')).translate).toBe('50px');

    await until(() => !item('b').hasAttribute('data-displacing'), 'plays cleaned up');
    await release();
  });

  it('cleans up even when the row carries a looping animation', async () => {
    setup(`
      @keyframes pulse { from { opacity: 1; } to { opacity: 0.6; } }
      [data-testid='item-b'] { animation: pulse 0.5s infinite; }
    `);
    const { swap, item, release } = await renderList();

    await swap();
    expect(item('b')).toHaveAttribute('data-displacing');

    // The looping animation never finishes; only the displacement transition
    // counts as part of the play.
    await until(() => !item('b').hasAttribute('data-displacing'), 'play state cleaned up');
    expect(item('b').style.getPropertyValue('--drag-displacement-y')).toBe('');

    await release();
  });

  it('retargets displacement tracking when a virtualizer swaps the root node', async () => {
    setup();
    let swapNode = () => {};
    let moveRow = () => {};
    function SwappedRow() {
      const [swapped, setSwapped] = React.useState(false);
      const [top, setTop] = React.useState(200);
      swapNode = () => setSwapped(true);
      moveRow = () => setTop(100);
      return (
        <div>
          <Draggable.Root
            kind={testDragKind}
            data-testid="held"
            pointerActivation={{ mouse: { type: 'immediate' } }}
            style={{ position: 'fixed', left: 0, top: 0, width: 100, height: 40 }}
          />
          <Draggable.Root
            kind={testDragKind}
            data-testid={swapped ? 'fresh-row' : 'old-row'}
            style={{ position: 'fixed', left: 0, top, width: 100, height: 40 }}
            render={(props) => <div key={swapped ? 'fresh' : 'old'} {...props} />}
          >
            <Draggable.Displacement />
          </Draggable.Root>
        </div>
      );
    }

    await renderDnd(<SwappedRow />);
    const held = screen.getByTestId('held');
    pointer('pointerdown', held, 50, 20);
    await flushRaf();

    const oldRow = screen.getByTestId('old-row');
    await act(async () => swapNode());
    const freshRow = screen.getByTestId('fresh-row');
    expect(freshRow).not.toBe(oldRow);

    await act(async () => moveRow());
    expect(oldRow).not.toHaveAttribute('data-displacing');
    expect(freshRow).toHaveAttribute('data-displacing');
    expect(freshRow.style.getPropertyValue('--drag-displacement-y')).toBe('100px');

    await until(() => !freshRow.hasAttribute('data-displacing'), 'swapped row play cleaned up');
    pointer('pointerup', held, 50, 20);
    await flushRaf();
  });

  it('sweeps a same-task second commit through the trailing sweep', async () => {
    setup();
    let setOrder: (order: string[]) => void = () => {};
    function DoubleApp() {
      const [order, setOrderState] = React.useState(['a', 'b']);
      setOrder = setOrderState;
      return (
        <div>
          <Draggable.Root
            kind={testDragKind}
            data-testid="held"
            pointerActivation={{ mouse: { type: 'immediate' } }}
            style={{ position: 'fixed', left: 0, top: 0, width: 100, height: 40 }}
          />
          {order.map((id, index) => (
            <Draggable.Root
              key={id}
              kind={testDragKind}
              data-testid={`item-${id}`}
              style={{ position: 'fixed', left: 0, top: 100 + index * 50, width: 40, height: 40 }}
            >
              <Draggable.Displacement />
            </Draggable.Root>
          ))}
        </div>
      );
    }
    await renderDnd(<DoubleApp />);
    const held = screen.getByTestId('held');
    pointer('pointerdown', held, 50, 20);
    await flushRaf();
    const item = (id: string) => screen.getByTestId(`item-${id}`);

    // Two synchronous commits in one task: the first sweep runs during the
    // first commit's effects and cannot see the second commit's movement; the
    // trailing sweep (detected through a repeat requester) must pick it up.
    await act(async () => {
      ReactDOM.flushSync(() => setOrder(['b', 'a']));
      ReactDOM.flushSync(() => setOrder(['a', 'b']));
    });

    // The second commit put everything back, so the correct final state is the
    // reverse play measured against the first commit's baselines.
    expect(item('b').style.getPropertyValue('--drag-displacement-y')).toBe('-50px');
    expect(item('a').style.getPropertyValue('--drag-displacement-y')).toBe('50px');

    await until(() => !item('b').hasAttribute('data-displacing'), 'plays cleaned up');
    pointer('pointerup', held, 50, 20);
    await flushRaf();
  });

  it('animates the source back on a canceled drag', async () => {
    setup();
    let setTop: (top: number) => void = () => {};
    function CancelApp() {
      const [top, setTopState] = React.useState(200);
      setTop = setTopState;
      return (
        <Draggable.Root
          kind={testDragKind}
          data-testid="row"
          pointerActivation={{ mouse: { type: 'immediate' } }}
          onDragEnd={(event) => {
            if (event.canceled) {
              setTopState(200);
            }
          }}
          style={{ position: 'fixed', left: 0, top, width: 100, height: 40 }}
        >
          <Draggable.Displacement />
        </Draggable.Root>
      );
    }
    await renderDnd(<CancelApp />);
    const row = () =>
      screen.getAllByTestId('row').find((el) => !el.hasAttribute('data-drag-preview'))!;

    pointer('pointerdown', row(), 50, 220);
    await flushRaf();

    // The live reorder moved the source itself; as the active source it is
    // excluded from displacement while the session runs.
    await act(async () => setTop(120));
    expect(row()).not.toHaveAttribute('data-displacing');

    // Escape cancels; the revert commit lands inside the grace frame and the
    // source, no longer excluded, animates back to its slot.
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );
    });

    expect(row()).toHaveAttribute('data-displacing');
    expect(row().style.getPropertyValue('--drag-displacement-y')).toBe('-80px');

    await until(() => !row().hasAttribute('data-displacing'), 'revert play cleaned up');
  });

  it('retargets an interrupted play instantly, without easing to the new delta', async () => {
    setup();
    let setTop: (top: number) => void = () => {};
    await renderDnd(
      <Rows
        onApi={(api) => {
          setTop = api;
        }}
      />,
    );
    const held = screen.getByTestId('held');
    const row = () =>
      screen.getAllByTestId('row').find((el) => !el.hasAttribute('data-drag-preview'))!;

    pointer('pointerdown', held, 50, 20);
    await flushRaf();

    act(() => setTop(120));
    expect(row()).toHaveAttribute('data-displacing');
    expect(row()).toHaveAttribute('data-starting-style');
    await until(() => !row().hasAttribute('data-starting-style'), 'first play released');
    await until(() => row().getAnimations().length > 0, 'first transition running');

    // A second reorder mid-flight. The rewrite happens under the starting
    // style, whose after-change style carries no transition, so the new delta
    // applies on that very frame rather than easing toward it.
    act(() => setTop(240));

    expect(row()).toHaveAttribute('data-starting-style');
    // The layout moved 120 → 240; the in-flight translate must not leak into
    // the measurement, so the fresh delta is the layout diff, nothing else.
    expect(row().style.getPropertyValue('--drag-displacement-y')).toBe('-120px');
    expect(getComputedStyle(row()).translate).toBe('0px -120px');

    await until(() => !row().hasAttribute('data-displacing'), 'retargeted play cleaned up');

    pointer('pointerup', held, 50, 20);
    await flushRaf();
  });

  /**
   * Resolve once the module's visibility observer has delivered its pending
   * records for `element`. A sentinel observer created now is notified in the
   * same intersection-observation task as the module's earlier-created one, and
   * the awaiting continuation runs only after every callback of that task.
   */
  function waitForVisibilityDelivery(element: Element): Promise<void> {
    return new Promise((resolve) => {
      const sentinel = new IntersectionObserver(() => {
        sentinel.disconnect();
        resolve();
      });
      sentinel.observe(element);
    });
  }

  /** Two tracked rows: one in the viewport, one far below it. */
  function FarRows({
    onApi,
  }: {
    onApi: (setTops: (tops: { a: number; c: number }) => void) => void;
  }) {
    const [tops, setTops] = React.useState({ a: 100, c: 4000 });
    onApi(setTops);
    return (
      <div>
        <Draggable.Root
          kind={testDragKind}
          data-testid="held"
          pointerActivation={{ mouse: { type: 'immediate' } }}
          style={{ position: 'fixed', left: 0, top: 0, width: 100, height: 40 }}
        />
        <Draggable.Root
          kind={testDragKind}
          data-testid="item-a"
          style={{ position: 'fixed', left: 0, top: tops.a, width: 40, height: 40 }}
        >
          <Draggable.Displacement />
        </Draggable.Root>
        <Draggable.Root
          kind={testDragKind}
          data-testid="item-c"
          style={{ position: 'fixed', left: 0, top: tops.c, width: 40, height: 40 }}
        >
          <Draggable.Displacement />
        </Draggable.Root>
      </div>
    );
  }

  async function renderFarRows() {
    let setTops: (tops: { a: number; c: number }) => void = () => {};
    await renderDnd(
      <FarRows
        onApi={(api) => {
          setTops = api;
        }}
      />,
    );
    const held = screen.getByTestId('held');
    const a = screen.getByTestId('item-a');
    const c = screen.getByTestId('item-c');
    // Let the observer mark the far row invisible before the drag begins.
    await waitForVisibilityDelivery(c);
    pointer('pointerdown', held, 50, 20);
    await flushRaf();
    return {
      a,
      c,
      setTops: (tops: { a: number; c: number }) => act(async () => setTops(tops)),
      release: async () => {
        pointer('pointerup', held, 50, 20);
        await flushRaf();
      },
    };
  }

  it('sweeps only rows in the viewport, leaving off-screen movement unmeasured', async () => {
    setup();
    const { a, c, setTops, release } = await renderFarRows();

    // Both rows move in one commit; only the visible one plays.
    await setTops({ a: 150, c: 4050 });
    expect(a).toHaveAttribute('data-displacing');
    expect(a.style.getPropertyValue('--drag-displacement-y')).toBe('-50px');
    expect(c).not.toHaveAttribute('data-displacing');

    await until(() => !a.hasAttribute('data-displacing'), 'visible play cleaned up');
    await release();
  });

  it('adopts a row entering the viewport mid-drag: the arrival does not play, later moves do', async () => {
    setup();
    const { c, setTops, release } = await renderFarRows();

    // Off-screen → on-screen in one commit: no baseline to diff against, and
    // flying in from 4,000px away is exactly what must not happen.
    await setTops({ a: 100, c: 200 });
    expect(c).not.toHaveAttribute('data-displacing');

    // The observer reports it visible and adopts the current position.
    await waitForVisibilityDelivery(c);

    await setTops({ a: 100, c: 260 });
    expect(c).toHaveAttribute('data-displacing');
    expect(c.style.getPropertyValue('--drag-displacement-y')).toBe('-60px');

    await until(() => !c.hasAttribute('data-displacing'), 'adopted play cleaned up');
    await release();
  });
});
