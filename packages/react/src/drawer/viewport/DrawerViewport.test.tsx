import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Combobox } from '@base-ui/react/combobox';
import { Drawer } from '@base-ui/react/drawer';
import { Slider } from '@base-ui/react/slider';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, firePointer, isJSDOM } from '#test-utils';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { useDrawerProviderContext } from '../provider/DrawerProviderContext';
import { useDrawerRootContext } from '../root/DrawerRootContext';

describe('<Drawer.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<Drawer.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Drawer.Root open>
          <Drawer.Portal>{node}</Drawer.Portal>
        </Drawer.Root>,
      );
    },
  }));

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

  function setHeight(element: HTMLElement | null, value: number) {
    if (element) {
      Object.defineProperty(element, 'offsetHeight', { configurable: true, value });
    }
  }

  function createNativeTouchMove(target: EventTarget, point: { clientX: number; clientY: number }) {
    const touchMove = new Event('touchmove', { bubbles: true, cancelable: true });
    Object.defineProperty(touchMove, 'touches', {
      value: [createTouch(target, point)],
      configurable: true,
    });
    return touchMove;
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

  it('preserves text selection outside the popup when a swipe starts', async () => {
    await render(
      <div>
        <span data-testid="outside-text">Outside selection</span>
        <Drawer.Root open>
          <Drawer.Portal>
            <Drawer.Viewport data-testid="viewport">
              <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </div>,
    );

    const outsideText = screen.getByTestId('outside-text');
    const textNode = outsideText.firstChild;
    const selection = window.getSelection();
    expect(textNode).not.toBeNull();
    expect(selection).not.toBeNull();
    if (!textNode || !selection) {
      return;
    }

    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 7);
    selection.removeAllRanges();
    selection.addRange(range);

    const popup = screen.getByTestId('popup');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;

    try {
      fireEvent.pointerDown(screen.getByTestId('viewport'), {
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

    expect(selection.rangeCount).toBe(1);
    expect(selection.toString()).toBe('Outside');
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

  it('uses shadow-root hit testing for touch swipe targets', async () => {
    const host = document.body.appendChild(document.createElement('div'));
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const originalDocumentElementFromPoint = document.elementFromPoint;
    const originalShadowElementFromPoint = shadowRoot.elementFromPoint;

    try {
      await render(
        <Drawer.Root open>
          <Drawer.Portal container={shadowRoot}>
            <Drawer.Backdrop data-testid="backdrop" />
            <Drawer.Viewport>
              <Drawer.Popup>
                <div data-testid="target">Target</div>
                <div data-base-ui-swipe-ignore data-testid="ignored">
                  Ignore
                </div>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const target = shadowRoot.querySelector<HTMLElement>('[data-testid="target"]');
      const ignored = shadowRoot.querySelector<HTMLElement>('[data-testid="ignored"]');
      const backdrop = shadowRoot.querySelector<HTMLElement>('[data-testid="backdrop"]');
      expect(target).not.toBeNull();
      expect(ignored).not.toBeNull();
      expect(backdrop).not.toBeNull();
      if (!target || !ignored || !backdrop) {
        return;
      }

      // Returning an in-popup element from the document hit test would start the swipe if the
      // shadow root were not consulted, so this pins the shadow-root lookup rather than the
      // `contains()` rejection that a retargeted host would also trigger.
      document.elementFromPoint = () => target;
      shadowRoot.elementFromPoint = () => ignored;

      fireEvent.touchStart(ignored, {
        touches: [createTouch(ignored, { clientX: 0, clientY: 0 })],
      });

      await flushMicrotasks();

      expect(backdrop).not.toHaveAttribute('data-swiping');

      fireEvent.touchEnd(ignored, {
        changedTouches: [createTouch(ignored, { clientX: 0, clientY: 0 })],
      });
      shadowRoot.elementFromPoint = () => target;

      fireEvent.touchStart(target, {
        touches: [createTouch(target, { clientX: 0, clientY: 0 })],
      });

      await flushMicrotasks();

      expect(backdrop).toHaveAttribute('data-swiping', '');
    } finally {
      document.elementFromPoint = originalDocumentElementFromPoint;
      shadowRoot.elementFromPoint = originalShadowElementFromPoint;
      host.remove();
    }
  });

  it.skipIf(isJSDOM)('starts a swipe inside a shadow root using real hit testing', async () => {
    const host = document.body.appendChild(document.createElement('div'));
    const shadowRoot = host.attachShadow({ mode: 'open' });

    try {
      await render(
        <Drawer.Root open swipeDirection="down">
          <Drawer.Portal container={shadowRoot}>
            <Drawer.Backdrop data-testid="backdrop" />
            <Drawer.Viewport>
              <Drawer.Popup
                data-testid="popup"
                style={{ position: 'fixed', top: 0, left: 0, width: 200, height: 200 }}
              >
                Content
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const popup = shadowRoot.querySelector<HTMLElement>('[data-testid="popup"]');
      const backdrop = shadowRoot.querySelector<HTMLElement>('[data-testid="backdrop"]');
      expect(popup).not.toBeNull();
      expect(backdrop).not.toBeNull();
      if (!popup || !backdrop) {
        return;
      }

      // No `elementFromPoint` stubbing: a real document hit test retargets the popup content to
      // the shadow host, which fails the `contains()` check in the swipe `canStart` guard, so
      // this only engages when the hit test runs against the shadow root.
      fireEvent.touchStart(popup, {
        touches: [createTouch(popup, { clientX: 100, clientY: 100 })],
      });

      fireEvent.touchMove(popup, {
        touches: [createTouch(popup, { clientX: 100, clientY: 125 })],
      });

      await waitFor(() => {
        expect(backdrop).toHaveAttribute('data-swiping', '');
      });

      fireEvent.touchEnd(popup, {
        changedTouches: [createTouch(popup, { clientX: 100, clientY: 125 })],
      });
    } finally {
      host.remove();
    }
  });

  it('clears the backdrop data-swiping attribute when the drawer unmounts mid-swipe', async () => {
    const { unmount } = await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup>
              <button type="button" data-testid="button">
                Action
              </button>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const button = screen.getByTestId('button');
    const backdrop = screen.getByTestId('backdrop');

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => button;

    try {
      fireEvent.touchStart(button, {
        touches: [createTouch(button, { clientX: 0, clientY: 0 })],
      });

      await flushMicrotasks();

      expect(backdrop).toHaveAttribute('data-swiping', '');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    await act(async () => {
      unmount();
    });

    // The detached node keeps its attributes, so this asserts the cleanup removed
    // `data-swiping` from the backdrop that was mounted while swiping.
    expect(backdrop).not.toHaveAttribute('data-swiping');
  });

  it('uses the event target for non-keyboard touch scroll arbitration', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup>
              <div data-testid="scroll" style={{ overflowY: 'auto', maxHeight: 40 }}>
                <button type="button" data-testid="button">
                  Action
                </button>
                <div style={{ height: 120 }} />
              </div>
              <div data-testid="other-scroll" style={{ overflowY: 'auto', maxHeight: 40 }}>
                <div style={{ height: 120 }} />
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const button = screen.getByTestId('button');
    const scroll = screen.getByTestId('scroll');
    const otherScroll = screen.getByTestId('other-scroll');
    const backdrop = screen.getByTestId('backdrop');

    Object.defineProperty(scroll, 'scrollHeight', { value: 160, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
    scroll.scrollTop = 0;
    Object.defineProperty(otherScroll, 'scrollHeight', { value: 160, configurable: true });
    Object.defineProperty(otherScroll, 'clientHeight', { value: 40, configurable: true });
    otherScroll.scrollTop = 40;

    const originalElementFromPoint = document.elementFromPoint;
    let hitTestCount = 0;
    document.elementFromPoint = () => {
      hitTestCount += 1;
      return hitTestCount === 1 ? otherScroll : button;
    };

    try {
      fireEvent.touchStart(button, {
        touches: [
          createTouch(button, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      fireEvent.touchMove(button, {
        touches: [
          createTouch(button, {
            clientX: 0,
            clientY: 40,
          }),
        ],
      });

      await flushMicrotasks();

      expect(backdrop).toHaveAttribute('data-swiping', '');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('allows clicks on non-interactive elements without data-base-ui-swipe-ignore', async () => {
    const handleClick = vi.fn();
    const handleOpenChange = vi.fn();

    await render(
      <Drawer.Root open onOpenChange={handleOpenChange}>
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup>
              <Drawer.Content>
                <div data-testid="target" onClick={handleClick}>
                  Action
                </div>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const target = screen.getByTestId('target');
    const backdrop = screen.getByTestId('backdrop');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => target;

    try {
      fireEvent.touchStart(target, {
        touches: [
          createTouch(target, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });
      fireEvent.pointerDown(target, { pointerType: 'touch' });
      fireEvent.touchEnd(target, {
        changedTouches: [
          createTouch(target, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });
      fireEvent.click(target, { detail: 1 });

      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleOpenChange).not.toHaveBeenCalled();
    expect(backdrop).not.toHaveAttribute('data-swiping');
  });

  it('does not start touch swipes from elements with data-base-ui-swipe-ignore', async () => {
    const handleOpenChange = vi.fn();

    await render(
      <Drawer.Root open onOpenChange={handleOpenChange}>
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup>
              <Drawer.Content>
                <div data-testid="target" data-base-ui-swipe-ignore>
                  Action
                </div>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const target = screen.getByTestId('target');
    const backdrop = screen.getByTestId('backdrop');

    fireEvent.touchStart(target, {
      touches: [
        createTouch(target, {
          clientX: 0,
          clientY: 0,
        }),
      ],
    });

    fireEvent.touchMove(target, {
      touches: [
        createTouch(target, {
          clientX: 0,
          clientY: 40,
        }),
      ],
    });

    fireEvent.touchEnd(target, {
      changedTouches: [
        createTouch(target, {
          clientX: 0,
          clientY: 40,
        }),
      ],
    });

    await flushMicrotasks();

    expect(backdrop).not.toHaveAttribute('data-swiping');
    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it('does not prevent native touch scrolling in portaled descendants', async () => {
    const portalContainer = document.createElement('div');
    document.body.append(portalContainer);

    function PortaledPopup() {
      return ReactDOM.createPortal(
        <div data-testid="portaled-popup">Portaled popup</div>,
        portalContainer,
      );
    }

    await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup>
              <Drawer.Content>Content</Drawer.Content>
              <PortaledPopup />
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const portaledPopup = screen.getByTestId('portaled-popup');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => portaledPopup;

    try {
      fireEvent.touchStart(portaledPopup, {
        touches: [
          createTouch(portaledPopup, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      const touchMove = createNativeTouchMove(portaledPopup, {
        clientX: 0,
        clientY: 40,
      });
      portaledPopup.dispatchEvent(touchMove);

      expect(touchMove.defaultPrevented).toBe(false);
    } finally {
      document.elementFromPoint = originalElementFromPoint;
      portalContainer.remove();
    }
  });

  it.skipIf(isJSDOM)(
    'allows touch gestures on a portaled combobox popup without starting drawer swipe',
    async () => {
      const handleOpenChange = vi.fn();
      const { user } = await render(
        <Drawer.Root open onOpenChange={handleOpenChange}>
          <Drawer.Portal>
            <Drawer.Backdrop data-testid="backdrop" />
            <Drawer.Viewport>
              <Drawer.Popup>
                <Drawer.Content>
                  <Combobox.Root
                    defaultOpen
                    items={[
                      'Apple',
                      'Banana',
                      'Cherry',
                      'Date',
                      'Elderberry',
                      'Fig',
                      'Grape',
                      'Honeydew',
                      'Kiwi',
                      'Lime',
                    ]}
                  >
                    <Combobox.Input />
                    <Combobox.Portal>
                      <Combobox.Positioner>
                        <Combobox.Popup>
                          <Combobox.List style={{ maxHeight: 40, overflow: 'auto' }}>
                            {(item: string) => (
                              <Combobox.Item key={item} value={item}>
                                {item}
                              </Combobox.Item>
                            )}
                          </Combobox.List>
                        </Combobox.Popup>
                      </Combobox.Positioner>
                    </Combobox.Portal>
                  </Combobox.Root>
                </Drawer.Content>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const listbox = await screen.findByRole('listbox');
      const backdrop = screen.getByTestId('backdrop');
      await waitFor(() => {
        expect(listbox.scrollHeight).toBeGreaterThan(listbox.clientHeight);
      });
      expect(listbox.scrollHeight).toBeGreaterThan(listbox.clientHeight);

      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => listbox;

      try {
        const rect = listbox.getBoundingClientRect();

        await user.pointer([
          {
            target: listbox,
            coords: {
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height - 8,
            },
            keys: '[TouchA>]',
          },
          {
            target: listbox,
            coords: {
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
            },
            pointerName: 'TouchA',
          },
          {
            target: listbox,
            coords: {
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + 8,
            },
            pointerName: 'TouchA',
          },
          { keys: '[/TouchA]' },
        ]);

        expect(backdrop).not.toHaveAttribute('data-swiping');
        expect(handleOpenChange).not.toHaveBeenCalled();
        expect(listbox).toBeVisible();
      } finally {
        document.elementFromPoint = originalElementFromPoint;
      }
    },
  );

  it('still allows touch swipes from elements with legacy data-swipe-ignore', async () => {
    const handleOpenChange = vi.fn();

    await render(
      <Drawer.Root open onOpenChange={handleOpenChange} swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup>
              <div data-testid="target" data-swipe-ignore>
                Action
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const target = screen.getByTestId('target');
    const backdrop = screen.getByTestId('backdrop');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => target;

    try {
      fireEvent.touchStart(target, {
        touches: [
          createTouch(target, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      fireEvent.touchMove(target, {
        touches: [
          createTouch(target, {
            clientX: 0,
            clientY: 40,
          }),
        ],
      });

      await flushMicrotasks();

      expect(backdrop).toHaveAttribute('data-swiping', '');

      fireEvent.touchEnd(target, {
        changedTouches: [
          createTouch(target, {
            clientX: 0,
            clientY: 80,
          }),
        ],
      });

      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it('does not start non-touch swipes from Drawer.Content', async () => {
    await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup>
              <Drawer.Content>
                <div data-testid="target">Action</div>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const target = screen.getByTestId('target');
    const backdrop = screen.getByTestId('backdrop');

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => target;

    try {
      fireEvent.pointerDown(target, {
        button: 0,
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 0,
        pointerType: 'mouse',
      });

      await flushMicrotasks();

      expect(backdrop).not.toHaveAttribute('data-swiping');
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

  it('treats pen interactions on Drawer.Content as non-touch swipes', async () => {
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

  it('clears nested swiping when a nested drawer swipe is reversed before release', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup data-testid="parent-popup">
              <Drawer.Root open swipeDirection="down">
                <Drawer.Portal>
                  <Drawer.Viewport>
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

    const parentPopup = screen.getByTestId('parent-popup');
    const childPopup = screen.getByTestId('child-popup');
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

      fireEvent.touchMove(button, {
        touches: [
          createTouch(button, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      await flushMicrotasks();

      expect(parentPopup).not.toHaveAttribute('data-nested-drawer-swiping');
      expect(parentPopup.style.getPropertyValue('--drawer-swipe-progress')).toBe('0');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('prevents touchmove at scroll top when swiping down on scrollable content', async () => {
    const handleTouchMove = vi.fn();

    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup>
              <div
                data-testid="scroll"
                onTouchMove={handleTouchMove}
                style={{ overflowY: 'auto', maxHeight: 40 }}
              >
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
    expect(handleTouchMove).not.toHaveBeenCalled();
  });

  it('prevents touchmove at scroll bottom when swiping up on scrollable content', async () => {
    await render(
      <Drawer.Root open swipeDirection="up">
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

    const scroll = screen.getByTestId('scroll');
    const backdrop = screen.getByTestId('backdrop');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
    scroll.scrollTop = 80;

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

      const touchMove = createNativeTouchMove(scroll, {
        clientX: 0,
        clientY: 10,
      });

      await act(async () => {
        scroll.dispatchEvent(touchMove);
        await flushMicrotasks();
      });

      expect(touchMove.defaultPrevented).toBe(true);
      expect(backdrop).toHaveAttribute('data-swiping');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('prevents touchmove when a scrollable ancestor wraps the popup at the top', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
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
    const backdrop = screen.getByTestId('backdrop');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
    scroll.scrollTop = 0;

    const item = screen.getByTestId('item');

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => item;

    try {
      fireEvent.touchStart(item, {
        touches: [
          createTouch(item, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      const touchMove = createNativeTouchMove(item, {
        clientX: 0,
        clientY: 10,
      });

      await act(async () => {
        item.dispatchEvent(touchMove);
        await flushMicrotasks();
      });

      expect(touchMove.defaultPrevented).toBe(true);
      expect(backdrop).toHaveAttribute('data-swiping');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it.skipIf(isJSDOM)(
    'starts a swipe away from the page scroll edge when the body is a scroll container',
    async () => {
      const html = document.documentElement;
      const { body } = document;
      const previousHtmlStyle = html.style.cssText;
      const previousBodyStyle = body.style.cssText;
      // A common reset that turns `body` into a real scroll container instead of letting its
      // overflow propagate to the viewport.
      html.style.cssText = 'height: 100%; overflow-y: auto';
      body.style.cssText = 'height: 100%; overflow-y: auto';

      try {
        await render(
          <React.Fragment>
            <div style={{ height: 5000 }} />
            <Drawer.Root open modal={false} swipeDirection="down" snapPoints={[300, 100]}>
              <Drawer.Portal>
                <Drawer.Backdrop data-testid="backdrop" />
                <Drawer.Viewport style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
                  <Drawer.Popup
                    data-testid="popup"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 300,
                      pointerEvents: 'auto',
                      transform:
                        'translateY(calc(var(--drawer-snap-point-offset) + var(--drawer-swipe-movement-y)))',
                    }}
                  >
                    <div data-testid="drag" style={{ height: 100 }}>
                      Drag
                    </div>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.Root>
          </React.Fragment>,
        );

        const popup = screen.getByTestId('popup');
        const drag = screen.getByTestId('drag');
        const backdrop = screen.getByTestId('backdrop');

        await waitFor(() => {
          expect(popup.style.getPropertyValue('--drawer-snap-point-offset')).toBe('0px');
        });

        // The old code refused swipes away from the page scroll edge, so being at the top
        // with a scrollable body is the precondition that made the up-swipe fail.
        expect(body.scrollTop).toBe(0);
        expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);

        const rect = drag.getBoundingClientRect();
        const clientX = rect.left + 20;
        const clientY = rect.top + 80;

        fireEvent.touchStart(drag, { touches: [createTouch(drag, { clientX, clientY })] });
        fireEvent.touchMove(drag, {
          touches: [createTouch(drag, { clientX, clientY: clientY - 30 })],
        });

        await waitFor(() => {
          expect(backdrop).toHaveAttribute('data-swiping', '');
        });

        fireEvent.touchEnd(drag, {
          changedTouches: [createTouch(drag, { clientX, clientY: clientY - 30 })],
        });
      } finally {
        html.style.cssText = previousHtmlStyle;
        body.style.cssText = previousBodyStyle;
      }
    },
  );

  it('prevents touchmove when there is no scroll container', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">
              <Drawer.Content>Content</Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const popup = screen.getByTestId('popup');
    const backdrop = screen.getByTestId('backdrop');

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;

    try {
      fireEvent.touchStart(popup, {
        touches: [
          createTouch(popup, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      const touchMove = createNativeTouchMove(popup, {
        clientX: 0,
        clientY: 10,
      });

      await act(async () => {
        popup.dispatchEvent(touchMove);
        await flushMicrotasks();
      });

      expect(touchMove.defaultPrevented).toBe(true);
      expect(backdrop).toHaveAttribute('data-swiping');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
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

    await waitFor(() => {
      expect(dispatched).toBe(true);
      expect(backdrop).not.toHaveAttribute('data-swiping');
    });
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

  it('does not start swiping when adjusting input selection handles', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">
              <input data-testid="input" defaultValue="Selectable text" />
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const input = screen.getByTestId('input') as HTMLInputElement;
    const popup = screen.getByTestId('popup');
    const backdrop = screen.getByTestId('backdrop');

    input.focus();
    input.setSelectionRange(0, 5);

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;

    try {
      fireEvent.touchStart(popup, {
        touches: [
          createTouch(popup, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      expect(backdrop).not.toHaveAttribute('data-swiping');

      const dispatched = fireEvent.touchMove(popup, {
        touches: [
          createTouch(popup, {
            clientX: 0,
            clientY: 10,
          }),
        ],
      });

      await waitFor(() => {
        expect(dispatched).toBe(true);
        expect(backdrop).not.toHaveAttribute('data-swiping');
      });
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('does not start swiping when adjusting textarea selection handles', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">
              <textarea data-testid="textarea" defaultValue="Selectable text" />
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
    const popup = screen.getByTestId('popup');
    const backdrop = screen.getByTestId('backdrop');

    textarea.focus();
    textarea.setSelectionRange(0, 5);

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;

    try {
      fireEvent.touchStart(popup, {
        touches: [
          createTouch(popup, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      expect(backdrop).not.toHaveAttribute('data-swiping');

      const dispatched = fireEvent.touchMove(popup, {
        touches: [
          createTouch(popup, {
            clientX: 0,
            clientY: 10,
          }),
        ],
      });

      await waitFor(() => {
        expect(dispatched).toBe(true);
        expect(backdrop).not.toHaveAttribute('data-swiping');
      });
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('does not start swiping when adjusting contenteditable selection handles', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">
              <div contentEditable suppressContentEditableWarning data-testid="editable">
                Selectable text
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const editable = screen.getByTestId('editable');
    const popup = screen.getByTestId('popup');
    const backdrop = screen.getByTestId('backdrop');
    const selection = window.getSelection();
    expect(selection).not.toBeNull();
    expect(editable.firstChild).toBeTruthy();
    if (!selection || !editable.firstChild) {
      return;
    }

    editable.focus();
    const range = document.createRange();
    range.setStart(editable.firstChild, 0);
    range.setEnd(editable.firstChild, 5);
    selection.removeAllRanges();
    selection.addRange(range);

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;

    try {
      fireEvent.touchStart(popup, {
        touches: [
          createTouch(popup, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      expect(backdrop).not.toHaveAttribute('data-swiping');

      const dispatched = fireEvent.touchMove(popup, {
        touches: [
          createTouch(popup, {
            clientX: 0,
            clientY: 10,
          }),
        ],
      });

      await waitFor(() => {
        expect(dispatched).toBe(true);
        expect(backdrop).not.toHaveAttribute('data-swiping');
      });
    } finally {
      document.elementFromPoint = originalElementFromPoint;
      selection.removeAllRanges();
    }
  });

  it('does not start swiping when adjusting regular text selection handles', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">
              <span data-testid="text">Selectable text</span>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const text = screen.getByTestId('text');
    const popup = screen.getByTestId('popup');
    const backdrop = screen.getByTestId('backdrop');
    const selection = window.getSelection();
    expect(selection).not.toBeNull();
    expect(text.firstChild).toBeTruthy();
    if (!selection || !text.firstChild) {
      return;
    }

    const range = document.createRange();
    range.setStart(text.firstChild, 0);
    range.setEnd(text.firstChild, 5);
    selection.removeAllRanges();
    selection.addRange(range);

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;

    try {
      fireEvent.touchStart(popup, {
        touches: [
          createTouch(popup, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      expect(backdrop).not.toHaveAttribute('data-swiping');

      const dispatched = fireEvent.touchMove(popup, {
        touches: [
          createTouch(popup, {
            clientX: 0,
            clientY: 10,
          }),
        ],
      });

      await waitFor(() => {
        expect(dispatched).toBe(true);
        expect(backdrop).not.toHaveAttribute('data-swiping');
      });
    } finally {
      document.elementFromPoint = originalElementFromPoint;
      selection.removeAllRanges();
    }
  });

  it('allows touchmove when scrolling down from scroll top', async () => {
    const handleTouchMove = vi.fn();

    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup>
              <div
                data-testid="scroll"
                onTouchMove={handleTouchMove}
                style={{ overflowY: 'auto', maxHeight: 40 }}
              >
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
    expect(handleTouchMove).toHaveBeenCalledTimes(1);
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

  it('keeps damped snap-point styles when a duplicate-coordinate pointermove arrives', async () => {
    await render(
      <Drawer.Root open snapPoints={['100px', 1]}>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const viewport = screen.getByTestId('viewport');
    const popup = screen.getByTestId('popup');

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;

    try {
      fireEvent.pointerDown(viewport, {
        button: 0,
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 100,
        pointerType: 'mouse',
      });

      await flushMicrotasks();

      // The first move only re-anchors the drag origin.
      fireEvent.pointerMove(viewport, {
        pointerId: 1,
        buttons: 1,
        clientX: 0,
        clientY: 100,
        pointerType: 'mouse',
      });

      // Drag upward past the fully-open edge; the snap-point progress handler replaces the raw
      // frozen transform with square-root-damped movement on every processed move.
      fireEvent.pointerMove(viewport, {
        pointerId: 1,
        buttons: 1,
        clientX: 0,
        clientY: 0,
        pointerType: 'mouse',
      });

      await flushMicrotasks();

      expect(popup.style.transform).toBe('');
      const dampedMovementY = popup.style.getPropertyValue('--drawer-swipe-movement-y');
      expect(dampedMovementY).toBe('-10px');

      // A cursor pinned at a screen edge during an off-screen drag produces
      // duplicate-coordinate moves. They must not reinstate the raw frozen transform, which
      // would jump the popup to the undamped position.
      fireEvent.pointerMove(viewport, {
        pointerId: 1,
        buttons: 1,
        clientX: 0,
        clientY: 0,
        pointerType: 'mouse',
      });

      await flushMicrotasks();

      expect(popup.style.transform).toBe('');
      expect(popup.style.getPropertyValue('--drawer-swipe-movement-y')).toBe(dampedMovementY);

      // Only vertical directions are enabled, so horizontal jitter while the vertical
      // position is pinned leaves the drag offset unchanged. Such moves must not reinstate
      // the raw frozen transform either.
      fireEvent.pointerMove(viewport, {
        pointerId: 1,
        buttons: 1,
        clientX: 5,
        clientY: 0,
        pointerType: 'mouse',
      });

      await flushMicrotasks();

      expect(popup.style.transform).toBe('');
      expect(popup.style.getPropertyValue('--drawer-swipe-movement-y')).toBe(dampedMovementY);
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
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

  it('does not prevent a sub-slop first touchmove over cross-axis scrollable content', async () => {
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

    const scroll = screen.getByTestId('scroll');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => scroll;

    try {
      fireEvent.touchStart(scroll, {
        touches: [createTouch(scroll, { clientX: 100, clientY: 100 })],
      });

      // Below the axis-attribution slop the gesture cannot be claimed yet: preventing the first
      // cancelable touchmove on iOS cancels native scrolling for the entire gesture.
      const firstMoveDispatched = fireEvent.touchMove(scroll, {
        touches: [createTouch(scroll, { clientX: 100, clientY: 97 })],
      });
      expect(firstMoveDispatched).toBe(true);

      // Past the slop on the cross axis, native vertical scrolling stays preserved.
      const secondMoveDispatched = fireEvent.touchMove(scroll, {
        touches: [createTouch(scroll, { clientX: 100, clientY: 60 })],
      });
      expect(secondMoveDispatched).toBe(true);

      fireEvent.touchEnd(scroll, {
        changedTouches: [createTouch(scroll, { clientX: 100, clientY: 60 })],
      });

      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('claims the gesture once the drawer axis passes the slop over cross-axis scrollable content', async () => {
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

    const scroll = screen.getByTestId('scroll');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => scroll;

    try {
      fireEvent.touchStart(scroll, {
        touches: [createTouch(scroll, { clientX: 100, clientY: 100 })],
      });

      const ambiguousMoveDispatched = fireEvent.touchMove(scroll, {
        touches: [createTouch(scroll, { clientX: 103, clientY: 101 })],
      });
      expect(ambiguousMoveDispatched).toBe(true);

      const drawerAxisMoveDispatched = fireEvent.touchMove(scroll, {
        touches: [createTouch(scroll, { clientX: 112, clientY: 101 })],
      });
      expect(drawerAxisMoveDispatched).toBe(false);

      fireEvent.touchEnd(scroll, {
        changedTouches: [createTouch(scroll, { clientX: 112, clientY: 101 })],
      });

      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('yields the gesture when the browser commits to a native cross-axis scroll', async () => {
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

    const scroll = screen.getByTestId('scroll');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => scroll;

    try {
      fireEvent.touchStart(scroll, {
        touches: [createTouch(scroll, { clientX: 100, clientY: 100 })],
      });

      fireEvent.touchMove(scroll, {
        touches: [createTouch(scroll, { clientX: 100, clientY: 97 })],
      });

      // A non-cancelable touchmove (still below the slop) means the browser committed the
      // gesture to a native scroll.
      const nonCancelableMove = new Event('touchmove', { bubbles: true, cancelable: false });
      Object.defineProperty(nonCancelableMove, 'touches', {
        value: [createTouch(scroll, { clientX: 100, clientY: 96 })],
        configurable: true,
      });
      scroll.dispatchEvent(nonCancelableMove);

      // Even a decisive drawer-axis move afterwards must not be claimed.
      const drawerAxisMoveDispatched = fireEvent.touchMove(scroll, {
        touches: [createTouch(scroll, { clientX: 140, clientY: 96 })],
      });
      expect(drawerAxisMoveDispatched).toBe(true);

      fireEvent.touchEnd(scroll, {
        changedTouches: [createTouch(scroll, { clientX: 140, clientY: 96 })],
      });

      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('keeps tracking the finger when a claimed drag returns inside the slop', async () => {
    await render(
      <Drawer.Root open swipeDirection="right">
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
    const popup = screen.getByTestId('popup');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => scroll;

    try {
      fireEvent.touchStart(scroll, {
        touches: [createTouch(scroll, { clientX: 100, clientY: 100 })],
      });

      fireEvent.touchMove(scroll, {
        touches: [createTouch(scroll, { clientX: 120, clientY: 100 })],
      });
      fireEvent.touchMove(scroll, {
        touches: [createTouch(scroll, { clientX: 150, clientY: 100 })],
      });

      expect(popup.style.getPropertyValue('--drawer-swipe-movement-x')).toBe('30px');

      // The slop is measured from the touch origin, so a claimed drag that travels back inside it
      // must not be re-arbitrated: the popup has to keep following the finger.
      const inSlopMoveDispatched = fireEvent.touchMove(scroll, {
        touches: [createTouch(scroll, { clientX: 103, clientY: 100 })],
      });
      expect(inSlopMoveDispatched).toBe(false);
      expect(
        Number.parseFloat(popup.style.getPropertyValue('--drawer-swipe-movement-x')),
      ).toBeLessThan(0);

      fireEvent.touchEnd(scroll, {
        changedTouches: [createTouch(scroll, { clientX: 103, clientY: 100 })],
      });

      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('keeps driving a claimed drag through a non-cancelable touchmove', async () => {
    await render(
      <Drawer.Root open swipeDirection="right">
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
    const popup = screen.getByTestId('popup');
    Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => scroll;

    try {
      fireEvent.touchStart(scroll, {
        touches: [createTouch(scroll, { clientX: 100, clientY: 100 })],
      });

      fireEvent.touchMove(scroll, {
        touches: [createTouch(scroll, { clientX: 150, clientY: 100 })],
      });
      fireEvent.touchMove(scroll, {
        touches: [createTouch(scroll, { clientX: 200, clientY: 100 })],
      });

      expect(popup.style.getPropertyValue('--drawer-swipe-movement-x')).toBe('50px');

      // Once the drawer axis owns the gesture, a non-cancelable move no longer means the browser
      // took it for a native scroll, so the drag must not be abandoned.
      const nonCancelableMove = new Event('touchmove', { bubbles: true, cancelable: false });
      Object.defineProperty(nonCancelableMove, 'touches', {
        value: [createTouch(scroll, { clientX: 250, clientY: 100 })],
        configurable: true,
      });
      await act(async () => {
        scroll.dispatchEvent(nonCancelableMove);
      });

      expect(popup.style.getPropertyValue('--drawer-swipe-movement-x')).toBe('100px');

      const laterMoveDispatched = fireEvent.touchMove(scroll, {
        touches: [createTouch(scroll, { clientX: 300, clientY: 100 })],
      });
      expect(laterMoveDispatched).toBe(false);
      expect(popup.style.getPropertyValue('--drawer-swipe-movement-x')).toBe('150px');

      fireEvent.touchEnd(scroll, {
        changedTouches: [createTouch(scroll, { clientX: 300, clientY: 100 })],
      });

      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('does not lock vertical swipe after minor cross-axis jitter in down drawers', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup>
              <div data-testid="scroll" style={{ overflowX: 'auto', width: 40 }}>
                <div style={{ width: 120, height: 40 }}>Scrollable content</div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const scroll = screen.getByTestId('scroll');
    const backdrop = screen.getByTestId('backdrop');
    Object.defineProperty(scroll, 'scrollWidth', { value: 120, configurable: true });
    Object.defineProperty(scroll, 'clientWidth', { value: 40, configurable: true });
    scroll.scrollLeft = 0;

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
            clientX: 4,
            clientY: 3,
          }),
        ],
      });

      fireEvent.touchMove(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 4,
            clientY: 28,
          }),
        ],
      });

      await flushMicrotasks();

      expect(backdrop).toHaveAttribute('data-swiping', '');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it.skipIf(isJSDOM)(
    'does not hijack cross-axis gestures from mixed-axis scroll containers',
    async () => {
      await render(
        <Drawer.Root open swipeDirection="down">
          <Drawer.Portal>
            <Drawer.Backdrop data-testid="backdrop" />
            <Drawer.Viewport>
              <Drawer.Popup>
                <div data-testid="scroll" style={{ overflow: 'auto', width: 40, height: 40 }}>
                  <div style={{ width: 120, height: 120 }}>Scrollable content</div>
                </div>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const scroll = screen.getByTestId('scroll');
      const backdrop = screen.getByTestId('backdrop');
      Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
      Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
      Object.defineProperty(scroll, 'scrollWidth', { value: 120, configurable: true });
      Object.defineProperty(scroll, 'clientWidth', { value: 40, configurable: true });
      scroll.scrollTop = 0;
      scroll.scrollLeft = 40;

      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => scroll;

      try {
        fireEvent.touchStart(scroll, {
          touches: [
            createTouch(scroll, {
              clientX: 40,
              clientY: 0,
            }),
          ],
        });

        fireEvent.touchMove(scroll, {
          touches: [
            createTouch(scroll, {
              clientX: 10,
              clientY: 20,
            }),
          ],
        });

        await flushMicrotasks();

        expect(backdrop).not.toHaveAttribute('data-swiping');
      } finally {
        document.elementFromPoint = originalElementFromPoint;
      }
    },
  );

  it.skipIf(isJSDOM)(
    'does not block vertical scrolling in right drawers when only vertical overflow exists',
    async () => {
      await render(
        <Drawer.Root open swipeDirection="right">
          <Drawer.Portal>
            <Drawer.Backdrop data-testid="backdrop" />
            <Drawer.Viewport>
              <Drawer.Popup>
                <div data-testid="scroll" style={{ overflowY: 'auto', height: 40 }}>
                  <div style={{ height: 120 }}>Scrollable content</div>
                </div>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const scroll = screen.getByTestId('scroll');
      const backdrop = screen.getByTestId('backdrop');

      fireEvent.touchStart(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 20,
          }),
        ],
      });

      const dispatched = fireEvent.touchMove(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      await flushMicrotasks();

      expect(dispatched).toBe(true);
      expect(backdrop).not.toHaveAttribute('data-swiping');
    },
  );

  it.skipIf(isJSDOM)(
    'does not block vertical scrolling in left drawers when only vertical overflow exists',
    async () => {
      await render(
        <Drawer.Root open swipeDirection="left">
          <Drawer.Portal>
            <Drawer.Backdrop data-testid="backdrop" />
            <Drawer.Viewport>
              <Drawer.Popup>
                <div data-testid="scroll" style={{ overflowY: 'auto', height: 40 }}>
                  <div style={{ height: 120 }}>Scrollable content</div>
                </div>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const scroll = screen.getByTestId('scroll');
      const backdrop = screen.getByTestId('backdrop');

      fireEvent.touchStart(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 20,
          }),
        ],
      });

      const dispatched = fireEvent.touchMove(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      await flushMicrotasks();

      expect(dispatched).toBe(true);
      expect(backdrop).not.toHaveAttribute('data-swiping');
    },
  );

  it.skipIf(isJSDOM)(
    'does not block horizontal scrolling in down drawers when only horizontal overflow exists',
    async () => {
      await render(
        <Drawer.Root open swipeDirection="down">
          <Drawer.Portal>
            <Drawer.Backdrop data-testid="backdrop" />
            <Drawer.Viewport>
              <Drawer.Popup>
                <div data-testid="scroll" style={{ overflowX: 'auto', width: 40 }}>
                  <div style={{ width: 120, height: 40 }}>Scrollable content</div>
                </div>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const scroll = screen.getByTestId('scroll');
      const backdrop = screen.getByTestId('backdrop');

      fireEvent.touchStart(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 20,
            clientY: 0,
          }),
        ],
      });

      const dispatched = fireEvent.touchMove(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      await flushMicrotasks();

      expect(dispatched).toBe(true);
      expect(backdrop).not.toHaveAttribute('data-swiping');
    },
  );

  it.skipIf(isJSDOM)(
    'does not block horizontal scrolling in up drawers when only horizontal overflow exists',
    async () => {
      await render(
        <Drawer.Root open swipeDirection="up">
          <Drawer.Portal>
            <Drawer.Backdrop data-testid="backdrop" />
            <Drawer.Viewport>
              <Drawer.Popup>
                <div data-testid="scroll" style={{ overflowX: 'auto', width: 40 }}>
                  <div style={{ width: 120, height: 40 }}>Scrollable content</div>
                </div>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const scroll = screen.getByTestId('scroll');
      const backdrop = screen.getByTestId('backdrop');

      fireEvent.touchStart(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 20,
            clientY: 0,
          }),
        ],
      });

      const dispatched = fireEvent.touchMove(scroll, {
        touches: [
          createTouch(scroll, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      await flushMicrotasks();

      expect(dispatched).toBe(true);
      expect(backdrop).not.toHaveAttribute('data-swiping');
    },
  );

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
        buttons: 1,
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

  it('cancels pointer drags and ignores compatibility touch pointer cancellation', async () => {
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
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 20,
        pointerType: 'mouse',
      });
      expect(backdrop).toHaveAttribute('data-swiping', '');

      fireEvent.pointerCancel(viewport, {
        pointerId: 1,
        clientX: 0,
        clientY: 20,
        pointerType: 'mouse',
      });
      expect(backdrop).not.toHaveAttribute('data-swiping');

      fireEvent.pointerDown(viewport, { pointerId: 2, pointerType: 'touch' });
      fireEvent.pointerCancel(viewport, { pointerId: 2, pointerType: 'touch' });
      expect(backdrop).not.toHaveAttribute('data-swiping');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('ignores touchstart when there is no active touch', async () => {
    await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup>Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    fireEvent.touchStart(screen.getByTestId('viewport'), { touches: [] });
    expect(screen.getByTestId('backdrop')).not.toHaveAttribute('data-swiping');
  });

  it('uses regular horizontal dismissal when snap points are configured', async () => {
    const handleOpenChange = vi.fn();
    await render(
      <Drawer.Root
        open
        onOpenChange={handleOpenChange}
        snapPoints={['100px', '200px']}
        swipeDirection="left"
      >
        <Drawer.Portal>
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup
              data-testid="popup"
              ref={(element) => {
                if (element) {
                  Object.defineProperty(element, 'offsetWidth', {
                    configurable: true,
                    value: 200,
                  });
                }
              }}
            >
              Drawer
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const viewport = screen.getByTestId('viewport');
    const popup = screen.getByTestId('popup');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;

    try {
      fireEvent.pointerDown(viewport, {
        button: 0,
        buttons: 1,
        pointerId: 1,
        clientX: 180,
        clientY: 10,
        pointerType: 'mouse',
      });
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 179,
        clientY: 10,
        pointerType: 'mouse',
      });
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 40,
        clientY: 10,
        pointerType: 'mouse',
      });
      fireEvent.pointerUp(viewport, {
        pointerId: 1,
        clientX: 40,
        clientY: 10,
        pointerType: 'mouse',
      });
      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(handleOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it('does not dismiss from a fast swipe that was never attributed to the snap point axis', async () => {
    const handleOpenChange = vi.fn();
    const handleSnapPointChange = vi.fn();

    vi.useFakeTimers();
    try {
      // The taller point is declared first so the expected settle target is not simply the
      // first resolved snap point.
      await render(
        <Drawer.Root
          open
          onOpenChange={handleOpenChange}
          onSnapPointChange={handleSnapPointChange}
          snapPoints={['200px', '100px']}
          swipeDirection="down"
        >
          <Drawer.Portal>
            <Drawer.Viewport data-testid="viewport" ref={(element) => setHeight(element, 400)}>
              <Drawer.Popup data-testid="popup" ref={(element) => setHeight(element, 300)}>
                Drawer
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const viewport = screen.getByTestId('viewport');
      const popup = screen.getByTestId('popup');
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => popup;

      try {
        // A mostly horizontal flick: cumulative |deltaX| stays above |deltaY| on every
        // move so no swipe direction is ever attributed, while the final samples carry
        // fast downward velocity from the finger arcing down at lift.
        firePointer.down(viewport, {
          button: 0,
          buttons: 1,
          pointerId: 1,
          clientX: 100,
          clientY: 10,
          pointerType: 'mouse',
          timeStamp: 1000,
        });
        firePointer.move(viewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 120,
          clientY: 12,
          pointerType: 'mouse',
          timeStamp: 1050,
        });
        firePointer.move(viewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 200,
          clientY: 20,
          pointerType: 'mouse',
          timeStamp: 1100,
        });
        firePointer.move(viewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 240,
          clientY: 55,
          pointerType: 'mouse',
          timeStamp: 1120,
        });
        firePointer.up(viewport, {
          pointerId: 1,
          clientX: 240,
          clientY: 55,
          pointerType: 'mouse',
          timeStamp: 1130,
        });
        await flushMicrotasks();
      } finally {
        document.elementFromPoint = originalElementFromPoint;
      }

      expect(handleOpenChange).not.toHaveBeenCalled();
      // The release settles on the nearest snap point rather than dismissing.
      expect(handleSnapPointChange).not.toHaveBeenCalledWith(null, expect.anything());
      expect(handleSnapPointChange).toHaveBeenCalledWith('100px', expect.anything());
      expect(popup).not.toHaveAttribute('data-ending-style');
      expect(popup).not.toHaveAttribute('data-swipe-dismiss');
    } finally {
      vi.useRealTimers();
    }
  });

  it('navigates snap points from a drag that was never attributed to the swipe axis', async () => {
    const handleOpenChange = vi.fn();
    const handleSnapPointChange = vi.fn();

    await render(
      <Drawer.Root
        open
        onOpenChange={handleOpenChange}
        onSnapPointChange={handleSnapPointChange}
        snapPoints={['100px', '200px']}
        swipeDirection="down"
      >
        <Drawer.Portal>
          <Drawer.Viewport data-testid="viewport" ref={(element) => setHeight(element, 400)}>
            <Drawer.Popup data-testid="popup" ref={(element) => setHeight(element, 300)}>
              Drawer
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const viewport = screen.getByTestId('viewport');
    const popup = screen.getByTestId('popup');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;

    try {
      // A sustained diagonal drag: cumulative |deltaX| stays above |deltaY| on every
      // move so no direction is attributed, while the vertical component drags the
      // sheet 150px upward toward the taller snap point.
      fireEvent.pointerDown(viewport, {
        button: 0,
        buttons: 1,
        pointerId: 1,
        clientX: 300,
        clientY: 300,
        pointerType: 'mouse',
      });
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 280,
        clientY: 290,
        pointerType: 'mouse',
      });
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 200,
        clientY: 220,
        pointerType: 'mouse',
      });
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 140,
        clientY: 150,
        pointerType: 'mouse',
      });
      fireEvent.pointerUp(viewport, {
        pointerId: 1,
        clientX: 140,
        clientY: 150,
        pointerType: 'mouse',
      });
      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(handleSnapPointChange).toHaveBeenCalledWith('200px', expect.anything());
    expect(handleOpenChange).not.toHaveBeenCalled();
    expect(popup).not.toHaveAttribute('data-ending-style');
  });

  it('clears nested swipe state after an unattributed snap point gesture', async () => {
    await render(
      <Drawer.Root open swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup data-testid="parent-popup">
              <Drawer.Root open snapPoints={['100px', '200px']} swipeDirection="down">
                <Drawer.Portal>
                  <Drawer.Viewport
                    data-testid="child-viewport"
                    ref={(element) => setHeight(element, 400)}
                  >
                    <Drawer.Popup
                      data-testid="child-popup"
                      ref={(element) => setHeight(element, 300)}
                    >
                      Child
                    </Drawer.Popup>
                  </Drawer.Viewport>
                </Drawer.Portal>
              </Drawer.Root>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const parentPopup = screen.getByTestId('parent-popup');
    const childPopup = screen.getByTestId('child-popup');
    const childViewport = screen.getByTestId('child-viewport');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => childPopup;

    try {
      fireEvent.pointerDown(childViewport, {
        button: 0,
        buttons: 1,
        pointerId: 1,
        clientX: 100,
        clientY: 10,
        pointerType: 'mouse',
      });
      fireEvent.pointerMove(childViewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 120,
        clientY: 12,
        pointerType: 'mouse',
      });
      fireEvent.pointerMove(childViewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 200,
        clientY: 30,
        pointerType: 'mouse',
      });
      await flushMicrotasks();

      expect(parentPopup).toHaveAttribute('data-nested-drawer-swiping', '');
      expect(parentPopup.style.getPropertyValue('--drawer-swipe-progress')).not.toBe('0');

      fireEvent.pointerUp(childViewport, {
        pointerId: 1,
        clientX: 200,
        clientY: 30,
        pointerType: 'mouse',
      });
      await flushMicrotasks();

      expect(parentPopup.style.getPropertyValue('--drawer-swipe-progress')).toBe('0');
      expect(parentPopup).not.toHaveAttribute('data-nested-drawer-swiping');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('clears nested swipe state after an attributed drag settles on a snap point', async () => {
    vi.useFakeTimers();
    try {
      await render(
        <Drawer.Root open swipeDirection="down">
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup data-testid="parent-popup">
                <Drawer.Root open snapPoints={['100px', '200px']} swipeDirection="down">
                  <Drawer.Portal>
                    <Drawer.Viewport
                      data-testid="child-viewport"
                      ref={(element) => setHeight(element, 400)}
                    >
                      <Drawer.Popup
                        data-testid="child-popup"
                        ref={(element) => setHeight(element, 300)}
                      >
                        Child
                      </Drawer.Popup>
                    </Drawer.Viewport>
                  </Drawer.Portal>
                </Drawer.Root>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const parentPopup = screen.getByTestId('parent-popup');
      const childPopup = screen.getByTestId('child-popup');
      const childViewport = screen.getByTestId('child-viewport');
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => childPopup;

      try {
        // A straight-down drag, so the swipe direction is attributed, ending in a
        // slight upward reversal: the reversal flips the sampled release velocity
        // against the drag so the release resolves through the slow fallback velocity
        // and settles back on the snap point in both test environments.
        firePointer.down(childViewport, {
          button: 0,
          buttons: 1,
          pointerId: 1,
          clientX: 100,
          clientY: 10,
          pointerType: 'mouse',
          timeStamp: 1000,
        });
        firePointer.move(childViewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 100,
          clientY: 24,
          pointerType: 'mouse',
          timeStamp: 1050,
        });
        firePointer.move(childViewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 100,
          clientY: 48,
          pointerType: 'mouse',
          timeStamp: 1150,
        });
        await flushMicrotasks();

        expect(parentPopup).toHaveAttribute('data-nested-drawer-swiping', '');
        expect(parentPopup.style.getPropertyValue('--drawer-swipe-progress')).not.toBe('0');

        firePointer.move(childViewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 100,
          clientY: 44,
          pointerType: 'mouse',
          timeStamp: 1250,
        });
        firePointer.up(childViewport, {
          pointerId: 1,
          clientX: 100,
          clientY: 44,
          pointerType: 'mouse',
          timeStamp: 1600,
        });
        await flushMicrotasks();

        expect(childPopup).not.toHaveAttribute('data-ending-style');
        expect(childPopup).not.toHaveAttribute('data-swipe-dismiss');
        expect(parentPopup.style.getPropertyValue('--drawer-swipe-progress')).toBe('0');
        expect(parentPopup).not.toHaveAttribute('data-nested-drawer-swiping');
      } finally {
        document.elementFromPoint = originalElementFromPoint;
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not dismiss from an unattributed fast swipe with snapToSequentialPoints', async () => {
    const handleOpenChange = vi.fn();
    const handleSnapPointChange = vi.fn();

    vi.useFakeTimers();
    try {
      await render(
        <Drawer.Root
          open
          onOpenChange={handleOpenChange}
          onSnapPointChange={handleSnapPointChange}
          snapPoints={['100px', '200px']}
          snapToSequentialPoints
          swipeDirection="down"
        >
          <Drawer.Portal>
            <Drawer.Viewport data-testid="viewport" ref={(element) => setHeight(element, 400)}>
              <Drawer.Popup data-testid="popup" ref={(element) => setHeight(element, 300)}>
                Drawer
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const viewport = screen.getByTestId('viewport');
      const popup = screen.getByTestId('popup');
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => popup;

      try {
        // Same mostly horizontal flick as the non-sequential test, released from the
        // most-collapsed snap point so the sequential branch has no adjacent point to
        // advance to and decides to close.
        firePointer.down(viewport, {
          button: 0,
          buttons: 1,
          pointerId: 1,
          clientX: 100,
          clientY: 10,
          pointerType: 'mouse',
          timeStamp: 1000,
        });
        firePointer.move(viewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 120,
          clientY: 12,
          pointerType: 'mouse',
          timeStamp: 1050,
        });
        firePointer.move(viewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 200,
          clientY: 20,
          pointerType: 'mouse',
          timeStamp: 1100,
        });
        firePointer.move(viewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 240,
          clientY: 55,
          pointerType: 'mouse',
          timeStamp: 1120,
        });
        firePointer.up(viewport, {
          pointerId: 1,
          clientX: 240,
          clientY: 55,
          pointerType: 'mouse',
          timeStamp: 1130,
        });
        await flushMicrotasks();
      } finally {
        document.elementFromPoint = originalElementFromPoint;
      }

      expect(handleOpenChange).not.toHaveBeenCalled();
      expect(handleSnapPointChange).not.toHaveBeenCalledWith(null, expect.anything());
      expect(handleSnapPointChange).toHaveBeenCalledWith('100px', expect.anything());
      expect(popup).not.toHaveAttribute('data-ending-style');
      expect(popup).not.toHaveAttribute('data-swipe-dismiss');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not start swipe dismissal when closing the snap point is canceled', async () => {
    const handleOpenChange = vi.fn();
    const handleSnapPointChange = vi.fn(
      (
        nextSnapPoint: Drawer.Root.SnapPoint | null,
        eventDetails: Drawer.Root.SnapPointChangeEventDetails,
      ) => {
        if (nextSnapPoint === null) {
          eventDetails.cancel();
        }
      },
    );

    vi.useFakeTimers();
    try {
      await render(
        <Drawer.Root
          open
          defaultSnapPoint="100px"
          onOpenChange={handleOpenChange}
          onSnapPointChange={handleSnapPointChange}
          snapPoints={['100px', '200px']}
          snapToSequentialPoints
          swipeDirection="down"
        >
          <Drawer.Portal>
            <Drawer.Viewport data-testid="viewport" ref={(element) => setHeight(element, 400)}>
              <Drawer.Popup data-testid="popup" ref={(element) => setHeight(element, 300)}>
                Drawer
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const viewport = screen.getByTestId('viewport');
      const popup = screen.getByTestId('popup');
      const releaseAttributes: string[] = [];
      const observer = new MutationObserver((records) => {
        records.forEach((record) => {
          if (record.attributeName) {
            releaseAttributes.push(record.attributeName);
          }
        });
      });
      observer.observe(popup, {
        attributeFilter: ['data-ending-style', 'data-swipe-dismiss'],
        attributes: true,
      });

      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => popup;

      try {
        firePointer.down(viewport, {
          button: 0,
          buttons: 1,
          pointerId: 1,
          clientX: 100,
          clientY: 10,
          pointerType: 'mouse',
          timeStamp: 1000,
        });
        firePointer.move(viewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 100,
          clientY: 30,
          pointerType: 'mouse',
          timeStamp: 1050,
        });
        firePointer.move(viewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 100,
          clientY: 80,
          pointerType: 'mouse',
          timeStamp: 1100,
        });
        firePointer.up(viewport, {
          pointerId: 1,
          clientX: 100,
          clientY: 100,
          pointerType: 'mouse',
          timeStamp: 1120,
        });
        await flushMicrotasks();
      } finally {
        document.elementFromPoint = originalElementFromPoint;
        observer.disconnect();
      }

      expect(handleSnapPointChange).toHaveBeenCalledWith(null, expect.anything());
      expect(handleOpenChange).not.toHaveBeenCalled();
      expect(releaseAttributes).toEqual([]);
      expect(popup).not.toHaveAttribute('data-ending-style');
      expect(popup).not.toHaveAttribute('data-swipe-dismiss');
    } finally {
      vi.useRealTimers();
    }
  });

  it('settles on the nearest snap point when an unattributed drag ends past the last snap point', async () => {
    const handleOpenChange = vi.fn();
    const handleSnapPointChange = vi.fn();

    vi.useFakeTimers();
    try {
      await render(
        <Drawer.Root
          open
          onOpenChange={handleOpenChange}
          onSnapPointChange={handleSnapPointChange}
          snapPoints={['200px', '100px']}
          defaultSnapPoint="100px"
          swipeDirection="down"
        >
          <Drawer.Portal>
            <Drawer.Viewport data-testid="viewport" ref={(element) => setHeight(element, 400)}>
              <Drawer.Popup data-testid="popup" ref={(element) => setHeight(element, 300)}>
                Drawer
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const viewport = screen.getByTestId('viewport');
      const popup = screen.getByTestId('popup');
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => popup;

      try {
        // A slow diagonal drag that never attributes a direction and ends nearer the closed
        // position than to any snap point, so the release resolves through the close branch.
        firePointer.down(viewport, {
          button: 0,
          buttons: 1,
          pointerId: 1,
          clientX: 100,
          clientY: 100,
          pointerType: 'mouse',
          timeStamp: 1000,
        });
        firePointer.move(viewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 200,
          clientY: 120,
          pointerType: 'mouse',
          timeStamp: 1100,
        });
        firePointer.move(viewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 300,
          clientY: 170,
          pointerType: 'mouse',
          timeStamp: 1400,
        });
        firePointer.move(viewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 400,
          clientY: 190,
          pointerType: 'mouse',
          timeStamp: 1900,
        });
        firePointer.up(viewport, {
          pointerId: 1,
          clientX: 400,
          clientY: 190,
          pointerType: 'mouse',
          timeStamp: 1950,
        });
        await flushMicrotasks();
      } finally {
        document.elementFromPoint = originalElementFromPoint;
      }

      expect(handleOpenChange).not.toHaveBeenCalled();
      expect(handleSnapPointChange).not.toHaveBeenCalledWith(null, expect.anything());
      expect(handleSnapPointChange).toHaveBeenCalledWith('100px', expect.anything());
      expect(popup).not.toHaveAttribute('data-ending-style');
    } finally {
      vi.useRealTimers();
    }
  });

  it('settles on the nearest snap point when an unattributed drag ends past the last snap point with snapToSequentialPoints', async () => {
    const handleOpenChange = vi.fn();
    const handleSnapPointChange = vi.fn();

    vi.useFakeTimers();
    try {
      await render(
        <Drawer.Root
          open
          onOpenChange={handleOpenChange}
          onSnapPointChange={handleSnapPointChange}
          snapPoints={['200px', '100px']}
          defaultSnapPoint="100px"
          snapToSequentialPoints
          swipeDirection="down"
        >
          <Drawer.Portal>
            <Drawer.Viewport data-testid="viewport" ref={(element) => setHeight(element, 400)}>
              <Drawer.Popup data-testid="popup" ref={(element) => setHeight(element, 300)}>
                Drawer
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const viewport = screen.getByTestId('viewport');
      const popup = screen.getByTestId('popup');
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => popup;

      try {
        // A slow diagonal drag that never attributes a direction and ends nearer the closed
        // position than to any snap point, so the release resolves through the close branch.
        firePointer.down(viewport, {
          button: 0,
          buttons: 1,
          pointerId: 1,
          clientX: 100,
          clientY: 100,
          pointerType: 'mouse',
          timeStamp: 1000,
        });
        firePointer.move(viewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 200,
          clientY: 120,
          pointerType: 'mouse',
          timeStamp: 1100,
        });
        firePointer.move(viewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 300,
          clientY: 170,
          pointerType: 'mouse',
          timeStamp: 1400,
        });
        firePointer.move(viewport, {
          buttons: 1,
          pointerId: 1,
          clientX: 400,
          clientY: 190,
          pointerType: 'mouse',
          timeStamp: 1900,
        });
        firePointer.up(viewport, {
          pointerId: 1,
          clientX: 400,
          clientY: 190,
          pointerType: 'mouse',
          timeStamp: 1950,
        });
        await flushMicrotasks();
      } finally {
        document.elementFromPoint = originalElementFromPoint;
      }

      expect(handleOpenChange).not.toHaveBeenCalled();
      expect(handleSnapPointChange).not.toHaveBeenCalledWith(null, expect.anything());
      expect(handleSnapPointChange).toHaveBeenCalledWith('100px', expect.anything());
      expect(popup).not.toHaveAttribute('data-ending-style');
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the resting snap point progress when a press never starts a swipe', async () => {
    await render(
      <Drawer.Root open snapPoints={['100px', '200px']} swipeDirection="down">
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport data-testid="viewport" ref={(element) => setHeight(element, 400)}>
            <Drawer.Popup data-testid="popup" ref={(element) => setHeight(element, 300)}>
              <Drawer.Content data-testid="content">Drawer</Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const backdrop = screen.getByTestId('backdrop');
    const content = screen.getByTestId('content');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => content;

    expect(backdrop.style.getPropertyValue('--drawer-swipe-progress')).toBe('1');

    try {
      // A press inside `Drawer.Content` never starts a swipe, but it still reaches the gesture
      // hook's release handler, which reports progress carrying the last drag deltas.
      fireEvent.pointerDown(content, {
        button: 0,
        buttons: 1,
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        pointerType: 'mouse',
      });
      fireEvent.pointerUp(content, {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        pointerType: 'mouse',
      });
      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(backdrop.style.getPropertyValue('--drawer-swipe-progress')).toBe('1');
  });

  it('does not resolve snap points before the popup has a measurable height', async () => {
    const handleOpenChange = vi.fn();
    await render(
      <Drawer.Root
        open
        onOpenChange={handleOpenChange}
        snapPoints={['100px', '200px']}
        swipeDirection="down"
      >
        <Drawer.Portal>
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup
              data-testid="popup"
              ref={(element) => {
                if (element) {
                  Object.defineProperty(element, 'offsetHeight', {
                    configurable: true,
                    value: 0,
                  });
                }
              }}
            >
              Drawer
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const viewport = screen.getByTestId('viewport');
    const popup = screen.getByTestId('popup');
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
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 1,
        pointerType: 'mouse',
      });
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 40,
        pointerType: 'mouse',
      });
      fireEvent.pointerUp(viewport, {
        pointerId: 1,
        clientX: 0,
        clientY: 40,
        pointerType: 'mouse',
      });
      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it('falls back to regular dismissal when all snap points are invalid', async () => {
    const handleOpenChange = vi.fn();
    await render(
      <Drawer.Root open onOpenChange={handleOpenChange} snapPoints={['50%']}>
        <Drawer.Portal>
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup
              data-testid="popup"
              ref={(element) => {
                if (element) {
                  Object.defineProperty(element, 'offsetHeight', {
                    configurable: true,
                    value: 200,
                  });
                }
              }}
            >
              Drawer
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const viewport = screen.getByTestId('viewport');
    const popup = screen.getByTestId('popup');
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
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 1,
        pointerType: 'mouse',
      });
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 140,
        pointerType: 'mouse',
      });
      fireEvent.pointerUp(viewport, {
        pointerId: 1,
        clientX: 0,
        clientY: 140,
        pointerType: 'mouse',
      });
      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(handleOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it('defers pointer capture until movement passes the drag threshold', async () => {
    await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const viewport = screen.getByTestId('viewport');
    const popup = screen.getByTestId('popup');

    const setPointerCapture = vi.fn();
    Object.defineProperty(popup, 'setPointerCapture', {
      configurable: true,
      value: setPointerCapture,
    });
    Object.defineProperty(popup, 'releasePointerCapture', {
      configurable: true,
      value: () => {},
    });

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

      // A plain press must not capture the pointer: capture would retarget the eventual
      // `click` to the popup and block activation of non-native interactive children.
      expect(setPointerCapture).not.toHaveBeenCalled();

      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 2,
        pointerType: 'mouse',
      });
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 4,
        pointerType: 'mouse',
      });

      await flushMicrotasks();

      // Sub-threshold jitter during a click must not capture either.
      expect(setPointerCapture).not.toHaveBeenCalled();

      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 12,
        pointerType: 'mouse',
      });

      await flushMicrotasks();

      expect(setPointerCapture).toHaveBeenCalledTimes(1);

      fireEvent.pointerUp(viewport, {
        pointerId: 1,
        clientX: 0,
        clientY: 12,
        pointerType: 'mouse',
      });
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

  it('ignores swipe input until a popup is mounted', async () => {
    const handleOpenChange = vi.fn();
    await render(
      <Drawer.Root open onOpenChange={handleOpenChange}>
        <Drawer.Portal>
          <Drawer.Viewport data-testid="viewport" />
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const viewport = screen.getByTestId('viewport');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => viewport;

    try {
      fireEvent.pointerDown(viewport, {
        button: 0,
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 0,
        pointerType: 'mouse',
      });
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 100,
        pointerType: 'mouse',
      });
      fireEvent.pointerUp(viewport, {
        pointerId: 1,
        clientX: 0,
        clientY: 100,
        pointerType: 'mouse',
      });
      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it('cleans up when the popup unmounts during an active swipe', async () => {
    const handleOpenChange = vi.fn();
    function TestCase({ showPopup }: { showPopup: boolean }) {
      return (
        <Drawer.Root
          open
          onOpenChange={handleOpenChange}
          snapPoints={['100px', '200px']}
          swipeDirection="down"
        >
          <Drawer.Portal>
            <Drawer.Backdrop data-testid="backdrop" />
            <Drawer.Viewport data-testid="viewport">
              {showPopup && <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>}
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      );
    }

    const { setProps } = await render(<TestCase showPopup />);
    const viewport = screen.getByTestId('viewport');
    const popup = screen.getByTestId('popup');
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
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 20,
        pointerType: 'mouse',
      });
      expect(screen.getByTestId('backdrop')).toHaveAttribute('data-swiping', '');

      await setProps({ showPopup: false });
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 30,
        pointerType: 'mouse',
      });
      expect(screen.getByTestId('backdrop')).toHaveAttribute('data-swiping', '');

      fireEvent.pointerUp(viewport, {
        pointerId: 1,
        clientX: 0,
        clientY: 30,
        pointerType: 'mouse',
      });
      await flushMicrotasks();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(screen.getByTestId('backdrop')).not.toHaveAttribute('data-swiping');
    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it('does not start pointer swipes while a closed drawer remains mounted', async () => {
    const handleOpenChange = vi.fn();
    const originalElementFromPoint = document.elementFromPoint;

    try {
      await render(
        <Drawer.Root
          defaultOpen
          onOpenChange={(nextOpen, eventDetails) => {
            handleOpenChange(nextOpen);
            if (!nextOpen) {
              eventDetails.preventUnmountOnClose();
            }
          }}
        >
          <Drawer.Portal>
            <Drawer.Backdrop data-testid="backdrop" />
            <Drawer.Viewport data-testid="viewport">
              <Drawer.Popup data-testid="popup">
                <Drawer.Close>Close</Drawer.Close>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const viewport = screen.getByTestId('viewport');
      const popup = screen.getByTestId('popup');
      document.elementFromPoint = () => popup;

      await act(async () => {
        screen.getByRole('button', { name: 'Close' }).click();
      });
      await waitFor(() => {
        expect(popup).toHaveAttribute('data-closed', '');
      });
      handleOpenChange.mockClear();

      fireEvent.pointerDown(viewport, {
        button: 0,
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 0,
        pointerType: 'mouse',
      });
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 100,
        pointerType: 'mouse',
      });

      expect(screen.getByTestId('backdrop')).not.toHaveAttribute('data-swiping');
      expect(handleOpenChange).not.toHaveBeenCalled();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('clears a selection whose endpoints are popup elements', async () => {
    await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const popup = screen.getByTestId('popup');
    const removeAllRanges = vi.fn();
    const selectionSpy = vi.spyOn(document, 'getSelection').mockReturnValue({
      anchorNode: popup,
      focusNode: popup,
      isCollapsed: false,
      removeAllRanges,
    } as unknown as Selection);
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;

    try {
      fireEvent.pointerDown(screen.getByTestId('viewport'), {
        button: 0,
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 0,
        pointerType: 'mouse',
      });
      expect(removeAllRanges).toHaveBeenCalledTimes(1);
    } finally {
      selectionSpy.mockRestore();
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('preserves an expanded touch selection whose focus endpoint is in the popup', async () => {
    await render(
      <div>
        <span data-testid="outside">Outside</span>
        <Drawer.Root open>
          <Drawer.Portal>
            <Drawer.Backdrop data-testid="backdrop" />
            <Drawer.Viewport>
              <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </div>,
    );

    const popup = screen.getByTestId('popup');
    const outside = screen.getByTestId('outside');
    const selectionSpy = vi.spyOn(document, 'getSelection').mockReturnValue({
      anchorNode: outside,
      focusNode: popup,
      isCollapsed: false,
      containsNode: () => false,
    } as unknown as Selection);
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;

    try {
      fireEvent.touchStart(popup, {
        touches: [createTouch(popup, { clientX: 0, clientY: 100 })],
      });
      fireEvent.touchMove(popup, {
        touches: [createTouch(popup, { clientX: 0, clientY: 140 })],
      });

      expect(screen.getByTestId('backdrop')).not.toHaveAttribute('data-swiping');
    } finally {
      selectionSpy.mockRestore();
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('falls back to the viewport when a touch event has no element target', async () => {
    await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const popup = screen.getByTestId('popup');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;
    const touchStart = new Event('touchstart', { bubbles: true, cancelable: true });
    Object.defineProperty(touchStart, 'touches', {
      configurable: true,
      value: [createTouch(popup, { clientX: 0, clientY: 100 })],
    });
    touchStart.composedPath = () => [window];

    try {
      await act(async () => {
        popup.dispatchEvent(touchStart);
        await flushMicrotasks();
      });
      fireEvent.touchMove(popup, {
        touches: [createTouch(popup, { clientX: 0, clientY: 140 })],
      });
      expect(screen.getByTestId('backdrop')).toHaveAttribute('data-swiping', '');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('ignores compatibility touch pointer gestures with real displacement', async () => {
    const handleOpenChange = vi.fn();
    await render(
      <Drawer.Root open onOpenChange={handleOpenChange}>
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport data-testid="viewport">
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const viewport = screen.getByTestId('viewport');
    const popup = screen.getByTestId('popup');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => popup;
    const pointerEvents = [
      ['pointerdown', 0, 1],
      ['pointermove', 1, 1],
      ['pointermove', 100, 1],
      ['pointerup', 100, 0],
      ['pointercancel', 100, 0],
    ] as const;

    try {
      await act(async () => {
        for (const [type, clientY, buttons] of pointerEvents) {
          const event = new Event(type, { bubbles: true, cancelable: true });
          Object.defineProperties(event, {
            pointerType: { value: 'touch' },
            pointerId: { value: 1 },
            button: { value: 0 },
            buttons: { value: buttons },
            clientX: { value: 0 },
            clientY: { value: clientY },
          });

          viewport.dispatchEvent(event);
        }
        await flushMicrotasks();
      });
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }

    expect(screen.getByTestId('backdrop')).not.toHaveAttribute('data-swiping');
    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it('publishes and clears swipe progress through Drawer.Provider', async () => {
    await render(
      <Drawer.Provider>
        <Drawer.Indent data-testid="indent" />
        <Drawer.Root open>
          <Drawer.Portal>
            <Drawer.Viewport data-testid="viewport">
              <Drawer.Popup
                data-testid="popup"
                ref={(element) => {
                  if (element) {
                    Object.defineProperty(element, 'offsetHeight', {
                      configurable: true,
                      value: 100,
                    });
                  }
                }}
              >
                Drawer
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </Drawer.Provider>,
    );

    const viewport = screen.getByTestId('viewport');
    const popup = screen.getByTestId('popup');
    const indent = screen.getByTestId('indent');
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
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 1,
        pointerType: 'mouse',
      });
      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 40,
        pointerType: 'mouse',
      });
      await flushMicrotasks();
      expect(
        Number.parseFloat(indent.style.getPropertyValue('--drawer-swipe-progress')),
      ).toBeCloseTo(0.39);
      expect(indent.style.getPropertyValue('--drawer-height')).toBe('100px');

      fireEvent.pointerMove(viewport, {
        buttons: 1,
        pointerId: 1,
        clientX: 0,
        clientY: 0,
        pointerType: 'mouse',
      });
      expect(indent.style.getPropertyValue('--drawer-swipe-progress')).toBe('0');
      expect(indent.style.getPropertyValue('--drawer-height')).toBe('');
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it('publishes resting snap progress before descendant layout effects', async () => {
    let snapPointPassiveEffectFlushed = false;
    let appliedBeforePassiveEffect: boolean | null = null;

    function PassiveEffectBoundary({ snapPoint }: { snapPoint: string }) {
      useIsoLayoutEffect(() => {
        snapPointPassiveEffectFlushed = false;
      });

      React.useEffect(() => {
        if (snapPoint === '200px') {
          snapPointPassiveEffectFlushed = true;
        }
      }, [snapPoint]);

      return null;
    }

    function TestCase({ snapPoint }: { snapPoint: string }) {
      return (
        <Drawer.Root open modal={false} snapPoints={['100px', '200px']} snapPoint={snapPoint}>
          <Drawer.Portal>
            <Drawer.Backdrop data-testid="backdrop" />
            <Drawer.Viewport
              ref={(element) => {
                if (element) {
                  Object.defineProperty(element, 'offsetHeight', {
                    configurable: true,
                    value: 200,
                  });
                }
              }}
            >
              <PassiveEffectBoundary snapPoint={snapPoint} />
              <Drawer.Popup
                ref={(element) => {
                  if (element) {
                    Object.defineProperty(element, 'offsetHeight', {
                      configurable: true,
                      value: 200,
                    });
                  }
                }}
              >
                Drawer
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      );
    }

    const { setProps } = await render(<TestCase snapPoint="100px" />);
    const backdrop = screen.getByTestId('backdrop');
    const originalSetProperty = backdrop.style.setProperty.bind(backdrop.style);
    const setPropertySpy = vi
      .spyOn(backdrop.style, 'setProperty')
      .mockImplementation((name, value, priority) => {
        if (
          name === '--drawer-swipe-progress' &&
          value === '0' &&
          appliedBeforePassiveEffect === null
        ) {
          appliedBeforePassiveEffect = !snapPointPassiveEffectFlushed;
        }
        originalSetProperty(name, value, priority);
      });

    try {
      await setProps({ snapPoint: '200px' });
      expect(appliedBeforePassiveEffect).toBe(true);
      expect(backdrop.style.getPropertyValue('--drawer-swipe-progress')).toBe('0');
    } finally {
      setPropertySpy.mockRestore();
    }
  });

  it('clears kept-mounted swipe state before descendant layout effects on reopen', async () => {
    let openPassiveEffectFlushed = false;
    let resetBeforePassiveEffect: boolean | null = null;

    function PassiveEffectBoundary({ open }: { open: boolean }) {
      useDialogRootContext().useState('open');

      useIsoLayoutEffect(() => {
        openPassiveEffectFlushed = false;
      });

      React.useEffect(() => {
        if (open) {
          openPassiveEffectFlushed = true;
        }
      }, [open]);

      return null;
    }

    function TestCase({ open }: { open: boolean }) {
      return (
        <Drawer.Root open={open} modal={false}>
          <Drawer.Portal keepMounted>
            <Drawer.Viewport>
              <PassiveEffectBoundary open={open} />
              <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      );
    }

    const { setProps } = await render(<TestCase open={false} />);
    const popup = screen.getByTestId('popup');
    popup.style.setProperty('--drawer-swipe-movement-y', '50px');
    popup.setAttribute('data-swipe-dismiss', '');
    const originalToggleAttribute = popup.toggleAttribute.bind(popup);
    const toggleAttributeSpy = vi
      .spyOn(popup, 'toggleAttribute')
      .mockImplementation((name, force) => {
        if (name === 'data-swipe-dismiss' && force === false && resetBeforePassiveEffect === null) {
          resetBeforePassiveEffect = !openPassiveEffectFlushed;
        }
        return originalToggleAttribute(name, force);
      });

    try {
      await setProps({ open: true });
      expect(resetBeforePassiveEffect).toBe(true);
      expect(popup.style.getPropertyValue('--drawer-swipe-movement-y')).toBe('0px');
      expect(popup).not.toHaveAttribute('data-swipe-dismiss');
    } finally {
      toggleAttributeSpy.mockRestore();
    }
  });

  it('clears nested progress before descendant layout effects when the child closes', async () => {
    let closePassiveEffectFlushed = false;
    let clearedBeforePassiveEffect: boolean | null = null;

    function NestedProgressControl() {
      const { onNestedSwipeProgressChange } = useDrawerRootContext();

      return <button onClick={() => onNestedSwipeProgressChange(0.5)}>Set nested progress</button>;
    }

    function PassiveEffectBoundary({ childOpen }: { childOpen: boolean }) {
      useDialogRootContext().useState('open');
      closePassiveEffectFlushed = false;

      useIsoLayoutEffect(
        () => () => {
          closePassiveEffectFlushed = false;
        },
        [],
      );

      React.useEffect(
        () => () => {
          if (childOpen) {
            closePassiveEffectFlushed = true;
          }
        },
        [childOpen],
      );

      return null;
    }

    function TestCase({ childOpen }: { childOpen: boolean }) {
      return (
        <Drawer.Root open modal={false}>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup data-testid="parent-popup">
                <Drawer.Root open={childOpen} modal={false}>
                  <Drawer.Portal keepMounted>
                    <Drawer.Viewport>
                      <PassiveEffectBoundary childOpen={childOpen} />
                      <Drawer.Popup>Child drawer</Drawer.Popup>
                    </Drawer.Viewport>
                  </Drawer.Portal>
                  <NestedProgressControl />
                </Drawer.Root>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      );
    }

    const { setProps, user } = await render(<TestCase childOpen />);

    await user.click(screen.getByRole('button', { name: 'Set nested progress' }));
    expect(
      screen.getByTestId('parent-popup').style.getPropertyValue('--drawer-swipe-progress'),
    ).toBe('0.5');
    const parentPopup = screen.getByTestId('parent-popup');
    const originalSetProperty = parentPopup.style.setProperty.bind(parentPopup.style);
    const setPropertySpy = vi
      .spyOn(parentPopup.style, 'setProperty')
      .mockImplementation((name, value, priority) => {
        if (
          name === '--drawer-swipe-progress' &&
          value === '0' &&
          clearedBeforePassiveEffect === null
        ) {
          clearedBeforePassiveEffect = !closePassiveEffectFlushed;
        }
        originalSetProperty(name, value, priority);
      });

    try {
      await setProps({ childOpen: false });
      expect(clearedBeforePassiveEffect).toBe(true);
      expect(parentPopup.style.getPropertyValue('--drawer-swipe-progress')).toBe('0');
    } finally {
      setPropertySpy.mockRestore();
    }
  });

  it('clears provider and backdrop swipe state during layout teardown', async () => {
    let teardownPassiveEffectFlushed = false;
    let clearedBeforePassiveEffect: boolean | null = null;

    function ProviderStateControl() {
      const providerContext = useDrawerProviderContext();

      return (
        <button
          onClick={() => {
            providerContext?.visualStateStore.set({
              swipeProgress: 0.5,
              frontmostHeight: 100,
            });
          }}
        >
          Set provider state
        </button>
      );
    }

    function PassiveEffectBoundary() {
      useIsoLayoutEffect(
        () => () => {
          teardownPassiveEffectFlushed = false;
        },
        [],
      );

      React.useEffect(
        () => () => {
          teardownPassiveEffectFlushed = true;
        },
        [],
      );

      return null;
    }

    function TestCase({ showViewport }: { showViewport: boolean }) {
      return (
        <Drawer.Provider>
          <Drawer.Indent data-testid="indent" />
          <ProviderStateControl />
          <Drawer.Root open modal={false}>
            <Drawer.Portal>
              <Drawer.Backdrop data-testid="backdrop" />
              {showViewport && (
                <React.Fragment>
                  <PassiveEffectBoundary />
                  <Drawer.Viewport>
                    <Drawer.Popup>Drawer</Drawer.Popup>
                  </Drawer.Viewport>
                </React.Fragment>
              )}
            </Drawer.Portal>
          </Drawer.Root>
        </Drawer.Provider>
      );
    }

    const { setProps, user } = await render(<TestCase showViewport />);

    await user.click(screen.getByRole('button', { name: 'Set provider state' }));
    const indent = screen.getByTestId('indent');
    const backdrop = screen.getByTestId('backdrop');
    backdrop.setAttribute('data-swiping', '');
    expect(indent.style.getPropertyValue('--drawer-swipe-progress')).toBe('0.5');
    expect(indent.style.getPropertyValue('--drawer-height')).toBe('100px');
    const originalSetProperty = indent.style.setProperty.bind(indent.style);
    const setPropertySpy = vi
      .spyOn(indent.style, 'setProperty')
      .mockImplementation((name, value, priority) => {
        if (
          name === '--drawer-swipe-progress' &&
          value === '0' &&
          clearedBeforePassiveEffect === null
        ) {
          clearedBeforePassiveEffect = !teardownPassiveEffectFlushed;
        }
        originalSetProperty(name, value, priority);
      });

    try {
      await setProps({ showViewport: false });
      expect(clearedBeforePassiveEffect).toBe(true);
      expect(indent.style.getPropertyValue('--drawer-swipe-progress')).toBe('0');
      expect(indent.style.getPropertyValue('--drawer-height')).toBe('');
      expect(backdrop).not.toHaveAttribute('data-swiping');
    } finally {
      setPropertySpy.mockRestore();
    }
  });

  it('leaves pinch-zoom touchmove to the browser', async () => {
    await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Backdrop data-testid="backdrop" />
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const popup = screen.getByTestId('popup');
    fireEvent.touchStart(popup, {
      touches: [createTouch(popup, { clientX: 0, clientY: 100 })],
    });
    const touchMove = new Event('touchmove', { bubbles: true, cancelable: true });
    Object.defineProperty(touchMove, 'touches', {
      configurable: true,
      value: [
        createTouch(popup, { clientX: 0, clientY: 80 }),
        createTouch(popup, { clientX: 20, clientY: 80 }),
      ],
    });

    await act(async () => {
      expect(popup.dispatchEvent(touchMove)).toBe(true);
      await flushMicrotasks();
    });
    expect(screen.getByTestId('backdrop')).not.toHaveAttribute('data-swiping');
  });

  it('prevents page scrolling for a non-overflowing touch scroll container', async () => {
    await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup>
              <div data-testid="scroll" style={{ overflowY: 'auto' }}>
                Content
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const scroll = screen.getByTestId('scroll');
    Object.defineProperties(scroll, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 200, writable: true },
    });
    fireEvent.touchStart(scroll, {
      touches: [createTouch(scroll, { clientX: 0, clientY: 100 })],
    });
    Object.defineProperty(scroll, 'scrollHeight', { configurable: true, value: 100 });
    const touchMove = createNativeTouchMove(scroll, { clientX: 0, clientY: 80 });

    await act(async () => {
      expect(scroll.dispatchEvent(touchMove)).toBe(false);
      await flushMicrotasks();
    });
    expect(touchMove.defaultPrevented).toBe(true);

    const nonCancelableMove = new Event('touchmove', { bubbles: true, cancelable: false });
    Object.defineProperty(nonCancelableMove, 'touches', {
      configurable: true,
      value: [createTouch(scroll, { clientX: 0, clientY: 60 })],
    });
    await act(async () => {
      expect(scroll.dispatchEvent(nonCancelableMove)).toBe(true);
      await flushMicrotasks();
    });
  });

  it('keeps a claimed scroll-edge swipe moving through non-cancelable events', async () => {
    const handleParentTouchMove = vi.fn();
    await render(
      <div onTouchMove={handleParentTouchMove}>
        <Drawer.Root open>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup>
                <div data-testid="scroll" style={{ height: 100, overflowY: 'auto' }}>
                  <div style={{ height: 300 }} />
                </div>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </div>,
    );

    const scroll = screen.getByTestId('scroll');
    Object.defineProperties(scroll, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 300 },
    });
    scroll.scrollTop = 0;
    fireEvent.touchStart(scroll, {
      touches: [createTouch(scroll, { clientX: 0, clientY: 100 })],
    });
    fireEvent.touchMove(scroll, {
      touches: [createTouch(scroll, { clientX: 0, clientY: 120 })],
    });
    handleParentTouchMove.mockClear();

    const touchMove = new Event('touchmove', { bubbles: true, cancelable: false });
    Object.defineProperty(touchMove, 'touches', {
      configurable: true,
      value: [createTouch(scroll, { clientX: 0, clientY: 130 })],
    });
    await act(async () => {
      expect(scroll.dispatchEvent(touchMove)).toBe(true);
      await flushMicrotasks();
    });

    expect(handleParentTouchMove).not.toHaveBeenCalled();

    const cancelableMove = fireEvent.touchMove(scroll, {
      touches: [createTouch(scroll, { clientX: 0, clientY: 140 })],
    });
    expect(cancelableMove).toBe(false);
  });

  it('does not claim a stationary touch in overflowing content', async () => {
    await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup>
              <div data-testid="scroll" style={{ height: 100, overflowY: 'auto' }}>
                <div style={{ height: 300 }} />
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const scroll = screen.getByTestId('scroll');
    Object.defineProperties(scroll, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 300 },
    });
    fireEvent.touchStart(scroll, {
      touches: [createTouch(scroll, { clientX: 0, clientY: 100 })],
    });
    const touchMove = createNativeTouchMove(scroll, { clientX: 0, clientY: 100 });

    await act(async () => {
      expect(scroll.dispatchEvent(touchMove)).toBe(true);
      await flushMicrotasks();
    });
    expect(touchMove.defaultPrevented).toBe(false);
  });
});
