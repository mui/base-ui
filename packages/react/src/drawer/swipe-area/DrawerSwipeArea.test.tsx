import { DrawerPreview as Drawer } from '@base-ui/react/drawer';
import { act, fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

type SwipeOptions = {
  timeStepMs?: number;
  startTimeMs?: number;
  waitBeforeRelease?: () => Promise<unknown>;
};

async function swipe(
  element: HTMLElement,
  start: { x: number; y: number },
  end: { x: number; y: number },
  options: SwipeOptions = {},
) {
  const stepX = start.x + (end.x === start.x ? 0 : Math.sign(end.x - start.x));
  const stepY = start.y + (end.y === start.y ? 0 : Math.sign(end.y - start.y));
  const { timeStepMs, startTimeMs = 0, waitBeforeRelease } = options;
  const useTimeStamp = typeof timeStepMs === 'number';
  let timeStamp = startTimeMs;

  fireEvent.pointerDown(element, {
    button: 0,
    buttons: 1,
    pointerId: 1,
    clientX: start.x,
    clientY: start.y,
    pointerType: 'mouse',
    ...(useTimeStamp ? { timeStamp } : null),
  });

  await flushMicrotasks();

  if (useTimeStamp) {
    timeStamp += timeStepMs;
  }

  fireEvent.pointerMove(element, {
    pointerId: 1,
    clientX: stepX,
    clientY: stepY,
    pointerType: 'mouse',
    ...(useTimeStamp ? { timeStamp } : null),
  });

  await flushMicrotasks();

  if (useTimeStamp) {
    timeStamp += timeStepMs;
  }

  fireEvent.pointerMove(element, {
    pointerId: 1,
    clientX: end.x,
    clientY: end.y,
    pointerType: 'mouse',
    ...(useTimeStamp ? { timeStamp } : null),
  });

  await flushMicrotasks();

  if (waitBeforeRelease) {
    await waitBeforeRelease();
    await flushMicrotasks();
  }

  if (useTimeStamp) {
    timeStamp += timeStepMs;
  }

  fireEvent.pointerUp(element, {
    pointerId: 1,
    clientX: end.x,
    clientY: end.y,
    pointerType: 'mouse',
    ...(useTimeStamp ? { timeStamp } : null),
  });

  await flushMicrotasks();
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function swipeUp(element: HTMLElement, startY: number, endY: number, options?: SwipeOptions) {
  return swipe(element, { x: 10, y: startY }, { x: 10, y: endY }, options);
}

async function swipeLeft(
  element: HTMLElement,
  startX: number,
  endX: number,
  options?: SwipeOptions,
) {
  return swipe(element, { x: startX, y: 10 }, { x: endX, y: 10 }, options);
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

  it('does not open when the swipe direction never locks to the open direction', async () => {
    const handleOpenChange = vi.fn();

    await render(
      <Drawer.Root onOpenChange={handleOpenChange}>
        <Drawer.SwipeArea data-testid="swipe-area" />
      </Drawer.Root>,
    );

    await swipe(screen.getByTestId('swipe-area'), { x: 10, y: 120 }, { x: 70, y: 118 });

    expect(screen.getByTestId('swipe-area')).toHaveAttribute('data-closed', '');
    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it('prevents default pointer down for non-touch swipes', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
      </Drawer.Root>,
    );

    const notCancelled = fireEvent.pointerDown(screen.getByTestId('swipe-area'), {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 10,
      clientY: 120,
      pointerType: 'mouse',
    });

    expect(notCancelled).toBe(false);
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

  it('re-enables outside press dismissal after opening by swipe', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    await swipeUp(swipeArea, 120, 40);

    expect(swipeArea).toHaveAttribute('data-open', '');

    await act(async () => {
      await wait(20);
    });

    fireEvent.click(document.body);
    await flushMicrotasks();

    expect(swipeArea).toHaveAttribute('data-closed', '');
  });

  it.skipIf(isJSDOM)('uses a size-based swipe threshold by default', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup style={{ height: 200 }}>Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    await flushMicrotasks();

    const swipeArea = screen.getByTestId('swipe-area');
    const slowSwipe = {
      timeStepMs: 1300,
      waitBeforeRelease: async () => {
        await screen.findByText('Drawer');
        await act(async () => {
          await wait(120);
        });
      },
    };

    await swipeUp(swipeArea, 200, 130, slowSwipe);

    expect(swipeArea).toHaveAttribute('data-closed', '');

    await swipeUp(swipeArea, 200, 80, slowSwipe);

    expect(swipeArea).toHaveAttribute('data-open', '');
  });
});
