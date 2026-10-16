import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { isJSDOM } from '@base-ui/utils/testUtils';
import { Draggable } from '@base-ui/react/draggable';

/**
 * Runs the snippets from the "Testing" section of the Draggable docs
 * (docs/src/app/(docs)/react/utils/draggable/page.mdx) as written, so update both
 * together. It deliberately skips `setupDragEngineTests()`, like an app's test suite.
 */

const card = Draggable.createKind('card');

function Board(props: {
  onMoveEnd: Draggable.Root.Props['onMoveEnd'];
  onDraggableDrop: () => void;
}) {
  return (
    <Draggable.Provider>
      <Draggable.Root
        kind={card}
        render={<button type="button" />}
        onMoveEnd={props.onMoveEnd}
        style={{ position: 'fixed', left: 0, top: 0, width: 100, height: 30 }}
      >
        Write the spec
      </Draggable.Root>
      <Draggable.Target
        accept={card}
        role="group"
        aria-label="Done"
        payload="done"
        onDraggableDrop={props.onDraggableDrop}
        style={{ position: 'fixed', left: 0, top: 100, width: 200, height: 100 }}
      />
    </Draggable.Provider>
  );
}

describe('Draggable docs testing recipes', () => {
  if (isJSDOM) {
    // jsdom has no layout, so report the target under the pointer as a browser would.
    beforeEach(() => {
      vi.spyOn(document, 'elementFromPoint').mockImplementation((x, y) =>
        x >= 0 && x < 200 && y >= 100 && y < 200
          ? document.querySelector('[aria-label="Done"]')
          : null,
      );
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });
  }

  it('drops with the mouse recipe', async () => {
    const onMoveEnd = vi.fn();
    const onDraggableDrop = vi.fn();
    render(<Board onMoveEnd={onMoveEnd} onDraggableDrop={onDraggableDrop} />);

    // Like an app's test suite: Testing Library's `render` and its own user-event instance.
    // eslint-disable-next-line base-ui-test/no-standalone-user-event-setup
    const user = userEvent.setup();
    const card = screen.getByRole('button', { name: 'Write the spec' });

    await user.pointer([
      { keys: '[MouseLeft>]', target: card, coords: { x: 0, y: 0 } },
      // This move passes the 5px threshold and starts the drag.
      { coords: { x: 0, y: 40 } },
      { coords: { x: 0, y: 120 } },
    ]);
    // The drag is in progress. Assert on it here, then release.
    await waitFor(() => {
      expect(screen.getByRole('group', { name: 'Done' })).toHaveAttribute('data-drag-over');
    });
    await user.pointer({ keys: '[/MouseLeft]' });

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    const eventDetails = onMoveEnd.mock.calls[0][0];
    expect(eventDetails.target?.payload).toBe('done');
    expect(eventDetails.reason).toBe('drop');
    expect(onDraggableDrop).toHaveBeenCalledTimes(1);
  });

  it('drops with the touch recipe', async () => {
    const onMoveEnd = vi.fn();
    const onDraggableDrop = vi.fn();
    render(<Board onMoveEnd={onMoveEnd} onDraggableDrop={onDraggableDrop} />);
    const card = screen.getByRole('button', { name: 'Write the spec' });

    const touch = { pointerId: 1, pointerType: 'touch', buttons: 1 };

    vi.useFakeTimers();
    fireEvent.pointerDown(card, { ...touch, clientX: 0, clientY: 0 });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    vi.useRealTimers();

    fireEvent.pointerMove(document, { ...touch, clientX: 0, clientY: 120 });
    await waitFor(() => {
      expect(screen.getByRole('group', { name: 'Done' })).toHaveAttribute('data-drag-over');
    });
    fireEvent.pointerUp(document, { ...touch, buttons: 0, clientX: 0, clientY: 120 });

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    const eventDetails = onMoveEnd.mock.calls[0][0];
    expect(eventDetails.target?.payload).toBe('done');
    expect(eventDetails.reason).toBe('drop');
    expect(onDraggableDrop).toHaveBeenCalledTimes(1);
  });

  // Runs after the recipes, so a preview they leaked would still be in the document.
  it('leaves no drag preview behind', async () => {
    await waitFor(() => {
      expect(document.querySelector('[data-drag-preview]')).toBe(null);
    });
  });
});
