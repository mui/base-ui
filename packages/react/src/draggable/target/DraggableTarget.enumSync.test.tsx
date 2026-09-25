import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { createDndRenderer, testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createElement, flushRaf, setupDragEngineTests } from '../../../test/dnd';
import * as DraggableTargetDataAttributes from './DraggableTargetDataAttributes';

setupDragEngineTests();

// The engine writes these names as inlined string literals (`dropTarget.ts`), so
// nothing links them to the exported constants that type the generated API
// reference. Re-link every member here: renaming only one side fails CI.
describe('Draggable.Target enum sync', () => {
  const { renderDnd } = createDndRenderer();

  it('names the target attributes per DraggableTargetDataAttributes', async () => {
    const { engine } = await renderDnd(
      <React.Fragment>
        <Draggable.Target data-testid="outer" accept={testDragKind}>
          <div data-testid="inner-host">
            <Draggable.Target data-testid="inner" accept={testDragKind} />
          </div>
        </Draggable.Target>
        <Draggable.Target data-testid="off" accept={testDragKind} disabled />
        <Draggable.Target data-testid="full" accept={testDragKind} canDrop={() => 'reject'} />
      </React.Fragment>,
    );

    const outer = screen.getByTestId('outer');
    const inner = screen.getByTestId('inner');
    const full = screen.getByTestId('full');

    expect(screen.getByTestId('off')).toHaveAttribute(DraggableTargetDataAttributes.disabled);
    expect(outer).not.toHaveAttribute(DraggableTargetDataAttributes.dragOver);
    expect(outer).not.toHaveAttribute(DraggableTargetDataAttributes.accepting);

    const source = createElement();
    engine.registerSource(source, { kind: testDragKind });
    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(inner);
    fireEvent.dragOver(inner);
    await flushRaf();

    // Every accepting target is marked from the moment the drag starts, wherever
    // the pointer is — that is what `accepting` is for.
    expect(outer).toHaveAttribute(DraggableTargetDataAttributes.accepting);
    expect(screen.getByTestId('off')).not.toHaveAttribute(DraggableTargetDataAttributes.accepting);

    // Both are over; only the deepest is `dragOverInnermost`.
    expect(inner).toHaveAttribute(DraggableTargetDataAttributes.dragOver);
    expect(inner).toHaveAttribute(DraggableTargetDataAttributes.dragOverInnermost);
    expect(outer).toHaveAttribute(DraggableTargetDataAttributes.dragOver);
    expect(outer).not.toHaveAttribute(DraggableTargetDataAttributes.dragOverInnermost);

    // A rejecting target marks itself while hovered, and only while hovered,
    // without ever entering the stack.
    expect(full).not.toHaveAttribute(DraggableTargetDataAttributes.rejected);
    fireEvent.dragEnter(full);
    fireEvent.dragOver(full);
    await flushRaf();
    expect(full).toHaveAttribute(DraggableTargetDataAttributes.rejected);
    expect(full).not.toHaveAttribute(DraggableTargetDataAttributes.dragOver);
    fireEvent.dragEnter(inner);
    fireEvent.dragOver(inner);
    await flushRaf();
    expect(full).not.toHaveAttribute(DraggableTargetDataAttributes.rejected);

    fireEvent.drop(inner);
    await flushRaf();

    // Every drag-scoped attribute clears with the drag; a regression here would
    // leave targets highlighted as valid drop zones after every drop.
    expect(outer).not.toHaveAttribute(DraggableTargetDataAttributes.accepting);
    expect(inner).not.toHaveAttribute(DraggableTargetDataAttributes.accepting);
    expect(inner).not.toHaveAttribute(DraggableTargetDataAttributes.dragOver);
    expect(inner).not.toHaveAttribute(DraggableTargetDataAttributes.dragOverInnermost);
    expect(outer).not.toHaveAttribute(DraggableTargetDataAttributes.dragOver);
  });
});
