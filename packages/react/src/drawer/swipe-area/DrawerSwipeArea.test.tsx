import { Drawer } from '@base-ui/react/drawer';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createRenderer, describeConformance } from '#test-utils';

async function swipe(
  element: HTMLElement,
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  const stepX = start.x + (end.x === start.x ? 0 : Math.sign(end.x - start.x));
  const stepY = start.y + (end.y === start.y ? 0 : Math.sign(end.y - start.y));

  fireEvent.pointerDown(element, {
    button: 0,
    buttons: 1,
    pointerId: 1,
    clientX: start.x,
    clientY: start.y,
    pointerType: 'mouse',
  });

  await flushMicrotasks();

  fireEvent.pointerMove(element, {
    pointerId: 1,
    clientX: stepX,
    clientY: stepY,
    pointerType: 'mouse',
  });

  await flushMicrotasks();

  fireEvent.pointerMove(element, {
    pointerId: 1,
    clientX: end.x,
    clientY: end.y,
    pointerType: 'mouse',
  });

  await flushMicrotasks();

  fireEvent.pointerUp(element, {
    pointerId: 1,
    clientX: end.x,
    clientY: end.y,
    pointerType: 'mouse',
  });

  await flushMicrotasks();
}

async function swipeUp(element: HTMLElement, startY: number, endY: number) {
  return swipe(element, { x: 10, y: startY }, { x: 10, y: endY });
}

async function swipeLeft(element: HTMLElement, startX: number, endX: number) {
  return swipe(element, { x: startX, y: 10 }, { x: endX, y: 10 });
}

describe('<Drawer.SwipeArea />', () => {
  const { render } = createRenderer();

  describeConformance(<Drawer.SwipeArea />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Drawer.Root>{node}</Drawer.Root>);
    },
  }));

  it('opens the drawer when swiped in the open direction', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
      </Drawer.Root>,
    );

    expect(screen.getByTestId('swipe-area')).toHaveAttribute('data-closed', '');

    await swipeUp(screen.getByTestId('swipe-area'), 120, 40);

    expect(screen.getByTestId('swipe-area')).toHaveAttribute('data-open', '');
  });

  it('does not open the drawer for a short swipe', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
      </Drawer.Root>,
    );

    await swipeUp(screen.getByTestId('swipe-area'), 120, 100);

    expect(screen.getByTestId('swipe-area')).toHaveAttribute('data-closed', '');
  });

  it('does not open the drawer when disabled', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" disabled />
      </Drawer.Root>,
    );

    await swipeUp(screen.getByTestId('swipe-area'), 120, 40);

    expect(screen.getByTestId('swipe-area')).toHaveAttribute('data-closed', '');
  });

  it('respects custom swipeDirection', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" swipeDirection="left" />
      </Drawer.Root>,
    );

    await swipeLeft(screen.getByTestId('swipe-area'), 120, 40);

    expect(screen.getByTestId('swipe-area')).toHaveAttribute('data-open', '');
  });

  it('uses swipeThreshold when provided as a function', async () => {
    const threshold = vi.fn(() => 10);

    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" swipeThreshold={threshold} />
      </Drawer.Root>,
    );

    await swipeUp(screen.getByTestId('swipe-area'), 120, 100);

    expect(screen.getByTestId('swipe-area')).toHaveAttribute('data-open', '');
    expect(threshold).toHaveBeenCalled();
  });
});
