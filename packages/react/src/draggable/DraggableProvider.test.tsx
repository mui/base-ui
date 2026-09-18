import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createDndRenderer } from '#test-utils';
import { Draggable } from './index';
import { lift, dragEnter, drop, setupDragEngineTests } from '../../test/dnd';

setupDragEngineTests();

function Manager() {
  Draggable.useDragDropManager();
  return null;
}

describe('Draggable.Provider', () => {
  const { renderDnd } = createDndRenderer();

  it.each([
    ['Root', <Draggable.Root />],
    ['Target', <Draggable.Target />],
    ['Viewport', <Draggable.Viewport />],
    ['manager', <Manager />],
  ])('requires a provider for %s', (_name, element) => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => render(element)).toThrow(/Draggable.Provider is missing/);
    } finally {
      spy.mockRestore();
    }
  });

  it('lets a monitor observe drags from outside any provider', async () => {
    const onMoveStart = vi.fn();
    const onMoveEnd = vi.fn();
    function ShellMonitor() {
      Draggable.useDragMonitor({ onMoveStart, onMoveEnd });
      return null;
    }
    render(
      <React.Fragment>
        <ShellMonitor />
        <Draggable.Provider>
          <Draggable.Root data-testid="source">
            <Draggable.Preview disabled />
          </Draggable.Root>
        </Draggable.Provider>
      </React.Fragment>,
    );
    const source = screen.getByTestId('source');
    await lift(source);
    expect(onMoveStart).toHaveBeenCalledTimes(1);
    drop(source);
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
  });

  it('matches an untyped source and target without declaring a kind', async () => {
    const onDrop = vi.fn();
    await renderDnd(
      <React.Fragment>
        <Draggable.Root data-testid="source">
          <Draggable.Preview disabled />
        </Draggable.Root>
        <Draggable.Target data-testid="target" onDraggableDrop={onDrop} />
      </React.Fragment>,
    );
    await lift(screen.getByTestId('source'));
    await dragEnter(screen.getByTestId('target'));
    await drop(screen.getByTestId('target'));
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop.mock.calls[0][0].source.payload).toBeUndefined();
  });

  it('does not match an explicit source kind with a default-kind target in one provider', async () => {
    const onDrop = vi.fn();
    const card = Draggable.createKind('provider-card');
    await renderDnd(
      <React.Fragment>
        <Draggable.Root kind={card} data-testid="source">
          <Draggable.Preview disabled />
        </Draggable.Root>
        <Draggable.Target data-testid="target" onDraggableDrop={onDrop} />
      </React.Fragment>,
    );
    await lift(screen.getByTestId('source'));
    await dragEnter(screen.getByTestId('target'));
    await drop(screen.getByTestId('target'));
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('does not match a default-kind source with an explicit-accept target in one provider', async () => {
    const onDrop = vi.fn();
    const card = Draggable.createKind('provider-card');
    await renderDnd(
      <React.Fragment>
        <Draggable.Root data-testid="source">
          <Draggable.Preview disabled />
        </Draggable.Root>
        <Draggable.Target data-testid="target" accept={card} onDraggableDrop={onDrop} />
      </React.Fragment>,
    );
    await lift(screen.getByTestId('source'));
    await dragEnter(screen.getByTestId('target'));
    await drop(screen.getByTestId('target'));
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('does not match default kinds across provider boundaries', async () => {
    const onDrop = vi.fn();
    await renderDnd(
      <React.Fragment>
        <Draggable.Root data-testid="source">
          <Draggable.Preview disabled />
        </Draggable.Root>
        <Draggable.Provider>
          <Draggable.Target data-testid="target" onDraggableDrop={onDrop} />
        </Draggable.Provider>
      </React.Fragment>,
    );
    await lift(screen.getByTestId('source'));
    await dragEnter(screen.getByTestId('target'));
    await drop(screen.getByTestId('target'));
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('allows explicit kinds to cross provider boundaries', async () => {
    const kind = Draggable.createKind('shared');
    const onDrop = vi.fn();
    await renderDnd(
      <React.Fragment>
        <Draggable.Root kind={kind} data-testid="source">
          <Draggable.Preview disabled />
        </Draggable.Root>
        <Draggable.Provider>
          <Draggable.Target accept={kind} data-testid="target" onDraggableDrop={onDrop} />
        </Draggable.Provider>
      </React.Fragment>,
    );
    await lift(screen.getByTestId('source'));
    await dragEnter(screen.getByTestId('target'));
    await drop(screen.getByTestId('target'));
    expect(onDrop).toHaveBeenCalledTimes(1);
  });
  it('provides drag context to custom preview content', async () => {
    function PreviewContent() {
      Draggable.useDragDropManager();
      return <span data-testid="custom-preview">Preview</span>;
    }
    await renderDnd(
      <Draggable.Root data-testid="source">
        <Draggable.Preview>
          <PreviewContent />
        </Draggable.Preview>
      </Draggable.Root>,
    );
    await lift(screen.getByTestId('source'));
    expect(screen.getByTestId('custom-preview')).toBeInTheDocument();
  });
});
