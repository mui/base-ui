import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { act, flushMicrotasks } from '@mui/internal-test-utils';
import { createDndRenderer, testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createElement, flushRaf, registerCleanup, setupDragEngineTests } from '../../../test/dnd';
import { scheduleDisplacementSweep, trackDisplacedElement } from './displacement';

setupDragEngineTests();

const VAR_X = '--drag-displacement-x';
const VAR_Y = '--drag-displacement-y';

/**
 * A row whose layout offsets are driven by the test through `positions`, so a
 * "reorder" is a position-map change plus a re-render, and the module's
 * measurements see it exactly as a real layout shift. Ids in `hidden` read as
 * zero-sized, the way `display: none` does.
 */
function Row({
  id,
  positions,
  hidden,
  track = true,
}: {
  id: string;
  positions: Map<string, number>;
  hidden?: Set<string>;
  track?: boolean;
}) {
  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      if (node) {
        Object.defineProperties(node, {
          offsetTop: { configurable: true, get: () => positions.get(id) ?? 0 },
          offsetLeft: { configurable: true, get: () => 0 },
          offsetWidth: { configurable: true, get: () => (hidden?.has(id) ? 0 : 200) },
          offsetHeight: { configurable: true, get: () => (hidden?.has(id) ? 0 : 40) },
        });
      }
    },
    [id, positions, hidden],
  );
  return (
    <Draggable.Root data-testid={id} kind={testDragKind} render={<div ref={ref} />}>
      {track ? <Draggable.Displacement /> : null}
    </Draggable.Root>
  );
}

