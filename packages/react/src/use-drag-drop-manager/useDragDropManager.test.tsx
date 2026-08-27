import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { useDragDropManager } from '@base-ui/react/use-drag-drop-manager';
import { createElement, flushRaf, setupDragEngineTests } from '../../test/dnd';
import { frFR } from '../locale-frFR';
import { LocalizationProvider } from '../localization-provider';

setupDragEngineTests();

const itemKind = Draggable.createKind('item');

describe('useDragDropManager', () => {
  const { renderDnd } = createDndRenderer();

  it('returns the same engine across rerenders, so registrations survive', async () => {
    // The engine is created once and reads its reactive inputs through refs. If a
    // rerender replaced it, every effect keyed on it would unregister and
    // re-register — dropping the registration held by an in-flight drag.
    const seen: unknown[] = [];
    let registrations = 0;

    function Harness({ label }: { label: string }) {
      const engine = useDragDropManager();
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
            cleanupRef.current = engine.registerDraggable(node, () => ({
              kind: itemKind,
              label: labelRef.current,
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

    function Harness({ onDragStart }: { onDragStart: () => void }) {
      const engine = useDragDropManager();
      const paramsRef = React.useRef({ kind: itemKind, onDragStart });
      // Keep the object identity stable: the imperative getter contract is
      // value-live, so internal React registration caching must not leak here.
      paramsRef.current.onDragStart = onDragStart;
      const cleanupRef = React.useRef<(() => void) | null>(null);
      const ref = React.useCallback(
        (node: HTMLDivElement | null) => {
          if (node) {
            cleanupRef.current = engine.registerDraggable(node, () => paramsRef.current);
          } else {
            cleanupRef.current?.();
            cleanupRef.current = null;
          }
        },
        [engine],
      );
      return <div ref={ref} data-testid="source" />;
    }

    const { rerender } = await renderDnd(<Harness onDragStart={first} />);
    await rerender(<Harness onDragStart={second} />);

    const source = screen.getByTestId('source');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    fireEvent.dragStart(source);
    await flushRaf();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('picks up a locale change for the next drag without re-registering', async () => {
    // Translations reach the engine through a ref, so a provider swap applies to
    // the next registration's static setup without a new engine.
    function Harness() {
      const engine = useDragDropManager();
      const cleanupRef = React.useRef<(() => void) | null>(null);
      const ref = React.useCallback(
        (node: HTMLDivElement | null) => {
          if (node) {
            cleanupRef.current = engine.registerDraggable(node, () => ({ kind: itemKind }));
          } else {
            cleanupRef.current?.();
            cleanupRef.current = null;
          }
        },
        [engine],
      );
      return <div ref={ref} data-testid="source" />;
    }

    const { rerender } = await renderDnd(<Harness />);
    expect(screen.getByTestId('source')).toHaveAttribute('aria-roledescription', 'draggable');

    await rerender(
      <LocalizationProvider translations={frFR}>
        <Harness />
      </LocalizationProvider>,
    );

    expect(screen.getByTestId('source')).toHaveAttribute('aria-roledescription', 'déplaçable');
  });

  it('registers a monitor from a getter alone, with no element', async () => {
    const onDragStart = vi.fn();

    function Harness() {
      const engine = useDragDropManager();
      React.useEffect(() => engine.registerMonitor(() => ({ onDragStart })), [engine]);
      return null;
    }

    const { engine } = await renderDnd(<Harness />);
    const source = createElement();
    engine.registerDraggable(source, {});

    fireEvent.dragStart(source);
    await flushRaf();

    expect(onDragStart).toHaveBeenCalledTimes(1);
  });

  it('ends the drag in progress through cancelDrag', async () => {
    const onDragEnd = vi.fn();

    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerDraggable(source, { onDragEnd });

    fireEvent.dragStart(source);
    await flushRaf();

    act(() => {
      engine.cancelDrag();
    });

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0].canceled).toBe(true);
  });
});
