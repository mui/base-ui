import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { createDndRenderer } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createElement, flushRaf, setupDragEngineTests } from '../../../test/dnd';

setupDragEngineTests();

describe('Draggable.Target state props', () => {
  const { renderDnd } = createDndRenderer();

  const className = (state: Draggable.Target.State) =>
    [
      state.disabled ? 'is-disabled' : 'is-enabled',
      state.dragOver ? 'is-over' : 'is-idle',
      state.dragOverInnermost ? 'is-innermost' : '',
    ]
      .filter(Boolean)
      .join(' ');
  const style = (state: Draggable.Target.State) => ({
    outlineWidth: state.dragOver ? '2px' : '0px',
    opacity: state.disabled ? '0.5' : '1',
  });

  it('resolves className and style callbacks from the drag-over state', async () => {
    const { engine } = await renderDnd(
      <Draggable.Target
        accept={Draggable.anyKind}
        data-testid="target"
        className={className}
        style={style}
      />,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const target = screen.getByTestId('target');
    target.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    expect(target).toHaveClass('is-enabled', 'is-idle');
    expect(target).not.toHaveClass('is-innermost');
    expect(target.style.outlineWidth).toBe('0px');
    expect(target.style.opacity).toBe('1');

    fireEvent.dragStart(source);
    await flushRaf();
    fireEvent.dragEnter(target);
    fireEvent.dragOver(target);
    await flushRaf();

    expect(target).toHaveClass('is-enabled', 'is-over', 'is-innermost');
    expect(target.style.outlineWidth).toBe('2px');

    fireEvent.drop(target);
    await flushRaf();

    expect(target).toHaveClass('is-idle');
    expect(target.style.outlineWidth).toBe('0px');
  });

  it('resolves className and style callbacks from the disabled state', async () => {
    const { rerender } = await renderDnd(
      <Draggable.Target
        accept={Draggable.anyKind}
        data-testid="target"
        className={className}
        style={style}
      />,
    );
    const target = screen.getByTestId('target');

    expect(target).toHaveClass('is-enabled');
    expect(target.style.opacity).toBe('1');

    await rerender(
      <Draggable.Target
        accept={Draggable.anyKind}
        data-testid="target"
        className={className}
        style={style}
        disabled
      />,
    );

    expect(target).toHaveClass('is-disabled', 'is-idle');
    expect(target.style.opacity).toBe('0.5');
    expect(target).toHaveAttribute('data-disabled');
  });
});
