import * as React from 'react';
import type { Coords } from '@floating-ui/react-dom';
import { flushMicrotasks } from '@mui/internal-test-utils';
import { fireEvent, render, screen } from '@testing-library/react';
import { test } from 'vitest';
import { useClientPoint, useFloating, useInteractions } from '../index';

function expectLocation({ x, y }: Coords) {
  expect(Number(screen.getByTestId('x')?.textContent)).toBe(x);
  expect(Number(screen.getByTestId('y')?.textContent)).toBe(y);
  expect(Number(screen.getByTestId('width')?.textContent)).toBe(0);
  expect(Number(screen.getByTestId('height')?.textContent)).toBe(0);
}

function App({
  enabled = true,
  point,
  axis,
  useTriggerProps = false,
}: {
  enabled?: boolean;
  point?: Coords;
  axis?: 'both' | 'x' | 'y';
  useTriggerProps?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { refs, elements, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
  });
  const clientPoint = useClientPoint(context, {
    enabled,
    ...point,
    axis,
  });
  const { getReferenceProps, getTriggerProps, getFloatingProps } = useInteractions([clientPoint]);

  const rect = elements.reference?.getBoundingClientRect();
  const referenceProps = useTriggerProps ? getTriggerProps() : getReferenceProps();

  return (
    <React.Fragment>
      <div
        data-testid="reference"
        ref={refs.setReference}
        {...referenceProps}
        style={{ width: 0, height: 0 }}
      >
        Reference
      </div>
      {isOpen && (
        <div data-testid="floating" ref={refs.setFloating} {...getFloatingProps()}>
          Floating
        </div>
      )}
      <button onClick={() => setIsOpen((v) => !v)} />
      <span data-testid="x">{rect?.x}</span>
      <span data-testid="y">{rect?.y}</span>
      <span data-testid="width">{rect?.width}</span>
      <span data-testid="height">{rect?.height}</span>
    </React.Fragment>
  );
}

test('renders at explicit client point and can be updated', async () => {
  const { rerender } = render(<App point={{ x: 0, y: 0 }} />);

  fireEvent.click(screen.getByRole('button'));

  await flushMicrotasks();

  expectLocation({ x: 0, y: 0 });

  rerender(<App point={{ x: 1000, y: 1000 }} />);

  await flushMicrotasks();

  expectLocation({ x: 1000, y: 1000 });
});

test('updates position from trigger props', async () => {
  render(<App useTriggerProps />);

  await flushMicrotasks();

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 400,
      clientY: 200,
    }),
  );

  await flushMicrotasks();

  expectLocation({ x: 400, y: 200 });
});

test('uses trigger element when dom reference is missing', async () => {
  render(<App axis="x" />);

  const reference = screen.getByTestId('reference');
  reference.getBoundingClientRect = () => ({
    x: 10,
    y: 50,
    width: 0,
    height: 0,
    top: 50,
    left: 10,
    right: 10,
    bottom: 50,
    toJSON: () => {},
  });

  await flushMicrotasks();

  fireEvent.mouseMove(reference, {
    clientX: 200,
    clientY: 300,
  });

  await flushMicrotasks();

  expectLocation({ x: 200, y: 50 });
});

test('renders at mouse event coords', async () => {
  render(<App />);

  await flushMicrotasks();

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );

  await flushMicrotasks();

  expectLocation({ x: 500, y: 500 });

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 1000,
      clientY: 1000,
    }),
  );

  await flushMicrotasks();

  expectLocation({ x: 1000, y: 1000 });

  // Window listener isn't registered unless the floating element is open.
  fireEvent(
    window,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 700,
      clientY: 700,
    }),
  );

  await flushMicrotasks();

  expectLocation({ x: 1000, y: 1000 });

  fireEvent.click(screen.getByRole('button'));
  await flushMicrotasks();

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 700,
      clientY: 700,
    }),
  );
  await flushMicrotasks();

  expectLocation({ x: 700, y: 700 });

  fireEvent(
    document.body,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 0,
      clientY: 0,
    }),
  );
  await flushMicrotasks();

  expectLocation({ x: 0, y: 0 });
});

test('ignores mouse events when explicit coords are specified', async () => {
  render(<App point={{ x: 0, y: 0 }} />);

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );
  await flushMicrotasks();

  expectLocation({ x: 0, y: 0 });
});

test('cleans up window listener when closing or disabling', async () => {
  const { rerender } = render(<App />);

  fireEvent.click(screen.getByRole('button'));

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );
  await flushMicrotasks();

  fireEvent.click(screen.getByRole('button'));

  fireEvent(
    document.body,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 0,
      clientY: 0,
    }),
  );
  await flushMicrotasks();

  expectLocation({ x: 500, y: 500 });

  fireEvent.click(screen.getByRole('button'));

  fireEvent(
    document.body,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );
  await flushMicrotasks();

  expectLocation({ x: 500, y: 500 });

  rerender(<App enabled={false} />);

  fireEvent(
    document.body,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 0,
      clientY: 0,
    }),
  );
  await flushMicrotasks();

  expectLocation({ x: 500, y: 500 });
});

test('axis x', async () => {
  render(<App axis="x" />);

  fireEvent.click(screen.getByRole('button'));

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );
  await flushMicrotasks();

  expectLocation({ x: 500, y: 0 });
});

test('axis y', async () => {
  render(<App axis="y" />);

  fireEvent.click(screen.getByRole('button'));

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );
  await flushMicrotasks();

  expectLocation({ x: 0, y: 500 });
});

test('removes window listener when cursor lands on floating element', async () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button'));

  fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );

  fireEvent(
    screen.getByTestId('floating'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  );

  fireEvent(
    document.body,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 0,
      clientY: 0,
    }),
  );
  await flushMicrotasks();

  expectLocation({ x: 500, y: 500 });
});
