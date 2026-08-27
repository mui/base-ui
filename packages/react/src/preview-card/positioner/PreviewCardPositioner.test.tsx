import { afterEach, expect, vi } from 'vitest';
import * as React from 'react';
import { PreviewCard } from '@base-ui/react/preview-card';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM, waitForPositioned } from '#test-utils';

const Trigger = React.forwardRef(function Trigger(
  props: PreviewCard.Trigger.Props,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  return <PreviewCard.Trigger {...props} ref={ref} render={<div />} />;
});

type RectLike = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

const multilineWrapperStyle = { width: 140 };
// These tests dispatch pointer coordinates directly. Exclude the real browser cursor so it cannot
// generate a competing hover event over a different inline line.
const multilineTriggerStyle: React.CSSProperties = {
  display: 'inline',
  lineHeight: '20px',
  pointerEvents: 'none',
};

function expectWithin(actual: number, expected: number, tolerance = 2) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

function hoverAt(element: Element, clientX: number, clientY: number) {
  fireEvent.mouseEnter(element, { clientX, clientY });
  fireEvent.mouseMove(element, { clientX, clientY });
}

// These overrides are safe because each test renders fresh trigger elements before mocking them.
function mockClientRects(element: Element, rects: RectLike[]) {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  const boundingRect = DOMRect.fromRect({
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  });

  Object.defineProperty(element, 'getClientRects', {
    configurable: true,
    value: () =>
      rects.map((rect) =>
        DOMRect.fromRect({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        }),
      ),
  });

  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => boundingRect,
  });
}

