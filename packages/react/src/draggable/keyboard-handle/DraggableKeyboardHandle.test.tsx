import * as React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createDndRenderer, describeConformance, testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { cancel, flushRaf, lift, setupDragEngineTests } from '../../../test/dnd';
import { dragSessionStore } from '../../utils/drag-and-drop/dragSessionStore';

setupDragEngineTests();

describe('<Draggable.KeyboardHandle />', () => {
  const { renderDnd } = createDndRenderer();

  describeConformance(<Draggable.KeyboardHandle />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render(node) {
      return renderDnd(<Draggable.Root kind={testDragKind}>{node}</Draggable.Root>);
    },
  }));

  it('owns keyboard pickup while leaving pointer pickup on the whole root', async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind} data-testid="card">
        <span data-testid="body">content</span>
        <Draggable.KeyboardHandle data-testid="handle">grip</Draggable.KeyboardHandle>
      </Draggable.Root>,
    );
    const card = screen.getByTestId('card');
    const body = screen.getByTestId('body');
    const handle = screen.getByTestId('handle');
    card.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    expect(card).not.toHaveAttribute('tabindex');
    expect(card).not.toHaveAttribute('aria-roledescription');
    expect(card.style.touchAction).toBe('manipulation');
    expect(handle).toHaveAttribute('aria-roledescription', 'draggable');
    expect(handle.style.touchAction).not.toBe('manipulation');

    fireEvent.keyDown(body, { key: ' ' });
    expect(dragSessionStore.getSnapshot()).toBeNull();

    fireEvent.keyDown(handle, { key: ' ' });
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);
    fireEvent.keyDown(handle, { key: 'Escape' });
    await flushRaf();

    await lift(body);
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);
    cancel();
    await flushRaf();

    await lift(handle);
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);
    cancel();
    await flushRaf();
  });

  it('starts from a virtual click but not an ordinary pointer click', async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind} data-testid="card">
        <Draggable.KeyboardHandle data-testid="handle">grip</Draggable.KeyboardHandle>
      </Draggable.Root>,
    );
    const handle = screen.getByTestId('handle');
    const card = screen.getByTestId('card');

    fireEvent.click(handle, { detail: 1 });
    expect(dragSessionStore.getSnapshot()).toBeNull();

    fireEvent.click(handle, { detail: 0 });
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);
    fireEvent.keyDown(handle, { key: 'Escape' });
    await flushRaf();
  });

  it('uses a regular handle for pointer pickup when both handle types are mounted', async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind} data-testid="card">
        <span data-testid="body">content</span>
        <Draggable.Handle data-testid="pointer-handle">pointer</Draggable.Handle>
        <Draggable.KeyboardHandle data-testid="keyboard-handle">keyboard</Draggable.KeyboardHandle>
      </Draggable.Root>,
    );
    const card = screen.getByTestId('card');
    const keyboardHandle = screen.getByTestId('keyboard-handle');
    card.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    await lift(screen.getByTestId('body'), { expectNoDrag: true });
    expect(dragSessionStore.getSnapshot()).toBeNull();

    await lift(screen.getByTestId('pointer-handle'));
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);
    cancel();
    await flushRaf();

    fireEvent.keyDown(screen.getByTestId('pointer-handle'), { key: ' ' });
    expect(dragSessionStore.getSnapshot()).toBeNull();

    fireEvent.keyDown(keyboardHandle, { key: 'Enter' });
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);
    fireEvent.keyDown(keyboardHandle, { key: 'Escape' });
    await flushRaf();
  });

  it('follows a disabled root out of the tab order', async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind} disabled>
        <Draggable.KeyboardHandle data-testid="handle">grip</Draggable.KeyboardHandle>
      </Draggable.Root>,
    );

    expect(screen.getByTestId('handle')).toBeDisabled();
    expect(screen.getByTestId('handle')).not.toHaveAttribute('aria-roledescription');
  });
});