describe('displacement tracking', () => {
  const { renderDnd } = createDndRenderer();

  /** Re-render helper: bump a version so every row commits. */
  function useVersion(): [number, () => void] {
    const [version, setVersion] = React.useState(0);
    return [version, () => setVersion((v) => v + 1)];
  }

  function App({
    positions,
    onApi,
  }: {
    positions: Map<string, number>;
    onApi: (bumpApp: () => void) => void;
  }) {
    const [, bump] = useVersion();
    onApi(bump);
    return (
      <div>
        <Row id="a" positions={positions} />
        <Row id="b" positions={positions} />
      </div>
    );
  }

  async function renderRows() {
    const positions = new Map([
      ['a', 0],
      ['b', 40],
    ]);
    let bumpApp: () => void = () => {};
    const { engine } = await renderDnd(
      <App
        positions={positions}
        onApi={(bump) => {
          bumpApp = bump;
        }}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, { kind: testDragKind });
    return {
      source,
      positions,
      commit: () => act(() => bumpApp()),
      row: (id: string) => screen.getByTestId(id),
    };
  }

  it('publishes the delta and the attribute pair on the frame a tracked row moves mid-drag', async () => {
    const { source, positions, commit, row } = await renderRows();

    fireEvent.dragStart(source);
    await flushRaf();

    positions.set('b', 0);
    commit();

    const b = row('b');
    // The starting frame: both attributes, and the measured delta as variables.
    expect(b).toHaveAttribute('data-displacing');
    expect(b).toHaveAttribute('data-starting-style');
    expect(b.style.getPropertyValue(VAR_X)).toBe('0px');
    expect(b.style.getPropertyValue(VAR_Y)).toBe('40px');
    expect(row('a')).not.toHaveAttribute('data-displacing');

    // One frame later the starting style comes off; with no consumer transition
    // declared (jsdom has no animations), the play state cleans up immediately.
    await flushRaf();
    expect(b).not.toHaveAttribute('data-starting-style');
    expect(b).not.toHaveAttribute('data-displacing');
    expect(b.style.getPropertyValue(VAR_Y)).toBe('');

    fireEvent.dragEnd(source);
  });

  it('does not let an older release frame clear a newer play', async () => {
    const callbacks: FrameRequestCallback[] = [];
    const requestSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    registerCleanup(() => requestSpy.mockRestore());

    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerDraggable(source, { kind: testDragKind });
    const row = document.createElement('div');
    document.body.appendChild(row);
    registerCleanup(() => row.remove());
    let top = 0;
    Object.defineProperties(row, {
      offsetTop: { configurable: true, get: () => top },
      offsetLeft: { configurable: true, get: () => 0 },
      offsetWidth: { configurable: true, get: () => 200 },
      offsetHeight: { configurable: true, get: () => 40 },
    });
    const untrack = trackDisplacedElement(row);
    registerCleanup(untrack);

    fireEvent.dragStart(source);
    callbacks.length = 0;

    top = 40;
    scheduleDisplacementSweep();
    const releaseFirst = callbacks.at(-1)!;

    top = 80;
    scheduleDisplacementSweep();
    await Promise.resolve();
    const releaseSecond = callbacks.at(-1)!;
    expect(releaseSecond).not.toBe(releaseFirst);
    expect(row.style.getPropertyValue(VAR_Y)).toBe('-40px');

    releaseFirst(0);
    expect(row).toHaveAttribute('data-starting-style');
    expect(row.style.getPropertyValue(VAR_Y)).toBe('-40px');

    releaseSecond(16);
    expect(row).not.toHaveAttribute('data-starting-style');
    expect(row).not.toHaveAttribute('data-displacing');

    fireEvent.dragEnd(source);
  });

  it('flushes the starting style once in every owner document', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerDraggable(source, { kind: testDragKind });

    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const frameDocument = iframe.contentDocument!;
    const mainRow = document.createElement('div');
    const frameRow = frameDocument.createElement('div');
    document.body.appendChild(mainRow);
    frameDocument.body.appendChild(frameRow);

    let mainTop = 0;
    let frameTop = 0;
    let mainFlushes = 0;
    let frameFlushes = 0;
    Object.defineProperties(mainRow, {
      offsetTop: { configurable: true, get: () => mainTop },
      offsetLeft: { configurable: true, get: () => 0 },
      offsetWidth: { configurable: true, get: () => 200 },
      offsetHeight: {
        configurable: true,
        get: () => {
          mainFlushes += 1;
          return 40;
        },
      },
    });
    Object.defineProperties(frameRow, {
      offsetTop: { configurable: true, get: () => frameTop },
      offsetLeft: { configurable: true, get: () => 0 },
      offsetWidth: { configurable: true, get: () => 200 },
      offsetHeight: {
        configurable: true,
        get: () => {
          frameFlushes += 1;
          return 40;
        },
      },
    });

    const releaseMain = trackDisplacedElement(mainRow);
    const releaseFrame = trackDisplacedElement(frameRow);
    fireEvent.dragStart(source);
    await flushRaf();

    mainFlushes = 0;
    frameFlushes = 0;
    mainTop = 40;
    frameTop = 40;
    scheduleDisplacementSweep(mainRow);

    expect(mainFlushes).toBe(1);
    expect(frameFlushes).toBe(1);
    expect(mainRow).toHaveAttribute('data-displacing');
    expect(frameRow).toHaveAttribute('data-displacing');

    fireEvent.dragEnd(source);
    releaseFrame();
    releaseMain();
    iframe.remove();
    mainRow.remove();
  });

  it('does nothing outside a drag', async () => {
    const { positions, commit, row } = await renderRows();

    positions.set('b', 0);
    commit();

    expect(row('b')).not.toHaveAttribute('data-displacing');
    expect(row('b').style.getPropertyValue(VAR_Y)).toBe('');
  });

  it('baselines at drag start, so pre-drag movement never animates', async () => {
    const { source, positions, commit, row } = await renderRows();

    // Moves while idle, unanimated and unrecorded as a pending delta.
    positions.set('b', 120);
    commit();

    fireEvent.dragStart(source);
    await flushRaf();
    // A commit with no movement since the baseline: nothing to play.
    commit();

    expect(row('b')).not.toHaveAttribute('data-displacing');
    fireEvent.dragEnd(source);
  });

  it('sweeps the whole registry, catching a row that moved without re-rendering', async () => {
    // Memoized: renders once and never again, but its rect follows `positions`.
    const MemoRow = React.memo(
      function MemoRow({ positions }: { positions: Map<string, number> }) {
        return <Row id="memo" positions={positions} />;
      },
      () => true,
    );

    const positions = new Map([
      ['live', 0],
      ['memo', 40],
    ]);
    let bumpApp: () => void = () => {};
    const { engine } = await renderDnd(
      <App2
        positions={positions}
        onApi={(bump) => {
          bumpApp = bump;
        }}
      />,
    );

    function App2({
      positions: p,
      onApi,
    }: {
      positions: Map<string, number>;
      onApi: (b: () => void) => void;
    }) {
      const [, setVersion] = React.useState(0);
      onApi(() => setVersion((v) => v + 1));
      return (
        <div>
          <Row id="live" positions={p} />
          <MemoRow positions={p} />
        </div>
      );
    }

    const source = createElement();
    engine.registerDraggable(source, { kind: testDragKind });

    fireEvent.dragStart(source);
    await flushRaf();

    positions.set('memo', 0);
    act(() => bumpApp());

    // `live` re-rendered and requested the sweep; `memo` did not re-render, yet
    // its movement is measured because the sweep covers the registry.
    expect(screen.getByTestId('memo')).toHaveAttribute('data-displacing');
    expect(screen.getByTestId('memo').style.getPropertyValue(VAR_Y)).toBe('40px');

    fireEvent.dragEnd(source);
    await flushRaf();
  });

  it('never animates the dragged source while its session is live', async () => {
    const positions = new Map([
      ['a', 0],
      ['b', 40],
    ]);
    let bumpApp: () => void = () => {};
    await renderDnd(
      <App
        positions={positions}
        onApi={(bump) => {
          bumpApp = bump;
        }}
      />,
    );

    // Drag row "a" itself (the bridge replays pointer events on it). The default
    // preview clones the row, testid included, so query past the clone.
    const sourceRow = () =>
      screen.getAllByTestId('a').find((el) => !el.hasAttribute('data-drag-preview'))!;
    fireEvent.dragStart(sourceRow());
    await flushRaf();

    // The live reorder moves both rows; only the neighbour animates.
    positions.set('a', 40);
    positions.set('b', 0);
    act(() => bumpApp());

    expect(sourceRow()).not.toHaveAttribute('data-displacing');
    expect(screen.getByTestId('b')).toHaveAttribute('data-displacing');

    fireEvent.dragEnd(sourceRow());
    await flushRaf();
  });

  it('keeps the window open one frame past the drag, then closes it', async () => {
    const { source, positions, commit, row } = await renderRows();

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnd(source);

    // The commit a drop handler causes lands after the session nulls and still
    // animates: the grace frame has not fired yet.
    positions.set('b', 0);
    commit();
    expect(row('b')).toHaveAttribute('data-displacing');

    await flushRaf();
    // Window closed: later movement is inert.
    positions.set('b', 80);
    commit();
    expect(row('b')).not.toHaveAttribute('data-displacing');
  });

  it('re-baselines on resize instead of misreading the reflow as displacement', async () => {
    const { source, positions, commit, row } = await renderRows();

    fireEvent.dragStart(source);
    await flushRaf();

    // A resize reflows every offset; the next commit must not animate anything.
    positions.set('a', 100);
    positions.set('b', 180);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    commit();

    expect(row('a')).not.toHaveAttribute('data-displacing');
    expect(row('b')).not.toHaveAttribute('data-displacing');

    fireEvent.dragEnd(source);
    await flushRaf();
  });

  it('ignores movement below the epsilon', async () => {
    const { source, positions, commit, row } = await renderRows();

    fireEvent.dragStart(source);
    await flushRaf();

    positions.set('b', 40.4);
    commit();

    expect(row('b')).not.toHaveAttribute('data-displacing');
    fireEvent.dragEnd(source);
    await flushRaf();
  });

  it('leaves an untracked sibling alone during a live reorder', async () => {
    const positions = new Map([
      ['tracked', 0],
      ['untracked', 40],
    ]);
    let bumpApp: () => void = () => {};
    function MixedApp({ onApi }: { onApi: (b: () => void) => void }) {
      const [, setVersion] = React.useState(0);
      onApi(() => setVersion((v) => v + 1));
      return (
        <div>
          <Row id="tracked" positions={positions} />
          <Row id="untracked" positions={positions} track={false} />
        </div>
      );
    }
    const { engine } = await renderDnd(
      <MixedApp
        onApi={(b) => {
          bumpApp = b;
        }}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, { kind: testDragKind });

    fireEvent.dragStart(source);
    await flushRaf();

    positions.set('tracked', 40);
    positions.set('untracked', 0);
    act(() => bumpApp());

    expect(screen.getByTestId('tracked')).toHaveAttribute('data-displacing');
    expect(screen.getByTestId('untracked')).not.toHaveAttribute('data-displacing');
    expect(screen.getByTestId('untracked').style.getPropertyValue(VAR_Y)).toBe('');

    fireEvent.dragEnd(source);
    await flushRaf();
  });

  it('a row hidden mid-drag reappears without flying in from the origin', async () => {
    const positions = new Map([
      ['a', 0],
      ['b', 40],
    ]);
    const hidden = new Set<string>();
    let bumpApp: () => void = () => {};
    function HideApp({ onApi }: { onApi: (b: () => void) => void }) {
      const [, setVersion] = React.useState(0);
      onApi(() => setVersion((v) => v + 1));
      return (
        <div>
          <Row id="a" positions={positions} hidden={hidden} />
          <Row id="b" positions={positions} hidden={hidden} />
        </div>
      );
    }
    const { engine } = await renderDnd(
      <HideApp
        onApi={(b) => {
          bumpApp = b;
        }}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, { kind: testDragKind });

    fireEvent.dragStart(source);
    await flushRaf();

    // Hidden: a zero-sized box has no usable position, so the baseline drops.
    hidden.add('b');
    await act(async () => bumpApp());
    await flushMicrotasks();

    // Reappears somewhere else: adopt, never play a delta against 0,0 or the
    // stale pre-hide position.
    hidden.delete('b');
    positions.set('b', 200);
    await act(async () => bumpApp());
    await flushMicrotasks();
    expect(screen.getByTestId('b')).not.toHaveAttribute('data-displacing');

    // Baselined again: later movement animates normally.
    positions.set('b', 160);
    await act(async () => bumpApp());
    expect(screen.getByTestId('b')).toHaveAttribute('data-displacing');
    expect(screen.getByTestId('b').style.getPropertyValue(VAR_Y)).toBe('40px');

    fireEvent.dragEnd(source);
    await flushRaf();
  });

  it('reopens the window when the registry refills mid-drag', async () => {
    const positions = new Map([
      ['a', 0],
      ['b', 40],
    ]);
    let bumpApp: () => void = () => {};
    let showRows = true;
    function DrainApp({ onApi }: { onApi: (b: () => void) => void }) {
      const [, setVersion] = React.useState(0);
      onApi(() => setVersion((v) => v + 1));
      return (
        <div>
          {showRows && <Row id="a" positions={positions} />}
          {showRows && <Row id="b" positions={positions} />}
        </div>
      );
    }
    const { engine } = await renderDnd(
      <DrainApp
        onApi={(b) => {
          bumpApp = b;
        }}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, { kind: testDragKind });

    fireEvent.dragStart(source);
    await flushRaf();

    // Every tracked row unmounts (a virtualized list draining): the module
    // releases its subscription and closes the window.
    showRows = false;
    act(() => bumpApp());

    // The rows come back while the same drag is still running. The store never
    // publishes in between, so the window state must be derived at track time.
    showRows = true;
    act(() => bumpApp());
    await flushRaf();

    positions.set('b', 0);
    act(() => bumpApp());
    expect(screen.getByTestId('b')).toHaveAttribute('data-displacing');
    expect(screen.getByTestId('b').style.getPropertyValue(VAR_Y)).toBe('40px');

    fireEvent.dragEnd(source);
    await flushRaf();
  });

  it('removing Draggable.Displacement mid-play removes the play state', async () => {
    const positions = new Map([
      ['a', 0],
      ['b', 40],
    ]);
    let bumpApp: () => void = () => {};
    let trackB = true;
    function ToggleApp({ onApi }: { onApi: (b: () => void) => void }) {
      const [, setVersion] = React.useState(0);
      onApi(() => setVersion((v) => v + 1));
      return (
        <div>
          <Row id="a" positions={positions} />
          <Row id="b" positions={positions} track={trackB} />
        </div>
      );
    }
    const { engine } = await renderDnd(
      <ToggleApp
        onApi={(b) => {
          bumpApp = b;
        }}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, { kind: testDragKind });

    fireEvent.dragStart(source);
    await flushRaf();

    positions.set('b', 0);
    act(() => bumpApp());
    expect(screen.getByTestId('b')).toHaveAttribute('data-displacing');

    // Opting out mid-play unhooks the element and clears what was written.
    trackB = false;
    await act(async () => bumpApp());
    expect(screen.getByTestId('b')).not.toHaveAttribute('data-displacing');
    expect(screen.getByTestId('b')).not.toHaveAttribute('data-starting-style');
    expect(screen.getByTestId('b').style.getPropertyValue(VAR_Y)).toBe('');

    fireEvent.dragEnd(source);
    await flushRaf();
  });

  it('a row mounted mid-drag does not fly in', async () => {
    const positions = new Map([
      ['a', 0],
      ['late', 40],
    ]);
    let bumpApp: () => void = () => {};
    let showLate = false;
    function LateApp({ onApi }: { onApi: (b: () => void) => void }) {
      const [, setVersion] = React.useState(0);
      onApi(() => setVersion((v) => v + 1));
      return (
        <div>
          <Row id="a" positions={positions} />
          {showLate && <Row id="late" positions={positions} />}
        </div>
      );
    }
    const { engine } = await renderDnd(
      <LateApp
        onApi={(b) => {
          bumpApp = b;
        }}
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, { kind: testDragKind });

    fireEvent.dragStart(source);
    await flushRaf();

    showLate = true;
    act(() => bumpApp());

    expect(screen.getByTestId('late')).not.toHaveAttribute('data-displacing');
    // A frame boundary between the mount and the move, as in real usage; the
    // same-task double-commit case is covered by the trailing sweep instead.
    await flushRaf();

    // Once baselined, its later movement animates like any neighbour.
    positions.set('late', 0);
    act(() => bumpApp());
    expect(screen.getByTestId('late')).toHaveAttribute('data-displacing');

    fireEvent.dragEnd(source);
    await flushRaf();
  });
});
