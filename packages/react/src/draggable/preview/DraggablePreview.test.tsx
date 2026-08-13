import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen, render as rtlRender } from '@testing-library/react';
import { act } from '@mui/internal-test-utils';
import { testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { setupDragEngineTests, lift, flushRaf } from '../../../test/dnd';
import { DraggablePreviewProvider } from '../preview-provider/DraggablePreviewProvider';

setupDragEngineTests();

describe('Draggable.Preview', () => {
  it('keeps the engine settings props off the DOM element', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    try {
      rtlRender(
        <DraggablePreviewProvider>
          <Draggable.Root kind={testDragKind} data-testid="drag">
            <Draggable.Preview
              data-testid="preview"
              modifiers={({ point }) => point}
              offset={{ x: 0, y: 0 }}
              container={container}
            >
              Preview
            </Draggable.Preview>
          </Draggable.Root>
        </DraggablePreviewProvider>,
      );

      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      fireEvent.dragStart(source);

      // The settings belong to the engine and are plucked from the spread props; a
      // missed pluck would land `offset` or `container` here as an attribute.
      // Function-valued settings like `modifiers` never serialize to attributes, so
      // their pluck is guarded by React's unknown-prop console error (which fails
      // the test) and the `Required<…>`-mapped declaration in `useDeclaredPreview`
      // instead.
      const preview = screen.getByTestId('preview');
      expect(preview.hasAttribute('offset')).toBe(false);
      expect(preview.hasAttribute('container')).toBe(false);
    } finally {
      container.remove();
    }
  });

  it('never resolves the container callback for a disabled preview', () => {
    const container = vi.fn(() => document.body);
    rtlRender(
      <DraggablePreviewProvider>
        <Draggable.Root kind={testDragKind} data-testid="drag">
          <Draggable.Preview disabled container={container}>
            Preview
          </Draggable.Preview>
        </Draggable.Root>
      </DraggablePreviewProvider>,
    );

    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    fireEvent.dragStart(source);

    // `disabled` means there is no preview element to inject, so resolving the
    // reference anyway would run consumer code for nothing.
    expect(container).not.toHaveBeenCalled();
    expect(document.querySelector('[data-drag-preview]')).toBeNull();
  });

  it('does not call a typed render callback for a mismatched source kind', () => {
    const otherKind = Draggable.createKind('other-preview-kind');
    const renderPreview = vi.fn(() => 'Preview');
    rtlRender(
      <DraggablePreviewProvider>
        <Draggable.Root kind={testDragKind} data-testid="drag">
          <Draggable.Preview kind={otherKind}>{renderPreview}</Draggable.Preview>
        </Draggable.Root>
      </DraggablePreviewProvider>,
    );

    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    fireEvent.dragStart(source);

    expect(renderPreview).not.toHaveBeenCalled();
    expect(document.querySelector('[data-drag-preview]')).toBeNull();
  });

  it('throws when the nearest PreviewProvider does not wrap the Draggable.Root', () => {
    // The engine publishes through the provider seen from the root's position; a
    // provider mounted between the root and the part can never receive the
    // content, and the drag would fail mid-gesture instead of at render.
    // React 18's dev error path logs the uncaught render error via console.error.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() =>
        rtlRender(
          <DraggablePreviewProvider>
            <Draggable.Root kind={testDragKind}>
              <DraggablePreviewProvider>
                <Draggable.Preview>Preview</Draggable.Preview>
              </DraggablePreviewProvider>
            </Draggable.Root>
          </DraggablePreviewProvider>,
        ),
      ).toThrow(/is inside its <Draggable\.Root>/);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('accepts a provider that wraps the Draggable.Root', () => {
    expect(() =>
      rtlRender(
        <DraggablePreviewProvider>
          <Draggable.Root kind={testDragKind}>
            <Draggable.Preview>Preview</Draggable.Preview>
          </Draggable.Root>
        </DraggablePreviewProvider>,
      ),
    ).not.toThrow();
  });

  it('keeps the preview alive and moving after the source unmounts mid-drag', async () => {
    // The declaration indirection exists so the preview outlives the source
    // component: a virtualizer or a live reorder can unmount the dragged row
    // mid-drag, and the overlay-rendered content must survive it.
    function Fixture(props: { withRow: boolean }) {
      return (
        <DraggablePreviewProvider>
          {props.withRow ? (
            <Draggable.Root kind={testDragKind} data-testid="drag">
              <Draggable.Preview>Preview content</Draggable.Preview>
            </Draggable.Root>
          ) : null}
        </DraggablePreviewProvider>
      );
    }

    const { rerender } = rtlRender(<Fixture withRow />);
    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    await lift(source, { clientX: 10, clientY: 10 });
    expect(screen.getByText('Preview content')).toBeInTheDocument();

    rerender(<Fixture withRow={false} />);
    expect(screen.queryByTestId('drag')).toBeNull();
    expect(screen.getByText('Preview content')).toBeInTheDocument();

    // The drag is still live: a further move keeps repositioning the preview.
    // Dispatched on `document` — the bridge's `dragover` replay targets the
    // (now detached) source, which the engine's document-level move listener
    // can no longer hear.
    const host = document.querySelector('[data-drag-preview]') as HTMLElement;
    const before = host.style.translate;
    await act(async () => {
      document.dispatchEvent(
        new PointerEvent('pointermove', {
          pointerType: 'mouse',
          pointerId: 1,
          clientX: 150,
          clientY: 120,
          button: -1,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    await flushRaf();

    expect(screen.getByText('Preview content')).toBeInTheDocument();
    expect(host.style.translate).toMatch(/px/);
    expect(host.style.translate).not.toBe(before);
  });

  it("drops another provider's stale preview when a drop and the next pickup share one flush", () => {
    // Each provider owns its own store, so a new drag can only clear the store it
    // resolves — never the one the *previous* source published into. When the drop
    // and the next pickup land in the same React flush, the renderer's
    // clear-on-null effect never runs either, so without the global
    // last-published slot provider A's content stays on screen for B's whole drag.
    rtlRender(
      <React.Fragment>
        <DraggablePreviewProvider>
          <Draggable.Root kind={testDragKind} data-testid="a">
            <Draggable.Preview>Preview A</Draggable.Preview>
          </Draggable.Root>
        </DraggablePreviewProvider>
        <DraggablePreviewProvider>
          <Draggable.Root kind={testDragKind} data-testid="b">
            <Draggable.Preview>Preview B</Draggable.Preview>
          </Draggable.Root>
        </DraggablePreviewProvider>
      </React.Fragment>,
    );

    const a = screen.getByTestId('a');
    const b = screen.getByTestId('b');
    a.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    b.getBoundingClientRect = () => new DOMRect(0, 200, 200, 100);

    fireEvent.dragStart(a);
    expect(screen.getByText('Preview A')).toBeInTheDocument();

    // End A and start B without an intervening commit. Dispatched raw rather than
    // through `fireEvent`, which flushes between calls — the single flush is the
    // whole point of the test.
    act(() => {
      a.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true }));
      b.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true }));
    });

    expect(screen.queryByText('Preview A')).toBeNull();
    expect(screen.getByText('Preview B')).toBeInTheDocument();
  });
});
