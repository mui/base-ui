import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { createDndRenderer, testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createElement, flushRaf, lift, setupDragEngineTests } from '../../test/dnd';
import { DraggablePreviewCssVars } from './preview/DraggablePreviewCssVars';
import { DraggablePreviewDataAttributes } from './preview/DraggablePreviewDataAttributes';
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
});
