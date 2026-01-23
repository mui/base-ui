import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import { act, screen, fireEvent, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import type { ToastManagerAddOptions } from '../useToastManager';
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

  it.skipIf(isJSDOM)('recalculates height when content mutates', async () => {
    function ToastList() {
      return Toast.useToastManager().toasts.map((toastItem) => (
        <Toast.Root
          key={toastItem.id}
          toast={toastItem}
          data-testid="toast-root"
          style={{ width: 30 }}
        >
          <Toast.Content>
            <Toast.Title>{toastItem.title}</Toast.Title>
            <Toast.Description>{toastItem.description}</Toast.Description>
          </Toast.Content>
        </Toast.Root>
      ));
    }

    function App() {
      const { add, update } = Toast.useToastManager();
      const [toastId, setToastId] = React.useState<string | null>(null);
      const addedRef = React.useRef(false);

      React.useEffect(() => {
        if (addedRef.current) {
          return;
        }
        addedRef.current = true;
        const id = add({
          id: 'resizable-toast',
          title: 'Loading',
          description: 'Short',
        });
        setToastId(id);
      }, [add]);

      return (
        <div>
          <button
            type="button"
            onClick={() => {
              if (!toastId) {
                return;
              }
              update(toastId, {
                title: 'Success',
                description:
                  'This content is longer than before and should cause the height to increase',
              });
            }}
          >
            update
          </button>
          <Toast.Viewport>
            <ToastList />
          </Toast.Viewport>
        </div>
      );
    }

    await render(
      <Toast.Provider>
        <App />
      </Toast.Provider>,
    );

    const toastRoot = await screen.findByTestId('toast-root');

    await waitFor(() => {
      const height = toastRoot.style.getPropertyValue('--toast-height');
      expect(height).to.not.equal('');
    });

    const initialHeight = parseInt(toastRoot.style.getPropertyValue('--toast-height'), 10);

    fireEvent.click(screen.getByRole('button', { name: 'update' }));

    await waitFor(() => {
      const newHeight = parseInt(toastRoot.style.getPropertyValue('--toast-height'), 10);
      expect(newHeight).to.be.greaterThan(initialHeight);
    });
  });

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

  describe.skipIf(isJSDOM)('swipe behavior', () => {
    function SwipeTestButton({
      toastOptions,
    }: {
      toastOptions?: Partial<ToastManagerAddOptions<any>>;
    } = {}) {
      const { add } = Toast.useToastManager();
      return (
        <button
          type="button"
          onClick={() => {
            add({
              id: 'swipe-test-toast',
              title: 'Swipe Me',
              description: 'Swipe to dismiss',
              ...(toastOptions ?? {}),
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
      return Toast.useToastManager().toasts.map((toastItem) => (
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
      // Fire an initial move event close to the start to trigger the isFirstPointerMoveRef logic correctly.
      // This simulates the finger moving slightly before the main swipe movement is registered.
      let deltaX = 0;
      if (endX > startX) {
        deltaX = 1;
      } else if (endX < startX) {
        deltaX = -1;
      }

      let deltaY = 0;
      if (endY > startY) {
        deltaY = 1;
      } else if (endY < startY) {
        deltaY = -1;
      }

      fireEvent.pointerMove(element, {
        clientX: startX + deltaX,
        clientY: startY + deltaY,
        bubbles: true,
        pointerId: 1,
      });
      // Fire the main move event to the end position.
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

      // Swipe up (starting at y=100, ending at y=55, which is > 40px threshold)
      simulateSwipe(toastElement, 100, 100, 100, 55);

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

      // Swipe up but only by 10px (below 40px threshold)
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
      simulateSwipe(toastElement, 100, 100, 100, 150);

      expect(screen.queryByTestId('toast-root')).not.to.equal(null);
    });

    describe('supports multiple swipe directions', () => {
      it('up + right', async () => {
        await render(
          <Toast.Provider>
            <Toast.Viewport>
              <SwipeTestToast swipeDirection={['up', 'right']} />
            </Toast.Viewport>
            <SwipeTestButton />
          </Toast.Provider>,
        );

        const addToast = screen.getByRole('button', { name: 'add toast' });

        fireEvent.click(addToast);

        // Swipe right
        simulateSwipe(screen.getByTestId('toast-root'), 100, 100, 150, 100);

        await waitFor(() => {
          expect(screen.queryByTestId('toast-root')).to.equal(null);
        });

        fireEvent.click(addToast);

        // Swipe up
        simulateSwipe(screen.getByTestId('toast-root'), 100, 100, 100, 50);

        await waitFor(() => {
          expect(screen.queryByTestId('toast-root')).to.equal(null);
        });
      });

      it('right + left', async () => {
        await render(
          <Toast.Provider>
            <Toast.Viewport>
              <SwipeTestToast swipeDirection={['right', 'left']} />
            </Toast.Viewport>
            <SwipeTestButton />
          </Toast.Provider>,
        );

        const addToast = screen.getByRole('button', { name: 'add toast' });

        fireEvent.click(addToast);

        // Swipe right
        simulateSwipe(screen.getByTestId('toast-root'), 100, 100, 150, 100);

        await waitFor(() => {
          expect(screen.queryByTestId('toast-root')).to.equal(null);
        });

        fireEvent.click(addToast);

        // Swipe left
        simulateSwipe(screen.getByTestId('toast-root'), 100, 100, 50, 100);

        await waitFor(() => {
          expect(screen.queryByTestId('toast-root')).to.equal(null);
        });
      });

      it('up + down', async () => {
        await render(
          <Toast.Provider>
            <Toast.Viewport>
              <SwipeTestToast swipeDirection={['up', 'down']} />
            </Toast.Viewport>
            <SwipeTestButton />
          </Toast.Provider>,
        );

        const addToast = screen.getByRole('button', { name: 'add toast' });

        fireEvent.click(addToast);

        // Swipe up
        simulateSwipe(screen.getByTestId('toast-root'), 100, 100, 100, 50);

        await waitFor(() => {
          expect(screen.queryByTestId('toast-root')).to.equal(null);
        });

        fireEvent.click(addToast);

        // Swipe down
        simulateSwipe(screen.getByTestId('toast-root'), 100, 100, 100, 150);

        await waitFor(() => {
          expect(screen.queryByTestId('toast-root')).to.equal(null);
        });
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

    it('applies [data-swiping] attribute when swiping', async () => {
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

      expect(toastElement.getAttribute('data-swiping')).to.equal('');
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

    it('ignores swipe gestures when toast is anchored', async () => {
      const anchor = document.createElement('div');
      document.body.appendChild(anchor);

      try {
        await render(
          <Toast.Provider>
            <Toast.Viewport>
              <SwipeTestToast swipeDirection="up" />
            </Toast.Viewport>
            <SwipeTestButton
              toastOptions={{
                positionerProps: {
                  anchor,
                },
              }}
            />
          </Toast.Provider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

        const toastElement = screen.getByTestId('toast-root');

        simulateSwipe(toastElement, 100, 100, 100, 55);

        expect(screen.queryByTestId('toast-root')).not.to.equal(null);
      } finally {
        document.body.removeChild(anchor);
      }
    });
  });
});
