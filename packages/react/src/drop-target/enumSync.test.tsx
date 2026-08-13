import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { createDndRenderer, testDragKind } from '#test-utils';
import { DropTarget } from '@base-ui/react/drop-target';
import { createElement, flushRaf, setupDragEngineTests } from '../../test/dnd';
import { DropTargetRootDataAttributes } from './root/DropTargetRootDataAttributes';

setupDragEngineTests();

// The engine writes these names as inlined string literals (`dropTarget.ts`, the
// state-attribute mapping) so the enum stays tree-shakeable — it exists for types
// and the generated API reference only. Nothing else links the literals to the
// enum, so re-link every member here: renaming only one side fails CI.
describe('DropTarget enum sync', () => {
  const { renderDnd } = createDndRenderer();

  it('names the target attributes per DropTargetRootDataAttributes', async () => {
    const { engine } = await renderDnd(
      <React.Fragment>
        <DropTarget.Root data-testid="outer" accept={testDragKind}>
          <div data-testid="inner-host">
            <DropTarget.Root data-testid="inner" accept={testDragKind} />
          </div>
        </DropTarget.Root>
        <DropTarget.Root data-testid="off" accept={testDragKind} disabled />
        <DropTarget.Root data-testid="full" accept={testDragKind} canDrop={() => 'reject'} />
      </React.Fragment>,
    );

    const outer = screen.getByTestId('outer');
    const inner = screen.getByTestId('inner');
    const full = screen.getByTestId('full');

    // Present for as long as the element is registered, drag or no drag.
    expect(outer).toHaveAttribute(DropTargetRootDataAttributes.dropTarget);
    expect(screen.getByTestId('off')).toHaveAttribute(DropTargetRootDataAttributes.disabled);
    expect(outer).not.toHaveAttribute(DropTargetRootDataAttributes.over);
    expect(outer).not.toHaveAttribute(DropTargetRootDataAttributes.accepting);

    const source = createElement();
    engine.registerDraggable(source, { kind: testDragKind });
    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(inner);
    fireEvent.dragOver(inner);
    await flushRaf();

    // Every accepting target is marked from the moment the drag starts, wherever
    // the pointer is — that is what `accepting` is for.
    expect(outer).toHaveAttribute(DropTargetRootDataAttributes.accepting);
    expect(screen.getByTestId('off')).not.toHaveAttribute(DropTargetRootDataAttributes.accepting);

    // Both are over; only the deepest is `overInnermost`.
    expect(inner).toHaveAttribute(DropTargetRootDataAttributes.over);
    expect(inner).toHaveAttribute(DropTargetRootDataAttributes.overInnermost);
    expect(outer).toHaveAttribute(DropTargetRootDataAttributes.over);
    expect(outer).not.toHaveAttribute(DropTargetRootDataAttributes.overInnermost);

    // A rejecting target marks itself while hovered, and only while hovered,
    // without ever entering the stack.
    expect(full).not.toHaveAttribute(DropTargetRootDataAttributes.rejected);
    fireEvent.dragEnter(full);
    fireEvent.dragOver(full);
    await flushRaf();
    expect(full).toHaveAttribute(DropTargetRootDataAttributes.rejected);
    expect(full).not.toHaveAttribute(DropTargetRootDataAttributes.over);
    fireEvent.dragEnter(inner);
    fireEvent.dragOver(inner);
    await flushRaf();
    expect(full).not.toHaveAttribute(DropTargetRootDataAttributes.rejected);

    fireEvent.drop(inner);
    await flushRaf();

    // Every drag-scoped attribute clears with the drag; a regression here would
    // leave targets highlighted as valid drop zones after every drop.
    expect(outer).not.toHaveAttribute(DropTargetRootDataAttributes.accepting);
    expect(inner).not.toHaveAttribute(DropTargetRootDataAttributes.accepting);
    expect(inner).not.toHaveAttribute(DropTargetRootDataAttributes.over);
    expect(inner).not.toHaveAttribute(DropTargetRootDataAttributes.overInnermost);
    expect(outer).not.toHaveAttribute(DropTargetRootDataAttributes.over);
  });
});
