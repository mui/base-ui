import { expect } from 'vitest';
import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, firePointer } from '#test-utils';

describe('firePointer', () => {
  const { render } = createRenderer();

  function Target(props: { onStamp: (timeStamp: number) => void }) {
    const { onStamp } = props;
    return (
      <div
        data-testid="target"
        onPointerDown={(event) => onStamp(event.timeStamp)}
        onPointerMove={(event) => onStamp(event.timeStamp)}
        onPointerUp={(event) => onStamp(event.timeStamp)}
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
    await render(<Target onStamp={(timeStamp) => seen.push(timeStamp)} />);
    const target = screen.getByTestId('target');

    firePointer.down(target, { pointerId: 1, timeStamp: 1000 });
    firePointer.move(target, { pointerId: 1, timeStamp: 1050 });
    firePointer.up(target, { pointerId: 1, timeStamp: 1100 });

    expect(seen).toEqual([1000, 1050, 1100]);
  });

  it('rejects a non-positive timeStamp instead of falling back to the real clock', async () => {
    const seen: number[] = [];
    await render(<Target onStamp={(timeStamp) => seen.push(timeStamp)} />);
    const target = screen.getByTestId('target');

    expect(() => firePointer.down(target, { pointerId: 1, timeStamp: 0 })).toThrow(
      /timeStamp must be greater than 0/,
    );
    expect(seen).toEqual([]);
  });
});
