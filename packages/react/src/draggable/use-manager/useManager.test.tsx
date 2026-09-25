import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createElement, flushRaf, setupDragEngineTests } from '../../../test/dnd';

setupDragEngineTests();

const itemKind = Draggable.createKind('item');

describe('useManager', () => {
  const { renderDnd } = createDndRenderer();

  it('returns the same engine across rerenders, so registrations survive', async () => {
    // The engine is created once and reads its reactive inputs through refs. If a
    // rerender replaced it, every effect keyed on it would unregister and
    // re-register — dropping the registration held by an in-flight drag.
    const seen: unknown[] = [];
    let registrations = 0;

    function Harness({ label }: { label: string }) {
      const engine = Draggable.useManager();
      // Collected after commit, not during render: React 18's Strict Mode
      // double-render re-runs ref initializers and discards the first pass, so
      // a render-time push would record an instance that never mounted.
      React.useEffect(() => {
        seen.push(engine);
      });
      const labelRef = React.useRef(label);
      labelRef.current = label;
      const cleanupRef = React.useRef<(() => void) | null>(null);
      const ref = React.useCallback(
        // Explicit null-branch cleanup rather than returning the unregister
        // function: React 18 does not support callback-ref cleanups and warns.
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
        // Keyed on the engine alone: the point is that its identity does not
        // churn, so this registers exactly once across every rerender.
        [engine],
      );
      return <div ref={ref} data-testid="source" />;
    }

    const { rerender } = await renderDnd(<Harness label="first" />);
    // Whatever the mount cost (Strict Mode double-invokes refs), it must not grow
    // with rerenders — that is what a churning engine identity would cause.
    const afterMount = registrations;

    await rerender(<Harness label="second" />);
    await rerender(<Harness label="third" />);

    expect(seen.length).toBeGreaterThan(1);
    for (const engine of seen) {
      expect(engine).toBe(seen[0]);
    }
    expect(registrations).toBe(afterMount);
  });

  it('reads the current callbacks and locale through live refs, not the mount-time ones', async () => {
    const first = vi.fn();
    const second = vi.fn();

    function Harness({ onMoveStart }: { onMoveStart: () => void }) {
      const engine = Draggable.useManager();
      const paramsRef = React.useRef({ kind: itemKind, onMoveStart });
      // Keep the object identity stable: the imperative getter contract is
      // value-live, so internal React registration caching must not leak here.
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
    fireEvent.dragStart(source);
    await flushRaf();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('registers a monitor from a getter alone, with no element', async () => {
    const onMoveStart = vi.fn();

    function Harness() {
      const engine = Draggable.useManager();
      React.useEffect(() => engine.registerMonitor(() => ({ onMoveStart })), [engine]);
      return null;
    }

    const { engine } = await renderDnd(<Harness />);
    const source = createElement();
    engine.registerSource(source, {});

    fireEvent.dragStart(source);
    await flushRaf();

    expect(onMoveStart).toHaveBeenCalledTimes(1);
  });

  it('ends the drag in progress through cancelDrag', async () => {
    const onMoveEnd = vi.fn();

    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerSource(source, { onMoveEnd });

    fireEvent.dragStart(source);
    await flushRaf();

    act(() => {
      engine.cancelDrag();
    });

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd.mock.calls[0][0].target).toBeNull();
    expect(onMoveEnd.mock.calls[0][1].reason).toBe('imperative-action');
  });
});
