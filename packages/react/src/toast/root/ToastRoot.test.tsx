import { expect } from 'vitest';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Toast } from '@base-ui/react/toast';
import { act, screen, fireEvent, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import type { ToastManagerAddOptions } from '../useToastManager';
import { List, Button } from '../utils/test-utils';
import { toastRootStateAttributesMapping } from './ToastRoot';

const toast: Toast.Root.ToastObject = {
  id: 'test',
  title: 'Toast title',
};

function simulateSwipe(
  element: HTMLElement,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  releaseTarget: HTMLElement | Document = element,
  releaseType: 'pointerup' | 'pointercancel' = 'pointerup',
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
  const releaseEvent = {
    clientX: endX,
    clientY: endY,
    bubbles: true,
    pointerId: 1,
  };

  if (releaseType === 'pointercancel') {
    fireEvent.pointerCancel(releaseTarget, releaseEvent);
  } else {
    fireEvent.pointerUp(releaseTarget, releaseEvent);
  }
}

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

  it('maps the active swipe direction to its data attribute', () => {
    expect(toastRootStateAttributesMapping.swipeDirection!('left')).toEqual({
      'data-swipe-direction': 'left',
    });
  });

  it('keeps dynamic title and description ids synchronized with mounted label parts', async () => {
    function App() {
      const [mode, setMode] = React.useState<'fallback' | 'explicit' | 'none' | 'restored'>(
        'fallback',
      );
      const showLabels = mode !== 'none';
      const explicit = mode === 'explicit';

      return (
        <Toast.Provider>
          <button type="button" onClick={() => setMode('explicit')}>
            explicit
          </button>
          <button type="button" onClick={() => setMode('none')}>
            none
          </button>
          <button type="button" onClick={() => setMode('restored')}>
            restore
          </button>
          <Toast.Viewport>
            <Toast.Root toast={{ ...toast, description: 'Toast description' }} data-testid="root">
              {showLabels && (
                <React.Fragment>
                  <Toast.Title data-testid="title">
                    {explicit ? 'Explicit title' : undefined}
                  </Toast.Title>
                  <Toast.Description data-testid="description">
                    {explicit ? 'Explicit description' : undefined}
                  </Toast.Description>
                </React.Fragment>
              )}
            </Toast.Root>
          </Toast.Viewport>
        </Toast.Provider>
      );
    }

    const { user } = await render(<App />);
    const root = screen.getByTestId('root');

    expect(root).toHaveAttribute('aria-labelledby', screen.getByTestId('title').id);
    expect(root).toHaveAttribute('aria-describedby', screen.getByTestId('description').id);

    await user.click(screen.getByRole('button', { name: 'explicit' }));
    expect(root).toHaveAttribute('aria-labelledby', screen.getByTestId('title').id);
    expect(root).toHaveAttribute('aria-describedby', screen.getByTestId('description').id);
    expect(screen.getByTestId('title')).toHaveTextContent('Explicit title');
    expect(screen.getByTestId('description')).toHaveTextContent('Explicit description');

    await user.click(screen.getByRole('button', { name: 'none' }));
    expect(root).not.toHaveAttribute('aria-labelledby');
    expect(root).not.toHaveAttribute('aria-describedby');

    await user.click(screen.getByRole('button', { name: 'restore' }));
    expect(root).toHaveAttribute('aria-labelledby', screen.getByTestId('title').id);
    expect(root).toHaveAttribute('aria-describedby', screen.getByTestId('description').id);
    expect(screen.getByTestId('title')).toHaveTextContent('Toast title');
    expect(screen.getByTestId('description')).toHaveTextContent('Toast description');
  });

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
      expect(height).not.toBe('');
    });

    const initialHeight = parseInt(toastRoot.style.getPropertyValue('--toast-height'), 10);

    fireEvent.click(screen.getByRole('button', { name: 'update' }));

    await waitFor(() => {
      const newHeight = parseInt(toastRoot.style.getPropertyValue('--toast-height'), 10);
      expect(newHeight).toBeGreaterThan(initialHeight);
    });
  });

  it.skipIf(isJSDOM)(
    'clears the starting state and restores the height when re-adding an ending toast',
    async () => {
      const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      function App() {
        const { add, close, toasts } = Toast.useToastManager();

        return (
          <React.Fragment>
            <style>
              {`
              [data-testid="toast-root"] {
                opacity: 1;
                transition: opacity 10s;
              }

              [data-testid="toast-root"][data-ending-style] {
                opacity: 0;
              }
            `}
            </style>
            <button type="button" onClick={() => add({ id: 'save', title: 'Saved', timeout: 0 })}>
              add
            </button>
            <button type="button" onClick={() => close('save')}>
              close
            </button>
            <Toast.Viewport>
              {toasts.map((toastItem) => (
                <Toast.Root key={toastItem.id} toast={toastItem} data-testid="toast-root">
                  <Toast.Title />
                </Toast.Root>
              ))}
            </Toast.Viewport>
          </React.Fragment>
        );
      }

      try {
        const { user } = await render(
          <Toast.Provider>
            <App />
          </Toast.Provider>,
        );

        await user.click(screen.getByRole('button', { name: 'add' }));
        const toastRoot = screen.getByTestId('toast-root');
        expect(toastRoot).not.toHaveAttribute('data-starting-style');
        const initialHeight = toastRoot.style.getPropertyValue('--toast-height');
        expect(initialHeight).not.toBe('');

        await user.click(screen.getByRole('button', { name: 'close' }));
        expect(toastRoot).toHaveAttribute('data-ending-style');
        expect(toastRoot.style.getPropertyValue('--toast-height')).toBe('');

        await user.click(screen.getByRole('button', { name: 'add' }));
        expect(screen.getByTestId('toast-root')).toBe(toastRoot);

        await waitFor(() => {
          expect(toastRoot).not.toHaveAttribute('data-starting-style');
        });
        await waitFor(() => {
          expect(toastRoot.style.getPropertyValue('--toast-height')).toBe(initialHeight);
        });
      } finally {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
      }
    },
  );

  it.skipIf(isJSDOM)('registers an active toast after its root remounts', async () => {
    function App() {
      const { add, toasts } = Toast.useToastManager();
      const [showToasts, setShowToasts] = React.useState(true);
      const [longTitle, setLongTitle] = React.useState(false);

      return (
        <React.Fragment>
          <button type="button" onClick={() => add({ id: 'save', title: 'Saved', timeout: 0 })}>
            add
          </button>
          <button type="button" onClick={() => setShowToasts(false)}>
            hide
          </button>
          <button
            type="button"
            onClick={() => {
              setLongTitle(true);
              setShowToasts(true);
            }}
          >
            show
          </button>
          <Toast.Viewport>
            {showToasts
              ? toasts.map((toastItem) => (
                  <Toast.Root
                    key={toastItem.id}
                    toast={toastItem}
                    data-testid="toast-root"
                    style={{ width: 30 }}
                  >
                    <Toast.Title>
                      {longTitle ? 'This title is much longer than before' : undefined}
                    </Toast.Title>
                  </Toast.Root>
                ))
              : null}
          </Toast.Viewport>
        </React.Fragment>
      );
    }

    const { user } = await render(
      <Toast.Provider>
        <App />
      </Toast.Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'add' }));
    const initialRoot = screen.getByTestId('toast-root');
    expect(initialRoot).not.toHaveAttribute('data-starting-style');
    const initialHeight = parseInt(initialRoot.style.getPropertyValue('--toast-height'), 10);

    await user.click(screen.getByRole('button', { name: 'hide' }));
    expect(screen.queryByTestId('toast-root')).toBe(null);

    await user.click(screen.getByRole('button', { name: 'show' }));
    const remountedRoot = screen.getByTestId('toast-root');
    expect(remountedRoot).not.toBe(initialRoot);

    await waitFor(() => {
      const remountedHeight = parseInt(remountedRoot.style.getPropertyValue('--toast-height'), 10);
      expect(remountedHeight).toBeGreaterThan(initialHeight);
    });

    await user.keyboard('{F6}');
    await user.keyboard('{Tab}');

    expect(remountedRoot).toHaveFocus();
  });

  it.skipIf(isJSDOM)(
    'keeps stacking intact when re-adding an ending toast among other toasts',
    async () => {
      const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      function App() {
        const { add, close, toasts } = Toast.useToastManager();

        return (
          <React.Fragment>
            <style>
              {`
              [data-testid^="toast-"] {
                opacity: 1;
                transition: opacity 10s;
              }

              [data-testid^="toast-"][data-ending-style] {
                opacity: 0;
              }
            `}
            </style>
            <button type="button" onClick={() => add({ id: 't1', title: 'One', timeout: 0 })}>
              add-1
            </button>
            <button type="button" onClick={() => add({ id: 't2', title: 'Two', timeout: 0 })}>
              add-2
            </button>
            <button type="button" onClick={() => close('t1')}>
              close-1
            </button>
            <Toast.Viewport>
              {toasts.map((toastItem) => (
                <Toast.Root
                  key={toastItem.id}
                  toast={toastItem}
                  data-testid={`toast-${toastItem.id}`}
                >
                  <Toast.Content data-testid={`content-${toastItem.id}`}>
                    <Toast.Title />
                  </Toast.Content>
                </Toast.Root>
              ))}
            </Toast.Viewport>
          </React.Fragment>
        );
      }

      try {
        const { user } = await render(
          <Toast.Provider>
            <App />
          </Toast.Provider>,
        );

        await user.click(screen.getByRole('button', { name: 'add-1' }));
        await user.click(screen.getByRole('button', { name: 'add-2' }));
        await user.click(screen.getByRole('button', { name: 'close-1' }));

        const toast1 = screen.getByTestId('toast-t1');
        expect(toast1).toHaveAttribute('data-ending-style');

        await user.click(screen.getByRole('button', { name: 'add-1' }));

        await waitFor(() => {
          expect(toast1).not.toHaveAttribute('data-starting-style');
        });
        await waitFor(() => {
          expect(toast1.style.getPropertyValue('--toast-height')).not.toBe('');
        });

        // The revived toast is frontmost and its content is not hidden as "behind".
        expect(toast1.style.getPropertyValue('--toast-index')).toBe('0');
        expect(screen.getByTestId('content-t1')).not.toHaveAttribute('data-behind');

        // The unrelated toast is unaffected and stacks behind the revived one.
        const toast2 = screen.getByTestId('toast-t2');
        expect(toast2).not.toHaveAttribute('data-ending-style');
        expect(toast2.style.getPropertyValue('--toast-index')).toBe('1');
        expect(screen.getByTestId('content-t2')).toHaveAttribute('data-behind');
      } finally {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
      }
    },
  );

  it.skipIf(isJSDOM)('clears swipe state when re-adding a swipe-dismissed toast', async () => {
    const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    function App() {
      const { add, toasts } = Toast.useToastManager();

      return (
        <React.Fragment>
          <style>
            {`
            [data-testid="toast-root"] {
              opacity: 1;
              transition: opacity 10s;
            }

            [data-testid="toast-root"][data-ending-style] {
              opacity: 0;
            }
          `}
          </style>
          <button type="button" onClick={() => add({ id: 'save', title: 'Saved', timeout: 0 })}>
            add
          </button>
          <Toast.Viewport>
            {toasts.map((toastItem) => (
              <Toast.Root
                key={toastItem.id}
                toast={toastItem}
                data-testid="toast-root"
                swipeDirection="right"
              >
                <Toast.Title />
              </Toast.Root>
            ))}
          </Toast.Viewport>
        </React.Fragment>
      );
    }

    try {
      const { user } = await render(
        <Toast.Provider>
          <App />
        </Toast.Provider>,
      );

      await user.click(screen.getByRole('button', { name: 'add' }));
      const toastRoot = screen.getByTestId('toast-root');
      Object.defineProperty(toastRoot, 'setPointerCapture', {
        configurable: true,
        value: () => {},
      });
      Object.defineProperty(toastRoot, 'releasePointerCapture', {
        configurable: true,
        value: () => {},
      });

      simulateSwipe(toastRoot, 100, 100, 160, 100);

      expect(toastRoot).toHaveAttribute('data-ending-style');
      expect(toastRoot).toHaveAttribute('data-swipe-direction', 'right');

      await user.click(screen.getByRole('button', { name: 'add' }));
      expect(screen.getByTestId('toast-root')).toBe(toastRoot);

      await waitFor(() => {
        expect(toastRoot).not.toHaveAttribute('data-starting-style');
      });
      await waitFor(() => {
        expect(toastRoot).not.toHaveAttribute('data-swipe-direction');
      });
      expect(toastRoot.style.getPropertyValue('--toast-swipe-movement-x')).toBe('0px');
      expect(toastRoot.style.getPropertyValue('--toast-swipe-movement-y')).toBe('0px');
    } finally {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
    }
  });

  it.skipIf(isJSDOM)(
    'clears swipe state when a retained root is reused for another toast',
    async () => {
      const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      function App() {
        const { add, toasts } = Toast.useToastManager();

        return (
          <React.Fragment>
            <style>
              {`
              [data-testid^="root-"] {
                opacity: 1;
                transition: opacity 10s;
              }

              [data-testid^="root-"][data-ending-style] {
                opacity: 0;
              }
            `}
            </style>
            <button type="button" onClick={() => add({ title: 'Saved', timeout: 0 })}>
              add
            </button>
            <Toast.Viewport>
              {toasts.map((toastItem, index) => (
                <Toast.Root
                  key={index}
                  toast={toastItem}
                  data-testid={`root-${index}`}
                  swipeDirection="right"
                >
                  <Toast.Title />
                </Toast.Root>
              ))}
            </Toast.Viewport>
          </React.Fragment>
        );
      }

      try {
        const { user } = await render(
          <Toast.Provider>
            <App />
          </Toast.Provider>,
        );

        const addButton = screen.getByRole('button', { name: 'add' });
        await user.click(addButton);
        await user.click(addButton);
        await user.click(addButton);

        const swipedRoot = screen.getByTestId('root-1');
        Object.defineProperty(swipedRoot, 'setPointerCapture', {
          configurable: true,
          value: () => {},
        });
        Object.defineProperty(swipedRoot, 'releasePointerCapture', {
          configurable: true,
          value: () => {},
        });

        simulateSwipe(swipedRoot, 100, 100, 160, 100);
        expect(swipedRoot).toHaveAttribute('data-swipe-direction', 'right');

        // Index keys shift every retained root onto a different toast, so this root now
        // renders a toast that was never swiped.
        await user.click(addButton);
        expect(screen.getByTestId('root-1')).toBe(swipedRoot);

        await waitFor(() => {
          expect(swipedRoot).not.toHaveAttribute('data-swipe-direction');
        });
        expect(swipedRoot).not.toHaveAttribute('data-ending-style');
        expect(swipedRoot.style.getPropertyValue('--toast-swipe-movement-x')).toBe('0px');
        expect(swipedRoot.style.getPropertyValue('--toast-swipe-movement-y')).toBe('0px');
      } finally {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
      }
    },
  );

  it.skipIf(isJSDOM)(
    'moves focus to the next toast when closing in an index-keyed list',
    async () => {
      const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      function App() {
        const { add, toasts } = Toast.useToastManager();

        return (
          <React.Fragment>
            <style>
              {`
              [data-testid^="root-"] {
                opacity: 1;
                transition: opacity 10s;
              }

              [data-testid^="root-"][data-ending-style] {
                opacity: 0;
              }
            `}
            </style>
            <button type="button" onClick={() => add({ title: 'Saved', timeout: 0 })}>
              add
            </button>
            <Toast.Viewport>
              {toasts.map((toastItem, index) => (
                <Toast.Root key={index} toast={toastItem} data-testid={`root-${index}`}>
                  <Toast.Title />
                </Toast.Root>
              ))}
            </Toast.Viewport>
          </React.Fragment>
        );
      }

      try {
        const { user } = await render(
          <Toast.Provider>
            <App />
          </Toast.Provider>,
        );

        // With index keys, each add shifts every retained root to a different toast,
        // so the store refs must be re-registered per toast id.
        await user.click(screen.getByRole('button', { name: 'add' }));
        await user.click(screen.getByRole('button', { name: 'add' }));
        await user.click(screen.getByRole('button', { name: 'add' }));

        await user.keyboard('{F6}');
        await user.keyboard('{Tab}');
        expect(screen.getByTestId('root-0')).toHaveFocus();

        await user.keyboard('{Escape}');

        // Focus hands off to the next active toast, not the one animating out.
        await waitFor(() => {
          expect(screen.getByTestId('root-1')).toHaveFocus();
        });
      } finally {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
      }
    },
  );

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

    expect(screen.queryByTestId('root')).toBe(null);
  });

  it('ignores Escape when focus is in portaled content', async () => {
    function PortalList() {
      return Toast.useToastManager().toasts.map((toastItem) => (
        <Toast.Root key={toastItem.id} toast={toastItem} data-testid="root">
          <Toast.Title>{toastItem.title}</Toast.Title>
          {ReactDOM.createPortal(
            <button type="button" data-testid="portaled">
              portaled
            </button>,
            document.body,
          )}
        </Toast.Root>
      ));
    }

    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport>
          <PortalList />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'add' }));

    // The button is a React child of the toast, so the key event bubbles to the
    // toast, but it lives outside the toast in the DOM and owns the Escape key.
    await act(async () => screen.getByTestId('portaled').focus());
    await user.keyboard('{Escape}');

    expect(screen.queryByTestId('root')).not.toBe(null);
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

    it.each([
      ['left', -60, 0],
      ['right', 60, 0],
      ['up', 0, -60],
      ['down', 0, 60],
    ] as const)('dismisses with a real %s pointer swipe', async (direction, deltaX, deltaY) => {
      const { user } = await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection={direction} />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      await user.click(screen.getByRole('button', { name: 'add toast' }));
      const toastElement = screen.getByTestId('toast-root');
      Object.defineProperty(toastElement, 'setPointerCapture', {
        configurable: true,
        value: () => {},
      });
      Object.defineProperty(toastElement, 'releasePointerCapture', {
        configurable: true,
        value: () => {},
      });
      const rect = toastElement.getBoundingClientRect();
      const start = {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      };

      await user.pointer([
        { target: toastElement, coords: start, keys: '[TouchA>]' },
        {
          target: toastElement,
          pointerName: 'TouchA',
          coords: {
            clientX: start.clientX + Math.sign(deltaX),
            clientY: start.clientY + Math.sign(deltaY),
          },
        },
        {
          target: toastElement,
          pointerName: 'TouchA',
          coords: { clientX: start.clientX + deltaX, clientY: start.clientY + deltaY },
        },
        { keys: '[/TouchA]' },
      ]);

      await waitFor(() => expect(screen.queryByTestId('toast-root')).toBe(null));
    });

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
        expect(screen.queryByTestId('toast-root')).toBe(null);
      });
    });

    it('locks to a single axis on the first move of a two-axis swipe', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection={['down', 'right']} />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');
      Object.defineProperty(toastElement, 'setPointerCapture', {
        configurable: true,
        value: () => {},
      });
      Object.defineProperty(toastElement, 'releasePointerCapture', {
        configurable: true,
        value: () => {},
      });

      fireEvent.pointerDown(toastElement, {
        clientX: 100,
        clientY: 100,
        button: 0,
        bubbles: true,
        pointerId: 1,
      });
      fireEvent.pointerMove(toastElement, {
        clientX: 101,
        clientY: 101,
        bubbles: true,
        pointerId: 1,
      });
      fireEvent.pointerMove(toastElement, {
        clientX: 120,
        clientY: 150,
        bubbles: true,
        pointerId: 1,
      });

      expect(toastElement.style.getPropertyValue('--toast-swipe-movement-x')).toBe('0px');
      expect(toastElement.style.getPropertyValue('--toast-swipe-movement-y')).not.toBe('0px');

      fireEvent.pointerUp(toastElement, {
        clientX: 120,
        clientY: 150,
        bubbles: true,
        pointerId: 1,
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

      expect(screen.queryByTestId('toast-root')).not.toBe(null);
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

      expect(screen.queryByTestId('toast-root')).not.toBe(null);
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
          expect(screen.queryByTestId('toast-root')).toBe(null);
        });

        fireEvent.click(addToast);

        // Swipe up
        simulateSwipe(screen.getByTestId('toast-root'), 100, 100, 100, 50);

        await waitFor(() => {
          expect(screen.queryByTestId('toast-root')).toBe(null);
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
          expect(screen.queryByTestId('toast-root')).toBe(null);
        });

        fireEvent.click(addToast);

        // Swipe left
        simulateSwipe(screen.getByTestId('toast-root'), 100, 100, 50, 100);

        await waitFor(() => {
          expect(screen.queryByTestId('toast-root')).toBe(null);
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
          expect(screen.queryByTestId('toast-root')).toBe(null);
        });

        fireEvent.click(addToast);

        // Swipe down
        simulateSwipe(screen.getByTestId('toast-root'), 100, 100, 100, 150);

        await waitFor(() => {
          expect(screen.queryByTestId('toast-root')).toBe(null);
        });
      });
    });

    it('cancels a vertical swipe when the pointer changes its mind', async () => {
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
      fireEvent.pointerMove(toastElement, {
        clientX: 100,
        clientY: 99,
        movementY: -1,
        pointerId: 1,
      });

      // Swipe up well past the dismiss threshold to arm the gesture.
      fireEvent.pointerMove(toastElement, {
        clientX: 100,
        clientY: 10,
        movementY: -89,
        pointerId: 1,
      });
      expect(toastElement).toHaveAttribute('data-swipe-direction', 'up');

      // Reversing moves the cancel baseline to the turning point, so the swipe
      // is now measured as zero progress from there rather than 50px from the
      // original press, and the change of mind wins.
      fireEvent.pointerMove(toastElement, {
        clientX: 100,
        clientY: 50,
        movementY: 40,
        pointerId: 1,
      });
      fireEvent.pointerUp(toastElement, { clientX: 100, clientY: 50, pointerId: 1 });

      expect(screen.queryByTestId('toast-root')).not.toBe(null);
      expect(toastElement).not.toHaveAttribute('data-swipe-direction');
      expect(toastElement.style.getPropertyValue('--toast-swipe-movement-y')).toBe('0px');
    });

    it('cancels a horizontal swipe when the pointer changes its mind', async () => {
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

      fireEvent.pointerDown(toastElement, { clientX: 100, clientY: 100, button: 0, pointerId: 1 });
      fireEvent.pointerMove(toastElement, {
        clientX: 101,
        clientY: 100,
        movementX: 1,
        pointerId: 1,
      });

      fireEvent.pointerMove(toastElement, {
        clientX: 190,
        clientY: 100,
        movementX: 89,
        pointerId: 1,
      });
      expect(toastElement).toHaveAttribute('data-swipe-direction', 'right');

      fireEvent.pointerMove(toastElement, {
        clientX: 150,
        clientY: 100,
        movementX: -40,
        pointerId: 1,
      });
      fireEvent.pointerUp(toastElement, { clientX: 150, clientY: 100, pointerId: 1 });

      expect(screen.queryByTestId('toast-root')).not.toBe(null);
      expect(toastElement).not.toHaveAttribute('data-swipe-direction');
      expect(toastElement.style.getPropertyValue('--toast-swipe-movement-x')).toBe('0px');
    });

    it('locks the gesture to the horizontal axis when it starts sideways', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection={['down', 'right']} />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      fireEvent.pointerDown(toastElement, { clientX: 100, clientY: 100, button: 0, pointerId: 1 });
      fireEvent.pointerMove(toastElement, { clientX: 100, clientY: 100, pointerId: 1 });

      // Mostly sideways, so the gesture locks to the horizontal axis.
      fireEvent.pointerMove(toastElement, { clientX: 95, clientY: 98, pointerId: 1 });

      // Left is not a dismissible direction, so nothing gets armed.
      fireEvent.pointerMove(toastElement, { clientX: 90, clientY: 98, pointerId: 1 });
      expect(toastElement).not.toHaveAttribute('data-swipe-direction');

      // Back at the origin the horizontal delta is exactly zero.
      fireEvent.pointerMove(toastElement, { clientX: 100, clientY: 98, pointerId: 1 });
      expect(toastElement).not.toHaveAttribute('data-swipe-direction');

      // Dragging far downwards and slightly right: without the axis lock the
      // larger vertical delta would arm `down` instead.
      fireEvent.pointerMove(toastElement, { clientX: 110, clientY: 220, pointerId: 1 });
      expect(toastElement).toHaveAttribute('data-swipe-direction', 'right');

      fireEvent.pointerMove(toastElement, { clientX: 160, clientY: 220, pointerId: 1 });
      fireEvent.pointerUp(toastElement, { clientX: 160, clientY: 220, pointerId: 1 });

      await waitFor(() => {
        expect(screen.queryByTestId('toast-root')).toBe(null);
      });
    });

    it('locks the gesture to the vertical axis when it starts upright', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <SwipeTestToast swipeDirection={['down', 'right']} />
          </Toast.Viewport>
          <SwipeTestButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      fireEvent.pointerDown(toastElement, { clientX: 100, clientY: 100, button: 0, pointerId: 1 });
      fireEvent.pointerMove(toastElement, { clientX: 100, clientY: 100, pointerId: 1 });

      // Mostly upright, so the gesture locks to the vertical axis.
      fireEvent.pointerMove(toastElement, { clientX: 98, clientY: 95, pointerId: 1 });

      fireEvent.pointerMove(toastElement, { clientX: 98, clientY: 90, pointerId: 1 });
      expect(toastElement).not.toHaveAttribute('data-swipe-direction');

      fireEvent.pointerMove(toastElement, { clientX: 98, clientY: 100, pointerId: 1 });
      expect(toastElement).not.toHaveAttribute('data-swipe-direction');

      // Dragging far to the right and slightly down: without the axis lock the
      // larger horizontal delta would arm `right` instead.
      fireEvent.pointerMove(toastElement, { clientX: 220, clientY: 110, pointerId: 1 });
      expect(toastElement).toHaveAttribute('data-swipe-direction', 'down');

      fireEvent.pointerMove(toastElement, { clientX: 220, clientY: 160, pointerId: 1 });
      fireEvent.pointerUp(toastElement, { clientX: 220, clientY: 160, pointerId: 1 });

      await waitFor(() => {
        expect(screen.queryByTestId('toast-root')).toBe(null);
      });
    });

    it('does not start a swipe from a non-primary pointer button', async () => {
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

      fireEvent.pointerDown(toastElement, { clientX: 100, clientY: 100, button: 2, pointerId: 1 });

      expect(toastElement).not.toHaveAttribute('data-swiping');

      fireEvent.pointerMove(toastElement, { clientX: 200, clientY: 100, pointerId: 1 });
      fireEvent.pointerUp(toastElement, { clientX: 200, clientY: 100, pointerId: 1 });

      expect(screen.queryByTestId('toast-root')).not.toBe(null);
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

      expect(toastElement.getAttribute('data-swiping')).toBe('');
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

      expect(screen.queryByTestId('toast-root')).toBe(null);
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

      expect(screen.queryByTestId('toast-root')).toBe(null);
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

      expect(screen.queryByTestId('toast-root')).toBe(null);
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

      expect(screen.queryByTestId('toast-root')).toBe(null);

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));
      const secondToastElement = screen.getByTestId('toast-root');

      simulateSwipe(secondToastElement, 100, 100, 150, 100);

      expect(screen.queryByTestId('toast-root')).toBe(null);
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

      expect(screen.queryByTestId('toast-root')).not.toBe(null);

      // Swipe down (not allowed)
      simulateSwipe(toastElement, 100, 100, 100, 150);

      expect(screen.queryByTestId('toast-root')).not.toBe(null);
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

      expect(screen.queryByTestId('toast-root')).not.toBe(null);
    });

    it('prevents native touchmove only during an active touch swipe', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <Toast.Root toast={toast} data-testid="toast-root" swipeDirection="up">
              <Toast.Title>{toast.title}</Toast.Title>
            </Toast.Root>
          </Toast.Viewport>
        </Toast.Provider>,
      );

      const toastElement = screen.getByTestId('toast-root');
      Object.defineProperty(toastElement, 'setPointerCapture', {
        value: () => {},
        configurable: true,
      });

      const beforeSwipeEvent = new Event('touchmove', { bubbles: true, cancelable: true });
      toastElement.dispatchEvent(beforeSwipeEvent);
      expect(beforeSwipeEvent.defaultPrevented).toBe(false);

      fireEvent.pointerDown(toastElement, {
        clientX: 100,
        clientY: 100,
        button: 0,
        pointerId: 1,
        pointerType: 'touch',
      });

      const duringSwipeEvent = new Event('touchmove', { bubbles: true, cancelable: true });
      toastElement.dispatchEvent(duringSwipeEvent);
      expect(duringSwipeEvent.defaultPrevented).toBe(true);

      fireEvent.pointerCancel(toastElement, { pointerId: 1, pointerType: 'touch' });

      const afterSwipeEvent = new Event('touchmove', { bubbles: true, cancelable: true });
      toastElement.dispatchEvent(afterSwipeEvent);
      expect(afterSwipeEvent.defaultPrevented).toBe(false);
    });

    it('does not start swiping from elements with the data-base-ui-swipe-ignore attribute', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <Toast.Root toast={toast} data-testid="toast-root" swipeDirection="up">
              <div data-base-ui-swipe-ignore data-testid="ignore-target">
                Ignore swipe
              </div>
            </Toast.Root>
          </Toast.Viewport>
        </Toast.Provider>,
      );

      const toastElement = screen.getByTestId('toast-root');
      const ignoreTarget = screen.getByTestId('ignore-target');

      fireEvent.pointerDown(ignoreTarget, { clientX: 100, clientY: 100, button: 0, pointerId: 1 });

      expect(toastElement).not.toHaveAttribute('data-swiping');
    });

    it('does not start swiping from elements with the legacy data-swipe-ignore attribute', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <Toast.Root toast={toast} data-testid="toast-root" swipeDirection="up">
              <div data-swipe-ignore data-testid="ignore-target">
                Ignore swipe
              </div>
            </Toast.Root>
          </Toast.Viewport>
        </Toast.Provider>,
      );

      const toastElement = screen.getByTestId('toast-root');
      const ignoreTarget = screen.getByTestId('ignore-target');

      fireEvent.pointerDown(ignoreTarget, { clientX: 100, clientY: 100, button: 0, pointerId: 1 });

      expect(toastElement).not.toHaveAttribute('data-swiping');
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

        expect(screen.queryByTestId('toast-root')).not.toBe(null);
      } finally {
        document.body.removeChild(anchor);
      }
    });
  });

  describe('drag behavior regression', () => {
    function DragList() {
      return Toast.useToastManager().toasts.map((toastItem) => (
        <Toast.Root key={toastItem.id} toast={toastItem} data-testid="toast-root">
          <Toast.Content data-testid="toast-content">
            <Toast.Title>{toastItem.title}</Toast.Title>
            <Toast.Description>{toastItem.description}</Toast.Description>
          </Toast.Content>
        </Toast.Root>
      ));
    }

    function DragButton() {
      const { add } = Toast.useToastManager();
      return (
        <button
          type="button"
          onClick={() => {
            add({ title: 'T', description: 'D' });
          }}
        >
          add toast
        </button>
      );
    }

    it('resets drag state after releasing a far swipe even when the release lands on the document', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <DragList />
          </Toast.Viewport>
          <DragButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      // Default swipeDirection=['down','right']. Dragging left triggers the damped, opposite-
      // direction path. Release on the document to cover browsers that don't deliver the final
      // pointer event back to the toast root.
      simulateSwipe(toastElement, 300, 100, -5000, 100, document);

      expect(toastElement).not.toHaveAttribute('data-swiping');
      expect(toastElement).not.toHaveAttribute('data-swipe-direction');
      expect(toastElement.style.getPropertyValue('--toast-swipe-movement-x')).toBe('0px');
      expect(toastElement.style.getPropertyValue('--toast-swipe-movement-y')).toBe('0px');
      expect(toastElement.style.transition).toBe('');
      expect(toastElement.style.transform).toBe('');

      simulateSwipe(toastElement, 100, 100, 150, 100);

      await waitFor(() => {
        expect(screen.queryByTestId('toast-root')).toBe(null);
      });
    });

    it('resets drag state after a document pointercancel', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <DragList />
          </Toast.Viewport>
          <DragButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = screen.getByTestId('toast-root');

      simulateSwipe(toastElement, 300, 100, -5000, 100, document, 'pointercancel');

      expect(toastElement).not.toHaveAttribute('data-swiping');
      expect(toastElement).not.toHaveAttribute('data-swipe-direction');
      expect(toastElement.style.getPropertyValue('--toast-swipe-movement-x')).toBe('0px');
      expect(toastElement.style.getPropertyValue('--toast-swipe-movement-y')).toBe('0px');
      expect(toastElement.style.transition).toBe('');
      expect(toastElement.style.transform).toBe('');
    });
  });

  describe('object identity', () => {
    // Regression test for https://github.com/mui/base-ui/issues/3922
    // Toast calculations should use ID-based lookups, not referential equality
    it('works correctly when toast objects are recreated (not referentially equal)', async () => {
      // This component wraps useToastManager and creates NEW toast objects
      // by spreading them. This is a common pattern when users want to
      // add type-safety to the data field or transform toast properties.
      function ToastListWithNewObjects() {
        const { toasts } = Toast.useToastManager();

        // Create new objects - this breaks referential equality
        const transformedToasts = toasts.map((t) => ({
          ...t,
          // Users might transform data for type-safety, like:
          // data: parseToastData(t.data)
        }));

        return transformedToasts.map((toastItem) => (
          <Toast.Root key={toastItem.id} toast={toastItem} data-testid="toast-root">
            <Toast.Title>{toastItem.title}</Toast.Title>
            <Toast.Description>{toastItem.description}</Toast.Description>
            <Toast.Close data-testid="toast-close">Close</Toast.Close>
          </Toast.Root>
        ));
      }

      function AddButton() {
        const { add } = Toast.useToastManager();
        return (
          <button
            type="button"
            onClick={() => {
              add({
                id: 'test-toast',
                title: 'Test Title',
                description: 'Test Description',
              });
            }}
          >
            add toast
          </button>
        );
      }

      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <ToastListWithNewObjects />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

      const toastElement = await screen.findByTestId('toast-root');

      // Verify the toast index is correctly calculated (should be 0, not -1)
      // The --toast-index CSS variable is set based on the domIndex calculation
      await waitFor(() => {
        const toastIndex = toastElement.style.getPropertyValue('--toast-index');
        expect(toastIndex).toBe('0');
      });

      // Verify the close button works (which also relies on ID-based lookup)
      fireEvent.click(screen.getByTestId('toast-close'));

      await waitFor(() => {
        expect(screen.queryByTestId('toast-root')).toBe(null);
      });
    });

    it('correctly calculates indices for multiple toasts with recreated objects', async () => {
      function ToastListWithNewObjects() {
        const { toasts } = Toast.useToastManager();

        // Create new objects - this breaks referential equality
        const transformedToasts = toasts.map((t) => ({ ...t }));

        return transformedToasts.map((toastItem) => (
          <Toast.Root key={toastItem.id} toast={toastItem} data-testid={`toast-${toastItem.id}`}>
            <Toast.Title>{toastItem.title}</Toast.Title>
          </Toast.Root>
        ));
      }

      function AddButton() {
        const { add } = Toast.useToastManager();
        return (
          <button
            type="button"
            onClick={() => {
              add({ title: 'Toast 1' });
              add({ title: 'Toast 2' });
              add({ title: 'Toast 3' });
            }}
          >
            add toasts
          </button>
        );
      }

      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <ToastListWithNewObjects />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add toasts' }));

      // Wait for all toasts to appear
      const toasts = await screen.findAllByTestId(/^toast-/);
      expect(toasts).toHaveLength(3);

      // Verify each toast has a valid (non-negative) index
      await waitFor(() => {
        toasts.forEach((toastEl) => {
          const toastIndex = parseInt(toastEl.style.getPropertyValue('--toast-index'), 10);
          expect(toastIndex).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });
});
