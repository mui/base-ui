import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer, testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createElement, flushRaf, lift, setupDragEngineTests } from '../../test/dnd';
import { DraggablePreviewCssVars } from './preview/DraggablePreviewCssVars';
import { DraggablePreviewDataAttributes } from './preview/DraggablePreviewDataAttributes';
import { DraggableRootCssVars } from './root/DraggableRootCssVars';
import { DraggableRootDataAttributes } from './root/DraggableRootDataAttributes';

setupDragEngineTests();

// The engine writes these names as inlined string literals (`syntheticPreview.ts`,
// `customDragPreview.ts`) so the enums below stay tree-shakeable — they exist for types and the
// generated API reference only. Nothing else links the literals to the enums, so re-link every
// member of every enum in this module here: renaming only one side fails CI.
describe('Draggable enum sync', () => {
  const { renderDnd } = createDndRenderer();

  function DraggableWithPreview() {
    return (
      <Draggable.Root kind={testDragKind} data-testid="drag">
        <Draggable.Preview>
          <span data-testid="preview">x</span>
        </Draggable.Preview>
      </Draggable.Root>
    );
  }

  function getPreview(): HTMLElement {
    return screen.getByTestId('preview').closest('[data-drag-preview]') as HTMLElement;
  }

  it('names the source size CSS variables per DraggablePreviewCssVars', async () => {
    await renderDnd(<DraggableWithPreview />);
    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    fireEvent.dragStart(source);

    const preview = getPreview();
    expect(preview.style.getPropertyValue(DraggablePreviewCssVars.dragSourceWidth)).toBe('200px');
    expect(preview.style.getPropertyValue(DraggablePreviewCssVars.dragSourceHeight)).toBe('100px');
  });

  it('names the preview attributes per DraggablePreviewDataAttributes for a pointer drag', async () => {
    await renderDnd(<DraggableWithPreview />);
    const source = screen.getByTestId('drag');

    await lift(source);

    // `dragPreview` is the selector `getPreview` matched on, so reaching this line already
    // pins it; assert it anyway so a rename fails here rather than in an unrelated query.
    expect(getPreview()).toHaveAttribute(DraggablePreviewDataAttributes.dragPreview);
    expect(getPreview()).toHaveAttribute(DraggablePreviewDataAttributes.dragMode, 'pointer');
  });

  it('names the preview attributes per DraggablePreviewDataAttributes for a keyboard drag', async () => {
    await renderDnd(<DraggableWithPreview />);
    const source = screen.getByTestId('drag');

    source.focus();
    fireEvent.keyDown(source, { key: ' ' });
    // The mode lands one frame after the preview is positioned (see `syntheticPreview.ts`).
    await flushRaf();

    expect(getPreview()).toHaveAttribute(DraggablePreviewDataAttributes.dragPreview);
    expect(getPreview()).toHaveAttribute(DraggablePreviewDataAttributes.dragMode, 'keyboard');
  });

  it('names the source attributes per DraggableRootDataAttributes for a pointer drag', async () => {
    await renderDnd(
      <div>
        <Draggable.Root kind={testDragKind} data-testid="drag" />
        <Draggable.Root kind={testDragKind} data-testid="disabled" disabled />
      </div>,
    );
    const source = screen.getByTestId('drag');

    expect(screen.getByTestId('disabled')).toHaveAttribute(DraggableRootDataAttributes.disabled);
    expect(source).not.toHaveAttribute(DraggableRootDataAttributes.dragging);

    await lift(source);

    expect(source).toHaveAttribute(DraggableRootDataAttributes.dragging);
    expect(source).toHaveAttribute(DraggableRootDataAttributes.dragMode, 'pointer');
  });

  it('names the source attributes per DraggableRootDataAttributes for a keyboard drag', async () => {
    await renderDnd(<Draggable.Root kind={testDragKind} data-testid="drag" />);
    const source = screen.getByTestId('drag');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    source.focus();
    fireEvent.keyDown(source, { key: ' ' });
    await flushRaf();

    expect(source).toHaveAttribute(DraggableRootDataAttributes.dragging);
    expect(source).toHaveAttribute(DraggableRootDataAttributes.dragMode, 'keyboard');
  });

  it('names the source ending attribute per DraggableRootDataAttributes', async () => {
    const { engine } = await renderDnd(
      <Draggable.Root kind={testDragKind} data-testid="drag">
        <Draggable.ClonedPreview />
      </Draggable.Root>,
    );
    const source = screen.getByTestId('drag');
    const target = createElement();
    engine.registerDropTarget(target, {});

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.drop(target);

    expect(source).toHaveAttribute(DraggableRootDataAttributes.endingStyle);
    await flushRaf();
    expect(source).not.toHaveAttribute(DraggableRootDataAttributes.endingStyle);
  });

  it('names the displacement attributes and variables per the root enums', async () => {
    let top = 40;
    let bumpApp: () => void = () => {};
    function Neighbour() {
      const ref = React.useCallback((node: HTMLElement | null) => {
        if (node) {
          Object.defineProperties(node, {
            offsetTop: { configurable: true, get: () => top },
            offsetLeft: { configurable: true, get: () => 0 },
            offsetWidth: { configurable: true, value: 200 },
            offsetHeight: { configurable: true, value: 40 },
          });
        }
      }, []);
      const [, setVersion] = React.useState(0);
      bumpApp = () => setVersion((v) => v + 1);
      return (
        <Draggable.Root kind={testDragKind} data-testid="neighbour" render={<div ref={ref} />}>
          <Draggable.Displacement />
        </Draggable.Root>
      );
    }
    const { engine } = await renderDnd(<Neighbour />);
    const source = createElement();
    const cleanup = engine.registerDraggable(source, { kind: testDragKind });

    fireEvent.dragStart(source);
    await flushRaf();

    // A reorder mid-drag moves the neighbour up by 40px.
    top = 0;
    act(() => bumpApp());

    const neighbour = screen.getByTestId('neighbour');
    expect(neighbour).toHaveAttribute(DraggableRootDataAttributes.displacing);
    expect(neighbour).toHaveAttribute(DraggableRootDataAttributes.startingStyle);
    expect(neighbour.style.getPropertyValue(DraggableRootCssVars.displacementY)).toBe('40px');
    expect(neighbour.style.getPropertyValue(DraggableRootCssVars.displacementX)).toBe('0px');

    fireEvent.dragEnd(source);
    await flushRaf();
    cleanup();
  });
});
