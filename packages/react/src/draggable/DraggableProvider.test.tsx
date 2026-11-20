import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createDndRenderer, testDragKind } from '../../test/dndEngine';
import { Draggable } from './index';
import { lift, dragEnter, drop, setupDragEngineTests } from '../../test/dnd';

setupDragEngineTests();

function Manager() {
  Draggable.useManager();
  return null;
}

const collisionKind = Draggable.createKind('collision');

describe('Draggable.Provider', () => {
  const { renderDnd } = createDndRenderer();

  it.each([
    [
      'Root',
      <Draggable.Root>
        <Draggable.Trigger />
      </Draggable.Root>,
    ],
    ['Target', <Draggable.Target />],
    ['Viewport', <Draggable.Viewport />],
    ['CollisionProvider', <Draggable.CollisionProvider kind={collisionKind} />],
    ['manager', <Manager />],
  ])('requires a provider for %s', (_name, element) => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => render(element)).toThrow(/Draggable.Provider is missing/);
    } finally {
      spy.mockRestore();
    }
  });

  it('matches an untyped source and target without declaring a kind', async () => {
    const onDrop = vi.fn();
    await renderDnd(
      <React.Fragment>
        <Draggable.Root>
          <Draggable.Trigger data-testid="source"></Draggable.Trigger>
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
        <Draggable.Root kind={card}>
          <Draggable.Trigger data-testid="source"></Draggable.Trigger>
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
        <Draggable.Root>
          <Draggable.Trigger data-testid="source"></Draggable.Trigger>
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
        <Draggable.Root>
          <Draggable.Trigger data-testid="source"></Draggable.Trigger>
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
        <Draggable.Root kind={kind}>
          <Draggable.Trigger data-testid="source"></Draggable.Trigger>
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

  it('keeps the provider context stable when its parent renders', async () => {
    let rowCommits = 0;
    const Row = React.memo(function Row() {
      // Reads the provider context, so a new context value would render it again.
      Draggable.useManager();
      rowCommits += 1;
      return (
        <Draggable.Root kind={testDragKind}>
          <Draggable.Trigger data-testid="drag" />
        </Draggable.Root>
      );
    });

    function Wiring() {
      const [, force] = React.useState(0);
      return (
        <React.Fragment>
          <button type="button" data-testid="force" onClick={() => force((c) => c + 1)} />
          <Draggable.Provider>
            <Row />
          </Draggable.Provider>
        </React.Fragment>
      );
    }

    await renderDnd(<Wiring />);
    const countAfterMount = rowCommits;

    fireEvent.click(screen.getByTestId('force'));

    expect(rowCommits).toBe(countAfterMount);
  });
});