describe('<PreviewCard.Positioner />', () => {
  const { render, clock } = createRenderer();

  describeConformance(<PreviewCard.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <PreviewCard.Root open>
          <PreviewCard.Portal>{node}</PreviewCard.Portal>
        </PreviewCard.Root>,
      );
    },
  }));

  it('throws a descriptive error when rendered outside <PreviewCard.Portal>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <PreviewCard.Root open>
            <PreviewCard.Positioner />
          </PreviewCard.Root>,
        ),
      ).rejects.toThrow('Base UI: <PreviewCard.Portal> is missing.');
    } finally {
      errorSpy.mockRestore();
    }
  });

  const baselineX = 10;
  const baselineY = 36;
  const popupWidth = 52;
  const popupHeight = 24;
  const anchorWidth = 72;
  const anchorHeight = 36;
  const triggerStyle = { width: anchorWidth, height: anchorHeight };
  const popupStyle = { width: popupWidth, height: popupHeight };

  describe.skipIf(isJSDOM)('prop: sideOffset', () => {
    it('offsets the side when a number is specified', async () => {
      const sideOffset = 7;
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner data-testid="positioner" sideOffset={sideOffset}>
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX,
        y: baselineY + sideOffset,
      });
    });

    it('offsets the side when a function is specified', async () => {
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              data-testid="positioner"
              sideOffset={(data) => data.positioner.width + data.anchor.width}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX,
        y: baselineY + popupWidth + anchorWidth,
      });
    });

    it('can read the latest side inside sideOffset', async () => {
      let side = 'none';
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              side="left"
              data-testid="positioner"
              sideOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('right');
    });

    it('can read the latest align inside sideOffset', async () => {
      let align = 'none';
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              side="right"
              align="start"
              data-testid="positioner"
              sideOffset={(data) => {
                align = data.align;
                return 0;
              }}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      // correctly flips the align in the browser
      expect(align).toBe('end');
    });

    it('reads logical side inside sideOffset', async () => {
      let side = 'none';
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              side="inline-start"
              data-testid="positioner"
              sideOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('inline-end');
    });
  });

  describe.skipIf(isJSDOM)('prop: alignOffset', () => {
    it('offsets the align when a number is specified', async () => {
      const alignOffset = 7;
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner data-testid="positioner" alignOffset={alignOffset}>
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX + alignOffset,
        y: baselineY,
      });
    });

    it('offsets the align when a function is specified', async () => {
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              data-testid="positioner"
              alignOffset={(data) => data.positioner.width}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX + popupWidth,
        y: baselineY,
      });
    });

    it('can read the latest side inside alignOffset', async () => {
      let side = 'none';
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              side="left"
              data-testid="positioner"
              alignOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('right');
    });

    it('can read the latest align inside alignOffset', async () => {
      let align = 'none';
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              side="right"
              align="start"
              data-testid="positioner"
              alignOffset={(data) => {
                align = data.align;
                return 0;
              }}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      // correctly flips the align in the browser
      expect(align).toBe('end');
    });

    it('reads logical side inside alignOffset', async () => {
      let side = 'none';
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              side="inline-start"
              data-testid="positioner"
              alignOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('inline-end');
    });
  });

  it.skipIf(isJSDOM)('uses transform positioning without Viewport', async () => {
    const { unmount } = await render(
      <PreviewCard.Root open>
        <Trigger style={triggerStyle}>Trigger</Trigger>
        <PreviewCard.Portal>
          <PreviewCard.Positioner data-testid="positioner">
            <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>,
    );

    const positioner = screen.getByTestId('positioner');
    await waitFor(() => {
      expect(positioner.style.transform).not.toBe('');
    });
    unmount();
  });

  it.skipIf(isJSDOM)('uses top/left positioning with Viewport', async () => {
    const { unmount } = await render(
      <PreviewCard.Root open>
        <Trigger style={triggerStyle}>Trigger</Trigger>
        <PreviewCard.Portal>
          <PreviewCard.Positioner data-testid="positioner">
            <PreviewCard.Popup style={popupStyle}>
              <PreviewCard.Viewport>Popup</PreviewCard.Viewport>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>,
    );

    const positioner = screen.getByTestId('positioner');
    await waitForPositioned(positioner);
    expect(positioner.style.transform).toBe('');
    unmount();
  });

  describe.skipIf(isJSDOM)('multiline inline trigger', () => {
    afterEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      window.scrollTo(0, 0);
      document.documentElement.style.height = '';
      document.body.style.height = '';
      document.body.style.margin = '';
    });

    it('positions the popup relative to the hovered line of a multiline trigger', async () => {
      await render(
        <div style={multilineWrapperStyle}>
          <PreviewCard.Root>
            <PreviewCard.Trigger delay={0} data-testid="trigger" style={multilineTriggerStyle}>
              This is a long text that will wrap across multiple lines in the trigger element
            </PreviewCard.Trigger>
            <PreviewCard.Portal>
              <PreviewCard.Positioner data-testid="positioner" side="bottom" sideOffset={5}>
                <PreviewCard.Popup style={{ width: 80, height: 40 }}>
                  Preview Content
                </PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
        </div>,
      );

      const trigger = screen.getByTestId('trigger');
      const triggerRects = trigger.getClientRects();

      expect(triggerRects.length).toBeGreaterThan(2);

      // Enter over the second line so opening on hover uses the correct inline rect.
      const secondLineRect = triggerRects[1];
      const secondLineCenterX = secondLineRect.left + secondLineRect.width / 2;
      const secondLineCenterY = secondLineRect.top + secondLineRect.height / 2;

      hoverAt(trigger, secondLineCenterX, secondLineCenterY);

      const positioner = screen.getByTestId('positioner');
      await waitFor(() => {
        expect(positioner).toBeVisible();
      });

      // The positioner should be positioned relative to the second line,
      // not the first line or the bounding client rect.
      // y-coordinate should be close to the second line's bottom + sideOffset
      const expectedY = secondLineRect.bottom + 5;

      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, expectedY);
      });

      // x-coordinate should also be relative to where we hovered on the second line
      const { x: positionerX } = positioner.getBoundingClientRect();
      expect(positionerX).toBeGreaterThanOrEqual(secondLineRect.left - 10);
      expect(positionerX).toBeLessThanOrEqual(secondLineRect.right + 10);
    });

    describe('with delayed opening', () => {
      clock.withFakeTimers();

      it('uses the latest hovered line', async () => {
        await render(
          <div style={multilineWrapperStyle}>
            <PreviewCard.Root>
              <PreviewCard.Trigger delay={100} data-testid="trigger" style={multilineTriggerStyle}>
                This is a long text that will wrap across multiple lines in the trigger element
              </PreviewCard.Trigger>
              <PreviewCard.Portal>
                <PreviewCard.Positioner data-testid="positioner" side="bottom" sideOffset={5}>
                  <PreviewCard.Popup style={{ width: 80, height: 40 }}>
                    Preview Content
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </PreviewCard.Root>
          </div>,
        );

        const trigger = screen.getByTestId('trigger');
        const triggerRects = trigger.getClientRects();

        expect(triggerRects.length).toBeGreaterThan(2);

        const firstLineRect = triggerRects[0];
        const secondLineRect = triggerRects[1];

        fireEvent.mouseEnter(trigger, {
          clientX: firstLineRect.left + firstLineRect.width / 2,
          clientY: firstLineRect.top + firstLineRect.height / 2,
        });
        fireEvent.mouseMove(trigger, {
          clientX: firstLineRect.left + firstLineRect.width / 2,
          clientY: firstLineRect.top + firstLineRect.height / 2,
        });
        fireEvent.mouseMove(trigger, {
          clientX: secondLineRect.left + secondLineRect.width / 2,
          clientY: secondLineRect.top + secondLineRect.height / 2,
        });

        expect(screen.queryByTestId('positioner')).toBe(null);

        await clock.tickAsync(100);
        await clock.tickAsync(16);

        const positioner = screen.getByTestId('positioner');
        expectWithin(positioner.getBoundingClientRect().y, secondLineRect.bottom + 5);
      });
    });

    it('keeps the popup aligned after page scroll', async () => {
      document.documentElement.style.height = '4000px';
      document.body.style.height = '4000px';
      document.body.style.margin = '0';

      await render(
        <div>
          <div style={{ height: 1200 }} />
          <div style={multilineWrapperStyle}>
            <PreviewCard.Root>
              <PreviewCard.Trigger delay={0} data-testid="trigger" style={multilineTriggerStyle}>
                This is a long text that will wrap across multiple lines in the trigger element
              </PreviewCard.Trigger>
              <PreviewCard.Portal>
                <PreviewCard.Positioner data-testid="positioner" side="bottom" sideOffset={5}>
                  <PreviewCard.Popup style={{ width: 80, height: 40 }}>
                    Preview Content
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </PreviewCard.Root>
          </div>
          <div style={{ height: 1200 }} />
        </div>,
      );

      window.scrollTo(0, 1000);

      await waitFor(() => {
        expect(window.scrollY).toBe(1000);
      });

      const trigger = screen.getByTestId('trigger');
      const triggerRects = trigger.getClientRects();

      expect(triggerRects.length).toBeGreaterThan(1);

      const secondLineRect = triggerRects[1];
      const secondLineCenterX = secondLineRect.left + secondLineRect.width / 2;
      const secondLineCenterY = secondLineRect.top + secondLineRect.height / 2;

      hoverAt(trigger, secondLineCenterX, secondLineCenterY);

      const positioner = screen.getByTestId('positioner');
      await waitFor(() => {
        expect(positioner).toBeVisible();
      });

      const expectedY = secondLineRect.bottom + 5;

      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, expectedY);
      });

      const { x: positionerX } = positioner.getBoundingClientRect();
      expect(positionerX).toBeGreaterThanOrEqual(secondLineRect.left - 10);
      expect(positionerX).toBeLessThanOrEqual(secondLineRect.right + 10);
    });

    it('stays anchored to the opened line while already open', async () => {
      let positionUpdateCount = 0;
      await render(
        <div style={multilineWrapperStyle}>
          <PreviewCard.Root>
            <PreviewCard.Trigger delay={0} data-testid="trigger" style={multilineTriggerStyle}>
              This is a long text that will wrap across multiple lines in the trigger element
            </PreviewCard.Trigger>
            <PreviewCard.Portal>
              <PreviewCard.Positioner
                data-testid="positioner"
                side="bottom"
                sideOffset={() => {
                  positionUpdateCount += 1;
                  return 5;
                }}
              >
                <PreviewCard.Popup style={{ width: 80, height: 40 }}>
                  Preview Content
                </PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
        </div>,
      );

      const trigger = screen.getByTestId('trigger');
      const triggerRects = trigger.getClientRects();

      expect(triggerRects.length).toBeGreaterThan(2);

      const firstLineRect = triggerRects[0];
      const secondLineRect = triggerRects[1];

      hoverAt(
        trigger,
        firstLineRect.left + firstLineRect.width / 2,
        firstLineRect.top + firstLineRect.height / 2,
      );

      const positioner = screen.getByTestId('positioner');
      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, firstLineRect.bottom + 5);
      });
      const positionUpdateCountBeforeReentry = positionUpdateCount;

      fireEvent.mouseLeave(trigger);
      hoverAt(
        trigger,
        secondLineRect.left + secondLineRect.width / 2,
        secondLineRect.top + secondLineRect.height / 2,
      );

      window.dispatchEvent(new Event('resize'));
      await waitFor(() => {
        expect(positionUpdateCount).toBeGreaterThan(positionUpdateCountBeforeReentry);
      });

      expectWithin(positioner.getBoundingClientRect().y, firstLineRect.bottom + 5);
    });

    it('re-anchors to a newly entered line while reopening during close transition', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      const style = `
        @keyframes preview-card-inline-reentry-close-transition {
          from { opacity: 1; }
          to { opacity: 0.01; }
        }
        [data-testid="popup"][data-ending-style] {
          animation: preview-card-inline-reentry-close-transition 1000ms linear forwards;
        }
      `;

      await render(
        <React.Fragment>
          <style>{style}</style>
          <div style={multilineWrapperStyle}>
            <PreviewCard.Root>
              <PreviewCard.Trigger
                delay={0}
                closeDelay={0}
                data-testid="trigger"
                style={multilineTriggerStyle}
              >
                This is a long text that will wrap across multiple lines in the trigger element
              </PreviewCard.Trigger>
              <PreviewCard.Portal>
                <PreviewCard.Positioner data-testid="positioner" side="bottom" sideOffset={5}>
                  <PreviewCard.Popup data-testid="popup" style={{ width: 80, height: 40 }}>
                    Preview Content
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </PreviewCard.Root>
          </div>
        </React.Fragment>,
      );

      const trigger = screen.getByTestId('trigger');
      const triggerRects = trigger.getClientRects();

      expect(triggerRects.length).toBeGreaterThan(2);

      const firstLineRect = triggerRects[0];
      const secondLineRect = triggerRects[1];

      hoverAt(
        trigger,
        firstLineRect.left + firstLineRect.width / 2,
        firstLineRect.top + firstLineRect.height / 2,
      );

      const positioner = screen.getByTestId('positioner');
      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, firstLineRect.bottom + 5);
      });

      fireEvent.mouseLeave(trigger);
      await waitFor(() => {
        expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
      });

      fireEvent.mouseMove(trigger, {
        clientX: secondLineRect.left + secondLineRect.width / 2,
        clientY: secondLineRect.top + secondLineRect.height / 2,
      });
      fireEvent.mouseEnter(trigger, {
        clientX: secondLineRect.left + secondLineRect.width / 2,
        clientY: secondLineRect.top + secondLineRect.height / 2,
      });

      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, secondLineRect.bottom + 5);
      });
    });

    it('positions the popup relative to the side-aligned rect when open is controlled', async () => {
      const sideOffset = 5;
      const inlinePopupHeight = 40;

      await render(
        <div style={multilineWrapperStyle}>
          <PreviewCard.Root open>
            <PreviewCard.Trigger delay={0} data-testid="trigger" style={multilineTriggerStyle}>
              This is a long text that will wrap across multiple lines in the trigger element
            </PreviewCard.Trigger>
            <PreviewCard.Portal>
              <PreviewCard.Positioner
                data-testid="positioner"
                side="bottom"
                sideOffset={sideOffset}
              >
                <PreviewCard.Popup style={{ width: 80, height: inlinePopupHeight }}>
                  Preview Content
                </PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
        </div>,
      );

      const trigger = screen.getByTestId('trigger');
      const triggerRects = trigger.getClientRects();

      expect(triggerRects.length).toBeGreaterThan(1);

      const targetRect = triggerRects[triggerRects.length - 1];
      const expectedY = targetRect.bottom + sideOffset;
      const positioner = screen.getByTestId('positioner');

      await waitFor(() => {
        expect(positioner).toBeVisible();
      });

      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, expectedY);
      });

      const { x: positionerX } = positioner.getBoundingClientRect();
      expect(positionerX).toBeGreaterThanOrEqual(targetRect.left - 10);
      expect(positionerX).toBeLessThanOrEqual(targetRect.right + 10);
    });

    it('clears hovered-line coords after close before controlled reopen of the same trigger', async () => {
      const sideOffset = 5;

      function Test() {
        const [open, setOpen] = React.useState(false);
        const [triggerId, setTriggerId] = React.useState<string | null>(null);

        return (
          <div style={multilineWrapperStyle}>
            <PreviewCard.Root
              open={open}
              triggerId={triggerId}
              onOpenChange={(nextOpen, eventDetails) => {
                setOpen(nextOpen);
                setTriggerId(eventDetails.trigger?.id ?? null);
              }}
            >
              <PreviewCard.Trigger
                delay={0}
                data-testid="trigger"
                id="trigger"
                style={multilineTriggerStyle}
              >
                This is a long text that will wrap across multiple lines in the trigger element
              </PreviewCard.Trigger>
              <PreviewCard.Portal keepMounted>
                <PreviewCard.Positioner
                  data-testid="positioner"
                  side="bottom"
                  sideOffset={sideOffset}
                >
                  <PreviewCard.Popup style={{ width: 80, height: 40 }}>
                    Preview Content
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </PreviewCard.Root>

            <button
              type="button"
              onClick={() => {
                setTriggerId('trigger');
                setOpen(true);
              }}
            >
              Open
            </button>
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        );
      }

      await render(<Test />);
      const trigger = screen.getByTestId('trigger');
      const triggerRects = trigger.getClientRects();

      expect(triggerRects.length).toBeGreaterThan(2);

      const secondLineRect = triggerRects[1];
      hoverAt(
        trigger,
        secondLineRect.left + secondLineRect.width / 2,
        secondLineRect.top + secondLineRect.height / 2,
      );

      const positioner = screen.getByTestId('positioner');
      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, secondLineRect.bottom + sideOffset);
      });

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => {
        expect(positioner).toHaveAttribute('hidden');
      });

      fireEvent.click(screen.getByRole('button', { name: 'Open' }));

      const targetRect = triggerRects[triggerRects.length - 1];
      await waitFor(() => {
        expect(positioner).toBeVisible();
      });

      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, targetRect.bottom + sideOffset);
      });
    });

    it('ignores stale hovered coords when a controlled trigger switch reuses the popup', async () => {
      function Test() {
        const [open, setOpen] = React.useState(false);
        const [triggerId, setTriggerId] = React.useState<string | null>(null);

        return (
          <div>
            <PreviewCard.Root
              open={open}
              triggerId={triggerId}
              onOpenChange={(nextOpen, eventDetails) => {
                setOpen(nextOpen);
                setTriggerId(eventDetails.trigger?.id ?? null);
              }}
            >
              <PreviewCard.Trigger
                href="#"
                id="trigger-1"
                data-testid="trigger-1"
                delay={0}
                style={{ display: 'inline', pointerEvents: 'none' }}
              >
                Trigger 1
              </PreviewCard.Trigger>
              <PreviewCard.Trigger
                href="#"
                id="trigger-2"
                data-testid="trigger-2"
                delay={0}
                style={{ display: 'inline', pointerEvents: 'none' }}
              >
                Trigger 2
              </PreviewCard.Trigger>
              <PreviewCard.Portal>
                <PreviewCard.Positioner data-testid="positioner" side="bottom" sideOffset={5}>
                  <PreviewCard.Popup style={{ width: 80, height: 40 }}>
                    Preview Content
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </PreviewCard.Root>

            <button
              type="button"
              onClick={() => {
                setOpen(true);
                setTriggerId('trigger-2');
              }}
            >
              Switch
            </button>
          </div>
        );
      }

      await render(<Test />);
      const trigger1 = screen.getByTestId('trigger-1');
      const trigger2 = screen.getByTestId('trigger-2');

      mockClientRects(trigger1, [
        { left: 180, top: 0, right: 220, bottom: 10, width: 40, height: 10 },
        { left: 100, top: 20, right: 160, bottom: 30, width: 60, height: 10 },
      ]);
      mockClientRects(trigger2, [
        { left: 180, top: 100, right: 220, bottom: 110, width: 40, height: 10 },
        { left: 100, top: 120, right: 160, bottom: 130, width: 60, height: 10 },
      ]);

      hoverAt(trigger1, 200, 5);

      await waitFor(() => {
        expect(screen.getByTestId('positioner')).toBeVisible();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Switch' }));

      const positioner = screen.getByTestId('positioner');

      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, 135);
      });

      const { x: positionerX } = positioner.getBoundingClientRect();
      expect(positionerX).toBeGreaterThanOrEqual(90);
      expect(positionerX).toBeLessThanOrEqual(170);
    });

    it('uses the hovered line with a custom anchor in a clipped keepMounted portal', async () => {
      document.body.style.margin = '0';

      function Test() {
        const triggerRef = React.useRef<HTMLAnchorElement | null>(null);
        const [portalContainer, setPortalContainer] = React.useState<HTMLDivElement | null>(null);

        return (
          <div>
            <div ref={setPortalContainer} data-testid="portal-container" />
            <PreviewCard.Root>
              <PreviewCard.Trigger
                ref={triggerRef}
                href="#"
                delay={0}
                data-testid="trigger"
                style={{ pointerEvents: 'none' }}
              >
                Trigger
              </PreviewCard.Trigger>
              <PreviewCard.Portal keepMounted container={portalContainer}>
                <PreviewCard.Positioner
                  anchor={triggerRef}
                  collisionBoundary={{ x: 0, y: 0, width: 300, height: 120 }}
                  collisionPadding={0}
                  data-testid="positioner"
                  side="bottom"
                  sideOffset={5}
                >
                  <PreviewCard.Popup style={{ width: 80, height: 40 }}>
                    Preview Content
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </PreviewCard.Root>
          </div>
        );
      }

      await render(<Test />);
      const portalContainer = screen.getByTestId('portal-container');
      const trigger = screen.getByTestId('trigger');
      const positioner = screen.getByTestId('positioner');

      mockClientRects(trigger, [
        { left: 180, top: 80, right: 220, bottom: 90, width: 40, height: 10 },
        { left: 0, top: 100, right: 60, bottom: 110, width: 60, height: 10 },
      ]);

      hoverAt(trigger, 30, 105);

      await waitFor(() => {
        expect(positioner).toBeVisible();
      });

      expect(portalContainer).toContainElement(positioner);

      await waitFor(() => {
        expect(positioner).toHaveAttribute('data-side', 'top');
      });

      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, 55);
      });
    });

    it('positions the popup relative to the side-aligned rect when opened via focus', async () => {
      const sideOffset = 5;
      const inlinePopupHeight = 40;
      const { user } = await render(
        <div style={{ ...multilineWrapperStyle, marginTop: 100 }}>
          <PreviewCard.Root>
            <PreviewCard.Trigger
              delay={0}
              data-testid="trigger"
              tabIndex={0}
              style={multilineTriggerStyle}
            >
              This is a long text that will wrap across multiple lines in the trigger element
            </PreviewCard.Trigger>
            <PreviewCard.Portal>
              <PreviewCard.Positioner data-testid="positioner" side="top" sideOffset={sideOffset}>
                <PreviewCard.Popup style={{ width: 80, height: inlinePopupHeight }}>
                  Preview Content
                </PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
        </div>,
      );

      const trigger = screen.getByTestId('trigger');
      const triggerRects = trigger.getClientRects();

      expect(triggerRects.length).toBeGreaterThan(1);

      const targetRect = triggerRects[0];
      const expectedY = targetRect.top - inlinePopupHeight - sideOffset;

      await user.tab();

      const positioner = screen.getByTestId('positioner');

      await waitFor(() => {
        expect(positioner).toBeVisible();
      });

      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, expectedY);
      });

      const { x: positionerX } = positioner.getBoundingClientRect();
      expect(positionerX).toBeGreaterThanOrEqual(targetRect.left - 10);
      expect(positionerX).toBeLessThanOrEqual(targetRect.right + 10);
    });

    it('clears hovered-line coords when opened via focus', async () => {
      const sideOffset = 5;
      const inlinePopupHeight = 40;

      function Test() {
        const [open, setOpen] = React.useState(false);
        const [triggerId, setTriggerId] = React.useState<string | null>(null);

        return (
          <div style={{ ...multilineWrapperStyle, marginTop: 100 }}>
            <PreviewCard.Root
              open={open}
              triggerId={triggerId}
              onOpenChange={(nextOpen, eventDetails) => {
                if (eventDetails.reason === 'trigger-focus') {
                  setOpen(nextOpen);
                  setTriggerId(eventDetails.trigger?.id ?? null);
                }
              }}
            >
              <PreviewCard.Trigger
                delay={0}
                data-testid="trigger"
                id="trigger"
                tabIndex={0}
                style={multilineTriggerStyle}
              >
                This is a long text that will wrap across multiple lines in the trigger element
              </PreviewCard.Trigger>
              <PreviewCard.Portal keepMounted>
                <PreviewCard.Positioner data-testid="positioner" side="top" sideOffset={sideOffset}>
                  <PreviewCard.Popup style={{ width: 80, height: inlinePopupHeight }}>
                    Preview Content
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </PreviewCard.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);
      const trigger = screen.getByTestId('trigger');
      const triggerRects = trigger.getClientRects();

      expect(triggerRects.length).toBeGreaterThan(2);

      const secondLineRect = triggerRects[1];
      hoverAt(
        trigger,
        secondLineRect.left + secondLineRect.width / 2,
        secondLineRect.top + secondLineRect.height / 2,
      );

      const targetRect = triggerRects[0];
      const expectedY = targetRect.top - inlinePopupHeight - sideOffset;

      await user.tab();

      const positioner = screen.getByTestId('positioner');

      await waitFor(() => {
        expect(positioner).toBeVisible();
      });

      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, expectedY);
      });
    });
  });

  it.skipIf(isJSDOM)('uses transform positioning without Viewport', async () => {
    const { unmount } = await render(
      <PreviewCard.Root open>
        <Trigger style={triggerStyle}>Trigger</Trigger>
        <PreviewCard.Portal>
          <PreviewCard.Positioner data-testid="positioner">
            <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>,
    );

    const positioner = screen.getByTestId('positioner');
    await waitFor(() => {
      expect(positioner.style.transform).not.toBe('');
    });
    unmount();
  });

  it.skipIf(isJSDOM)('uses top/left positioning with Viewport', async () => {
    const { unmount } = await render(
      <PreviewCard.Root open>
        <Trigger style={triggerStyle}>Trigger</Trigger>
        <PreviewCard.Portal>
          <PreviewCard.Positioner data-testid="positioner">
            <PreviewCard.Popup style={popupStyle}>
              <PreviewCard.Viewport>Popup</PreviewCard.Viewport>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>,
    );

    const positioner = screen.getByTestId('positioner');
    await waitForPositioned(positioner);
    expect(positioner.style.transform).toBe('');
    unmount();
  });

  // A preview card kept mounted for its exit animation must not leave its content — typically
  // links — in sequential focus navigation while it is already logically closed.
  describe.skipIf(isJSDOM)('closing while mounted', () => {
    const closingStyle = `
      @keyframes preview-card-close-test {
        to {
          opacity: 0;
        }
      }

      .closing-test-popup[data-ending-style] {
        animation: preview-card-close-test 5s linear;
      }
    `;

    function Test({ open }: { open: boolean }) {
      return (
        <React.Fragment>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: closingStyle }} />
          <PreviewCard.Root open={open}>
            <Trigger>Trigger</Trigger>
            <PreviewCard.Portal>
              <PreviewCard.Positioner data-testid="positioner">
                <PreviewCard.Popup data-testid="popup" className="closing-test-popup">
                  <a data-testid="link" href="#link">
                    Link
                  </a>
                </PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
        </React.Fragment>
      );
    }

    beforeEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    });

    // Runs even when an assertion throws, so a 5s exit animation never leaks into cleanup.
    afterEach(async () => {
      await act(async () => {
        screen
          .queryAllByTestId('popup')
          .forEach((popup) => popup.getAnimations().forEach((animation) => animation.finish()));
      });
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    });

    // A preview card kept mounted for its exit animation must not leave its content — typically
    // links — in sequential focus navigation, and must not keep focus inside the closed subtree.
    // PreviewCard has no close-time focus handoff (the Root wires only `useDismiss`), so what
    // must hold is that focus ends up outside, not that anything moves it to a chosen target.
    it('makes the positioner inert and releases focus from inside it', async () => {
      const { setProps } = await render(<Test open />);
      const positioner = screen.getByTestId('positioner');
      const popup = screen.getByTestId('popup');
      const link = screen.getByTestId('link');

      expect(positioner).not.toHaveAttribute('inert');

      await act(async () => link.focus());
      expect(link).toHaveFocus();

      await setProps({ open: false });
      await waitFor(() => expect(popup).toHaveAttribute('data-ending-style'));

      expect(positioner).toHaveAttribute('inert');
      // Not merely "the link lost focus" — focus must be outside the closed subtree entirely.
      await waitFor(() => expect(popup.contains(document.activeElement)).toBe(false));
    });
  });
});
