import { expect, describe, it } from 'vitest';
import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, firePointer } from '#test-utils';

describe('firePointer', () => {
  const { render } = createRenderer();

  function Target(props: { onEvent: (event: React.PointerEvent) => void }) {
    const { onEvent } = props;
    return (
      <div
        data-testid="target"
        onPointerDown={onEvent}
        onPointerMove={onEvent}
        onPointerUp={onEvent}
      />
    );
  }

  // `timeStamp` is read-only and not a valid `PointerEventInit` member, so `fireEvent` drops it and
  // the event inherits the environment's clock instead — the fake one under jsdom, the real
  // monotonic one in a browser. Every gesture test that asserts on velocity depends on this helper
  // putting the requested value back, and would silently revert to real-clock timing if it stopped.
  // React is what the components read, and its synthetic event substitutes `Date.now()` for a
  // falsy stamp, so assert through a React handler rather than a native listener.
  it('reports the requested timeStamp to React handlers', async () => {
    const seen: number[] = [];
    await render(<Target onEvent={(event) => seen.push(event.timeStamp)} />);
    const target = screen.getByTestId('target');

    firePointer.down(target, { pointerId: 1, timeStamp: 1000 });
    firePointer.move(target, { pointerId: 1, timeStamp: 1050 });
    firePointer.up(target, { pointerId: 1, timeStamp: 1100 });

    expect(seen).toEqual([1000, 1050, 1100]);
  });

  // The rest of the init reaches the event through `createEvent`'s constructor rather than through
  // explicit `defineProperty` calls, so it is only as good as the environment's `PointerEvent`.
  // A stale `window.PointerEvent = window.MouseEvent` shim silently dropped `pointerId` and
  // `pointerType` in both environments once, and nothing failed: every consumer keys on
  // `'touch'`/`'pen'`, so `undefined` falls the same way as `'mouse'`.
  it('delivers the rest of the init alongside the timeStamp', async () => {
    const seen: Array<Record<string, unknown>> = [];
    await render(
      <Target
        onEvent={(event) =>
          seen.push({
            pointerId: event.pointerId,
            pointerType: event.pointerType,
            clientX: event.clientX,
            clientY: event.clientY,
            buttons: event.buttons,
            timeStamp: event.timeStamp,
          })
        }
      />,
    );

    firePointer.move(screen.getByTestId('target'), {
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 120,
      clientY: 40,
      buttons: 1,
      timeStamp: 1050,
    });

    expect(seen).toEqual([
      {
        pointerId: 1,
        pointerType: 'mouse',
        clientX: 120,
        clientY: 40,
        buttons: 1,
        timeStamp: 1050,
      },
    ]);
  });

  it('rejects a non-positive timeStamp instead of falling back to the real clock', async () => {
    const seen: number[] = [];
    await render(<Target onEvent={(event) => seen.push(event.timeStamp)} />);
    const target = screen.getByTestId('target');

    expect(() => firePointer.down(target, { pointerId: 1, timeStamp: 0 })).toThrow(
      /timeStamp must be greater than 0/,
    );
    expect(seen).toEqual([]);
  });
});
