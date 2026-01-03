import * as React from 'react';
import { expect } from 'chai';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { spy } from 'sinon';
import { useSwipeDismiss } from './useSwipeDismiss';

function SwipeBox({
  oppositeDirectionDamping,
}: Pick<useSwipeDismiss.Options, 'oppositeDirectionDamping'>) {
  const ref = React.useRef<HTMLDivElement>(null);
  const swipe = useSwipeDismiss({
    enabled: true,
    directions: ['down'],
    elementRef: ref,
    movementCssVars: { x: '--x', y: '--y' },
    oppositeDirectionDamping,
  });

  return (
    <div data-testid="el" ref={ref} style={swipe.getDragStyles()} {...swipe.getPointerProps()} />
  );
}

describe('useSwipeDismiss', () => {
  beforeAll(function beforeHook() {
    // PointerEvent not fully implemented in jsdom, causing fireEvent.pointer* to ignore options.
    // https://github.com/jsdom/jsdom/issues/2527
    (window as any).PointerEvent = window.MouseEvent;
  });

  const { render } = createRenderer();

  it('does not start swiping within a scrollable element when ignoreScrollableAncestors is true', async () => {
    const onSwipeStart = spy();

    function SwipeBoxScrollable() {
      const ref = React.useRef<HTMLDivElement>(null);
      const swipeDismiss = useSwipeDismiss({
        enabled: true,
        directions: ['down'],
        elementRef: ref,
        movementCssVars: { x: '--x', y: '--y' },
        ignoreScrollableAncestors: true,
        onSwipeStart,
      });

      return (
        <div
          data-testid="root"
          ref={ref}
          style={swipeDismiss.getDragStyles()}
          {...swipeDismiss.getPointerProps()}
        >
          <div data-testid="scroll" style={{ overflowY: 'auto', maxHeight: 100 }}>
            <div style={{ height: 200 }} />
          </div>
        </div>
      );
    }

    await render(<SwipeBoxScrollable />);

    const root = screen.getByTestId('root');
    const scroll = screen.getByTestId('scroll') as HTMLDivElement;

    Object.defineProperty(scroll, 'scrollHeight', { value: 200, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 100, configurable: true });

    fireEvent.pointerDown(scroll, {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 0,
      clientY: 100,
      bubbles: true,
      pointerType: 'mouse',
      movementX: 0,
      movementY: 0,
    });

    await flushMicrotasks();

    fireEvent.pointerMove(scroll, {
      pointerId: 1,
      clientX: 0,
      clientY: 150,
      bubbles: true,
      movementX: 0,
      movementY: 50,
    });

    await flushMicrotasks();

    expect(onSwipeStart.called).to.equal(false);
    expect(root.style.getPropertyValue('--y')).to.equal('0px');
  });

  it('does not prevent touch scrolling until a supported swipe direction is detected', async () => {
    await render(<SwipeBox />);
    const element = screen.getByTestId('el');

    fireEvent.pointerDown(element, {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 0,
      clientY: 100,
      bubbles: true,
      pointerType: 'mouse',
      movementX: 0,
      movementY: 0,
    });

    await flushMicrotasks();

    // First move establishes the baseline (iOS pointermove delay handling).
    fireEvent.pointerMove(element, {
      pointerId: 1,
      clientX: 0,
      clientY: 100,
      bubbles: true,
      movementX: 0,
      movementY: 0,
    });

    await flushMicrotasks();

    // Move up (unsupported) should not block the default touch scroll behavior.
    fireEvent.pointerMove(element, {
      pointerId: 1,
      clientX: 0,
      clientY: 50,
      bubbles: true,
      movementX: 0,
      movementY: -50,
    });

    await flushMicrotasks();

    const touchMoveBefore = new Event('touchmove', { bubbles: true, cancelable: true });
    element.dispatchEvent(touchMoveBefore);
    expect(touchMoveBefore.defaultPrevented).to.equal(false);

    // Once a supported direction is detected, touchmove should be prevented while swiping.
    fireEvent.pointerMove(element, {
      pointerId: 1,
      clientX: 0,
      clientY: 150,
      bubbles: true,
      movementX: 0,
      movementY: 100,
    });

    await flushMicrotasks();

    const touchMoveAfter = new Event('touchmove', { bubbles: true, cancelable: true });
    element.dispatchEvent(touchMoveAfter);
    expect(touchMoveAfter.defaultPrevented).to.equal(true);
  });

  it('clamps movement in the opposite direction when damping is disabled', async () => {
    await render(<SwipeBox oppositeDirectionDamping="none" />);
    const element = screen.getByTestId('el');

    fireEvent.pointerDown(element, {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 0,
      clientY: 100,
      bubbles: true,
      pointerType: 'mouse',
      movementX: 0,
      movementY: 0,
    });

    await flushMicrotasks();

    // First move establishes the baseline (iOS pointermove delay handling).
    fireEvent.pointerMove(element, {
      pointerId: 1,
      clientX: 0,
      clientY: 100,
      bubbles: true,
      movementX: 0,
      movementY: 0,
    });

    await flushMicrotasks();

    // Move up (opposite of allowed "down") should not move the element.
    fireEvent.pointerMove(element, {
      pointerId: 1,
      clientX: 0,
      clientY: 50,
      bubbles: true,
      movementX: 0,
      movementY: -50,
    });

    await flushMicrotasks();

    expect(element.style.getPropertyValue('--y')).to.equal('0px');
  });

  it('applies exponential damping by default for opposite-direction movement', async () => {
    await render(<SwipeBox />);
    const element = screen.getByTestId('el');

    fireEvent.pointerDown(element, {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 0,
      clientY: 100,
      bubbles: true,
      pointerType: 'mouse',
      movementX: 0,
      movementY: 0,
    });

    await flushMicrotasks();
    expect(element.style.transition).to.equal('none');

    fireEvent.pointerMove(element, {
      pointerId: 1,
      clientX: 0,
      clientY: 100,
      bubbles: true,
      movementX: 0,
      movementY: 0,
    });

    await flushMicrotasks();

    fireEvent.pointerMove(element, {
      pointerId: 1,
      clientX: 0,
      clientY: 50,
      bubbles: true,
      movementX: 0,
      movementY: -50,
    });

    await flushMicrotasks();

    expect(element.style.getPropertyValue('--y')).to.not.equal('0px');
  });
});
