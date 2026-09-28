import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, render as rtlRender } from '@testing-library/react';
import { act } from '@mui/internal-test-utils';
import { testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { setupDragEngineTests, lift, flushRaf, fireDrag } from '../../../test/dnd';
import { DraggableProvider } from '../DraggableProvider';

setupDragEngineTests();

describe('Draggable.Preview', () => {
  it.each([undefined, null, false])('clones the source with static %s children', (children) => {
    rtlRender(
      <DraggableProvider>
        <Draggable.Root data-testid="drag">
          Source content
          <Draggable.Preview>{children}</Draggable.Preview>
        </Draggable.Root>
      </DraggableProvider>,
    );
    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    fireDrag.dragStart(source);
    expect(document.querySelector('[data-drag-preview]')).toHaveTextContent('Source content');
  });

  it.each([null, false])('hides the preview when a render function returns %s', (children) => {
    rtlRender(
      <DraggableProvider>
        <Draggable.Root data-testid="drag">
          Source content
          <Draggable.Preview>{() => children}</Draggable.Preview>
        </Draggable.Root>
      </DraggableProvider>,
    );
    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    fireDrag.dragStart(source);
    expect(document.querySelector('[data-drag-preview]')).toBeNull();
  });

  it.each([
    ['className', { className: 'preview' }],
    ['style', { style: { color: 'red' } }],
    ['render', { render: <span /> }],
  ])('warns when %s would be ignored by the clone', (_name, props) => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      rtlRender(
        <DraggableProvider>
          <Draggable.Root>
            <Draggable.Preview {...props} />
          </Draggable.Root>
        </DraggableProvider>,
      );
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('these props are ignored'));
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('does not warn about render when custom children are provided', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      rtlRender(
        <DraggableProvider>
          <Draggable.Root>
            <Draggable.Preview render={<span />}>Preview</Draggable.Preview>
          </Draggable.Root>
        </DraggableProvider>,
      );
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('keeps the engine settings props off the DOM element', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    try {
      rtlRender(
        <DraggableProvider>
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
        </DraggableProvider>,
      );

      const source = screen.getByTestId('drag');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
      fireDrag.dragStart(source);

      // The settings are removed from the spread props before rendering. A missed
      // one would show up here as an `offset` or `container` attribute.
      // Function-valued settings like `modifiers` never serialize to attributes, so
      // React's unknown-prop console error, which fails the test, covers them.
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
      <DraggableProvider>
        <Draggable.Root kind={testDragKind} data-testid="drag">
          <Draggable.Preview disabled container={container}>
            Preview
          </Draggable.Preview>
        </Draggable.Root>
      </DraggableProvider>,
    );

    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    fireDrag.dragStart(source);

    // With `disabled` there is no preview element to insert, so resolving the
    // reference would run consumer code for nothing.
    expect(container).not.toHaveBeenCalled();
    expect(document.querySelector('[data-drag-preview]')).toBeNull();
  });

  it('does not call a typed render callback for a mismatched source kind', () => {
    const otherKind = Draggable.createKind('other-preview-kind');
    const renderPreview = vi.fn(() => 'Preview');
    rtlRender(
      <DraggableProvider>
        <Draggable.Root kind={testDragKind} data-testid="drag">
          <Draggable.Preview kind={otherKind}>{renderPreview}</Draggable.Preview>
        </Draggable.Root>
      </DraggableProvider>,
    );

    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    fireDrag.dragStart(source);

    expect(renderPreview).not.toHaveBeenCalled();
    expect(document.querySelector('[data-drag-preview]')).toBeNull();
  });

  it('throws when the nearest Draggable.Provider does not wrap the Draggable.Root', () => {
    // The engine publishes through the provider above the root. A provider between
    // the root and the part never receives the content, and without the render
    // error the drag would fail mid-gesture. React 18 in dev also logs the uncaught
    // render error through `console.error`.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() =>
        rtlRender(
          <DraggableProvider>
            <Draggable.Root kind={testDragKind}>
              <DraggableProvider>
                <Draggable.Preview>Preview</Draggable.Preview>
              </DraggableProvider>
            </Draggable.Root>
          </DraggableProvider>,
        ),
      ).toThrow(/is inside its <Draggable\.Root>/);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('accepts a provider that wraps the Draggable.Root', () => {
    expect(() =>
      rtlRender(
        <DraggableProvider>
          <Draggable.Root kind={testDragKind}>
            <Draggable.Preview>Preview</Draggable.Preview>
          </Draggable.Root>
        </DraggableProvider>,
      ),
    ).not.toThrow();
  });

  it('keeps the preview alive and moving after the source unmounts mid-drag', async () => {
    // The part declares the preview instead of rendering it in place, so the
    // preview outlives the source component. A virtualizer or a live reorder can
    // unmount the dragged row mid-drag, and the overlay content must survive it.
    function Fixture(props: { withRow: boolean }) {
      return (
        <DraggableProvider>
          {props.withRow ? (
            <Draggable.Root kind={testDragKind} data-testid="drag">
              <Draggable.Preview>Preview content</Draggable.Preview>
            </Draggable.Root>
          ) : null}
        </DraggableProvider>
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

    // The drag is still live, so another move repositions the preview. The move
    // goes to `document` because `fireDrag` dispatches on the source, which is now
    // detached and out of reach of the engine's document-level listener.
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
    // Every provider's overlay reads one shared store and renders only what was
    // published with its own context. The drop clears A's content and B's pickup
    // publishes B's. When both land in the same React flush, provider A must still
    // see the change, or its content stays on screen for all of B's drag.
    rtlRender(
      <React.Fragment>
        <DraggableProvider>
          <Draggable.Root kind={testDragKind} data-testid="a">
            <Draggable.Preview>Preview A</Draggable.Preview>
          </Draggable.Root>
        </DraggableProvider>
        <DraggableProvider>
          <Draggable.Root kind={testDragKind} data-testid="b">
            <Draggable.Preview>Preview B</Draggable.Preview>
          </Draggable.Root>
        </DraggableProvider>
      </React.Fragment>,
    );

    const a = screen.getByTestId('a');
    const b = screen.getByTestId('b');
    a.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    b.getBoundingClientRect = () => new DOMRect(0, 200, 200, 100);

    fireDrag.dragStart(a);
    expect(screen.getByText('Preview A')).toBeInTheDocument();

    // End A and start B without a commit in between. The nested `act` calls flush
    // only when the outer one exits, and that single flush is what this test covers.
    act(() => {
      fireDrag.drop(a);
      fireDrag.dragStart(b);
    });

    expect(screen.queryByText('Preview A')).toBeNull();
    expect(screen.getByText('Preview B')).toBeInTheDocument();
  });
});
