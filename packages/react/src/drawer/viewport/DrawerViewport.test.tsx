import { DrawerPreview as Drawer } from '@base-ui/react/drawer';
import { Slider } from '@base-ui/react/slider';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createRenderer } from '#test-utils';

describe('<Drawer.Viewport />', () => {
  beforeAll(function beforeHook() {
    // PointerEvent not fully implemented in jsdom, causing fireEvent.pointer* to ignore options.
    // https://github.com/jsdom/jsdom/issues/2527
    (window as any).PointerEvent = window.MouseEvent;
  });

  const { render } = createRenderer();

  function createTouch(target: EventTarget, point: { clientX: number; clientY: number }) {
    if (typeof Touch === 'function') {
      return new Touch({
        identifier: 1,
        target,
        ...point,
      });
    }

    return point;
  }

  it('clears text selection on swipe start', async () => {
    await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup data-testid="popup">
              <Drawer.Content>
                <span data-testid="text">Selectable</span>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const text = screen.getByTestId('text');
    expect(text.firstChild).toBeTruthy();

    const selection = window.getSelection();
    expect(selection).not.toBeNull();
    if (!selection || !text.firstChild) {
      return;
    }

    const range = document.createRange();
    range.setStart(text.firstChild, 0);
    range.setEnd(text.firstChild, 5);
    selection.removeAllRanges();
    selection.addRange(range);
    expect(selection.isCollapsed).toBe(false);

    const popup = screen.getByTestId('popup');
    const viewport = screen.getByTestId('viewport');

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;

    try {
      fireEvent.pointerDown(viewport, {
        button: 0,
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 0,
        pointerType: 'mouse',
      });
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(selection.rangeCount).toBe(0);
  });

  it('does not clear text selection on touch swipe start', async () => {
    await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup data-testid="popup">
              <Drawer.Content>
                <span data-testid="text">Selectable</span>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const text = screen.getByTestId('text');
    expect(text.firstChild).toBeTruthy();

    const selection = window.getSelection();
    expect(selection).not.toBeNull();
    if (!selection || !text.firstChild) {
      return;
    }

    const range = document.createRange();
    range.setStart(text.firstChild, 0);
    range.setEnd(text.firstChild, 5);
    selection.removeAllRanges();
    selection.addRange(range);
    expect(selection.isCollapsed).toBe(false);

    const popup = screen.getByTestId('popup');
    const viewport = screen.getByTestId('viewport');

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;

    try {
      fireEvent.touchStart(viewport, {
        touches: [
          createTouch(viewport, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(selection.rangeCount).toBe(1);
  });

  it('starts touch swipes from interactive elements', async () => {
    await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup data-testid="popup">
              <button type="button" data-testid="button">
                Action
              </button>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    await flushMicrotasks();

    const button = screen.getByTestId('button');
    const backdrop = screen.getByTestId('backdrop');

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => button;

    try {
      fireEvent.touchStart(button, {
        touches: [
          createTouch(button, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      await flushMicrotasks();

      expect(backdrop).toHaveAttribute('data-swiping', '');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('does not jump when touch starts outside the popup and then enters it', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup data-testid="popup">
              <Drawer.Content>Content</Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const viewport = screen.getByTestId('viewport');
    const popup = screen.getByTestId('popup');
    const backdrop = screen.getByTestId('backdrop');
    Object.defineProperty(popup, 'offsetHeight', { value: 200, configurable: true });

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = (_x, y) => (y < 100 ? viewport : popup);

    try {
      fireEvent.touchStart(viewport, {
        touches: [
          createTouch(viewport, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      fireEvent.touchMove(viewport, {
        touches: [
          createTouch(viewport, {
            clientX: 0,
            clientY: 120,
          }),
        ],
      });

      await flushMicrotasks();

      expect(backdrop).toHaveAttribute('data-swiping', '');
      expect(Number.parseFloat(popup.style.getPropertyValue('--drawer-swipe-movement-y'))).toBe(0);
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('dismisses when touch starts outside the popup, then continues swiping down inside it', async () => {
    const handleOpenChange = vi.fn();

    await render(
      <Drawer.Root open onOpenChange={handleOpenChange} swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup data-testid="popup">
              <Drawer.Content>Content</Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const viewport = screen.getByTestId('viewport');
    const popup = screen.getByTestId('popup');
    Object.defineProperty(popup, 'offsetHeight', { value: 200, configurable: true });

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = (_x, y) => (y < 100 ? viewport : popup);

    try {
      fireEvent.touchStart(viewport, {
        touches: [
          createTouch(viewport, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      fireEvent.touchMove(viewport, {
        touches: [
          createTouch(viewport, {
            clientX: 0,
            clientY: 120,
          }),
        ],
      });

      fireEvent.touchMove(viewport, {
        touches: [
          createTouch(viewport, {
            clientX: 0,
            clientY: 170,
          }),
        ],
      });

      fireEvent.touchEnd(viewport, {
        changedTouches: [
          createTouch(viewport, {
            clientX: 0,
            clientY: 170,
          }),
        ],
      });

      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(handleOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'swipe' }),
    );
  });

  it('treats pen interactions on swipe-ignored content as non-touch swipes', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup>
              <Drawer.Content>
                <button type="button" data-testid="button">
                  Action
                </button>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    await flushMicrotasks();

    const button = screen.getByTestId('button');
    const backdrop = screen.getByTestId('backdrop');

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => button;

    try {
      const pointerDownEvent = new Event('pointerdown', {
        bubbles: true,
        cancelable: true,
      }) as PointerEvent;

      Object.defineProperties(pointerDownEvent, {
        button: { value: 0 },
        buttons: { value: 1 },
        pointerId: { value: 1 },
        pointerType: { value: 'pen' },
        clientX: { value: 0 },
        clientY: { value: 0 },
      });

      fireEvent(button, pointerDownEvent);

      fireEvent.touchStart(button, {
        touches: [
          createTouch(button, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      await flushMicrotasks();

      expect(backdrop).not.toHaveAttribute('data-swiping');

      const prevented = fireEvent.touchMove(button, {
        touches: [
          createTouch(button, {
            clientX: 0,
            clientY: 10,
          }),
        ],
      });

      expect(prevented).toBe(true);
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('does not mark nested drawers as swiping until movement passes the threshold', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Viewport data-testid="parent-viewport">
            <Drawer.Popup data-testid="parent-popup">
              <Drawer.Root open swipeDirection="down">
                <Drawer.Portal>
                  <Drawer.Viewport data-testid="child-viewport">
                    <Drawer.Popup data-testid="child-popup">
                      <button type="button" data-testid="child-button">
                        Action
                      </button>
                    </Drawer.Popup>
                  </Drawer.Viewport>
                </Drawer.Portal>
              </Drawer.Root>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    await flushMicrotasks();

    const parentPopup = screen.getByTestId('parent-popup');
    const childPopup = screen.getByTestId('child-popup');
    const parentViewport = screen.getByTestId('parent-viewport');
    const childViewport = screen.getByTestId('child-viewport');
    const button = screen.getByTestId('child-button');
    Object.defineProperty(childPopup, 'offsetHeight', { value: 200, configurable: true });

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => childPopup;

    try {
      fireEvent.touchStart(button, {
        touches: [
          createTouch(button, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      await flushMicrotasks();

      expect(parentViewport).not.toHaveAttribute('data-nested-dialog-open');
      expect(childViewport).not.toHaveAttribute('data-nested-dialog-open');
      expect(parentPopup).not.toHaveAttribute('data-nested-drawer-swiping');

      fireEvent.touchMove(button, {
        touches: [
          createTouch(button, {
            clientX: 0,
            clientY: 5,
          }),
        ],
      });

      fireEvent.touchMove(button, {
        touches: [
          createTouch(button, {
            clientX: 0,
            clientY: 20,
          }),
        ],
      });

      await flushMicrotasks();

      expect(parentPopup).toHaveAttribute('data-nested-drawer-swiping', '');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('prevents touchmove at scroll top when swiping down on scrollable content', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup>
              <div data-testid="scroll" style={{ overflowY: 'auto', maxHeight: 40 }}>
                <div style={{ height: 120 }}>Scrollable content</div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const scroll = screen.getByTestId('scroll');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
    scroll.scrollTop = 0;

    fireEvent.touchStart(scroll, {
      touches: [
        createTouch(scroll, {
          clientX: 0,
          clientY: 0,
        }),
      ],
    });

    const prevented = fireEvent.touchMove(scroll, {
      touches: [
        createTouch(scroll, {
          clientX: 0,
          clientY: 10,
        }),
      ],
    });

    expect(prevented).toBe(false);
  });

  it('prevents touchmove at scroll bottom when swiping up on scrollable content', async () => {
    await render(
      <Drawer.Root open swipeDirection="up">
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup>
              <div data-testid="scroll" style={{ overflowY: 'auto', maxHeight: 40 }}>
                <div style={{ height: 120 }}>Scrollable content</div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const scroll = screen.getByTestId('scroll');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
    scroll.scrollTop = 80;

    fireEvent.touchStart(scroll, {
      touches: [
        createTouch(scroll, {
          clientX: 0,
          clientY: 20,
        }),
      ],
    });

    const prevented = fireEvent.touchMove(scroll, {
      touches: [
        createTouch(scroll, {
          clientX: 0,
          clientY: 10,
        }),
      ],
    });

    expect(prevented).toBe(false);
  });

  it('prevents touchmove when a scrollable ancestor wraps the popup at the top', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Viewport>
            <div data-testid="scroll" style={{ overflowY: 'auto', maxHeight: 40 }}>
              <Drawer.Popup>
                <Drawer.Content>
                  <span data-testid="item">Scrollable content</span>
                </Drawer.Content>
              </Drawer.Popup>
            </div>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const scroll = screen.getByTestId('scroll');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
    scroll.scrollTop = 0;

    const item = screen.getByTestId('item');

    fireEvent.touchStart(item, {
      touches: [
        createTouch(item, {
          clientX: 0,
          clientY: 0,
        }),
      ],
    });

    const prevented = fireEvent.touchMove(item, {
      touches: [
        createTouch(item, {
          clientX: 0,
          clientY: 10,
        }),
      ],
    });

    expect(prevented).toBe(false);
  });

  it('prevents touchmove when there is no scroll container', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">
              <Drawer.Content>Content</Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const popup = screen.getByTestId('popup');

    fireEvent.touchStart(popup, {
      touches: [
        createTouch(popup, {
          clientX: 0,
          clientY: 0,
        }),
      ],
    });

    const prevented = fireEvent.touchMove(popup, {
      touches: [
        createTouch(popup, {
          clientX: 0,
          clientY: 10,
        }),
      ],
    });

    expect(prevented).toBe(false);
  });

  it('does not block touchmove on native range inputs', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup>
              <input type="range" data-testid="range" />
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    await flushMicrotasks();

    const range = screen.getByTestId('range');
    const backdrop = screen.getByTestId('backdrop');

    fireEvent.touchStart(range, {
      touches: [
        createTouch(range, {
          clientX: 0,
          clientY: 0,
        }),
      ],
    });

    const dispatched = fireEvent.touchMove(range, {
      touches: [
        createTouch(range, {
          clientX: 20,
          clientY: 0,
        }),
      ],
    });

    await flushMicrotasks();

    expect(dispatched).toBe(true);
    expect(backdrop).not.toHaveAttribute('data-swiping');
  });

  it('does not block touchmove on slider thumb range inputs', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup>
              <Slider.Root defaultValue={50}>
                <Slider.Control>
                  <Slider.Track>
                    <Slider.Indicator />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider.Control>
              </Slider.Root>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    await flushMicrotasks();

    const sliderInput = screen.getByRole('slider');
    const backdrop = screen.getByTestId('backdrop');

    fireEvent.touchStart(sliderInput, {
      touches: [
        createTouch(sliderInput, {
          clientX: 0,
          clientY: 0,
        }),
      ],
    });

    const dispatched = fireEvent.touchMove(sliderInput, {
      touches: [
        createTouch(sliderInput, {
          clientX: 20,
          clientY: 0,
        }),
      ],
    });

    await flushMicrotasks();

    expect(dispatched).toBe(true);
    expect(backdrop).not.toHaveAttribute('data-swiping');
  });

  it('allows touchmove when scrolling down from scroll top', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup>
              <div data-testid="scroll" style={{ overflowY: 'auto', maxHeight: 40 }}>
                <div style={{ height: 120 }}>Scrollable content</div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const scroll = screen.getByTestId('scroll');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
    scroll.scrollTop = 0;

    fireEvent.touchStart(scroll, {
      touches: [
        createTouch(scroll, {
          clientX: 0,
          clientY: 0,
        }),
      ],
    });

    const prevented = fireEvent.touchMove(scroll, {
      touches: [
        createTouch(scroll, {
          clientX: 0,
          clientY: -10,
        }),
      ],
    });

    expect(prevented).toBe(true);
  });

  it('does not start an opposite-direction swipe from scroll bottom for down drawers with snap points', async () => {
    await render(
      <Drawer.Root open swipeDirection="down" snapPoints={['100px', 1]}>
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup>
              <div data-testid="scroll" style={{ overflowY: 'auto', maxHeight: 40 }}>
                <div style={{ height: 120 }}>Scrollable content</div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    await flushMicrotasks();

    const scroll = screen.getByTestId('scroll');
    const backdrop = screen.getByTestId('backdrop');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
    scroll.scrollTop = 80;

    fireEvent.touchStart(scroll, {
      touches: [
        createTouch(scroll, {
          clientX: 0,
          clientY: 40,
        }),
      ],
    });

    const moveAllowed = fireEvent.touchMove(scroll, {
      touches: [
        createTouch(scroll, {
          clientX: 0,
          clientY: 20,
        }),
      ],
    });

    await flushMicrotasks();

    expect(moveAllowed).toBe(true);
    expect(backdrop).not.toHaveAttribute('data-swiping');
  });

  it('does not start an opposite-direction swipe from scroll right edge for right drawers', async () => {
    await render(
      <Drawer.Root open swipeDirection="right">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup>
              <div data-testid="scroll" style={{ overflowX: 'auto', maxWidth: 40 }}>
                <div style={{ width: 120, height: 40 }}>Scrollable content</div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    await flushMicrotasks();

    const scroll = screen.getByTestId('scroll');
    const backdrop = screen.getByTestId('backdrop');
    Object.defineProperty(scroll, 'scrollWidth', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientWidth', { value: 40, configurable: true });
    scroll.scrollLeft = 80;

    fireEvent.touchStart(scroll, {
      touches: [
        createTouch(scroll, {
          clientX: 40,
          clientY: 0,
        }),
      ],
    });

    const moveAllowed = fireEvent.touchMove(scroll, {
      touches: [
        createTouch(scroll, {
          clientX: 20,
          clientY: 0,
        }),
      ],
    });

    await flushMicrotasks();

    expect(moveAllowed).toBe(true);
    expect(backdrop).not.toHaveAttribute('data-swiping');
  });

  it('starts swipe-to-dismiss after a scrollable container reaches the dismiss edge', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup>
              <div data-testid="scroll" style={{ overflowY: 'auto', maxHeight: 40 }}>
                <div style={{ height: 120 }}>Scrollable content</div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    await flushMicrotasks();

    const scroll = screen.getByTestId('scroll');
    const backdrop = screen.getByTestId('backdrop');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
    scroll.scrollTop = 30;

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => scroll;

    try {
      fireEvent.touchStart(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 30,
          }),
        ],
      });

      const firstMovePrevented = fireEvent.touchMove(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 40,
          }),
        ],
      });

      expect(firstMovePrevented).toBe(true);
      expect(backdrop).not.toHaveAttribute('data-swiping');

      scroll.scrollTop = 0;

      const secondMovePrevented = fireEvent.touchMove(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 50,
          }),
        ],
      });

      expect(secondMovePrevented).toBe(false);

      await flushMicrotasks();

      expect(backdrop).toHaveAttribute('data-swiping', '');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('dismisses from a top-edge scroll container with a touch swipe down', async () => {
    const handleOpenChange = vi.fn();

    await render(
      <Drawer.Root open onOpenChange={handleOpenChange} swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">
              <div data-testid="scroll" style={{ overflowY: 'auto', maxHeight: 40 }}>
                <div style={{ height: 120 }}>Scrollable content</div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const scroll = screen.getByTestId('scroll');
    const backdrop = screen.getByTestId('backdrop');
    const popup = screen.getByTestId('popup');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
    scroll.scrollTop = 0;

    Object.defineProperty(popup, 'offsetHeight', { value: 200, configurable: true });

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => scroll;

    try {
      fireEvent.touchStart(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      fireEvent.touchMove(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 140,
          }),
        ],
      });

      expect(backdrop).toHaveAttribute('data-swiping', '');

      fireEvent.touchEnd(scroll, {
        changedTouches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 140,
          }),
        ],
      });

      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(handleOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'swipe' }),
    );
  });

  it('dismisses from a bottom-edge scroll container with a touch swipe up', async () => {
    const handleOpenChange = vi.fn();

    await render(
      <Drawer.Root open onOpenChange={handleOpenChange} swipeDirection="up">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">
              <div data-testid="scroll" style={{ overflowY: 'auto', maxHeight: 40 }}>
                <div style={{ height: 120 }}>Scrollable content</div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const scroll = screen.getByTestId('scroll');
    const backdrop = screen.getByTestId('backdrop');
    const popup = screen.getByTestId('popup');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
    scroll.scrollTop = 80;

    Object.defineProperty(popup, 'offsetHeight', { value: 200, configurable: true });

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => scroll;

    try {
      fireEvent.touchStart(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 140,
          }),
        ],
      });

      fireEvent.touchMove(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      expect(backdrop).toHaveAttribute('data-swiping', '');

      fireEvent.touchEnd(scroll, {
        changedTouches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(handleOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'swipe' }),
    );
  });

  it('dismisses from a left-edge horizontal scroll container with a touch swipe right', async () => {
    const handleOpenChange = vi.fn();

    await render(
      <Drawer.Root open onOpenChange={handleOpenChange} swipeDirection="right">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">
              <div data-testid="scroll" style={{ overflowX: 'auto', maxWidth: 40 }}>
                <div style={{ width: 120, height: 40 }}>Scrollable content</div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const scroll = screen.getByTestId('scroll');
    const backdrop = screen.getByTestId('backdrop');
    const popup = screen.getByTestId('popup');
    Object.defineProperty(scroll, 'scrollWidth', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientWidth', { value: 40, configurable: true });
    scroll.scrollLeft = 0;

    Object.defineProperty(popup, 'offsetWidth', { value: 200, configurable: true });

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => scroll;

    try {
      fireEvent.touchStart(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      fireEvent.touchMove(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 140,
            clientY: 0,
          }),
        ],
      });

      expect(backdrop).toHaveAttribute('data-swiping', '');

      fireEvent.touchEnd(scroll, {
        changedTouches: [
          createTouch(scroll, {
            clientX: 140,
            clientY: 0,
          }),
        ],
      });

      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(handleOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'swipe' }),
    );
  });

  it('dismisses from a right-edge horizontal scroll container with a touch swipe left', async () => {
    const handleOpenChange = vi.fn();

    await render(
      <Drawer.Root open onOpenChange={handleOpenChange} swipeDirection="left">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">
              <div data-testid="scroll" style={{ overflowX: 'auto', maxWidth: 40 }}>
                <div style={{ width: 120, height: 40 }}>Scrollable content</div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const scroll = screen.getByTestId('scroll');
    const backdrop = screen.getByTestId('backdrop');
    const popup = screen.getByTestId('popup');
    Object.defineProperty(scroll, 'scrollWidth', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientWidth', { value: 40, configurable: true });
    scroll.scrollLeft = 80;

    Object.defineProperty(popup, 'offsetWidth', { value: 200, configurable: true });

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => scroll;

    try {
      fireEvent.touchStart(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 140,
            clientY: 0,
          }),
        ],
      });

      fireEvent.touchMove(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      expect(backdrop).toHaveAttribute('data-swiping', '');

      fireEvent.touchEnd(scroll, {
        changedTouches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(handleOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'swipe' }),
    );
  });

  it('allows horizontal swipe dismiss from a vertical scroll container', async () => {
    await render(
      <Drawer.Root open swipeDirection="right">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup>
              <div data-testid="scroll" style={{ overflowY: 'auto', maxHeight: 40 }}>
                <div style={{ height: 120 }}>Scrollable content</div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    await flushMicrotasks();

    const scroll = screen.getByTestId('scroll');
    const backdrop = screen.getByTestId('backdrop');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
    scroll.scrollTop = 20;

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => scroll;

    try {
      fireEvent.touchStart(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 20,
          }),
        ],
      });

      fireEvent.touchMove(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 20,
            clientY: 20,
          }),
        ],
      });

      await flushMicrotasks();

      expect(backdrop).toHaveAttribute('data-swiping', '');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('toggles data-swiping on the backdrop while swiping', async () => {
    await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    await flushMicrotasks();

    const viewport = screen.getByTestId('viewport');
    const popup = screen.getByTestId('popup');
    const backdrop = screen.getByTestId('backdrop');

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;

    try {
      fireEvent.pointerDown(viewport, {
        button: 0,
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 0,
        pointerType: 'mouse',
      });

      await flushMicrotasks();

      fireEvent.pointerMove(viewport, {
        pointerId: 1,
        clientX: 0,
        clientY: 8,
        pointerType: 'mouse',
      });

      await flushMicrotasks();

      expect(backdrop).toHaveAttribute('data-swiping', '');

      fireEvent.pointerUp(viewport, {
        pointerId: 1,
        clientX: 0,
        clientY: 8,
        pointerType: 'mouse',
      });

      await flushMicrotasks();

      expect(backdrop).not.toHaveAttribute('data-swiping');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('ends swipe drag when the primary mouse button is released mid-gesture', async () => {
    await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    await flushMicrotasks();

    const viewport = screen.getByTestId('viewport');
    const popup = screen.getByTestId('popup');
    const backdrop = screen.getByTestId('backdrop');

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;

    try {
      fireEvent.pointerDown(viewport, {
        button: 0,
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 0,
        pointerType: 'mouse',
      });

      await flushMicrotasks();

      fireEvent.pointerMove(viewport, {
        pointerId: 1,
        clientX: 0,
        clientY: 8,
        buttons: 1,
        pointerType: 'mouse',
      });

      await flushMicrotasks();

      expect(backdrop).toHaveAttribute('data-swiping', '');

      // Simulate a right-click interruption where the primary button is no longer pressed.
      fireEvent.pointerMove(viewport, {
        pointerId: 1,
        clientX: 0,
        clientY: 12,
        buttons: 2,
        pointerType: 'mouse',
      });

      await flushMicrotasks();

      expect(backdrop).not.toHaveAttribute('data-swiping');

      fireEvent.pointerMove(viewport, {
        pointerId: 1,
        clientX: 0,
        clientY: 30,
        buttons: 0,
        pointerType: 'mouse',
      });

      await flushMicrotasks();

      expect(backdrop).not.toHaveAttribute('data-swiping');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });
});
