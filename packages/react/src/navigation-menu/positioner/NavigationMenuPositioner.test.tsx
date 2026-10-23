import * as React from 'react';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { beforeEach, expect, vi, describe, it } from 'vitest';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { createRenderer, describeConformance, isJSDOM, waitForPositioned } from '#test-utils';

const useAnchorPositioningSpy = vi.hoisted(() => vi.fn());

vi.mock('../../internals/useAnchorPositioning', async () => {
  const actual = await vi.importActual<typeof import('../../internals/useAnchorPositioning')>(
    '../../internals/useAnchorPositioning',
  );

  return {
    ...actual,
    useAnchorPositioning: ((...args: Parameters<typeof actual.useAnchorPositioning>) => {
      useAnchorPositioningSpy(...args);
      return actual.useAnchorPositioning(...args);
    }) satisfies typeof actual.useAnchorPositioning,
  };
});

describe('<NavigationMenu.Positioner />', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    useAnchorPositioningSpy.mockClear();
  });

  describeConformance(<NavigationMenu.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <NavigationMenu.Root value="test">
          <NavigationMenu.Portal>{node}</NavigationMenu.Portal>
        </NavigationMenu.Root>,
      );
    },
  }));

  it('uses the layout viewport', async () => {
    await render(
      <NavigationMenu.Root value="test">
        <NavigationMenu.Portal>
          <NavigationMenu.Positioner />
        </NavigationMenu.Portal>
      </NavigationMenu.Root>,
    );

    expect(useAnchorPositioningSpy.mock.lastCall?.[0].shift).toEqual({
      rootBoundary: 'layoutViewport',
    });
  });

  it('throws a descriptive error when rendered outside <NavigationMenu.Portal>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <NavigationMenu.Root value="test">
            <NavigationMenu.Positioner />
          </NavigationMenu.Root>,
        ),
      ).rejects.toThrow('Base UI: <NavigationMenu.Portal> is missing.');
    } finally {
      errorSpy.mockRestore();
    }
  });
});

const trackingStyles = `
  .tracking-positioner {
    width: var(--positioner-width);
    height: var(--positioner-height);
    transition: top 60s linear, left 60s linear, right 60s linear, bottom 60s linear;
  }
  .tracking-positioner[data-instant] { transition: none; }
  .tracking-popup {
    width: var(--popup-width);
    height: var(--popup-height);
    opacity: 1;
    transition: opacity 60s linear, width 60s linear, height 60s linear;
  }
  .tracking-popup[data-ending-style] { opacity: 0; }
  .tracking-content { opacity: 1; transition: opacity 60s linear; }
  .tracking-content[data-starting-style],
  .tracking-content[data-ending-style] { opacity: 0; }
`;

function TrackingMenu({
  keepMounted,
  side = 'bottom',
}: {
  keepMounted: boolean;
  side?: 'top' | 'left' | 'bottom';
}) {
  const [value, setValue] = React.useState<string | null>('first');
  return (
    <React.Fragment>
      <style>{trackingStyles}</style>
      <div
        data-testid="scroller"
        style={{ height: 300, width: 360, overflow: 'auto', boxSizing: 'border-box' }}
      >
        <NavigationMenu.Root
          value={value}
          onValueChange={(next, details) => {
            if (
              next === null &&
              details.reason !== 'link-press' &&
              details.reason !== 'escape-key'
            ) {
              details.cancel();
            } else {
              setValue(next);
            }
          }}
        >
          <div style={{ paddingTop: 100, paddingLeft: side === 'left' ? 220 : 40 }}>
            <NavigationMenu.List
              style={{
                display: 'flex',
                flexDirection: side === 'top' ? 'column' : 'row',
                gap: 20,
                padding: 0,
                margin: 0,
              }}
            >
              <NavigationMenu.Item value="first" style={{ flex: 1 }}>
                <NavigationMenu.Trigger style={{ width: '100%' }}>First</NavigationMenu.Trigger>
                <NavigationMenu.Content style={{ width: 200, height: 80 }}>
                  First content
                  <NavigationMenu.Link closeOnClick render={<button type="button" />}>
                    Close
                  </NavigationMenu.Link>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              <NavigationMenu.Item value="second" style={{ flex: 1 }}>
                <NavigationMenu.Trigger style={{ width: '100%' }}>Second</NavigationMenu.Trigger>
                <NavigationMenu.Content
                  className="tracking-content"
                  style={{ width: 280, height: 100 }}
                >
                  Second content
                </NavigationMenu.Content>
              </NavigationMenu.Item>
            </NavigationMenu.List>
          </div>
          <NavigationMenu.Portal keepMounted={keepMounted}>
            <NavigationMenu.Positioner
              className="tracking-positioner"
              data-testid="positioner"
              side={side}
              align="start"
              sideOffset={8}
              collisionAvoidance={{ side: 'none', align: 'none' }}
            >
              <NavigationMenu.Popup className="tracking-popup" data-testid="popup">
                <NavigationMenu.Viewport />
              </NavigationMenu.Popup>
            </NavigationMenu.Positioner>
          </NavigationMenu.Portal>
        </NavigationMenu.Root>
        <div style={{ height: 600 }} />
      </div>
    </React.Fragment>
  );
}

