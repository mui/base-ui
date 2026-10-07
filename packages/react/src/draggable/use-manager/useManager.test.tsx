import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { act } from '@mui/internal-test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer } from '../../../test/dndEngine';
import { createElement, flushRaf, setupDragEngineTests, fireDrag } from '../../../test/dnd';

setupDragEngineTests();

const itemKind = Draggable.createKind('item');

describe('useManager', () => {
  const { renderDnd } = createDndRenderer();

  it('returns the same engine across rerenders, so registrations survive', async () => {
    // If a rerender replaced the engine, every effect keyed on it would
    // re-register, dropping the registration an in-flight drag holds.
    const seen: unknown[] = [];
    let registrations = 0;

    function Harness({ label }: { label: string }) {
      const engine = Draggable.useManager();
      // Collected after commit: React 18's Strict Mode discards its first render
      // pass, so a render-time push would record an instance that never mounted.
      React.useEffect(() => {
        seen.push(engine);
      });
      const labelRef = React.useRef(label);
      labelRef.current = label;
      const cleanupRef = React.useRef<(() => void) | null>(null);
      const ref = React.useCallback(
        // Clean up in the null branch instead of returning the unregister
        // function. React 18 doesn't support callback-ref cleanups and warns.
        (node: HTMLDivElement | null) => {
          if (node) {
            registrations += 1;
            cleanupRef.current = engine.registerSource(node, () => ({
              kind: itemKind,
              onMoveStart: () => labelRef.current,
            }));
          } else {
            cleanupRef.current?.();
            cleanupRef.current = null;
          }
        },
        // The engine's identity is stable, so this registers once across rerenders.
        [engine],
      );
      return <div ref={ref} data-testid="source" />;
    }

    const { rerender } = await renderDnd(<Harness label="first" />);
    // Strict Mode can register twice on mount, but rerenders must not add more.
    const afterMount = registrations;

    await rerender(<Harness label="second" />);
    await rerender(<Harness label="third" />);

    expect(seen.length).toBeGreaterThan(1);
    for (const engine of seen) {
      expect(engine).toBe(seen[0]);
    }
    expect(registrations).toBe(afterMount);
  });

  it('reads the current callbacks through live refs, not the mount-time ones', async () => {
    const first = vi.fn();
    const second = vi.fn();

    function Harness({ onMoveStart }: { onMoveStart: () => void }) {
      const engine = Draggable.useManager();
      const paramsRef = React.useRef({ kind: itemKind, onMoveStart });
      // Stable object identity: caching in the React layer must not return stale
      // values from a getter read on every dispatch.
      paramsRef.current.onMoveStart = onMoveStart;
      const cleanupRef = React.useRef<(() => void) | null>(null);
      const ref = React.useCallback(
        (node: HTMLDivElement | null) => {
          if (node) {
            cleanupRef.current = engine.registerSource(node, () => paramsRef.current);
          } else {
            cleanupRef.current?.();
            cleanupRef.current = null;
          }
        },
        [engine],
      );
      return <div ref={ref} data-testid="source" />;
    }

    const { rerender } = await renderDnd(<Harness onMoveStart={first} />);
    await rerender(<Harness onMoveStart={second} />);

    const source = screen.getByTestId('source');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    fireDrag.dragStart(source);
    await flushRaf();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('publishes a source payload changed during its drag on refresh', async () => {
    function ActivePayload() {
      const active = Draggable.useActiveDrag();
      return <output data-testid="active">{String(active?.payload)}</output>;
    }
    const { engine } = await renderDnd(<ActivePayload />);
    const source = createElement();
    let payload = 'first';
    engine.registerSource(source, () => ({ payload }));

    fireDrag.dragStart(source);
    await flushRaf();
    expect(screen.getByTestId('active')).toHaveTextContent('first');

    payload = 'second';
    act(() => {
      engine.refresh(source);
    });
    expect(screen.getByTestId('active')).toHaveTextContent('second');
  });

  it('ends the drag in progress through cancelDrag', async () => {
    const onMoveEnd = vi.fn();

    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerSource(source, { onMoveEnd });

    fireDrag.dragStart(source);
    await flushRaf();

    act(() => {
      engine.cancelDrag();
    });

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
    expect(onMoveEnd.mock.calls[0][0].reason).toBe('imperative-action');
  });
});
