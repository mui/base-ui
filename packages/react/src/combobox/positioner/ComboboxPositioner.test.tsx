import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { screen, waitFor } from '@mui/internal-test-utils';
import { Combobox } from '@base-ui/react/combobox';
import {
  createRenderer,
  describeConformance,
  isJSDOM,
  positionerConformanceTests,
} from '#test-utils';

describe('<Combobox.Positioner />', () => {
  const { render } = createRenderer();

  it('should not lock body scroll when controlled value={[]} triggers a re-render', async () => {
    // Render outside of act() to match real browser behavior where
    // the initial render and the useEffect re-render are separate commits.
    // Using act() batches them, hiding the bug.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const container = document.createElement('div');
    document.body.appendChild(container);
    document.body.removeAttribute('style');
    document.documentElement.removeAttribute('style');

    function Test() {
      const [, forceRender] = React.useState(0);
      React.useEffect(() => {
        forceRender(1);
      }, []);

      return (
        <Combobox.Root multiple value={[]}>
          <Combobox.Input />
          <Combobox.Portal>
            <Combobox.Positioner />
          </Combobox.Portal>
        </Combobox.Root>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    root.render(<Test />);

    // Wait for mount + useEffect re-render + setTimeout(0) in ScrollLocker.acquire
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });

    // Bug: the re-render causes forceMount, mounting the Positioner.
    // The Positioner's `open` is `undefined` (not `false`), so
    // `open && modal` evaluates to `undefined`, which triggers
    // useScrollLock's default parameter `enabled = true`.
    const bodyOverflowX = document.body.style.overflowX;
    const bodyOverflowY = document.body.style.overflowY;
    const htmlOverflowX = document.documentElement.style.overflowX;
    const htmlOverflowY = document.documentElement.style.overflowY;

    root.unmount();
    container.remove();
    document.body.removeAttribute('style');
    document.documentElement.removeAttribute('style');
    consoleSpy.mockRestore();

    expect(bodyOverflowX).not.toBe('hidden');
    expect(bodyOverflowY).not.toBe('hidden');
    expect(htmlOverflowX).not.toBe('hidden');
    expect(htmlOverflowY).not.toBe('hidden');
  });

  describeConformance(<Combobox.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Combobox.Root open>
          <Combobox.Portal>{node}</Combobox.Portal>
        </Combobox.Root>,
      );
    },
  }));

  positionerConformanceTests({
    render,
    createComponent: ({ root, trigger, positioner, popup }) => (
      <Combobox.Root {...root}>
        <Combobox.Input {...trigger} />
        <Combobox.Portal>
          <Combobox.Positioner {...positioner}>
            <Combobox.Popup {...popup}>Popup</Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ),
  });

  // https://github.com/mui/base-ui/issues/5118
  it.skipIf(isJSDOM)(
    'keeps the popup on the preferred side when its capped height fits below tall content',
    async () => {
      const items = Array.from({ length: 40 }, (_, index) => `item-${index}`);

      await render(
        // Anchor fixed near the bottom of the viewport: less room below than above,
        // but still more than the List's capped height.
        <div style={{ position: 'fixed', bottom: 120, left: 100 }}>
          <Combobox.Root open items={items}>
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner data-testid="positioner" side="bottom" sideOffset={0}>
                <Combobox.Popup>
                  <Combobox.List
                    style={{ maxHeight: 'min(80px, var(--available-height))', overflowY: 'auto' }}
                  >
                    {(item: string) => (
                      <Combobox.Item key={item} value={item} style={{ height: 30 }}>
                        {item}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </div>,
      );

      // The 40-item list (~1200px) overflows the room below the anchor, but the List is
      // capped to 80px which fits. The `--available-height` var must be seeded before
      // `size()` runs, otherwise `min(80px, var(--available-height))` is invalid on the
      // first `flip()` pass, the list is measured at full height, and the popup flips up.
      await waitFor(() => {
        expect(screen.getByTestId('positioner')).toHaveAttribute('data-side', 'bottom');
      });
    },
  );

  describe.skipIf(isJSDOM)('animated anchors', () => {
    function waitForFrame() {
      return new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    }

    // Resolves in a task after the next frame's paint, once this frame's observers have run.
    function waitForPaint() {
      return new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          const channel = new MessageChannel();
          channel.port1.onmessage = () => resolve();
          channel.port2.postMessage(null);
        });
      });
    }

    async function waitForIdleFrames() {
      // Lets the per-frame polling started by the open settle and stop.
      for (let frame = 0; frame < 10; frame += 1) {
        // eslint-disable-next-line no-await-in-loop
        await waitForFrame();
      }
    }

    function captureResizeObserverErrors() {
      const errors: string[] = [];
      const handleError = (event: ErrorEvent) => {
        if (event.message.includes('ResizeObserver loop')) {
          errors.push(event.message);
        }
      };
      window.addEventListener('error', handleError);
      return {
        errors,
        dispose: () => window.removeEventListener('error', handleError),
      };
    }

    it('tracks the anchor on each frame while its ancestor transform animates', async () => {
      const inputRef = React.createRef<HTMLInputElement>();
      const animatedContainerRef = React.createRef<HTMLDivElement>();
      const positionerRef = React.createRef<HTMLDivElement>();
      const resizeObserverErrors = captureResizeObserverErrors();
      let animation: Animation | undefined;
      let unmount: (() => void) | undefined;

      try {
        const view = await render(
          <div ref={animatedContainerRef} style={{ position: 'fixed', top: 20, left: 20 }}>
            <Combobox.Root open>
              <Combobox.Input ref={inputRef} style={{ width: 100 }} />
              <Combobox.Portal>
                <Combobox.Positioner
                  ref={positionerRef}
                  align="start"
                  collisionAvoidance={{
                    side: 'none',
                    align: 'none',
                    fallbackAxisSide: 'none',
                  }}
                >
                  <Combobox.Popup>
                    <Combobox.List>
                      <Combobox.Item value="One">One</Combobox.Item>
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
          </div>,
        );
        unmount = view.unmount;

        await waitFor(() => {
          expect(positionerRef.current!.getBoundingClientRect().left).toBeCloseTo(
            inputRef.current!.getBoundingClientRect().left,
            0,
          );
        });

        await React.act(async () => {
          await waitForIdleFrames();

          const initialLeft = inputRef.current!.getBoundingClientRect().left;
          // An ancestor transform changes the visual anchor rect without changing its layout size.
          animation = animatedContainerRef.current!.animate(
            [{ transform: 'translateX(0px)' }, { transform: 'translateX(120px)' }],
            { duration: 500, easing: 'linear', fill: 'both' },
          );

          const movedFrames: Array<{ anchorLeft: number; positionerLeft: number }> = [];
          for (let frame = 0; frame < 20; frame += 1) {
            // eslint-disable-next-line no-await-in-loop
            await waitForPaint();

            const anchorLeft = inputRef.current!.getBoundingClientRect().left;
            if (anchorLeft !== initialLeft) {
              movedFrames.push({
                anchorLeft,
                positionerLeft: positionerRef.current!.getBoundingClientRect().left,
              });
            }
          }

          // The first moved frame may lag: polling restarts from the observers after idling.
          const trackedFrames = movedFrames.slice(1);
          expect(trackedFrames.length).toBeGreaterThan(4);
          trackedFrames.forEach(({ anchorLeft, positionerLeft }) => {
            expect(positionerLeft).toBeCloseTo(anchorLeft, 0);
          });
        });

        expect(resizeObserverErrors.errors).toEqual([]);
      } finally {
        await React.act(async () => {
          animation?.cancel();
          unmount?.();
        });
        resizeObserverErrors.dispose();
      }
    });

    it('does not loop the ResizeObserver when an ancestor scale animates with width: var(--anchor-width)', async () => {
      const inputRef = React.createRef<HTMLInputElement>();
      const animatedContainerRef = React.createRef<HTMLDivElement>();
      const popupRef = React.createRef<HTMLDivElement>();
      const resizeObserverErrors = captureResizeObserverErrors();
      let animation: Animation | undefined;
      let unmount: (() => void) | undefined;

      try {
        const view = await render(
          <div
            ref={animatedContainerRef}
            style={{ position: 'fixed', top: 20, left: 20, transformOrigin: '0 0' }}
          >
            <Combobox.Root open>
              <Combobox.Input ref={inputRef} style={{ width: 100, boxSizing: 'border-box' }} />
              <Combobox.Portal>
                <Combobox.Positioner align="start">
                  <Combobox.Popup ref={popupRef} style={{ width: 'var(--anchor-width)' }}>
                    <Combobox.List>
                      <Combobox.Item value="One">One</Combobox.Item>
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
          </div>,
        );
        unmount = view.unmount;

        await waitFor(() => {
          expect(popupRef.current!.getBoundingClientRect().width).toBeCloseTo(100, 0);
        });

        await React.act(async () => {
          animation = animatedContainerRef.current!.animate(
            [{ transform: 'scale(1)' }, { transform: 'scale(2)' }],
            { duration: 400, easing: 'linear', fill: 'both' },
          );
          await animation.finished;
          await waitForPaint();
        });

        const anchorWidth = inputRef.current!.getBoundingClientRect().width;
        expect(anchorWidth).toBeCloseTo(200, 0);
        expect(popupRef.current!.getBoundingClientRect().width).toBeCloseTo(anchorWidth, 0);
        expect(resizeObserverErrors.errors).toEqual([]);
      } finally {
        await React.act(async () => {
          animation?.cancel();
          unmount?.();
        });
        resizeObserverErrors.dispose();
      }
    });

    it('follows an anchor whose width animates with width: var(--anchor-width)', async () => {
      const inputRef = React.createRef<HTMLInputElement>();
      const popupRef = React.createRef<HTMLDivElement>();
      const resizeObserverErrors = captureResizeObserverErrors();
      let animation: Animation | undefined;
      let unmount: (() => void) | undefined;

      try {
        const view = await render(
          <div style={{ position: 'fixed', top: 20, left: 20 }}>
            <Combobox.Root open>
              <Combobox.Input ref={inputRef} style={{ width: 100, boxSizing: 'border-box' }} />
              <Combobox.Portal>
                <Combobox.Positioner align="start">
                  <Combobox.Popup ref={popupRef} style={{ width: 'var(--anchor-width)' }}>
                    <Combobox.List>
                      <Combobox.Item value="One">One</Combobox.Item>
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
          </div>,
        );
        unmount = view.unmount;

        await waitFor(() => {
          expect(popupRef.current!.getBoundingClientRect().width).toBeCloseTo(100, 0);
        });

        await React.act(async () => {
          animation = inputRef.current!.animate([{ width: '100px' }, { width: '300px' }], {
            duration: 500,
            easing: 'linear',
            fill: 'both',
          });

          let anchorWidth = 100;
          for (let frame = 0; frame < 10; frame += 1) {
            // eslint-disable-next-line no-await-in-loop
            await waitForFrame();

            anchorWidth = inputRef.current!.getBoundingClientRect().width;
            // Measured inside the frame callback, before this frame's observers run: with
            // observers alone, the popup only catches up after this point.
            expect(popupRef.current!.getBoundingClientRect().width).toBeCloseTo(anchorWidth, 0);
          }

          expect(anchorWidth).toBeGreaterThan(110);
        });

        expect(resizeObserverErrors.errors).toEqual([]);
      } finally {
        await React.act(async () => {
          animation?.cancel();
          unmount?.();
        });
        resizeObserverErrors.dispose();
      }
    });
  });

  describe.skipIf(isJSDOM)('default anchor', () => {
    it('uses the input when input group is absent', async () => {
      const inputWidth = 120;
      const triggerWidth = 240;
      let anchorWidth = 0;
      const inputRef = React.createRef<HTMLInputElement>();

      await render(
        <Combobox.Root open>
          <Combobox.Input ref={inputRef} style={{ width: inputWidth }} />
          <Combobox.Trigger style={{ width: triggerWidth }}>Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner
              sideOffset={(data) => {
                anchorWidth = data.anchor.width;
                return 0;
              }}
            >
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="One">One</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      await waitFor(() => {
        expect(anchorWidth).toBeCloseTo(inputRef.current!.getBoundingClientRect().width, 0);
      });
      expect(anchorWidth).not.toBeCloseTo(triggerWidth, 0);
    });

    it('uses the input group when present', async () => {
      const inputGroupWidth = 240;
      const inputWidth = 120;
      let anchorWidth = 0;

      await render(
        <Combobox.Root open>
          <Combobox.InputGroup style={{ width: inputGroupWidth }}>
            <Combobox.Input style={{ width: inputWidth }} />
            <Combobox.Trigger>Open</Combobox.Trigger>
          </Combobox.InputGroup>
          <Combobox.Portal>
            <Combobox.Positioner
              sideOffset={(data) => {
                anchorWidth = data.anchor.width;
                return 0;
              }}
            >
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="One">One</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      await waitFor(() => {
        expect(anchorWidth).toBeCloseTo(inputGroupWidth, 0);
      });
    });
  });
});