describe.skipIf(isJSDOM)('anchor tracking', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    window.scrollTo(0, 0);
  });

  describe.each([{ keepMounted: false }, { keepMounted: true }])(
    'keepMounted=$keepMounted',
    ({ keepMounted }) => {
      it.each([
        {
          name: 'scrolling',
          update: (element: HTMLElement) => {
            element.scrollTop = 40;
          },
        },
        {
          name: 'layout changes',
          update: (element: HTMLElement) => {
            element.style.paddingLeft = '80px';
          },
        },
      ])('stays attached during $name', async ({ update }) => {
        await render(<TrackingMenu keepMounted={keepMounted} />);
        const positioner = screen.getByTestId('positioner');
        const trigger = screen.getByRole('button', { name: 'First' });
        await waitForPositioned(positioner);
        const before = trigger.getBoundingClientRect();
        expect(positioner.getBoundingClientRect().top).toBeCloseTo(before.bottom + 8, 0);
        expect(positioner.getBoundingClientRect().left).toBeCloseTo(before.left, 0);

        await act(async () => update(screen.getByTestId('scroller')));
        await waitFor(() => {
          expect(positioner.style.top).toBe(`${trigger.getBoundingClientRect().bottom + 8}px`);
        });
        await waitFor(() => {
          expect(positioner.style.left).toBe(`${trigger.getBoundingClientRect().left}px`);
        });

        const after = trigger.getBoundingClientRect();
        expect(after.top !== before.top || after.left !== before.left).toBe(true);
        // The 60s transition makes an eventual catch-up unable to satisfy these assertions.
        expect(positioner.getBoundingClientRect().top).toBeCloseTo(after.bottom + 8, 0);
        expect(positioner.getBoundingClientRect().left).toBeCloseTo(after.left, 0);
      });

      it('keeps tracking while the popup exits without suppressing its opacity transition', async () => {
        const { user } = await render(<TrackingMenu keepMounted={keepMounted} />);
        const positioner = screen.getByTestId('positioner');
        const popup = screen.getByTestId('popup');
        const trigger = screen.getByRole('button', { name: 'First' });
        await waitForPositioned(positioner);
        expect(popup).toHaveAttribute('data-open');
        const before = trigger.getBoundingClientRect();

        await user.click(screen.getByRole('button', { name: 'Close' }));
        expect(popup).toHaveAttribute('data-ending-style');
        await waitFor(() => {
          expect(
            popup
              .getAnimations()
              .some(
                (animation) =>
                  animation instanceof CSSTransition && animation.transitionProperty === 'opacity',
              ),
          ).toBe(true);
        });
        popup.getAnimations().forEach((animation) => animation.pause());
        await act(async () => {
          screen.getByTestId('scroller').scrollTop = 40;
        });
        await waitFor(() => {
          expect(positioner.style.top).toBe(`${trigger.getBoundingClientRect().bottom + 8}px`);
        });
        expect(popup).toHaveAttribute('data-ending-style');
        expect(trigger.getBoundingClientRect().top).toBeLessThan(before.top);
        expect(positioner.getBoundingClientRect().top).toBeCloseTo(
          trigger.getBoundingClientRect().bottom + 8,
          0,
        );
      });

      it('lets an in-flight trigger switch finish while the popup exits', async () => {
        const { user } = await render(<TrackingMenu keepMounted={keepMounted} />);
        const positioner = screen.getByTestId('positioner');
        const popup = screen.getByTestId('popup');
        await waitForPositioned(positioner);
        await user.click(screen.getByRole('button', { name: 'Second' }));
        await waitFor(() => {
          expect(
            positioner.getAnimations().some((animation) => animation instanceof CSSTransition),
          ).toBe(true);
        });

        await user.keyboard('{Escape}');
        expect(popup).toHaveAttribute('data-ending-style');
        await waitFor(() => {
          expect(
            popup
              .getAnimations()
              .some(
                (animation) =>
                  animation instanceof CSSTransition && animation.transitionProperty === 'opacity',
              ),
          ).toBe(true);
        });
        expect(
          positioner.getAnimations().some((animation) => animation instanceof CSSTransition),
        ).toBe(true);
      });

      it.each([{ side: 'bottom' }, { side: 'top' }, { side: 'left' }] as const)(
        'animates a trigger switch on the $side and resumes instant tracking when the move finishes',
        async ({ side }) => {
          const { user } = await render(<TrackingMenu keepMounted={keepMounted} side={side} />);
          const positioner = screen.getByTestId('positioner');
          const content = () => screen.getByText('Second content');
          const second = screen.getByRole('button', { name: 'Second' });
          await waitForPositioned(positioner);

          const moveFinished = vi.fn();
          positioner.addEventListener('transitionend', moveFinished);
          await user.click(second);
          await waitFor(() => {
            expect(
              positioner.getAnimations().some((animation) => animation instanceof CSSTransition),
            ).toBe(true);
          });
          expect(positioner).not.toHaveAttribute('data-instant');
          await waitFor(() => {
            expect(
              content()
                .getAnimations()
                .some(
                  (animation) =>
                    animation instanceof CSSTransition &&
                    animation.transitionProperty === 'opacity',
                ),
            ).toBe(true);
          });

          await act(async () => {
            positioner.getAnimations().forEach((animation) => animation.finish());
          });
          await waitFor(() => expect(moveFinished).toHaveBeenCalled());
          // Viewport content is still animating after the positioner's own move has ended.
          expect(positioner).not.toHaveAttribute('data-instant');

          await act(async () => {
            positioner.getAnimations({ subtree: true }).forEach((animation) => animation.finish());
          });
          await waitFor(() => expect(positioner).toHaveAttribute('data-instant'));
          positioner.removeEventListener('transitionend', moveFinished);
          const beforeScroll = positioner.getBoundingClientRect().top;
          await act(async () => {
            screen.getByTestId('scroller').scrollTop = 40;
          });
          await waitFor(() => {
            expect(positioner.getBoundingClientRect().top).toBeCloseTo(beforeScroll - 40, 0);
          });
        },
      );
    },
  );
});
