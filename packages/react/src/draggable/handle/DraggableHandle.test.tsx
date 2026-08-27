import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { createDndRenderer, describeConformance, testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { cancel, flushRaf, lift, setupDragEngineTests } from '../../../test/dnd';
import { dragSessionStore } from '../../utils/drag-and-drop/dragSessionStore';

setupDragEngineTests();

describe('<Draggable.Handle />', () => {
  const { renderDnd } = createDndRenderer();

  describeConformance(<Draggable.Handle />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render(node) {
      return renderDnd(<Draggable.Root kind={testDragKind}>{node}</Draggable.Root>);
    },
  }));

  it('is the single tab stop of its draggable from mount', async () => {
    // The handle is the focusable pickup affordance; the root must not add a
    // second tab stop of its own — including right after mount, when the root
    // is still resolving whether a handle exists.
    await renderDnd(
      <Draggable.Root kind={testDragKind} data-testid="card">
        <Draggable.Handle data-testid="handle">grip</Draggable.Handle>
      </Draggable.Root>,
    );
    const card = screen.getByTestId('card');
    expect(card).not.toHaveAttribute('tabindex');
    expect(card).not.toHaveAttribute('role');
    // Pickup, and its announcement, live on the handle.
    expect(screen.getByTestId('handle')).toHaveAttribute('aria-roledescription', 'draggable');
  });

  it('restricts pickup to the handle, for the pointer and the keyboard', async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind} data-testid="card">
        <span data-testid="body">content</span>
        <Draggable.Handle data-testid="handle">grip</Draggable.Handle>
      </Draggable.Root>,
    );
    const card = screen.getByTestId('card');
    const body = screen.getByTestId('body');
    card.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

    // A pointer lift from the card body, outside the handle, starts nothing.
    await lift(body, { expectNoDrag: true });
    expect(dragSessionStore.getSnapshot()).toBeNull();

    // Neither does a keyboard pickup outside the handle.
    fireEvent.keyDown(body, { key: ' ' });
    await flushRaf();
    expect(dragSessionStore.getSnapshot()).toBeNull();

    // Lifting from the handle starts the drag, with the root as the source.
    await lift(screen.getByTestId('handle'));
    expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);

    cancel();
    await flushRaf();
  });

  it('warns for a second mounted handle, and falls back to the survivor on unmount', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      function Card({ withFirst }: { withFirst: boolean }) {
        return (
          <Draggable.Root kind={testDragKind} data-testid="card">
            <span data-testid="body">content</span>
            {withFirst && <Draggable.Handle data-testid="handle-a">a</Draggable.Handle>}
            <Draggable.Handle data-testid="handle-b">b</Draggable.Handle>
          </Draggable.Root>
        );
      }

      const { rerender } = await renderDnd(<Card withFirst />);
      // `warn()` dedupes per message process-wide, so this must be the first
      // two-handle mount of the file — and re-mounts can't inflate the count.
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/more than one mounted Draggable\.Handle/);

      // Unmounting handle A restricts pickup to the surviving handle B, not
      // back to the whole card.
      await rerender(<Card withFirst={false} />);
      const card = screen.getByTestId('card');
      card.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);

      await lift(screen.getByTestId('body'), { expectNoDrag: true });
      expect(dragSessionStore.getSnapshot()).toBeNull();

      await lift(screen.getByTestId('handle-b'));
      expect(dragSessionStore.getSnapshot()?.source.element).toBe(card);

      cancel();
      await flushRaf();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it.each([
    ['a native button', true],
    ['a non-native button', false],
  ])(
    'follows the root out of the tab order when the draggable is disabled, as %s',
    async (_label, nativeButton) => {
      // The engine refuses the pickup on a disabled draggable; the handle must
      // not remain a focusable button that does nothing.
      await renderDnd(
        <Draggable.Root kind={testDragKind} disabled label="Card">
          <Draggable.Handle
            data-testid="handle"
            nativeButton={nativeButton}
            render={nativeButton ? undefined : <div />}
          >
            grip
          </Draggable.Handle>
        </Draggable.Root>,
      );
      const handle = screen.getByTestId('handle');
      expect(handle).toHaveAttribute('data-disabled');
      if (nativeButton) {
        expect(handle).toBeDisabled();
      } else {
        // No native `disabled` semantics: the state is announced through
        // `aria-disabled`, and the tab stop is withdrawn explicitly.
        expect(handle).toHaveAttribute('aria-disabled', 'true');
        expect(handle).toHaveAttribute('tabindex', '-1');
      }
    },
  );

  it('stays interactive while the draggable is enabled', async () => {
    await renderDnd(
      <Draggable.Root kind={testDragKind}>
        <Draggable.Handle data-testid="handle">grip</Draggable.Handle>
      </Draggable.Root>,
    );
    const handle = screen.getByTestId('handle');
    expect(handle).not.toBeDisabled();
    expect(handle).not.toHaveAttribute('data-disabled');
  });

  describe('default accessible name', () => {
    it('builds its aria-label from a labeled root', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind} label="Card">
          {/* The icon-only grip the default exists for: no text of its own, so
              without a label it would expose as an unnamed button. */}
          <Draggable.Handle data-testid="handle">
            <svg aria-hidden="true" />
          </Draggable.Handle>
        </Draggable.Root>,
      );
      expect(screen.getByTestId('handle')).toHaveAttribute('aria-label', 'Drag Card');
    });

    it('injects no label over a handle that renders its own text', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind} label="Task 3">
          <Draggable.Handle data-testid="handle">Reorder</Draggable.Handle>
        </Draggable.Root>,
      );
      // Overriding visible text with "Drag Task 3" is a WCAG 2.5.3 (Label in
      // Name) failure, and leaves a speech-input user unable to activate the
      // handle by the words they can see.
      const handle = screen.getByTestId('handle');
      expect(handle).not.toHaveAttribute('aria-label');
      expect(handle).toHaveAccessibleName('Reorder');
    });

    it('injects no label over text nested inside an element', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind} label="Task 3">
          <Draggable.Handle data-testid="handle">
            <span>Reorder</span>
          </Draggable.Handle>
        </Draggable.Root>,
      );
      // The common styled form. A check limited to direct children would miss it
      // and inject "Drag Task 3" over the visible word.
      const handle = screen.getByTestId('handle');
      expect(handle).not.toHaveAttribute('aria-label');
      expect(handle).toHaveAccessibleName('Reorder');
    });

    it('injects no label over text supplied by the render element', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind} label="Task 3">
          <Draggable.Handle data-testid="handle" render={<button>Reorder</button>} />
        </Draggable.Root>,
      );

      const handle = screen.getByTestId('handle');
      expect(handle).not.toHaveAttribute('aria-label');
      expect(handle).toHaveAccessibleName('Reorder');
    });

    it('injects no label over text returned by a render function', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind} label="Task 3">
          <Draggable.Handle
            data-testid="handle"
            render={(props) => <button {...props}>Reorder</button>}
          />
        </Draggable.Root>,
      );

      const handle = screen.getByTestId('handle');
      expect(handle).not.toHaveAttribute('aria-label');
      expect(handle).toHaveAccessibleName('Reorder');
    });

    it('injects no label over text rendered internally by a custom component', async () => {
      function TextHandle(props: React.ComponentPropsWithRef<'button'>) {
        return <button {...props}>Reorder</button>;
      }

      await renderDnd(
        <Draggable.Root kind={testDragKind} label="Task 3">
          <Draggable.Handle data-testid="handle" render={<TextHandle />} />
        </Draggable.Root>,
      );

      const handle = screen.getByTestId('handle');
      expect(handle).not.toHaveAttribute('aria-label');
      expect(handle).toHaveAccessibleName('Reorder');
    });

    it('still labels an icon-only handle written with whitespace around the icon', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind} label="Card">
          {/* prettier-ignore */}
          <Draggable.Handle data-testid="handle"> <svg aria-hidden="true" /> </Draggable.Handle>
        </Draggable.Root>,
      );
      // JSX keeps the spaces around the icon as string children. Counting those
      // as text would strip the default name and expose an unnamed button.
      expect(screen.getByTestId('handle')).toHaveAttribute('aria-label', 'Drag Card');
    });

    it('still labels a handle whose only text is inside an aria-hidden node', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind} label="Card">
          <Draggable.Handle data-testid="handle">
            <span aria-hidden>::</span>
          </Draggable.Handle>
        </Draggable.Root>,
      );
      // An `aria-hidden` glyph contributes nothing to the accessible name, so it
      // cannot be what names the control.
      expect(screen.getByTestId('handle')).toHaveAttribute('aria-label', 'Drag Card');
    });

    it('still labels a handle whose only text is inside a hidden node', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind} label="Card">
          <Draggable.Handle data-testid="handle">
            <span hidden>Reorder</span>
            <svg aria-hidden />
          </Draggable.Handle>
        </Draggable.Root>,
      );

      const handle = screen.getByTestId('handle');
      expect(handle).toHaveAttribute('aria-label', 'Drag Card');
      expect(handle).toHaveAccessibleName('Drag Card');
    });

    it('still labels a handle hidden with the string form aria-hidden="true"', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind} label="Card">
          <Draggable.Handle data-testid="handle">
            <span aria-hidden="true">⠿</span>
          </Draggable.Handle>
        </Draggable.Root>,
      );
      // React accepts `aria-hidden` as a `Booleanish`, and the string form is
      // the most commonly authored one — it must hide the glyph's text from the
      // check exactly like the boolean does.
      expect(screen.getByTestId('handle')).toHaveAttribute('aria-label', 'Drag Card');
    });

    it('yields to an explicit aria-label', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind} label="Card">
          <Draggable.Handle data-testid="handle" aria-label="Move the card">
            <svg aria-hidden="true" />
          </Draggable.Handle>
        </Draggable.Root>,
      );
      expect(screen.getByTestId('handle')).toHaveAttribute('aria-label', 'Move the card');
    });

    it('yields to an explicit aria-labelledby', async () => {
      await renderDnd(
        <React.Fragment>
          <span id="name">Move the card</span>
          <Draggable.Root kind={testDragKind} label="Card">
            <Draggable.Handle data-testid="handle" aria-labelledby="name">
              <svg aria-hidden="true" />
            </Draggable.Handle>
          </Draggable.Root>
        </React.Fragment>,
      );
      const handle = screen.getByTestId('handle');
      expect(handle).not.toHaveAttribute('aria-label');
      expect(handle).toHaveAttribute('aria-labelledby', 'name');
    });

    it('injects no label when the root has none', async () => {
      await renderDnd(
        <Draggable.Root kind={testDragKind}>
          <Draggable.Handle data-testid="handle">
            <svg aria-hidden="true" />
          </Draggable.Handle>
        </Draggable.Root>,
      );
      expect(screen.getByTestId('handle')).not.toHaveAttribute('aria-label');
    });
  });
});
