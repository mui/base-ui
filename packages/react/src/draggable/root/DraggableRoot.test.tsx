import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as ReactDOMClient from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, screen, render as rtlRender } from '@testing-library/react';
import { createDndRenderer, describeConformance, testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { useDragEngine } from '@base-ui/react/use-drag-engine';
import {
  cancel,
  createElement,
  dragOver,
  flushRaf,
  lift,
  setupDragEngineTests,
} from '../../../test/dnd';
import { dragSessionStore } from '../../utils/drag-and-drop/dragSessionStore';
import { getRegistration } from '../../utils/drag-and-drop/draggableRegistry';
import { DraggablePreviewProvider } from '../preview-provider/DraggablePreviewProvider';
import { enUS } from '../../locale-enUS';
import { frFR } from '../../locale-frFR';
import { LocalizationProvider } from '../../localization-provider';
import { CSPProvider } from '../../csp-provider';

setupDragEngineTests();

const TEST_DRAGGABLE_LABEL = 'test-draggable';

/** Kind for the fixtures that carry a payload, so its type reaches their handlers. */
const cardKind = Draggable.createKind<{ id: string }>('card');

/** Outer wrapper that puts the tree in a French `LocalizationProvider`. Passed as
 * `renderDnd`'s wrapper so the `Draggable.PreviewProvider` it mounts reads French translations
 * for its draggable registrations. */
function FrenchProvider({ children }: { children?: React.ReactNode }) {
  return <LocalizationProvider translations={frFR}>{children}</LocalizationProvider>;
}

/** `data-dragging` is owned by the engine, so `state.dragging` is probed through
 * `className` instead. */
function draggingClass(state: Draggable.Root.State) {
  return state.dragging ? 'dragging' : 'idle';
}

/**
 * Synchronous `rtlRender` inside a `Draggable.PreviewProvider`, which any preview
 * with content requires. Use it where the test wants a plain render rather than
 * `renderDnd`'s engine; a clone-only draggable needs neither and can use
 * `rtlRender` directly.
 */
function renderWithPreviewProvider(ui: React.ReactElement) {
  return rtlRender(<DraggablePreviewProvider>{ui}</DraggablePreviewProvider>);
}

function TestDraggable<TData = undefined>(props: {
  options?: Partial<Draggable.Root.Props<TData>>;
  mounted?: boolean;
  testId?: string;
}) {
  const { options, mounted = true, testId = 'drag' } = props;
  if (!mounted) {
    return null;
  }
  // `Draggable.Root`'s overloads need `payload` to be statically present once
  // `TData` is declared. This helper forwards whatever a fixture hands it — most
  // pass no payload at all — so widen past the overloads rather than making every
  // fixture declare one. `kind` defaults to the shared test kind, and a fixture
  // exercising kind matching (or a typed payload) passes its own.
  const Root = Draggable.Root as (props: Draggable.Root.Props<any>) => React.JSX.Element;
  return (
    <Root
      kind={testDragKind}
      label={TEST_DRAGGABLE_LABEL}
      {...options}
      data-testid={testId}
      className={draggingClass}
    />
  );
}

describe('Draggable.Root', () => {
  const { render, renderDnd } = createDndRenderer();

  describeConformance(<Draggable.Root kind={testDragKind} />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return renderDnd(node);
    },
  }));

  it('keeps keyboardMovement off the DOM element', () => {
    rtlRender(
      <Draggable.Root kind={testDragKind} data-testid="moved" keyboardMovement={() => null} />,
    );
    // Engine parameters are plucked from the spread props; a miss would land
    // here as a `keyboardmovement` attribute.
    expect(screen.getByTestId('moved').hasAttribute('keyboardmovement')).toBe(false);
  });

  it('keeps trackDisplacement off the DOM element', () => {
    rtlRender(<Draggable.Root kind={testDragKind} data-testid="tracked" trackDisplacement />);
    const el = screen.getByTestId('tracked');
    expect(el.hasAttribute('trackdisplacement')).toBe(false);
    // Component-level behavior only: nothing drag-scoped applies while idle.
    expect(el).not.toHaveAttribute('data-displacing');
  });

  it('registers with no PreviewProvider ancestor (the engine is global)', () => {
    // The engine lives in a global slot, so a draggable works with no provider
    // of any kind — registration applies the gesture styles directly.
    expect(() =>
      rtlRender(<Draggable.Root kind={testDragKind} data-testid="orphan" />),
    ).not.toThrow();
    const el = screen.getByTestId('orphan');
    expect(el.style.touchAction).toBe('manipulation');
    expect(el.style.userSelect).toBe('none');
  });

  it('throws when a Draggable.Preview has no PreviewProvider ancestor', async () => {
    // Content has to render in a React tree, and only a provider supplies one.
    // Failing at mount points the stack at the part, rather than at drag start.
    // React 18's dev error path logs the uncaught render error via console.error.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() =>
        rtlRender(
          <Draggable.Root kind={testDragKind} data-testid="bare">
            <Draggable.Preview>
              <span>preview</span>
            </Draggable.Preview>
          </Draggable.Root>,
        ),
      ).toThrow(/Draggable\.PreviewProvider/);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('needs no PreviewProvider to clone the source', async () => {
    // The clone is engine-built and touches no React, so the provider requirement
    // is scoped to content: a plain draggable stays zero-config.
    rtlRender(
      <Draggable.Root kind={testDragKind} data-testid="bare">
        <Draggable.ClonedPreview />
      </Draggable.Root>,
    );
    const source = screen.getByTestId('bare');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);

    const clone = source.parentElement!.querySelector('[data-drag-preview]');
    expect(clone).not.toBeNull();
  });

  it('applies the gesture styles once attached', async () => {
    await renderDnd(<TestDraggable />);
    const el = screen.getByTestId('drag');
    // Registration no longer marks the element `draggable` (the native path is
    // gone); the synthetic engine applies gesture styles to the handle so a
    // press can't select text or fire the touch callout.
    expect(el.style.touchAction).toBe('manipulation');
    expect(el.style.userSelect).toBe('none');
  });

  it('restores the gesture styles on unmount', async () => {
    const { unmount } = await renderDnd(<TestDraggable />);
    const el = screen.getByTestId('drag');
    expect(el.style.touchAction).toBe('manipulation');
    unmount();
    expect(el.style.touchAction).toBe('');
    expect(el.style.userSelect).toBe('');
  });

  it('wires keyboard a11y attributes and restores them on unmount', async () => {
    const { unmount } = await renderDnd(<TestDraggable />);
    const el = screen.getByTestId('drag');
    expect(el.getAttribute('aria-roledescription')).toBe('draggable');
    const describedBy = el.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).not.toBeNull();
    unmount();
    expect(el.hasAttribute('aria-roledescription')).toBe(false);
    expect(el.hasAttribute('aria-describedby')).toBe(false);
  });

  it('honours a custom ariaRoleDescription', async () => {
    await renderDnd(<TestDraggable options={{ ariaRoleDescription: 'sortable card' }} />);
    const el = screen.getByTestId('drag');
    expect(el.getAttribute('aria-roledescription')).toBe('sortable card');
  });

  it('restricts the gesture/a11y setup to the element behind Draggable.Handle', async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind} data-testid="card">
        <Draggable.Handle data-testid="handle">grip</Draggable.Handle>
      </Draggable.Root>,
    );
    const handle = screen.getByTestId('handle');
    const card = screen.getByTestId('card');

    // The gesture styles and keyboard a11y attributes land on the handle, not
    // the whole card — no `dragHandle` parameter needed.
    expect(handle.style.touchAction).toBe('manipulation');
    expect(card.style.getPropertyValue('touch-action')).toBe('');
    expect(handle.getAttribute('aria-roledescription')).toBe('draggable');
    expect(card.hasAttribute('aria-roledescription')).toBe(false);
  });

  it('moves the gesture/a11y setup onto a handle that mounts after the root', async () => {
    // A handle attaches through a ref callback, so mounting one re-registers the
    // draggable and the setup moves off the root.
    function Card({ withHandle }: { withHandle: boolean }) {
      return (
        <Draggable.Root kind={testDragKind} data-testid="card">
          {withHandle && <Draggable.Handle data-testid="handle">grip</Draggable.Handle>}
        </Draggable.Root>
      );
    }

    const { rerender } = await renderDnd(<Card withHandle={false} />);
    const card = screen.getByTestId('card');
    expect(card.style.touchAction).toBe('manipulation');

    await rerender(<Card withHandle />);

    const handle = screen.getByTestId('handle');
    expect(handle.style.touchAction).toBe('manipulation');
    expect(handle.getAttribute('aria-roledescription')).toBe('draggable');
    expect(card.style.touchAction).toBe('');
    expect(card.hasAttribute('aria-roledescription')).toBe(false);

    // The reverse leg: removing the handle moves the setup — and keyboard
    // pickup — back to the whole root.
    await rerender(<Card withHandle={false} />);

    expect(card.style.touchAction).toBe('manipulation');
    expect(card.getAttribute('aria-roledescription')).toBe('draggable');
    expect(card.getAttribute('aria-describedby')).toBeTruthy();

    card.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    fireEvent.keyDown(card, { key: ' ' });
    await flushRaf();
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);
    fireEvent.keyDown(card, { key: 'Escape' });
    await flushRaf();
  });

  it('applies the static setup to a handle swapped mid-drag once the drag ends', async () => {
    // Swapping the handle node during the element's own drag skips the
    // re-registration (tearing the gesture styles down would disrupt the live
    // drag); the skipped reconcile must flush when the drag ends, or the new
    // handle never receives the gesture styles / a11y attributes.
    function Card({ handleKey }: { handleKey: string }) {
      return (
        <Draggable.Root kind={testDragKind} data-testid="card">
          <Draggable.Handle key={handleKey} render={<button type="button" />} data-testid="handle">
            grip
          </Draggable.Handle>
        </Draggable.Root>
      );
    }

    const { rerender } = await renderDnd(<Card handleKey="a" />);
    const card = screen.getByTestId('card');
    card.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    const firstHandle = screen.getByTestId('handle');

    fireEvent.dragStart(firstHandle);
    await flushRaf();
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);

    // Remount the handle to a fresh node mid-drag. Queried within the live card
    // (the engine's clone preview duplicates the test id).
    await rerender(<Card handleKey="b" />);
    const secondHandle = card.querySelector('[data-testid="handle"]') as HTMLElement;
    expect(secondHandle).not.toBe(firstHandle);

    cancel();
    await flushRaf();

    expect(secondHandle.style.touchAction).toBe('manipulation');
    expect(secondHandle.getAttribute('aria-roledescription')).toBe('draggable');
    expect(secondHandle.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('exposes state.dragging reflecting the active drag session', async () => {
    const { engine } = await renderDnd(<TestDraggable />);
    const source = screen.getByTestId('drag');
    expect(source).toHaveClass('idle');

    // Pin element bounds so the engine can resolve a pointer location.
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    const target = createElement();
    engine.registerDropTarget(target, {});

    fireEvent.dragStart(source);
    await flushRaf();

    expect(source).toHaveClass('dragging');

    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    fireEvent.drop(target);
    await flushRaf();

    expect(source).toHaveClass('idle');
  });

  it('resets state.dragging when the drag is cancelled (no drop target hit)', async () => {
    await renderDnd(<TestDraggable />);
    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();
    expect(source).toHaveClass('dragging');

    // Cancel the drag with no drop target hit. The synthetic engine treats a
    // `dragend` without a preceding `drop` as a cancel.
    cancel();
    await flushRaf();

    expect(source).toHaveClass('idle');
  });

  it('blocks the drag when onBeforeDragStart cancels', async () => {
    const onDragStart = vi.fn();
    await renderDnd(
      <TestDraggable
        options={{ onBeforeDragStart: (_, eventDetails) => eventDetails.cancel(), onDragStart }}
      />,
    );
    const source = screen.getByTestId('drag');

    fireEvent.dragStart(source);
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();
    expect(source).toHaveClass('idle');
  });

  it('blocks the drag when disabled', async () => {
    const onDragStart = vi.fn();
    await renderDnd(<TestDraggable options={{ disabled: true, onDragStart }} />);
    const source = screen.getByTestId('drag');

    fireEvent.dragStart(source);
    await flushRaf();

    expect(onDragStart).not.toHaveBeenCalled();
    expect(source).toHaveClass('idle');
  });

  it('reflects disabled in state as data-disabled', async () => {
    await renderDnd(
      <div>
        <TestDraggable options={{ disabled: true }} testId="disabled" />
        <TestDraggable testId="enabled" />
      </div>,
    );

    expect(screen.getByTestId('disabled')).toHaveAttribute('data-disabled');
    expect(screen.getByTestId('enabled')).not.toHaveAttribute('data-disabled');
  });

  it('forwards payload into the drag payload', async () => {
    const tokenKind = Draggable.createKind<{ token: string }>('token');
    const payload = vi.fn(() => ({ token: 'abc' }));
    const onDragStart = vi.fn();
    await renderDnd(
      // `Props` hides `kind` behind an `Omit`, which TypeScript can't infer through, so
      // the payload type is named here rather than read off the kind.
      <TestDraggable<{ token: string }> options={{ kind: tokenKind, payload, onDragStart }} />,
    );
    const source = screen.getByTestId('drag');

    fireEvent.dragStart(source);
    await flushRaf();

    expect(payload).toHaveBeenCalledTimes(1);
    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart.mock.calls[0][0].source.payload).toEqual({ token: 'abc' });
  });

  it('forwards a static payload value, keeping it off the DOM element', async () => {
    const tokenKind = Draggable.createKind<{ token: string }>('static-token');
    const onDragStart = vi.fn();
    await renderDnd(
      <TestDraggable<{ token: string }>
        options={{ kind: tokenKind, payload: { token: 'abc' }, onDragStart }}
      />,
    );
    const source = screen.getByTestId('drag');
    // The engine parameter is plucked from the spread props; a miss would land
    // here as a `payload` attribute.
    expect(source.hasAttribute('payload')).toBe(false);

    fireEvent.dragStart(source);
    await flushRaf();

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart.mock.calls[0][0].source.payload).toEqual({ token: 'abc' });
  });

  it('keeps the registration stable across re-renders and calls the latest callbacks', async () => {
    const firstOnDragStart = vi.fn();
    const secondOnDragStart = vi.fn();

    const { rerender } = await renderDnd(
      <TestDraggable options={{ onDragStart: firstOnDragStart }} />,
    );
    const source = screen.getByTestId('drag');
    // Registration applies the gesture styles; they prove the element is
    // registered without relying on the removed native `draggable` attribute.
    expect(source.style.touchAction).toBe('manipulation');
    const getParameters = getRegistration(source)!;
    const firstParameters = getParameters();
    // Repeated engine dispatches within one render reuse both normalization
    // layers instead of rebuilding the registration object every time.
    expect(getParameters()).toBe(firstParameters);

    // Re-render with a brand-new onDragStart function reference. The
    // registration must NOT tear down and re-register — only the wrapped
    // callback should read the fresh prop.
    await rerender(<TestDraggable options={{ onDragStart: secondOnDragStart }} />);
    // Same DOM node, still registered — no re-registration happened.
    expect(screen.getByTestId('drag')).toBe(source);
    expect(source.style.touchAction).toBe('manipulation');
    const secondParameters = getParameters();
    expect(secondParameters).not.toBe(firstParameters);
    expect(getParameters()).toBe(secondParameters);

    fireEvent.dragStart(source);
    await flushRaf();

    expect(firstOnDragStart).not.toHaveBeenCalled();
    expect(secondOnDragStart).toHaveBeenCalledTimes(1);
  });

  it('re-registers when the element behind the ref is swapped without remounting', async () => {
    function Swappable({ swapped }: { swapped: boolean }) {
      // The key sits on the rendered node, not on the root, so this component —
      // and its registration — stays mounted while React swaps the DOM node
      // behind the ref, as a virtualizer recycling a row does.
      return (
        <Draggable.Root
          kind={testDragKind}
          data-testid={swapped ? 'b' : 'a'}
          render={(props) => <div key={swapped ? 'b' : 'a'} {...props} />}
        />
      );
    }

    const { rerender } = await renderDnd(<Swappable swapped={false} />);
    const first = screen.getByTestId('a');
    expect(first.style.touchAction).toBe('manipulation');

    await rerender(<Swappable swapped />);
    const second = screen.getByTestId('b');
    // The old node was deregistered (gesture styles restored) and the new node
    // registered, so the draggable follows the swap instead of going dead.
    expect(first.style.touchAction).toBe('');
    expect(second.style.touchAction).toBe('manipulation');
  });

  it('keeps state.dragging true when the source node is swapped mid-drag', async () => {
    function Swappable({ swapped }: { swapped: boolean }) {
      // The key sits on the rendered node, so React detaches the old node
      // (`ref(null)`) and attaches the new one while the registration lives on.
      return (
        <Draggable.Root
          kind={testDragKind}
          data-testid={swapped ? 'b' : 'a'}
          className={draggingClass}
          render={(props) => <div key={swapped ? 'b' : 'a'} {...props} />}
        />
      );
    }

    const { rerender } = await renderDnd(<Swappable swapped={false} />);
    const first = screen.getByTestId('a');
    first.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(first);
    await flushRaf();
    expect(first).toHaveClass('dragging');
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(first);

    // Recycle the row mid-drag. The session must re-point from the detached node
    // to the fresh one so `isDragging` and every in-flight closure reading
    // `source.element` track the swap instead of going stale (previously the
    // interposed `ref(null)` hid the swap and the session kept pointing at the
    // detached node).
    await rerender(<Swappable swapped />);
    const second = screen.getByTestId('b');
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(second);
    // The titled behavior: `state.dragging` — and the engine-owned marker — now
    // sit on the fresh node, not the detached one.
    expect(second).toHaveClass('dragging');
    expect(second).toHaveAttribute('data-dragging');
    expect(first).not.toHaveAttribute('data-dragging');
  });

  it('keeps a keyboard drag when the source is rendered into a different parent', async () => {
    // Not the swap above: there React keeps one `Draggable.Root` and hands it a new node, so
    // the hook sees the change and re-points the session. Moving the item between containers
    // unmounts one instance and mounts another, which nothing connects — the session is left
    // on a detached node. The drag has to run on regardless, because an app that reflows its
    // layout under a live drag is doing something ordinary.
    function Board({ inB }: { inB: boolean }) {
      const chip = <Draggable.Root kind={testDragKind} data-testid="chip" label="chip" />;
      return (
        <div>
          <div data-testid="col-a">{!inB && chip}</div>
          <div data-testid="col-b">{inB && chip}</div>
        </div>
      );
    }

    const { rerender } = await renderDnd(<Board inB={false} />);
    const chip = screen.getByTestId('chip');
    chip.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    chip.focus();
    fireEvent.keyDown(chip, { key: ' ' });
    await flushRaf();
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(chip);

    await rerender(<Board inB />);
    await flushRaf();

    expect(dragSessionStore.getSnapshot()).not.toBeNull();
  });

  it('defers a disabled flip mid-drag: the drag survives, the setup lands at drag end', async () => {
    // A reconcile-input change while this element is the active source must not
    // tear down the live gesture; the re-registration flushes at drag end.
    const { rerender } = await renderDnd(<Draggable.Root kind={testDragKind} data-testid="drag" />);
    const el = screen.getByTestId('drag');
    el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(el);
    await flushRaf();
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(el);

    await rerender(<Draggable.Root kind={testDragKind} data-testid="drag" disabled />);

    // The session and the gesture styles survive the flip.
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(el);
    expect(el.style.userSelect).toBe('none');
    expect(el.style.touchAction).toBe('manipulation');
    expect(el).toHaveAttribute('data-dragging');

    cancel();
    await flushRaf();

    // The skipped reconcile flushed: the a11y attributes now reflect `disabled`.
    expect(dragSessionStore.getSnapshot()).toBeNull();
    expect(el.style.userSelect).toBe('');
    expect(el.style.touchAction).toBe('');
    expect(el).not.toHaveAttribute('aria-roledescription');
    expect(el).not.toHaveAttribute('aria-describedby');
  });

  it('survives a re-render mid-drag when `ref` has a new identity each time', async () => {
    // `useMergedRefs` rebuilds its callback whenever an entry's identity changes,
    // so an inline `ref` arrow makes React detach and re-attach the node on every
    // render, re-running the registration mid-gesture.
    const onDragEnd = vi.fn();
    const onDrop = vi.fn();
    function Inline({ tick }: { tick: number }) {
      return (
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          data-tick={tick}
          className={draggingClass}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
          ref={(node) => {
            void node;
          }}
        />
      );
    }

    const { rerender, engine } = await renderDnd(<Inline tick={0} />);
    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    const target = createElement();
    engine.registerDropTarget(target, {});

    fireEvent.dragStart(source);
    await flushRaf();
    expect(source).toHaveClass('dragging');

    await rerender(<Inline tick={1} />);

    // The rendered node is unchanged (the clone shares its `data-testid`, so
    // assert on the node captured before the drag rather than re-querying).
    expect(source).toHaveAttribute('data-tick', '1');
    expect(source).toHaveClass('dragging');
    expect(source).toHaveAttribute('data-dragging');
    expect(source.style.userSelect).toBe('none');
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(source);

    // The drag still completes: re-registration must not have unbound the sensors
    // out from under the live gesture.
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();
    fireEvent.drop(target);
    await flushRaf();

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(source).toHaveClass('idle');
  });

  it('cleanup is idempotent and survives unmount mid-drag', async () => {
    const { unmount } = await renderDnd(<TestDraggable />);
    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);
    await flushRaf();

    expect(() => unmount()).not.toThrow();
    // Unmount runs the registration cleanup, which restores the gesture styles
    // it applied. (The active gesture's temporary `draggable="false"` is owned
    // by the live drag session and is restored when that session ends.)
    expect(source.style.touchAction).toBe('');
    expect(source.style.userSelect).toBe('');
  });

  describe('Strict Mode', () => {
    it('mounts a single set of keyboard a11y attributes', async () => {
      // Strict Mode double-invokes the registration effect (register → cleanup →
      // register); the re-register must leave exactly one live setup behind, not
      // duplicated or torn-down attributes.
      await renderDnd(
        <React.StrictMode>
          <TestDraggable />
        </React.StrictMode>,
      );
      const el = screen.getByTestId('drag');
      expect(el.getAttribute('aria-roledescription')).toBe('draggable');

      const describedBy = el.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      // A single instructions id, resolving to exactly one node still in the
      // document — the cleanup leg must not have removed it or left a duplicate.
      const ids = describedBy!.split(/\s+/);
      expect(ids).toHaveLength(1);
      expect(document.getElementById(ids[0])).not.toBeNull();
      expect(document.querySelectorAll(`[id="${ids[0]}"]`)).toHaveLength(1);
    });

    it('fires onDragStart, onDrop and onDragEnd exactly once for a full drag', async () => {
      const onDragStart = vi.fn();
      const onDragEnd = vi.fn();
      const onDrop = vi.fn();
      const { engine } = await renderDnd(
        <React.StrictMode>
          <TestDraggable options={{ onDragStart, onDrop, onDragEnd }} />
        </React.StrictMode>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      const target = createElement();
      engine.registerDropTarget(target, {});

      fireEvent.dragStart(source);
      await flushRaf();
      fireEvent.dragEnter(target);
      fireEvent.dragOver(target);
      await flushRaf();
      fireEvent.drop(target);
      await flushRaf();

      // A double-mounted registration would run the handlers once per hold.
      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDragEnd).toHaveBeenCalledTimes(1);
      // And it was a committed drop, which `onDrop` says on its own.
      expect(onDrop).toHaveBeenCalledTimes(1);
    });
  });

  describe('configuration forwarding', () => {
    it('forwards pointerActivation to the sensor: a raised distance defers the pickup', async () => {
      const onDragStart = vi.fn();
      await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          pointerActivation={{ mouse: { type: 'distance', distance: 40 } }}
          onDragStart={onDragStart}
        />,
      );
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      // The bridge nudges ~6px, well short of the configured 40px threshold, so
      // a forwarded `pointerActivation` keeps the drag from starting here.
      await lift(el, { expectNoDrag: true });
      expect(onDragStart).not.toHaveBeenCalled();
      expect(dragSessionStore.getSnapshot()).toBeNull();
    });

    it('forwards pointerActivation to the sensor: immediate picks up with no travel', async () => {
      const onDragStart = vi.fn();
      await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          pointerActivation={{ type: 'immediate' }}
          onDragStart={onDragStart}
        />,
      );
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(el);
      expect(onDragStart).toHaveBeenCalledTimes(1);

      cancel();
    });

    it('forwards modifiers: a root-level axis lock constrains a pointer drag', async () => {
      // Root-level modifiers govern the committed input (the hit-test point and
      // the preview follow it), so a vertical-axis lock must pin every reported
      // x while y keeps tracking the pointer.
      const moves: Array<{ x: number; y: number }> = [];
      await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          modifiers={Draggable.restrictToVerticalAxis}
          onDrag={({ location }) => {
            moves.push({
              x: location.current.input.clientX,
              y: location.current.input.clientY,
            });
          }}
        />,
      );
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(el, { clientX: 100, clientY: 50 });
      await dragOver(el, { clientX: 180, clientY: 90 });
      // `onDrag` is rAF-throttled on top of the sensor's frame, so the move
      // committed above is delivered one frame later.
      await flushRaf();

      expect(moves.length).toBeGreaterThan(0);
      // Every committed x sits at the drag-start anchor — the 100px press plus
      // the bridge's activation nudge (`DRAG_ACTIVATION_DISTANCE_PX`), where the
      // drag committed — never at the pointer's 180 — while the vertical axis
      // followed the pointer to 90. Pinned to the exact constant so a lock wired
      // to the wrong reference point can't slip through as "some stable x".
      expect(moves.every((move) => move.x === 106)).toBe(true);
      expect(moves.at(-1)!.y).toBe(90);

      cancel();
      await flushRaf();
    });

    it('forwards keyboardMovement: the resolver drives each arrow press', async () => {
      const presses: Array<{ key: string; direction: { x: number; y: number } }> = [];
      await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          keyboardMovement={(details) => {
            presses.push({ key: details.key, direction: details.direction });
            return null;
          }}
        />,
      );
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      el.focus();
      fireEvent.keyDown(el, { key: ' ' });
      await flushRaf();
      fireEvent.keyDown(el, { key: 'ArrowDown' });
      await flushRaf();

      expect(presses).toEqual([{ key: 'ArrowDown', direction: { x: 0, y: 1 } }]);

      fireEvent.keyDown(el, { key: 'Escape' });
      await flushRaf();
    });

    it('forwards finalFocus: it takes over the keyboard drop focus', async () => {
      const focusSpot = createElement();
      focusSpot.tabIndex = 0;
      const outcomes: Array<{ canceled: boolean; landed: boolean }> = [];
      await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          finalFocus={(parameters) => {
            outcomes.push({ canceled: parameters.canceled, landed: parameters.dropTarget != null });
            return focusSpot;
          }}
        />,
      );
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      el.focus();
      fireEvent.keyDown(el, { key: ' ' });
      await flushRaf();
      fireEvent.keyDown(el, { key: ' ' }); // drop over nothing
      await flushRaf(); // focus restoration runs one frame later

      expect(outcomes).toEqual([{ canceled: false, landed: false }]);
      expect(document.activeElement).toBe(focusSpot);
    });

    it('forwards onDropTargetChange: it fires with the entered target', async () => {
      const onDropTargetChange = vi.fn();
      const { engine } = await renderDnd(<TestDraggable options={{ onDropTargetChange }} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      const target = createElement();
      engine.registerDropTarget(target, {});

      fireEvent.dragStart(source);
      await flushRaf();
      expect(onDropTargetChange).not.toHaveBeenCalled();

      fireEvent.dragEnter(target);
      fireEvent.dragOver(target);
      await flushRaf();

      expect(onDropTargetChange).toHaveBeenCalledTimes(1);
      const event = onDropTargetChange.mock.calls[0][0];
      expect(
        event.location.current.dropTargets.map((record: { element: Element }) => record.element),
      ).toEqual([target]);

      cancel();
      await flushRaf();
    });

    it('forwards dragCursor to the pointer sensor cursor lock', async () => {
      await renderDnd(<Draggable.Root kind={testDragKind} data-testid="drag" dragCursor="copy" />);
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(el);

      // The sensor pins the cursor document-wide through a scoped rule driven by
      // this class/variable pair; the forwarded value must land in the variable.
      const root = document.documentElement;
      expect(root.classList.contains('baseui-dragging')).toBe(true);
      expect(root.style.getPropertyValue('--drag-cursor')).toBe('copy');

      cancel();
      await flushRaf();
      expect(root.classList.contains('baseui-dragging')).toBe(false);
    });

    it('reads the live CSP provider configuration for the cursor stylesheet', async () => {
      let setStyleElementsDisabled!: React.Dispatch<React.SetStateAction<boolean>>;

      function DynamicCSPProvider({ children }: { children?: React.ReactNode }) {
        const [disabled, setDisabled] = React.useState(true);
        setStyleElementsDisabled = setDisabled;
        return (
          <CSPProvider nonce="drag-nonce" disableStyleElements={disabled}>
            {children}
          </CSPProvider>
        );
      }

      await renderDnd(<Draggable.Root kind={testDragKind} data-testid="drag" />, {
        wrapper: DynamicCSPProvider,
      });
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(el);
      expect(document.documentElement).toHaveClass('baseui-dragging');
      expect(document.documentElement).not.toHaveClass('baseui-dragging-styles');
      cancel();
      await flushRaf();

      act(() => setStyleElementsDisabled(false));
      await lift(el);

      expect(document.documentElement).toHaveClass('baseui-dragging', 'baseui-dragging-styles');
      const cursorStyle = Array.from(document.head.querySelectorAll('style')).find(
        (style) =>
          style.nonce === 'drag-nonce' &&
          Array.from(style.sheet?.cssRules ?? []).some((rule) =>
            rule.cssText.includes('baseui-dragging-styles'),
          ),
      );
      expect(cursorStyle?.nonce).toBe('drag-nonce');

      cancel();
      await flushRaf();
    });

    it('forwards keyboardInstructions into the aria-describedby node', async () => {
      await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          keyboardInstructions="Press X to levitate."
        />,
      );
      const el = screen.getByTestId('drag');
      const describedBy = el.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy!)?.textContent).toBe('Press X to levitate.');
    });

    it('re-applies the keyboard a11y affordances when disabled flips', async () => {
      // The static DOM setup is captured at registration, so a prop change has to
      // re-register to land: a stale `aria-roledescription` would keep announcing
      // a keyboard drag the engine now refuses.
      const { rerender } = await renderDnd(
        <Draggable.Root kind={testDragKind} data-testid="drag" />,
      );
      const el = screen.getByTestId('drag');
      expect(el).toHaveAttribute('aria-roledescription', 'draggable');
      expect(el).toHaveAttribute('aria-describedby');
      expect(el).toHaveAttribute('tabindex', '0');

      await rerender(<Draggable.Root kind={testDragKind} data-testid="drag" disabled />);
      expect(el.style.touchAction).toBe('');
      expect(el.style.userSelect).toBe('');
      expect(el).not.toHaveAttribute('aria-roledescription');
      expect(el).not.toHaveAttribute('aria-describedby');
      expect(el).not.toHaveAttribute('tabindex');

      await rerender(<Draggable.Root kind={testDragKind} data-testid="drag" />);
      expect(el.style.touchAction).toBe('manipulation');
      expect(el.style.userSelect).toBe('none');
      expect(el).toHaveAttribute('aria-roledescription', 'draggable');
      expect(el).toHaveAttribute('aria-describedby');
    });

    it('preserves inline gesture styles changed while disabling', async () => {
      const { rerender } = await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          style={{ touchAction: 'pan-y', userSelect: 'text' }}
        />,
      );
      const el = screen.getByTestId('drag');
      expect(el.style.touchAction).toBe('manipulation');
      expect(el.style.userSelect).toBe('none');

      await rerender(
        <Draggable.Root
          kind={testDragKind}
          data-testid="drag"
          disabled
          style={{ touchAction: 'none', userSelect: 'auto' }}
        />,
      );

      expect(el.style.touchAction).toBe('none');
      expect(el.style.userSelect).toBe('auto');
    });

    it('re-applies the a11y strings when the locale changes, without remounting', async () => {
      // The provider is present in both trees and only its `translations` change,
      // so the tree shape is identical and React keeps the same node. Wrapping a
      // previously-unwrapped root would remount it instead, and a remount takes
      // the fresh strings through the registration path — leaving the live
      // `reconcileKey` effect, which exists for exactly this case, unexercised.
      const { rerender } = await renderDnd(
        <LocalizationProvider translations={enUS}>
          <Draggable.Root kind={testDragKind} data-testid="drag" />
        </LocalizationProvider>,
      );
      const el = screen.getByTestId('drag');
      expect(el).toHaveAttribute('aria-roledescription', 'draggable');

      await rerender(
        <LocalizationProvider translations={frFR}>
          <Draggable.Root kind={testDragKind} data-testid="drag" />
        </LocalizationProvider>,
      );

      // Same node, new strings.
      expect(screen.getByTestId('drag')).toBe(el);
      expect(el).toHaveAttribute('aria-roledescription', 'déplaçable');
    });
  });

  describe('same-commit node swap', () => {
    it('registers the new draggable node with the same commit’s parameters', async () => {
      // The ref callback runs earlier in a commit than the layout effect that
      // commits the params ref, so a keyed remount that also changes props would
      // register the new node against the *previous* render's parameters.
      const onDragStart = vi.fn();
      const first = vi.fn();
      const { rerender } = await renderDnd(
        <Draggable.Root
          kind={testDragKind}
          key="a"
          data-testid="drag"
          label="first"
          onDragStart={first}
        />,
      );
      const before = screen.getByTestId('drag');

      await rerender(
        <Draggable.Root
          kind={testDragKind}
          key="b"
          data-testid="drag"
          label="second"
          onDragStart={onDragStart}
        />,
      );
      const after = screen.getByTestId('drag');
      expect(after).not.toBe(before);

      after.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      await lift(after);

      expect(first).not.toHaveBeenCalled();
      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDragStart.mock.calls[0][0].source.label).toBe('second');
    });

    it('applies the same commit’s disabled to the new draggable node', async () => {
      const onDragStart = vi.fn();
      const { rerender } = await renderDnd(
        <Draggable.Root kind={testDragKind} key="a" data-testid="drag" onDragStart={onDragStart} />,
      );

      await rerender(
        <Draggable.Root
          kind={testDragKind}
          key="b"
          data-testid="drag"
          disabled
          onDragStart={onDragStart}
        />,
      );
      const after = screen.getByTestId('drag');
      after.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      // A stale registration would still read the previous render's enabled state.
      expect(after).not.toHaveAttribute('tabindex');
      await lift(after, { expectNoDrag: true });
      expect(onDragStart).not.toHaveBeenCalled();
    });

    it('registers the new drop-target node with the same commit’s parameters', async () => {
      const onDrop = vi.fn();
      const stale = vi.fn();
      const { engine, rerender } = await renderDnd(
        <DropTarget.Root
          accept={DropTarget.anyKind}
          key="a"
          data-testid="target"
          payload={{ slot: 1 }}
          onDrop={stale}
        />,
      );
      const source = createElement();
      engine.registerDraggable(source, {});

      await rerender(
        <DropTarget.Root
          accept={DropTarget.anyKind}
          key="b"
          data-testid="target"
          payload={{ slot: 2 }}
          onDrop={onDrop}
        />,
      );
      const target = screen.getByTestId('target');
      target.getBoundingClientRect = () => new DOMRect(0, 200, 200, 100);

      await lift(source);
      await dragOver(target, { clientY: 250 });
      fireEvent.drop(target, { clientY: 250 });
      await flushRaf();

      expect(stale).not.toHaveBeenCalled();
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop.mock.calls[0][0].self.payload).toEqual({ slot: 2 });
    });
  });

  describe('default tabIndex', () => {
    it('defaults tabIndex to 0 so the keyboard pickup is reachable with Tab', async () => {
      await renderDnd(<TestDraggable />);
      const el = screen.getByTestId('drag');
      expect(el).toHaveAttribute('tabindex', '0');
      // A focusable `<div>` that consumes Space and Enter must expose itself as
      // more than an unnamed `generic` node.
      expect(el).toHaveAttribute('role', 'button');
    });

    it('makes a handle-less root focusable synchronously on mount', () => {
      // `hasHandle` starts unknown (SSR can't see handles), so the resolving
      // layout effect must land the attributes in the mount commit, before
      // first paint — a plain synchronous render already shows them.
      rtlRender(<TestDraggable />);
      const el = screen.getByTestId('drag');
      expect(el).toHaveAttribute('tabindex', '0');
      expect(el).toHaveAttribute('role', 'button');
    });

    it('does not default tabIndex when keyboard drag is off', async () => {
      // No keyboard gesture is announced, so the element must not join the tab
      // order just to expose a pickup that can never start.
      await renderDnd(<TestDraggable options={{ keyboardActivation: 'off' }} />);
      const el = screen.getByTestId('drag');
      expect(el).not.toHaveAttribute('tabindex');
      expect(el).not.toHaveAttribute('role');

      // The prop's real contract: Space starts nothing, pointer pickup still works.
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      fireEvent.keyDown(el, { key: ' ' });
      await flushRaf();
      expect(dragSessionStore.getSnapshot()).toBeNull();

      await lift(el);
      expect(dragSessionStore.getSnapshot()?.source.element).toBe(el);

      cancel();
      await flushRaf();
    });

    it('keeps tabIndex and role when keyboard drag is manual', async () => {
      // `'manual'` moves the pickup elsewhere rather than removing it, so the
      // element still has to be reachable with Tab.
      await renderDnd(<TestDraggable options={{ keyboardActivation: 'manual' }} />);
      const el = screen.getByTestId('drag');
      expect(el).toHaveAttribute('tabindex', '0');
      expect(el).toHaveAttribute('role', 'button');
      // Still announced as draggable, without the hint it no longer honours.
      expect(el).toHaveAttribute('aria-roledescription');
      expect(el).not.toHaveAttribute('aria-describedby');
    });

    it('drops the instructions when keyboard drag switches to manual', async () => {
      // The reconcile path keys off `keyboardActivation`, so flipping it at runtime must
      // not strand the hint.
      const { setProps } = await renderDnd(
        <TestDraggable options={{ keyboardActivation: 'auto' }} />,
      );
      const el = screen.getByTestId('drag');
      expect(el).toHaveAttribute('aria-describedby');

      await setProps({ options: { keyboardActivation: 'manual' } });
      expect(el).toHaveAttribute('aria-roledescription');
      expect(el).not.toHaveAttribute('aria-describedby');
    });

    it('lets user-passed tabIndex and role override the defaults', async () => {
      await renderDnd(<TestDraggable options={{ tabIndex: -1, role: 'listitem' }} />);
      const el = screen.getByTestId('drag');
      expect(el).toHaveAttribute('tabindex', '-1');
      expect(el).toHaveAttribute('role', 'listitem');
    });

    it('server-renders a root with a handle without tabindex or role', () => {
      // `hasHandle` starts `null` for a reason: the server can't see handles
      // (they attach through client-side ref callbacks), so the SSR markup must
      // not carry a tab stop next to the handle's own.
      const container = document.createElement('div');
      container.innerHTML = ReactDOMServer.renderToString(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Handle>grip</Draggable.Handle>
        </Draggable.Root>,
      );
      const root = container.firstElementChild as HTMLElement;
      expect(root).not.toBeNull();
      expect(root).not.toHaveAttribute('tabindex');
      expect(root).not.toHaveAttribute('role');
    });

    it('keeps the root out of the tab order when a Draggable.Handle is mounted', async () => {
      // With a handle, pickup and the a11y attributes live on the handle (an
      // already-focusable button), so the root itself must not be focusable.
      await renderDnd(
        <Draggable.Root kind={testDragKind} data-testid="card">
          <Draggable.Handle data-testid="handle" render={<button type="button" />}>
            grip
          </Draggable.Handle>
        </Draggable.Root>,
      );
      const card = screen.getByTestId('card');
      expect(card).not.toHaveAttribute('tabindex');
      expect(card).not.toHaveAttribute('role');
    });

    it('never puts the root in the tab order, even transiently, when a handle mounts with it', () => {
      // Immediately after a synchronous mount the root must already have
      // resolved to "handle present": one tab stop per item from the start.
      rtlRender(
        <Draggable.Root kind={testDragKind} data-testid="card">
          <Draggable.Handle data-testid="handle" render={<button type="button" />}>
            grip
          </Draggable.Handle>
        </Draggable.Root>,
      );
      const card = screen.getByTestId('card');
      expect(card).not.toHaveAttribute('tabindex');
      expect(card).not.toHaveAttribute('role');
      expect(screen.getByTestId('handle')).toHaveAttribute('aria-roledescription', 'draggable');
    });

    it('moves the tab stop between the root and a handle mounting or unmounting later', async () => {
      function Card({ withHandle }: { withHandle: boolean }) {
        return (
          <Draggable.Root kind={testDragKind} data-testid="card">
            {withHandle && (
              <Draggable.Handle data-testid="handle" render={<button type="button" />}>
                grip
              </Draggable.Handle>
            )}
          </Draggable.Root>
        );
      }

      const { rerender } = await renderDnd(<Card withHandle={false} />);
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('tabindex', '0');
      expect(card).toHaveAttribute('role', 'button');

      // A handle mounting takes over pickup, so the root leaves the tab order.
      await rerender(<Card withHandle />);
      expect(card).not.toHaveAttribute('tabindex');
      expect(card).not.toHaveAttribute('role');

      // And unmounting it hands pickup — and the tab stop — back to the root.
      await rerender(<Card withHandle={false} />);
      expect(card).toHaveAttribute('tabindex', '0');
      expect(card).toHaveAttribute('role', 'button');
    });
  });

  describe('default clone preview', () => {
    function PlainDraggable(props: { options?: Partial<Draggable.Root.Props> }) {
      return (
        <Draggable.Root kind={testDragKind} {...props.options} data-testid="drag" className="Card">
          Card
        </Draggable.Root>
      );
    }

    it('clones the source in place, so the app CSS still applies to the preview', () => {
      // No `Draggable.PreviewProvider`: the clone stays in the source's own parent.
      rtlRender(<PlainDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      expect(document.querySelector('[data-drag-preview]')).toBeNull();

      fireEvent.dragStart(source);

      // The clone lives in the source's own parent, keeps its classes, and is
      // marked so consumers can style it with `.Card[data-drag-preview]`.
      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      expect(clone).not.toBeNull();
      expect(clone).toHaveClass('Card');
      // Through the engine-owned top-layer wrapper, whose placement carries the cascade.
      expect(clone.parentElement!.parentElement).toBe(source.parentElement);
    });

    it('marks the source with data-dragging, and never the clone', async () => {
      await renderDnd(<PlainDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // `[data-dragging] { opacity: .4 }` must dim the source alone — if the clone
      // carried the attribute the preview would fade with it.
      expect(source).toHaveAttribute('data-dragging');
      expect(document.querySelector('[data-drag-preview]')).not.toHaveAttribute('data-dragging');
    });

    it('anchors the clone at the grab point and moves it with the pointer', async () => {
      await renderDnd(<PlainDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(source, { clientX: 30, clientY: 40 });
      await dragOver(source, { clientX: 100, clientY: 120 });

      // The offset defaults to `'source'`, so the clone keeps the original press point. The
      // distance-activation nudge used by `lift` must not leak into this offset.
      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      expect(clone.style.translate).toBe('70px 80px');
    });

    it('tears the clone down and unmarks the source when the drag ends', async () => {
      await renderDnd(<PlainDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);
      expect(document.querySelector('[data-drag-preview]')).not.toBeNull();

      cancel();
      await flushRaf();

      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      expect(source).not.toHaveAttribute('data-dragging');
    });

    it('clones the source for a keyboard pickup too', async () => {
      rtlRender(<PlainDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      source.focus();
      fireEvent.keyDown(source, { key: ' ' });
      await flushRaf();

      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      expect(clone).toHaveClass('Card');
      expect(source).toHaveAttribute('data-dragging');

      fireEvent.keyDown(source, { key: 'Escape' });
      await flushRaf();
      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      expect(source).not.toHaveAttribute('data-dragging');
    });

    it('clears the clone and data-dragging after a real drop', async () => {
      const { engine } = await renderDnd(<PlainDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      const target = createElement();
      engine.registerDropTarget(target, {});

      fireEvent.dragStart(source);
      await flushRaf();
      expect(document.querySelector('[data-drag-preview]')).not.toBeNull();

      fireEvent.dragEnter(target);
      fireEvent.dragOver(target);
      await flushRaf();
      fireEvent.drop(target);

      // A clone gets an ending-style frame so an authored transition can settle
      // it into the source. With no transition, it is gone before that frame paints.
      expect(document.querySelector('[data-drag-preview]')).toHaveAttribute('data-ending-style');
      await flushRaf();
      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      expect(source).not.toHaveAttribute('data-dragging');
    });
  });

  describe('Draggable.ClonedPreview', () => {
    function ClonedPreviewDraggable(props: { previewProps?: Draggable.ClonedPreview.Props }) {
      return (
        <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
          Card
          <Draggable.ClonedPreview {...props.previewProps} />
        </Draggable.Root>
      );
    }

    it('still clones the source, and applies the offset to the clone', async () => {
      await renderDnd(<ClonedPreviewDraggable previewProps={{ offset: 'pointer' }} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(source, { clientX: 30, clientY: 40 });
      await dragOver(source, { clientX: 100, clientY: 120 });

      // Configuring the preview must not turn it into a host: it is still the
      // clone, carrying the source's own class.
      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      expect(clone).toHaveClass('Card');
      // `'pointer'` pins it to the pointer, rather than the grab point `'source'` keeps.
      expect(clone.style.translate).toBe('100px 120px');
    });

    it('resolves an offset callback against the clone, immediately', async () => {
      // A clone publishes nothing to the overlay store, so the renderer never runs
      // and nothing would re-anchor it later: the callback has to resolve at drag
      // start, unlike a host's.
      const offsetSpy = vi.fn((_params: { container: HTMLElement }) => ({ x: 10, y: 20 }));
      await renderDnd(<ClonedPreviewDraggable previewProps={{ offset: offsetSpy }} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(source, { clientX: 30, clientY: 40 });
      await dragOver(source, { clientX: 80, clientY: 90 });

      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      expect(offsetSpy).toHaveBeenCalledTimes(1);
      // Measured against the clone itself — there is no host to measure.
      expect(offsetSpy.mock.calls[0][0].container).toBe(clone);
      // Pointer (80, 90) minus the returned offset (10, 20).
      expect(clone.style.translate).toBe('70px 70px');
    });

    it('shows no preview at all when disabled', async () => {
      await renderDnd(<ClonedPreviewDraggable previewProps={{ disabled: true }} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      // The source is still marked, so it can be styled while it is being dragged.
      expect(source).toHaveAttribute('data-dragging');
    });

    it('needs no React at all, so it renders with no PreviewProvider', async () => {
      // A clone is built entirely by the engine, so it must not require the
      // provider a declared preview does — nor throw for the want of one.
      rtlRender(<ClonedPreviewDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      expect(document.querySelector('.Card[data-drag-preview]')).not.toBeNull();
    });

    it('clamps the clone to a modifiers element when the pointer leaves it', async () => {
      function BoundedDraggable() {
        const boundsRef = React.useRef<HTMLDivElement>(null);
        return (
          <React.Fragment>
            <div ref={boundsRef} data-testid="bounds" />
            <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
              {/* Pin the preview to the pointer so the assertions below read the
                  clamp alone, not the grab offset the `'source'` default would add. */}
              <Draggable.ClonedPreview
                modifiers={Draggable.restrictToElement(boundsRef)}
                offset="pointer"
              />
            </Draggable.Root>
          </React.Fragment>
        );
      }

      await renderDnd(<BoundedDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      // A 200×200 bounds element anchored at the viewport origin.
      screen.getByTestId('bounds').getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);

      await lift(source, { clientX: 10, clientY: 10 });

      // jsdom doesn't lay out, so stub the preview's measured size the clamp reads.
      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      clone.getBoundingClientRect = () => new DOMRect(0, 0, 50, 30);

      // Drag far past the bottom-right corner: the clone sticks to the edge
      // (200 − clone size: 200−50=150, 200−30=170) instead of following out.
      await dragOver(source, { clientX: 500, clientY: 500 });
      expect(clone.style.translate).toBe('150px 170px');

      // Back inside, it tracks the pointer again — the clamp pins, it doesn't stick.
      await dragOver(source, { clientX: 80, clientY: 90 });
      expect(clone.style.translate).toBe('80px 90px');
    });

    it('keeps the clone next to the source inside a PreviewProvider', async () => {
      function Wiring() {
        return (
          <DraggablePreviewProvider>
            <ClonedPreviewDraggable previewProps={{ offset: 'pointer' }} />
          </DraggablePreviewProvider>
        );
      }

      await render(<Wiring />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // The React layer reports only *hosts* as the active preview, so a declared
      // clone must not be mistaken for "no preview" and torn down.
      const clone = document.querySelector('.Card[data-drag-preview]') as HTMLElement;
      expect(clone).not.toBeNull();
      // The provider renders no element of its own, so it relocates nothing: the
      // clone stays where the app's contextual CSS still reaches it. Only
      // `container` moves a preview.
      expect(clone.parentElement!.parentElement).toBe(source.parentElement);
    });

    it('warns rather than throwing when a draggable declares two previews', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        // A wrapper composing its own preview around a consumer-passed one is a
        // plausible mistake; white-screening production over it is not
        // proportionate, and the duplicate-`Handle` slip only warns.
        expect(() =>
          renderWithPreviewProvider(
            <Draggable.Root kind={testDragKind} data-testid="drag">
              <Draggable.Preview>
                <span>x</span>
              </Draggable.Preview>
              <Draggable.ClonedPreview />
            </Draggable.Root>,
          ),
        ).not.toThrow();
        expect(String(warnSpy.mock.calls[0][0])).toMatch(/more than one preview part/);
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('does not throw for two parts of the same kind either', () => {
      // The likelier slip than one of each. Only the behaviour is asserted here:
      // `warn` is warn-once per message process-wide, so the sibling test above
      // has already consumed the warning.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        expect(() =>
          renderWithPreviewProvider(
            <Draggable.Root kind={testDragKind} data-testid="drag">
              <Draggable.Preview>
                <span>x</span>
              </Draggable.Preview>
              <Draggable.Preview>
                <span>y</span>
              </Draggable.Preview>
            </Draggable.Root>,
          ),
        ).not.toThrow();
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('renders a single preview part under Strict Mode', async () => {
      // Strict Mode double-invokes the declaring layout effect (declare → cleanup →
      // declare). Only the identity guard in the cleanup keeps that from tripping
      // the one-preview throw on mount.
      renderWithPreviewProvider(
        <React.StrictMode>
          <Draggable.Root kind={testDragKind} data-testid="drag">
            <Draggable.Preview>
              <span data-testid="preview">x</span>
            </Draggable.Preview>
          </Draggable.Root>
        </React.StrictMode>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);
      // eslint-disable-next-line testing-library/no-unnecessary-act -- flushing the detached fallback root, not the RTL tree
      await act(async () => {});

      expect(screen.getByTestId('preview')).toHaveTextContent('x');
    });

    it('swaps between the two preview parts in a single commit', async () => {
      // The outgoing part's cleanup has to run before the incoming part declares,
      // or a legitimate swap would trip the one-preview check.
      function Swappable(props: { cloned: boolean }) {
        return (
          <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
            {props.cloned ? (
              <Draggable.ClonedPreview />
            ) : (
              <Draggable.Preview>
                <span data-testid="preview">x</span>
              </Draggable.Preview>
            )}
          </Draggable.Root>
        );
      }

      const { setProps } = await renderDnd(<Swappable cloned={false} />);
      await setProps({ cloned: true });

      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // The clone carries the source's class; a host never does.
      expect(document.querySelector('.Card[data-drag-preview]')).not.toBeNull();
    });

    it('tracks arrow keys, and clamps to its modifiers, during a keyboard drag', async () => {
      function BoundedDraggable() {
        const boundsRef = React.useRef<HTMLDivElement>(null);
        return (
          <React.Fragment>
            <div ref={boundsRef} data-testid="bounds" />
            <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
              <Draggable.ClonedPreview
                modifiers={Draggable.restrictToElement(boundsRef)}
                offset="pointer"
              />
            </Draggable.Root>
          </React.Fragment>
        );
      }

      await renderDnd(<BoundedDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 40, 20);
      // A bounds element far narrower than the keyboard step, so one press overshoots it.
      screen.getByTestId('bounds').getBoundingClientRect = () => new DOMRect(0, 0, 40, 20);

      source.focus();
      fireEvent.keyDown(source, { key: ' ' });
      await flushRaf();

      const clone = document.querySelector('.Card[data-drag-preview]') as HTMLElement;
      expect(clone).not.toBeNull();
      clone.getBoundingClientRect = () => new DOMRect(0, 0, 10, 10);

      // A preview part's modifiers apply to keyboard drags the same way they
      // do to pointer drags; arrowing past the edge must pin rather than run off.
      fireEvent.keyDown(source, { key: 'ArrowRight' });
      await flushRaf();

      const x = Number(/^(-?[\d.]+)px/.exec(clone.style.translate)![1]);
      expect(x).toBeLessThanOrEqual(30);
    });

    it('swaps back to a Draggable.Preview in a single commit', async () => {
      // The reverse order: a host declaring after a clone's cleanup.
      function Swappable(props: { cloned: boolean }) {
        return (
          <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
            {props.cloned ? (
              <Draggable.ClonedPreview />
            ) : (
              <Draggable.Preview>
                <span data-testid="preview">x</span>
              </Draggable.Preview>
            )}
          </Draggable.Root>
        );
      }

      const { setProps } = await renderDnd(<Swappable cloned />);
      await setProps({ cloned: false });

      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      expect(screen.getByTestId('preview')).toHaveTextContent('x');
      expect(document.querySelector('.Card[data-drag-preview]')).toBeNull();
    });
  });

  describe('Draggable.Preview', () => {
    function DraggableWithPreview(props: {
      options?: Partial<Draggable.Root.Props>;
      preview?: Draggable.Preview.Props['children'];
      previewProps?: Omit<Draggable.Preview.Props, 'children'>;
      testId?: string;
    }) {
      const { options, preview, previewProps, testId = 'drag' } = props;
      return (
        <Draggable.Root kind={testDragKind} {...options} data-testid={testId}>
          <Draggable.Preview {...previewProps}>{preview}</Draggable.Preview>
        </Draggable.Root>
      );
    }

    it('renders the preview content into the overlay on dragstart', async () => {
      await renderDnd(<DraggableWithPreview preview={<span data-testid="preview">hello</span>} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      expect(screen.queryByTestId('preview')).toBeNull();

      fireEvent.dragStart(source);

      // The overlay committed synchronously inside the dragstart handler.
      expect(screen.getByTestId('preview')).toHaveTextContent('hello');
    });

    it('replaces the default clone rather than rendering alongside it', async () => {
      function CardWithPreview() {
        return (
          <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
            <Draggable.Preview>
              <span data-testid="preview">chip</span>
            </Draggable.Preview>
          </Draggable.Root>
        );
      }

      await renderDnd(<CardWithPreview />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      expect(screen.getByTestId('preview')).toBeInTheDocument();
      // No clone of the source: declaring content opts out of cloning entirely,
      // so the two previews can never both follow the pointer.
      expect(source.parentElement!.querySelector('.Card[data-drag-preview]')).toBeNull();
    });

    it('keeps the preview mounted during the drag and clears it when the drag ends', async () => {
      await renderDnd(<DraggableWithPreview preview={<span data-testid="preview">hello</span>} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);
      expect(screen.getByTestId('preview')).toBeInTheDocument();

      // The synthetic engine positions the preview each frame, so it stays
      // mounted for the whole active drag (no native snapshot-and-discard).
      await flushRaf();
      expect(screen.getByTestId('preview')).toBeInTheDocument();

      // Ending the drag clears the store, unmounting the overlay preview.
      cancel();
      await flushRaf();
      expect(screen.queryByTestId('preview')).toBeNull();
    });

    it('shows no preview at all when disabled', async () => {
      renderWithPreviewProvider(
        <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
          <Draggable.Preview disabled>
            <span data-testid="preview">x</span>
          </Draggable.Preview>
        </Draggable.Root>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);
      // eslint-disable-next-line testing-library/no-unnecessary-act -- would flush a fallback root, if one existed
      await act(async () => {});

      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      expect(screen.queryByTestId('preview')).toBeNull();
      expect(source).toHaveAttribute('data-dragging');
      // Nothing renders, so the content never needs a React root either.
      expect(document.querySelector('[data-base-ui-drag-overlay]')).toBeNull();
    });

    it('shows no preview at all when it has no children', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind} data-testid="drag" className="Card">
          <Draggable.Preview />
        </Draggable.Root>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // Declaring a preview opts out of the clone, so nothing to render means
      // nothing follows the pointer — not a fallback clone of the source.
      expect(document.querySelector('[data-drag-preview]')).toBeNull();
    });

    it('forwards its remaining props onto the rendered element', async () => {
      renderWithPreviewProvider(
        <Draggable.Root kind={testDragKind} data-testid="drag">
          <Draggable.Preview id="chip" data-chip="yes" aria-label="Card chip">
            <span data-testid="preview">chip</span>
          </Draggable.Preview>
        </Draggable.Root>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      const element = screen.getByTestId('preview').parentElement as HTMLElement;
      expect(element).toHaveAttribute('id', 'chip');
      expect(element).toHaveAttribute('data-chip', 'yes');
      expect(element).toHaveAttribute('aria-label', 'Card chip');
    });

    it('keeps the preview settings off the rendered element', async () => {
      const boundsRef = React.createRef<HTMLDivElement>();
      renderWithPreviewProvider(
        <Draggable.Root kind={testDragKind} data-testid="drag">
          <Draggable.Preview offset="pointer" modifiers={Draggable.restrictToElement(boundsRef)}>
            <span data-testid="preview">chip</span>
          </Draggable.Preview>
        </Draggable.Root>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // The settings belong to the engine; only the rendering props reach the DOM.
      // (`modifiers` is function-valued and never serializes to an attribute, so
      // its pluck is covered by the unknown-prop console error instead.)
      const element = screen.getByTestId('preview').parentElement as HTMLElement;
      expect(element).not.toHaveAttribute('offset');
      expect(element).not.toHaveAttribute('disabled');
    });

    it('reads React context from above the provider, without leaving the source', async () => {
      const ThemeContext = React.createContext('default');
      function PreviewReader() {
        const theme = React.useContext(ThemeContext);
        return <span data-testid="preview">{theme}</span>;
      }

      // The provider sits inside the theme context, so the content it renders
      // inherits it.
      await render(
        <ThemeContext.Provider value="dark">
          <DraggablePreviewProvider>
            <DraggableWithPreview preview={<PreviewReader />} />
          </DraggablePreviewProvider>
        </ThemeContext.Provider>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);
      expect(screen.getByTestId('preview')).toHaveTextContent('dark');
      // Both at once, which is the point of separating the two: the content reads
      // the app's context *and* the element stays where the app's contextual CSS
      // (`.dark .Card`) still matches it. Reaching for context used to cost this.
      expect(
        screen.getByTestId('preview').closest('[data-drag-preview]')!.parentElement!.parentElement,
      ).toBe(source.parentElement);
    });

    it.each([
      ['null', null],
      // The `{condition && <Chip />}` idiom: `false` is just as much "no content".
      ['false', false as unknown as null],
    ])('shows no preview when the children resolve to %s', async (_label, children) => {
      await renderDnd(<DraggableWithPreview preview={children} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // The sensor already built a host for the declaration; it must be torn down,
      // or an empty box follows the pointer for the whole drag.
      expect(document.querySelector('[data-drag-preview]')).toBeNull();
    });

    it('applies className to its own element, inside the engine-owned host', async () => {
      renderWithPreviewProvider(
        <DraggableWithPreview
          preview={<span data-testid="preview">chip</span>}
          previewProps={{ className: 'Ghost' }}
        />,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // `className` styles the part, not the host the engine transforms — so the
      // host keeps owning geometry while the consumer owns the look.
      const element = screen.getByTestId('preview').parentElement as HTMLElement;
      expect(element).toHaveClass('Ghost');
      expect(element.parentElement).toHaveAttribute('data-drag-preview', '');
    });

    it('renders the element the render prop returns, with no wrapper of its own', async () => {
      renderWithPreviewProvider(
        <DraggableWithPreview
          preview={<span data-testid="preview">chip</span>}
          previewProps={{ render: <section className="Chip" /> }}
        />,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      const element = screen.getByTestId('preview').parentElement as HTMLElement;
      expect(element.tagName).toBe('SECTION');
      expect(element).toHaveClass('Chip');
    });

    it('places the preview at the offset it declares', async () => {
      renderWithPreviewProvider(
        <DraggableWithPreview
          preview={<span data-testid="preview">x</span>}
          previewProps={{ offset: { x: 5, y: 6 } }}
        />,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(source, { clientX: 30, clientY: 40 });
      await dragOver(source, { clientX: 100, clientY: 120 });

      // Pointer (100, 120) minus the declared offset (5, 6) — not the `'source'`
      // default, which would have anchored to the grab point.
      const host = document.querySelector('[data-drag-preview]') as HTMLElement;
      expect(host.style.translate).toBe('95px 114px');
    });

    it('builds the preview from the drag payload when the children are a function', async () => {
      renderWithPreviewProvider(
        <DraggableWithPreview
          preview={({ source, mode }) => (
            <span data-testid="preview">{`${mode}:${source.label}`}</span>
          )}
          options={{ label: 'card-1' }}
        />,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);
      // eslint-disable-next-line testing-library/no-unnecessary-act -- flushing the detached fallback root, not the RTL tree
      await act(async () => {});

      expect(screen.getByTestId('preview')).toHaveTextContent('pointer:card-1');
    });

    it('invokes an offset callback with the overlay element', async () => {
      const offsetSpy = vi.fn((_params: { container: HTMLElement }) => ({ x: 10, y: 20 }));
      await renderDnd(
        <DraggableWithPreview
          preview={<span>preview</span>}
          previewProps={{ offset: offsetSpy }}
        />,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // Exactly once, and against the element the content actually rendered into —
      // a consumer centering on `container.offsetWidth` must not measure some other box.
      expect(offsetSpy).toHaveBeenCalledTimes(1);
      expect(offsetSpy.mock.calls[0][0].container).toBe(
        document.querySelector('[data-drag-preview]'),
      );
    });

    it('applies the offset callback result to the overlay position', async () => {
      await renderDnd(
        <DraggableWithPreview
          preview={<span data-testid="preview">x</span>}
          previewProps={{ offset: () => ({ x: 10, y: 20 }) }}
        />,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(source, { clientX: 100, clientY: 100 });
      await dragOver(source, { clientX: 80, clientY: 90 });

      const overlay = screen.getByTestId('preview').closest('[data-drag-preview]') as HTMLElement;
      // Pointer (80, 90) minus the returned offset (10, 20).
      expect(overlay.style.translate).toBe('70px 70px');
    });

    it('exposes the source size as CSS variables on the overlay element', async () => {
      await renderDnd(<DraggableWithPreview preview={<span data-testid="preview">x</span>} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // The documented `--drag-source-*` vars must be set on the overlay the
      // React preview renders into (not only the vanilla synthetic container).
      const overlay = screen.getByTestId('preview').closest('[data-drag-preview]') as HTMLElement;
      expect(overlay.style.getPropertyValue('--drag-source-width')).toBe('200px');
      expect(overlay.style.getPropertyValue('--drag-source-height')).toBe('100px');
    });

    it('renders the preview for a keyboard drag too', async () => {
      await renderDnd(<DraggableWithPreview preview={<span data-testid="preview">kbd</span>} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      // Keyboard pick-up publishes its own preview handle, so the overlay
      // adopts it just like a pointer drag.
      source.focus();
      fireEvent.keyDown(source, { key: ' ' });
      await flushRaf();

      expect(screen.getByTestId('preview')).toHaveTextContent('kbd');
    });

    it('clamps the preview to a modifiers element when the pointer leaves it', async () => {
      function BoundedDraggable() {
        const boundsRef = React.useRef<HTMLDivElement>(null);
        return (
          <React.Fragment>
            <div ref={boundsRef} data-testid="bounds" />
            <Draggable.Root kind={testDragKind} data-testid="drag">
              {/* Pin the preview to the pointer so the assertions below read the
                  clamp alone, not the grab offset the `'source'` default would add. */}
              <Draggable.Preview
                modifiers={Draggable.restrictToElement(boundsRef)}
                offset="pointer"
              >
                <span data-testid="preview">x</span>
              </Draggable.Preview>
            </Draggable.Root>
          </React.Fragment>
        );
      }

      await renderDnd(<BoundedDraggable />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      // A 200×200 bounds element anchored at the viewport origin.
      screen.getByTestId('bounds').getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);

      await lift(source, { clientX: 10, clientY: 10 });

      // jsdom doesn't lay out, so stub the preview's measured size the clamp reads.
      const overlay = screen.getByTestId('preview').closest('[data-drag-preview]') as HTMLElement;
      overlay.getBoundingClientRect = () => new DOMRect(0, 0, 50, 30);

      // Drag far past the bottom-right corner: the preview sticks to the edge
      // (200 − preview size: 200−50=150, 200−30=170) instead of following out.
      await dragOver(source, { clientX: 500, clientY: 500 });
      expect(overlay.style.translate).toBe('150px 170px');

      // Back inside the bounds, the preview tracks the pointer normally.
      await dragOver(source, { clientX: 80, clientY: 90 });
      expect(overlay.style.translate).toBe('80px 90px');
    });

    it('renders the preview next to the source, so the app CSS applies to it', async () => {
      await renderDnd(<DraggableWithPreview preview={<span data-testid="preview">x</span>} />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // The content is portaled into an engine-owned host that sits in the
      // source's own parent — the same place the default clone goes. A provider
      // supplies the React tree, and relocates nothing.
      const host = screen.getByTestId('preview').closest('[data-drag-preview]') as HTMLElement;
      expect(host).not.toBeNull();
      expect(host.parentElement!.parentElement).toBe(source.parentElement);
    });

    it('injects the preview into the part`s own container', async () => {
      function Wiring() {
        const containerRef = React.useRef<HTMLDivElement>(null);
        return (
          <React.Fragment>
            <div ref={containerRef} data-testid="container" />
            <DraggableWithPreview
              preview={<span data-testid="preview">x</span>}
              previewProps={{ container: containerRef }}
            />
          </React.Fragment>
        );
      }

      await renderDnd(<Wiring />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // `container` is the only thing that relocates a preview — and it is a part
      // prop now, not imperative-only.
      const host = screen.getByTestId('preview').closest('[data-drag-preview]') as HTMLElement;
      expect(host.parentElement!.parentElement).toBe(screen.getByTestId('container'));
    });

    it('resolves a container callback from the source element', async () => {
      function Wiring() {
        return (
          <div data-testid="board">
            <DraggableWithPreview
              preview={<span data-testid="preview">x</span>}
              previewProps={{
                container: (source: HTMLElement) => source.closest('[data-testid="board"]'),
              }}
            />
          </div>
        );
      }

      await renderDnd(<Wiring />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // The callback form reaches a container the caller has no ref to.
      const host = screen.getByTestId('preview').closest('[data-drag-preview]') as HTMLElement;
      expect(host.parentElement!.parentElement).toBe(screen.getByTestId('board'));
    });

    it('injects into the provider`s container by default, and the part`s over it', async () => {
      function Wiring({ partContainer }: { partContainer?: boolean }) {
        const fromProvider = React.useRef<HTMLDivElement>(null);
        const fromPart = React.useRef<HTMLDivElement>(null);
        return (
          <React.Fragment>
            <div ref={fromProvider} data-testid="from-provider" />
            <div ref={fromPart} data-testid="from-part" />
            <DraggablePreviewProvider container={fromProvider}>
              <DraggableWithPreview
                preview={<span data-testid="preview">x</span>}
                previewProps={partContainer ? { container: fromPart } : undefined}
              />
            </DraggablePreviewProvider>
          </React.Fragment>
        );
      }

      const { rerender } = await render(<Wiring />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      // A provider-level container relocates every descendant's preview, with no
      // per-item prop to thread down.
      fireEvent.dragStart(source);
      expect(
        screen.getByTestId('preview').closest('[data-drag-preview]')!.parentElement!.parentElement,
      ).toBe(screen.getByTestId('from-provider'));
      await cancel();

      await rerender(<Wiring partContainer />);
      const next = screen.getByTestId('drag');
      next.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(next);
      expect(
        screen.getByTestId('preview').closest('[data-drag-preview]')!.parentElement!.parentElement,
      ).toBe(screen.getByTestId('from-part'));
    });

    it('relocates the default clone through a provider container too', async () => {
      function Wiring() {
        const containerRef = React.useRef<HTMLDivElement>(null);
        return (
          <React.Fragment>
            <div ref={containerRef} data-testid="container" />
            <DraggablePreviewProvider container={containerRef}>
              <Draggable.Root kind={testDragKind} data-testid="drag" className="Card" />
            </DraggablePreviewProvider>
          </React.Fragment>
        );
      }

      await render(<Wiring />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      // The subtree default reaches the engine-built clone as well as content.
      const clone = document.querySelector('.Card[data-drag-preview]') as HTMLElement;
      expect(clone).not.toBeNull();
      expect(clone.parentElement!.parentElement).toBe(screen.getByTestId('container'));
    });

    it('resolves the provider container that arrives after mount, at drag start', async () => {
      // The provider carries `container` through a ref read at drag start, so a
      // container the app only learns later (a `useState`-held element) must
      // still reach the next drag — nothing re-registers on provider re-render.
      function Wiring() {
        const [container, setContainer] = React.useState<HTMLElement | null>(null);
        return (
          <React.Fragment>
            <div ref={setContainer} data-testid="late-container" />
            <DraggablePreviewProvider container={container ?? undefined}>
              <Draggable.Root kind={testDragKind} data-testid="drag" className="Card" />
            </DraggablePreviewProvider>
          </React.Fragment>
        );
      }

      await render(<Wiring />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      const clone = document.querySelector('.Card[data-drag-preview]') as HTMLElement;
      expect(clone.parentElement!.parentElement).toBe(screen.getByTestId('late-container'));
    });

    it('keeps the provider context stable under an inline container callback', async () => {
      // An inline callback is a new identity every render; the provider must not
      // let it churn the context value, or every memoized row below would
      // re-render whenever the provider does.
      let rowCommits = 0;
      const Row = React.memo(function Row() {
        rowCommits += 1;
        return <Draggable.Root kind={testDragKind} data-testid="drag" />;
      });

      function Wiring() {
        const [, force] = React.useState(0);
        return (
          <React.Fragment>
            <button type="button" data-testid="force" onClick={() => force((c) => c + 1)} />
            <DraggablePreviewProvider container={(source) => source.parentElement}>
              <Row />
            </DraggablePreviewProvider>
          </React.Fragment>
        );
      }

      await render(<Wiring />);
      const countAfterMount = rowCommits;

      fireEvent.click(screen.getByTestId('force'));

      expect(rowCommits).toBe(countAfterMount);
    });
  });

  describe('imperative dragPreview', () => {
    // An imperatively registered source has no component to hold a
    // `Draggable.Preview`, so it declares the preview on the registration itself.
    function ImperativeCard() {
      const engine = useDragEngine();
      const elementRef = React.useRef<HTMLDivElement>(null);
      React.useEffect(
        () =>
          engine.registerDraggable(elementRef.current!, () => ({
            kind: cardKind,
            payload: () => ({ id: 'a' }),
            dragPreview: { render: () => <span data-testid="preview">chip</span> },
          })),
        [engine],
      );
      return <div ref={elementRef} data-testid="drag" className="Card" />;
    }

    it('renders the preview for an imperatively registered source', async () => {
      await render(
        <DraggablePreviewProvider>
          <ImperativeCard />
        </DraggablePreviewProvider>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      expect(screen.getByTestId('preview')).toBeInTheDocument();
      // Exactly one preview: the declaration must suppress the clone, not race it.
      expect(document.querySelectorAll('[data-drag-preview]')).toHaveLength(1);
      expect(document.querySelector('.Card[data-drag-preview]')).toBeNull();
    });

    it('undoes a failed imperative preview pickup when no PreviewProvider exists', async () => {
      await render(
        <React.Fragment>
          <ImperativeCard />
          <Draggable.Root kind={testDragKind} data-testid="fallback" />
        </React.Fragment>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      const reportedError: { current: Error | null } = { current: null };
      const onError = (event: ErrorEvent) => {
        reportedError.current = event.error;
        event.preventDefault();
      };
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      window.addEventListener('error', onError);
      try {
        fireEvent.dragStart(source);
      } finally {
        window.removeEventListener('error', onError);
        consoleErrorSpy.mockRestore();
      }
      expect(reportedError.current?.message).toMatch(/Draggable\.PreviewProvider/);
      expect(dragSessionStore.getSnapshot()).toBeNull();
      expect(source).not.toHaveAttribute('data-dragging');
      expect(document.querySelector('[data-drag-preview]')).toBeNull();

      const fallback = screen.getByTestId('fallback');
      fallback.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      fireEvent.dragStart(fallback);
      expect(dragSessionStore.getSnapshot()?.source.element).toBe(fallback);
    });

    it('still honours dragPreview.offset for an imperative preview', async () => {
      function OffsetCard() {
        const engine = useDragEngine();
        const elementRef = React.useRef<HTMLDivElement>(null);
        React.useEffect(
          () =>
            engine.registerDraggable(elementRef.current!, () => ({
              kind: cardKind,
              payload: () => ({ id: 'a' }),
              dragPreview: {
                render: () => <span data-testid="preview">chip</span>,
                offset: { x: 5, y: 6 },
              },
            })),
          [engine],
        );
        return <div ref={elementRef} data-testid="drag" />;
      }

      await render(
        <DraggablePreviewProvider>
          <OffsetCard />
        </DraggablePreviewProvider>,
      );
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(source, { clientX: 30, clientY: 40 });
      await dragOver(source, { clientX: 100, clientY: 120 });

      const host = screen.getByTestId('preview').closest('[data-drag-preview]') as HTMLElement;
      expect(host.style.translate).toBe('95px 114px');
    });

    it('shows no preview at all with dragPreview.disabled', async () => {
      function DisabledCard() {
        const engine = useDragEngine();
        const elementRef = React.useRef<HTMLDivElement>(null);
        React.useEffect(
          () =>
            engine.registerDraggable(elementRef.current!, () => ({
              kind: cardKind,
              payload: () => ({ id: 'a' }),
              dragPreview: { disabled: true },
            })),
          [engine],
        );
        return <div ref={elementRef} data-testid="drag" className="Card" />;
      }

      await render(<DisabledCard />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      fireEvent.dragStart(source);

      expect(document.querySelector('[data-drag-preview]')).toBeNull();
      expect(source).toHaveAttribute('data-dragging');
    });

    it('clamps an imperative preview to dragPreview.modifiers', async () => {
      function BoundedCard() {
        const engine = useDragEngine();
        const elementRef = React.useRef<HTMLDivElement>(null);
        const boundsRef = React.useRef<HTMLDivElement>(null);
        React.useEffect(
          () =>
            engine.registerDraggable(elementRef.current!, () => ({
              kind: cardKind,
              payload: () => ({ id: 'a' }),
              dragPreview: {
                modifiers: Draggable.restrictToElement(boundsRef),
                offset: 'pointer',
              },
            })),
          [engine],
        );
        return (
          <React.Fragment>
            <div ref={boundsRef} data-testid="bounds" />
            <div ref={elementRef} data-testid="drag" className="Card" />
          </React.Fragment>
        );
      }

      await render(<BoundedCard />);
      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      screen.getByTestId('bounds').getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);

      await lift(source, { clientX: 10, clientY: 10 });

      const clone = document.querySelector('[data-drag-preview]') as HTMLElement;
      clone.getBoundingClientRect = () => new DOMRect(0, 0, 50, 30);

      await dragOver(source, { clientX: 500, clientY: 500 });
      expect(clone.style.translate).toBe('150px 170px');
    });

    it('injects the clone into an explicit dragPreview.container', async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      try {
        function ContainedCard() {
          const engine = useDragEngine();
          const elementRef = React.useRef<HTMLDivElement>(null);
          React.useEffect(
            () =>
              engine.registerDraggable(elementRef.current!, () => ({
                kind: cardKind,
                payload: () => ({ id: 'a' }),
                dragPreview: { container: host },
              })),
            [engine],
          );
          return <div ref={elementRef} data-testid="drag" className="Card" />;
        }

        await render(<ContainedCard />);
        const source = screen.getByTestId('drag');
        source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

        fireEvent.dragStart(source);

        expect(host.querySelector('[data-drag-preview]')).not.toBeNull();
      } finally {
        host.remove();
      }
    });

    it('injects the preview into an explicit dragPreview.container over the PreviewProvider', async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      try {
        function ContainedCard() {
          const engine = useDragEngine();
          const elementRef = React.useRef<HTMLDivElement>(null);
          React.useEffect(
            () =>
              engine.registerDraggable(elementRef.current!, () => ({
                kind: cardKind,
                payload: () => ({ id: 'a' }),
                dragPreview: {
                  render: () => <span data-testid="preview">chip</span>,
                  container: host,
                },
              })),
            [engine],
          );
          return <div ref={elementRef} data-testid="drag" />;
        }

        await render(
          <DraggablePreviewProvider>
            <ContainedCard />
          </DraggablePreviewProvider>,
        );
        const source = screen.getByTestId('drag');
        source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

        fireEvent.dragStart(source);

        expect(host.contains(screen.getByTestId('preview'))).toBe(true);
      } finally {
        host.remove();
      }
    });
  });

  describe('localization', () => {
    function liveRegionText(): string {
      return document.querySelector('[aria-live="polite"]')?.textContent ?? '';
    }

    it('localizes aria-roledescription and the keyboard instructions', async () => {
      await renderDnd(<TestDraggable />, { wrapper: FrenchProvider });
      const el = screen.getByTestId('drag');
      expect(el.getAttribute('aria-roledescription')).toBe('déplaçable');
      const describedBy = el.getAttribute('aria-describedby');
      expect(document.getElementById(describedBy!)?.textContent).toContain('Échap pour annuler');
    });

    it('keeps a custom ariaRoleDescription over the localized default', async () => {
      await renderDnd(<TestDraggable options={{ ariaRoleDescription: 'carte déplaçable' }} />, {
        wrapper: FrenchProvider,
      });
      expect(screen.getByTestId('drag').getAttribute('aria-roledescription')).toBe(
        'carte déplaçable',
      );
    });

    it('announces a keyboard drag in the provider language', async () => {
      await renderDnd(<TestDraggable />, { wrapper: FrenchProvider });
      const el = screen.getByTestId('drag');
      el.focus();
      fireEvent.keyDown(el, { key: ' ' });
      expect(liveRegionText()).toBe(
        'test-draggable saisi. Utilisez les flèches pour déplacer, Espace ou Entrée pour déposer, Échap pour annuler.',
      );

      await flushRaf();
      fireEvent.keyDown(el, { key: 'Escape' });
      // `canceled` is not overridden, so it falls back to the French default.
      expect(liveRegionText()).toBe('Déplacement de test-draggable annulé.');
    });

    it('routes the moved announcement through the locale default', async () => {
      // The stock locales stay silent on `moved` (they only speak with a
      // position phrase), so a locale overriding `dragAnnouncementMoved` proves
      // the React wrapper falls back to the locale default rather than
      // hard-coding silence.
      const translations = {
        ...frFR,
        dragAnnouncementMoved: ({ label }: { label: string; positionPhrase: string | null }) =>
          `${label} en mouvement.`,
      };
      function Provider({ children }: { children?: React.ReactNode }) {
        return <LocalizationProvider translations={translations}>{children}</LocalizationProvider>;
      }

      await renderDnd(<TestDraggable />, { wrapper: Provider });
      const el = screen.getByTestId('drag');
      el.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      el.focus();
      fireEvent.keyDown(el, { key: ' ' });
      await flushRaf();

      fireEvent.keyDown(el, { key: 'ArrowDown' });
      await flushRaf();
      // Move announcements are debounced (held arrow keys would flood the queue).
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 300);
        });
      });

      expect(liveRegionText()).toBe('test-draggable en mouvement.');

      fireEvent.keyDown(el, { key: 'Escape' });
    });

    it('falls back to the localized generic label when the draggable has none', async () => {
      await renderDnd(<TestDraggable options={{ label: undefined }} />, {
        wrapper: FrenchProvider,
      });
      const el = screen.getByTestId('drag');
      el.focus();
      fireEvent.keyDown(el, { key: ' ' });
      expect(liveRegionText()).toBe(
        'élément saisi. Utilisez les flèches pour déplacer, Espace ou Entrée pour déposer, Échap pour annuler.',
      );
    });

    it('merges a consumer announcement override under the localized defaults', async () => {
      await renderDnd(
        <TestDraggable options={{ keyboardAnnouncements: { pickedUp: () => 'Ramassé' } }} />,
        {
          wrapper: FrenchProvider,
        },
      );
      const el = screen.getByTestId('drag');
      el.focus();
      fireEvent.keyDown(el, { key: ' ' });
      expect(liveRegionText()).toBe('Ramassé');

      await flushRaf();
      fireEvent.keyDown(el, { key: 'Escape' });
      // The non-overridden cancel still uses the French default.
      expect(liveRegionText()).toBe('Déplacement de test-draggable annulé.');
    });

    it('gives draggables with different instructions their own node', async () => {
      function Mixed() {
        return (
          <React.Fragment>
            <DraggablePreviewProvider>
              <TestDraggable testId="english" />
            </DraggablePreviewProvider>
            <LocalizationProvider translations={frFR}>
              <DraggablePreviewProvider>
                <TestDraggable testId="french" />
              </DraggablePreviewProvider>
            </LocalizationProvider>
          </React.Fragment>
        );
      }
      await render(<Mixed />);
      // Each handle references its own language's instructions node rather than
      // sharing (and clobbering) a single one.
      const englishId = screen.getByTestId('english').getAttribute('aria-describedby');
      const frenchId = screen.getByTestId('french').getAttribute('aria-describedby');
      expect(englishId).not.toBe(frenchId);
      expect(document.getElementById(englishId!)?.textContent).toContain('arrow keys');
      expect(document.getElementById(frenchId!)?.textContent).toContain('Échap pour annuler');
    });
  });

  describe('server rendering', () => {
    const toServerHtml = (node: React.ReactElement) => ReactDOMServer.renderToString(node);

    it('emits no tabIndex or role until the mount commit resolves whether a handle exists', () => {
      // Handles announce themselves only through a client ref callback, so the
      // server cannot know whether one exists. Emitting `tabIndex={0}` there
      // would put a second tab stop next to every SSR'd handle; emitting nothing
      // means a handle-less draggable is not keyboard-reachable until hydration.
      // That trade-off is deliberate — the docs tell SSR apps to pass `tabIndex`
      // and `role` explicitly — and this pins which side of it we are on.
      expect(
        toServerHtml(<Draggable.Root kind={testDragKind} data-testid="source" />),
      ).not.toContain('tabindex');
      expect(
        toServerHtml(<Draggable.Root kind={testDragKind} data-testid="source" />),
      ).not.toContain('role=');
    });

    it('honours an explicit tabIndex and role in the server HTML', () => {
      const withExplicitProps = (
        <Draggable.Root kind={testDragKind} tabIndex={0} role="button" data-testid="source" />
      );

      expect(toServerHtml(withExplicitProps)).toContain('tabindex="0"');
      expect(toServerHtml(withExplicitProps)).toContain('role="button"');
    });

    it.each([
      ['without a handle', false],
      ['with a handle', true],
    ])('hydrates %s without a mismatch and resolves one tab stop', (_name, withHandle) => {
      const node = (
        <Draggable.Root kind={testDragKind} data-testid="source">
          {withHandle ? <Draggable.Handle data-testid="handle" /> : null}
        </Draggable.Root>
      );
      const container = document.createElement('div');
      container.innerHTML = toServerHtml(node);
      document.body.appendChild(container);
      const recoverableErrors: unknown[] = [];
      let root!: ReactDOMClient.Root;
      act(() => {
        root = ReactDOMClient.hydrateRoot(container, node, {
          onRecoverableError: (error) => recoverableErrors.push(error),
        });
      });

      try {
        expect(recoverableErrors).toEqual([]);
        const source = container.querySelector<HTMLElement>('[data-testid="source"]')!;
        const handle = container.querySelector<HTMLElement>('[data-testid="handle"]');
        expect(Array.from(container.querySelectorAll('[tabindex="0"]'))).toEqual([
          withHandle ? handle : source,
        ]);
      } finally {
        act(() => root.unmount());
        container.remove();
      }
    });
  });

  describe('parts outside the root', () => {
    // The error exists so a misplaced part fails loudly instead of silently
    // configuring nothing; nothing pinned that it actually fires.
    it.each([
      ['Draggable.Handle', <Draggable.Handle key="h" />],
      ['Draggable.ClonedPreview', <Draggable.ClonedPreview key="c" />],
    ])('throws when %s is rendered outside Draggable.Root', (_name, element) => {
      // React logs the uncaught render error through console.error in dev.
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        expect(() => rtlRender(element)).toThrow(/DraggableRootContext is missing/);
      } finally {
        errorSpy.mockRestore();
      }
    });
  });
});
