import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import { act, screen, fireEvent, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { List, Button } from '../utils/test-utils';

const toast: Toast.Root.ToastObject = {
  id: 'test',
  title: 'Toast title',
};

describe('<Toast.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Toast.Root toast={toast} />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Toast.Provider>
          <Toast.Viewport>{node}</Toast.Viewport>
        </Toast.Provider>,
      );
    },
  }));

  // requires :focus-visible check
  it.skipIf(isJSDOM)('closes when pressing escape', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });

    await act(async () => button.focus());
    await user.click(button);

    await user.keyboard('{F6}');
    await user.keyboard('{Tab}');
    await user.keyboard('{Escape}');

    expect(screen.queryByTestId('root')).to.equal(null);
  });

  it('renders title and description inside role=status node one tick later', async () => {
    function AccessibilityTestButton() {
      const { add } = Toast.useToast();
      return (
        <button
          type="button"
          onClick={() => {
            add({
              title: 'title',
              description: 'description',
            });
          }}
        >
          add
        </button>
      );
    }

    function AccessibilityTestList() {
      return Toast.useToast().toasts.map((toastItem) => (
        <Toast.Root key={toastItem.id} toast={toastItem} data-testid="root">
          <Toast.Title>{toastItem.title}</Toast.Title>
          <Toast.Description data-testid="description">{toastItem.description}</Toast.Description>
          <Toast.Close aria-label="close" />
        </Toast.Root>
      ));
    }

    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <AccessibilityTestList />
        </Toast.Viewport>
        <AccessibilityTestButton />
      </Toast.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'add' }));

    const status = screen.getByRole('status');
    expect(status).not.to.have.text('titledescription');

    await waitFor(() => {
      expect(status).to.have.text('titledescription');
    });
  });

  describe.skipIf(isJSDOM)('swipe behavior', () => {
    function SwipeTestButton() {
      const { add } = Toast.useToast();
      return (
        <button
          type="button"
          onClick={() => {
            add({
              id: 'swipe-test-toast',
              title: 'Swipe Me',
              description: 'Swipe to dismiss',
            });
          }}
        >
          add toast
        </button>
      );
    }

    function SwipeTestToast({
      swipeDirection,
    }: {
      swipeDirection: Toast.Root.Props['swipeDirection'];
    }) {
      return Toast.useToast().toasts.map((toastItem) => (
        <Toast.Root
          key={toastItem.id}
          toast={toastItem}
          data-testid="toast-root"
          swipeDirection={swipeDirection}
        >
          <Toast.Title>{toastItem.title}</Toast.Title>
          <Toast.Description>{toastItem.description}</Toast.Description>
        </Toast.Root>
      ));
    }

    function simulateSwipe(
      element: HTMLElement,
      startX: number,
      startY: number,
      endX: number,
      endY: number,
    ) {
      fireEvent.pointerDown(element, {
        clientX: startX,
        clientY: startY,
        button: 0,
        bubbles: true,
        pointerId: 1,
      });
      fireEvent.pointerMove(element, {
        clientX: endX,
        clientY: endY,
        bubbles: true,
        pointerId: 1,
      });
      fireEvent.pointerUp(element, { clientX: endX, clientY: endY, bubbles: true, pointerId: 1 });
    }

    it('closes toast when swiping in the specified direction beyond threshold', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="up" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // Swipe up (starting at y=100, ending at y=80, which is > 15px threshold)
      simulateSwipe(toastElement, 100, 100, 100, 80);

      await waitFor(() => {
        expect(screen.queryByTestId('toast-root')).to.equal(null);
      });
    });

    it('does not close toast when swiping in the specified direction below threshold', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="up" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // Swipe up but only by 10px (below 15px threshold)
      simulateSwipe(toastElement, 100, 100, 100, 90);

      expect(screen.queryByTestId('toast-root')).not.to.equal(null);
    });

    it('does not close toast when swiping in a non-specified direction', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="up" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // Swipe down (opposite of allowed direction)
      simulateSwipe(toastElement, 100, 100, 100, 120);

      expect(screen.queryByTestId('toast-root')).not.to.equal(null);
    });

    it('supports multiple swipe directions', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection={['up', 'right']} />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // Swipe right
      simulateSwipe(toastElement, 100, 100, 120, 100);

      await waitFor(() => {
        expect(screen.queryByTestId('toast-root')).to.equal(null);
      });
    });

    it('cancels swipe when direction is reversed beyond threshold', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="up" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // Start swiping up
      fireEvent.pointerDown(toastElement, { clientX: 100, clientY: 100, button: 0, pointerId: 1 });
      fireEvent.pointerMove(toastElement, { clientX: 100, clientY: 80, pointerId: 1 });

      // Then reverse direction
      fireEvent.pointerMove(toastElement, { clientX: 100, clientY: 90, pointerId: 1 });
      fireEvent.pointerUp(toastElement, { clientX: 100, clientY: 90, pointerId: 1 });

      expect(screen.queryByTestId('toast-root')).not.to.equal(null);
    });

    it('applies correct data attributes during swipe', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="up" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      fireEvent.pointerDown(toastElement, { clientX: 100, clientY: 100, button: 0, pointerId: 1 });

      expect(toastElement.getAttribute('data-swipe')).to.equal('start');

      // Move enough to trigger real drag
      fireEvent.pointerMove(toastElement, { clientX: 100, clientY: 80, pointerId: 1 });

      expect(toastElement.getAttribute('data-swipe')).to.equal('move');
      expect(toastElement.getAttribute('data-swipe-direction')).to.equal('up');

      fireEvent.pointerUp(toastElement, { clientX: 100, clientY: 80, pointerId: 1 });

      expect(toastElement.getAttribute('data-swipe')).to.equal('end');
    });

    it('dismisses toast when swiped down with downward swipe direction', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="down" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');
      simulateSwipe(toastElement, 100, 100, 100, 150);

      expect(screen.queryByTestId('toast-root')).to.equal(null);
    });

    it('dismisses toast when swiped left with leftward swipe direction', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="left" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');
      simulateSwipe(toastElement, 100, 100, 50, 100);

      expect(screen.queryByTestId('toast-root')).to.equal(null);
    });

    it('dismisses toast when swiped right with rightward swipe direction', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="right" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');
      simulateSwipe(toastElement, 100, 100, 150, 100);

      expect(screen.queryByTestId('toast-root')).to.equal(null);
    });

    it('allows swiping in multiple directions when specified', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection={['up', 'right']} />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // First test upward swipe
      simulateSwipe(toastElement, 100, 100, 100, 50);

      expect(screen.queryByTestId('toast-root')).to.equal(null);

      // Add another toast to test right swipe
      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));
      const secondToastElement = screen.getByTestId('toast-root');

      simulateSwipe(secondToastElement, 100, 100, 150, 100);

      expect(screen.queryByTestId('toast-root')).to.equal(null);
    });

    it('does not dismiss when swiped in non-specified direction', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="up" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // Swipe right (not allowed)
      simulateSwipe(toastElement, 100, 100, 150, 100);

      expect(screen.queryByTestId('toast-root')).not.to.equal(null);

      // Swipe down (not allowed)
      simulateSwipe(toastElement, 100, 100, 100, 150);

      expect(screen.queryByTestId('toast-root')).not.to.equal(null);
    });

    it('does not dismiss when swipe distance is below threshold', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection="up" />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // Small upward swipe (below threshold)
      simulateSwipe(toastElement, 100, 100, 100, 95);

      expect(screen.queryByTestId('toast-root')).not.to.equal(null);
    });
  });
});
