import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import type { UserEvent } from '@testing-library/user-event';
import { Collapsible } from '@base-ui/react/collapsible';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import type { createRenderer } from '#test-utils';
import {
  isJSDOM,
  moveMouse,
  recordTransitions,
  waitForPositioned,
  waitSingleFrame,
} from '#test-utils';
import type { DetachedTriggersTestConfig } from './detachedTriggersConformanceTests';
import type {
  Align,
  CollisionAvoidance,
  OffsetFunction,
  Side,
} from '../src/internals/useAnchorPositioning';

// The anchor sits at the viewport origin and the popup is centered below it, so the positioner
// starts at x = (anchorWidth - popupWidth) / 2 and y = anchorHeight.
const anchorWidth = 72;
const anchorHeight = 36;
const popupWidth = 52;
const popupHeight = 24;
const baselineX = (anchorWidth - popupWidth) / 2;
const baselineY = anchorHeight;

const triggerStyle: React.CSSProperties = {
  width: anchorWidth,
  height: anchorHeight,
  boxSizing: 'border-box',
};
const popupStyle: React.CSSProperties = { width: popupWidth, height: popupHeight };

const offsetCases = [
  {
    prop: 'sideOffset',
    numberPosition: (offset: number) => ({ x: baselineX, y: baselineY + offset }),
    offsetFunction: ((data) => data.positioner.width + data.anchor.width) as OffsetFunction,
    functionPosition: { x: baselineX, y: baselineY + popupWidth + anchorWidth },
  },
  {
    prop: 'alignOffset',
    numberPosition: (offset: number) => ({ x: baselineX + offset, y: baselineY }),
    offsetFunction: ((data) => data.positioner.width) as OffsetFunction,
    functionPosition: { x: baselineX + popupWidth, y: baselineY },
  },
] as const;

const callbackDataCases: Array<{
  description: string;
  positioner: Pick<PositionerTestProps, 'side' | 'align'>;
  key: 'side' | 'align';
  direction: 'ltr' | 'rtl';
  expected: string;
}> = [
  {
    description: 'the latest side after a flip',
    positioner: { side: 'left' },
    key: 'side',
    direction: 'ltr',
    expected: 'right',
  },
  {
    description: 'the latest align after a flip',
    positioner: { side: 'right', align: 'start' },
    key: 'align',
    direction: 'ltr',
    expected: 'end',
  },
  {
    description: 'the logical side after a flip',
    positioner: { side: 'inline-start' },
    key: 'side',
    direction: 'ltr',
    expected: 'inline-end',
  },
  {
    description: 'the logical side in RTL mode',
    positioner: { side: 'inline-start' },
    key: 'side',
    direction: 'rtl',
    expected: 'inline-start',
  },
];

/**
 * Tests the anchor positioning behavior that every `*.Positioner` part shares through
 * `useAnchorPositioning`. All cases need real layout, so they run in the browser only.
 */
export function positionerConformanceTests(config: PositionerTestConfig) {
  const {
    render,
    createComponent,
    viewport: hasViewport = false,
    defaultSide = 'bottom',
    defaultCollisionAvoidance = 'dropdown',
    stableState = true,
  } = config;

  function prepareComponent(options: {
    positioner?: Partial<PositionerTestProps>;
    popup?: { style?: React.CSSProperties };
    open?: boolean;
    viewport?: boolean;
  }) {
    return createComponent({
      root: { open: options.open ?? true },
      trigger: { style: triggerStyle },
      positioner: { 'data-testid': 'positioner', ...options.positioner },
      popup: { style: options.popup?.style ?? popupStyle },
      viewport: options.viewport ?? false,
    });
  }

  describe.skipIf(isJSDOM)('Positioner conformance', () => {
    if (config.triggerSwitch) {
      triggerSwitchTests({ render, ...config.triggerSwitch });
    }

    describe.each(offsetCases)(
      'prop: $prop',
      ({ prop, numberPosition, offsetFunction, functionPosition }) => {
        it('offsets the positioner when a number is specified', async () => {
          const offset = 7;
          await render(prepareComponent({ positioner: { [prop]: offset } }));

          const positioner = screen.getByTestId('positioner');
          const { x, y } = numberPosition(offset);
          expect(positioner.style.transform).toBe(`translate(${x}px, ${y}px)`);
          expect(positioner.getBoundingClientRect()).toMatchObject({ x, y });
        });

        it('offsets the positioner when a function is specified', async () => {
          await render(prepareComponent({ positioner: { [prop]: offsetFunction } }));

          const positioner = screen.getByTestId('positioner');
          const { x, y } = functionPosition;
          expect(positioner.style.transform).toBe(`translate(${x}px, ${y}px)`);
          expect(positioner.getBoundingClientRect()).toMatchObject({ x, y });
        });

        it.each(callbackDataCases)(
          'reads $description inside the function',
          async ({ positioner, key, direction, expected }) => {
            let value = 'none';
            const element = prepareComponent({
              positioner: {
                ...positioner,
                [prop]: ((data) => {
                  value = data[key];
                  return 0;
                }) satisfies OffsetFunction,
              },
            });

            await render(<DirectionProvider direction={direction}>{element}</DirectionProvider>);

            expect(value).toBe(expected);
            expect(screen.getByTestId('positioner')).toHaveAttribute(`data-${key}`, expected);
          },
        );
      },
    );

    // https://github.com/mui/base-ui/issues/5131
    it('rests exactly at collisionPadding from the colliding edge', async () => {
      const collisionPadding = 12;
      let setOpen!: React.Dispatch<React.SetStateAction<boolean>>;

      function App() {
        const [open, setOpenState] = React.useState(false);
        setOpen = setOpenState;

        return (
          // Anchor pinned near the bottom so the bottom-side popup flips to the top and
          // collides with the top viewport edge.
          <div style={{ position: 'fixed', bottom: 8, left: 16 }}>
            {prepareComponent({
              open,
              positioner: {
                side: 'bottom',
                sideOffset: 8,
                collisionPadding,
                collisionAvoidance: { fallbackAxisSide: 'none' },
              },
              popup: {
                style: { width: 200, height: 1000, maxHeight: 'var(--available-height)' },
              },
            })}
          </div>
        );
      }

      await render(<App />);
      await act(async () => setOpen(true));

      const positioner = screen.getByTestId('positioner');
      await waitFor(() => {
        expect(positioner).toHaveAttribute('data-side', 'top');
      });

      // The preferred-side bias used by flip() must not leak into the resting position:
      // the popup should sit exactly `collisionPadding` away from the top edge, not +1px.
      await waitFor(() => {
        expect(Math.round(positioner.getBoundingClientRect().top)).toBe(collisionPadding);
      });
    });

    it('places the popup on the default side when it fits', async () => {
      await render(
        <div style={{ position: 'fixed', top: 200, left: 200 }}>{prepareComponent({})}</div>,
      );

      expect(screen.getByTestId('positioner')).toHaveAttribute('data-side', defaultSide);
    });

    describe('prop: collisionAvoidance', () => {
      // The popup fits neither above nor below the anchor, but fits beside it, so only a fallback to
      // the perpendicular axis moves it to the side.
      function prepareTallPopup(collisionAvoidance?: CollisionAvoidance) {
        return (
          <div style={{ position: 'fixed', top: '50%', left: 16 }}>
            {prepareComponent({
              positioner: { side: 'bottom', collisionAvoidance },
              popup: { style: { width: popupWidth, height: '75vh' } },
            })}
          </div>
        );
      }

      const collisionDefaults = {
        popup: { collisionAvoidance: { fallbackAxisSide: 'end' }, side: /^right$/ },
        dropdown: { collisionAvoidance: { fallbackAxisSide: 'none' }, side: /^(top|bottom)$/ },
      } as const;

      it(`uses the ${defaultCollisionAvoidance} default when the prop is not set`, async () => {
        await render(prepareTallPopup());

        const positioner = screen.getByTestId('positioner');
        await waitForPositioned(positioner);
        expect(positioner.getAttribute('data-side')).toMatch(
          collisionDefaults[defaultCollisionAvoidance].side,
        );
      });

      it('uses the prop over the default', async () => {
        const other =
          collisionDefaults[defaultCollisionAvoidance === 'popup' ? 'dropdown' : 'popup'];
        await render(prepareTallPopup(other.collisionAvoidance));

        const positioner = screen.getByTestId('positioner');
        await waitForPositioned(positioner);
        expect(positioner.getAttribute('data-side')).toMatch(other.side);
      });
    });

    it.skipIf(!stableState)(
      'passes the same state object while nothing it holds changes',
      async () => {
        const states: unknown[] = [];

        function App({ color }: { color: string }) {
          return prepareComponent({
            positioner: {
              render: (props, state) => {
                states.push(state);
                return <div {...props} />;
              },
            },
            popup: { style: { ...popupStyle, color } },
          });
        }

        const { setProps } = await render(<App color="red" />);
        const stateBefore = states.at(-1);
        const renderCountBefore = states.length;

        await setProps({ color: 'blue' });

        expect(states.length).toBeGreaterThan(renderCountBefore);
        expect(states.at(-1)).toBe(stateBefore);
      },
    );

    it('uses transform positioning without Viewport', async () => {
      await render(prepareComponent({}));

      const positioner = screen.getByTestId('positioner');
      await waitFor(() => {
        expect(positioner.style.transform).toBe(`translate(${baselineX}px, ${baselineY}px)`);
      });
    });

    if (hasViewport) {
      it('uses top/left positioning with Viewport', async () => {
        await render(prepareComponent({ viewport: true }));

        const positioner = screen.getByTestId('positioner');
        await waitForPositioned(positioner);
        expect(positioner.style.transform).toBe('');
        // A pass can measure the popup before it has a size, so wait for the final coordinates.
        await waitFor(() => {
          expect(positioner.style.left).toBe(`${baselineX}px`);
        });
        await waitFor(() => {
          expect(positioner.style.top).toBe(`${baselineY}px`);
        });
      });

      it('updates positioning when Viewport mounts and unmounts', async () => {
        function App() {
          const [showViewport, setShowViewport] = React.useState(false);

          return (
            <React.Fragment>
              {prepareComponent({ viewport: showViewport })}
              {/* Rendered after the anchor to keep the anchor at the viewport origin. */}
              <button type="button" onClick={() => setShowViewport((value) => !value)}>
                Toggle Viewport
              </button>
            </React.Fragment>
          );
        }

        const { user } = await render(<App />);
        const positioner = screen.getByTestId('positioner');
        const toggle = screen.getByRole('button', { name: 'Toggle Viewport' });

        expect(positioner.style.transform).toBe(`translate(${baselineX}px, ${baselineY}px)`);

        await user.click(toggle);
        await waitFor(() => {
          expect(positioner.style.transform).toBe('');
        });
        await waitFor(() => {
          expect(positioner.style.top).toBe(`${baselineY}px`);
        });

        await user.click(toggle);
        await waitFor(() => {
          expect(positioner.style.transform).toBe(`translate(${baselineX}px, ${baselineY}px)`);
        });
      });
    }
  });
}

export interface PositionerTestProps {
  'data-testid': string;
  side?: Side;
  align?: Align;
  sideOffset?: number | OffsetFunction;
  alignOffset?: number | OffsetFunction;
  collisionPadding?: number;
  collisionAvoidance?: CollisionAvoidance | undefined;
  render?: (props: React.HTMLAttributes<HTMLDivElement>, state: unknown) => React.ReactElement;
}

export interface PositionerTestComponentProps {
  /**
   * Props to spread on the Root part.
   */
  root: { open: boolean };
  /**
   * Props to spread on the element the positioner is anchored to.
   */
  trigger: { style: React.CSSProperties };
  /**
   * Props to spread on the Positioner part.
   */
  positioner: PositionerTestProps;
  /**
   * Props to spread on the Popup part.
   */
  popup: { style: React.CSSProperties };
  /**
   * Whether to wrap the popup content in the component's Viewport part.
   */
  viewport: boolean;
}

export interface PositionerTestConfig {
  /**
   * Render function returned from `createRenderer`.
   */
  render: ReturnType<typeof createRenderer>['render'];
  /**
   * Returns an open popup whose Positioner is anchored to an element at the viewport origin.
   * Its parameters contain props to be spread on the component's parts.
   */
  createComponent: (props: PositionerTestComponentProps) => React.JSX.Element;
  /**
   * Whether the component has a Viewport part, which switches the positioner to top/left
   * positioning.
   * @default false
   */
  viewport?: boolean;
  /**
   * The side the Positioner places the popup on when `side` isn't set.
   * @default 'bottom'
   */
  defaultSide?: Side;
  /**
   * The `collisionAvoidance` default the Positioner uses: `'popup'` falls back to the
   * perpendicular axis when neither side fits, `'dropdown'` doesn't.
   * @default 'dropdown'
   */
  defaultCollisionAvoidance?: 'popup' | 'dropdown';
  /**
   * Whether the Positioner passes the same state object to `render` while nothing in it changes.
   * @default true
   */
  stableState?: boolean;
  /**
   * Parts that support transitions between detached triggers.
   */
  triggerSwitch?: TriggerSwitchTestParts;
}

type TriggerSwitchTestParts = Required<
  Pick<
    DetachedTriggersTestConfig,
    'createHandle' | 'Root' | 'Trigger' | 'Portal' | 'Positioner' | 'Popup' | 'Viewport'
  >
> &
  Pick<DetachedTriggersTestConfig, 'triggerProps'> & {
    Arrow: DetachedTriggersTestConfig['Popup'];
    /**
     * How a trigger opens the popup or takes it over.
     * @default 'click'
     */
    interaction?: 'click' | 'hover';
  };

function triggerSwitchTests({
  render,
  createHandle,
  Root,
  Trigger,
  Portal,
  Positioner,
  Popup,
  Viewport,
  Arrow,
  triggerProps,
  interaction = 'click',
}: TriggerSwitchTestParts & Pick<PositionerTestConfig, 'render'>) {
  async function activate(user: UserEvent, name: 'First' | 'Second') {
    const trigger = screen.getByText(name);
    if (interaction === 'hover') {
      // The pointer moves from the other trigger, as it does when a user switches triggers.
      moveMouse(screen.getByText(name === 'First' ? 'Second' : 'First'), trigger);
    } else {
      await user.click(trigger);
    }
  }

  function Fixture({
    handle,
    rootProps,
    keepMounted = false,
    withViewport = false,
    side = 'right',
    resizeOnSwitch = false,
    holdSwitch = false,
    holdExit = false,
    content,
  }: {
    handle: ReturnType<typeof createHandle>;
    rootProps?: Record<string, unknown>;
    keepMounted?: boolean;
    withViewport?: boolean;
    side?: Side;
    resizeOnSwitch?: boolean;
    holdSwitch?: boolean;
    holdExit?: boolean;
    content?: React.ReactNode;
  }) {
    // Held transitions are paused on transitionrun and finished or canceled by the test.
    const duration = holdSwitch ? '60s' : '200ms';

    return (
      <React.Fragment>
        <style>{`
          .tracking-positioner {
            transition: transform ${duration} linear, top ${duration} linear, right ${duration} linear, bottom ${duration} linear, left ${duration} linear;
          }
          .tracking-positioner[data-instant] { transition: none; }
          .tracking-popup { opacity: 1; transition: opacity 200ms linear; }
          .tracking-popup[data-starting-style], .tracking-popup[data-ending-style] { opacity: 0; }
          .tracking-popup[data-ending-style]:not([data-instant]) { transition-duration: ${holdExit ? '60s' : '200ms'}; }
          .tracking-popup[data-instant] { transition: none; }
          @keyframes tracking-content { to { opacity: 0.5; } }
          .tracking-content-animation { animation: tracking-content 60s linear; }
          .tracking-popup-resize {
            transition: width ${duration} linear, height ${duration} linear, opacity 200ms linear;
          }
        `}</style>
        <div data-testid="scroller" style={{ width: 400, height: 200, overflow: 'auto' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: side === 'left' ? 'row' : 'column',
              alignItems: side === 'left' ? 'flex-start' : 'flex-end',
              gap: 40,
              paddingTop: 40,
              paddingLeft: side === 'left' ? 120 : undefined,
              width: '25vw',
              height: 500,
            }}
          >
            <Trigger handle={handle} id="first" payload="first" {...triggerProps}>
              First
            </Trigger>
            <Trigger handle={handle} id="second" payload="second" {...triggerProps}>
              Second
            </Trigger>
          </div>
        </div>
        <Root handle={handle} modal={false} {...rootProps}>
          {({ payload }: { payload: unknown }) => (
            <Portal keepMounted={keepMounted}>
              <Positioner
                data-testid="positioner"
                className="tracking-positioner"
                style={
                  resizeOnSwitch
                    ? { width: 'var(--positioner-width)', height: 'var(--positioner-height)' }
                    : undefined
                }
                side={side}
                align="start"
              >
                <Popup
                  data-testid="popup"
                  className={`tracking-popup${resizeOnSwitch ? ' tracking-popup-resize' : ''}`}
                  style={
                    resizeOnSwitch
                      ? { width: 'var(--popup-width, auto)', height: 'var(--popup-height, auto)' }
                      : { width: 80, height: 30 }
                  }
                >
                  {withViewport ? (
                    <Viewport>
                      <div
                        style={
                          resizeOnSwitch
                            ? {
                                width: side === 'left' && payload === 'second' ? 120 : 80,
                                height: side === 'top' && payload === 'second' ? 50 : 30,
                              }
                            : undefined
                        }
                      >
                        Popup
                      </div>
                    </Viewport>
                  ) : (
                    'Popup'
                  )}
                  {content}
                </Popup>
              </Positioner>
            </Portal>
          )}
        </Root>
      </React.Fragment>
    );
  }

  function ArrowFixture({ handle }: { handle: ReturnType<typeof createHandle> }) {
    return (
      <React.Fragment>
        <style>{`
          .tracking-arrow-positioner { transition: transform 200ms linear, top 200ms linear, left 200ms linear; }
          .tracking-arrow { transition: left 200ms linear; }
          .tracking-arrow-positioner[data-instant], .tracking-arrow[data-instant] { transition: none; }
        `}</style>
        {/* Collision shifting holds the popup at the viewport edge for both triggers. */}
        <div data-testid="first-wrapper" style={{ position: 'fixed', top: 200, left: 10 }}>
          <Trigger handle={handle} id="first" {...triggerProps}>
            First
          </Trigger>
        </div>
        <div style={{ position: 'fixed', top: 200, left: 60 }}>
          <Trigger handle={handle} id="second" {...triggerProps}>
            Second
          </Trigger>
        </div>
        <Root handle={handle} modal={false} defaultOpen defaultTriggerId="first">
          <Portal>
            <Positioner
              data-testid="positioner"
              className="tracking-arrow-positioner"
              side="bottom"
              align="center"
              collisionPadding={5}
            >
              <Popup data-testid="popup" style={{ width: 200, height: 40 }}>
                <Arrow
                  data-testid="arrow"
                  className="tracking-arrow"
                  style={{ width: 12, height: 6 }}
                />
              </Popup>
            </Positioner>
          </Portal>
        </Root>
      </React.Fragment>
    );
  }

  it.each([
    { name: 'before switching (transform)', withViewport: false, afterSwitch: false },
    { name: 'after switching (insets)', withViewport: true, afterSwitch: true },
  ])(
    'tracks a scroll $name without a position transition',
    async ({ withViewport, afterSwitch }) => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      const { user } = await render(
        <Fixture handle={createHandle()} withViewport={withViewport} />,
      );
      const first = screen.getByText('First');
      const second = screen.getByText('Second');
      await activate(user, 'First');
      const positioner = await screen.findByTestId('positioner');
      await waitFor(() => expect(positioner.style.transition).toBe(''));
      await waitFor(() =>
        expect(positioner.getBoundingClientRect().top).toBeCloseTo(
          first.getBoundingClientRect().top,
          0,
        ),
      );
      await waitFor(() => expect(screen.getByTestId('popup').getAnimations()).toHaveLength(0));

      if (afterSwitch) {
        await activate(user, 'Second');
      }
      const trigger = afterSwitch ? second : first;
      await waitFor(() =>
        expect(positioner.getBoundingClientRect().top).toBeCloseTo(
          trigger.getBoundingClientRect().top,
          0,
        ),
      );
      await waitFor(() => expect(positioner.getAnimations()).toHaveLength(0));

      expect(positioner).toHaveAttribute('data-open');
      expect(positioner.getAnimations()).toHaveLength(0);
      const transitions = recordTransitions(positioner);
      const previousPosition = positioner.style.cssText;
      await act(async () => {
        screen.getByTestId('scroller').scrollTop += 20;
      });
      await waitFor(() =>
        expect(positioner.getBoundingClientRect().top).toBeCloseTo(
          trigger.getBoundingClientRect().top,
          0,
        ),
      );
      await waitFor(() =>
        expect(
          Math.abs(positioner.getBoundingClientRect().left - trigger.getBoundingClientRect().right),
        ).toBeLessThan(1),
      );
      await act(async () => {
        await waitSingleFrame();
        await waitSingleFrame();
      });

      expect(positioner.style.cssText).not.toBe(previousPosition);
      expect(transitions.started).toEqual([]);
      expect(positioner.getBoundingClientRect().top).toBeCloseTo(
        trigger.getBoundingClientRect().top,
        0,
      );
      expect(
        Math.abs(positioner.getBoundingClientRect().left - trigger.getBoundingClientRect().right),
      ).toBeLessThan(1);
    },
  );

  it('tracks the anchor instantly during the Popup exit transition', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const { setProps } = await render(
      <Fixture handle={createHandle()} holdExit rootProps={{ open: true, triggerId: 'first' }} />,
    );
    const positioner = screen.getByTestId('positioner');
    const popup = screen.getByTestId('popup');
    await waitFor(() => expect(popup.style.transition).toBe(''));
    await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));
    const exit = recordTransitions(popup, { pause: true });
    await setProps({ rootProps: { open: false, triggerId: 'first' } });
    await waitFor(() => expect(exit.started).toContain('opacity'));
    expect(popup).toHaveAttribute('data-ending-style');
    expect(popup.getAnimations()[0].playState).toBe('paused');
    const transitions = recordTransitions(positioner);
    const previousTop = positioner.getBoundingClientRect().top;
    await act(async () => {
      screen.getByTestId('scroller').scrollTop += 20;
    });
    await waitFor(() =>
      expect(positioner.getBoundingClientRect().top).toBeCloseTo(previousTop - 20, 0),
    );
    await act(async () => {
      await waitSingleFrame();
      await waitSingleFrame();
    });
    expect(transitions.started).toEqual([]);
    expect(popup).toHaveAttribute('data-ending-style');
    expect(popup).not.toHaveAttribute('data-instant');
  });

  it.each([
    { name: 'unmounted', keepMounted: false },
    { name: 'kept mounted', keepMounted: true },
  ])('preserves Popup enter and exit transitions when $name', async ({ keepMounted }) => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const { setProps } = await render(
      <Fixture
        handle={createHandle()}
        keepMounted={keepMounted}
        rootProps={{ open: false, triggerId: 'first' }}
      />,
    );

    const enter = recordTransitions(ownerDocument(screen.getByText('First')).body, {
      subtree: true,
    });
    await setProps({ rootProps: { open: true, triggerId: 'first' } });
    const popup = screen.getByTestId('popup');
    await waitFor(() => expect(enter.started).toContain('opacity'));
    expect(popup).not.toHaveAttribute('data-instant');
    expect(screen.getByTestId('positioner')).toHaveAttribute('data-instant');
    await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));

    const exit = recordTransitions(popup);
    await setProps({ rootProps: { open: false, triggerId: 'first' } });
    expect(popup).toHaveAttribute('data-ending-style');
    await waitFor(() => expect(exit.started).toContain('opacity'));
    expect(popup).not.toHaveAttribute('data-instant');
  });

  it('preserves the Popup enter transition when kept mounted and reopened at another trigger', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const { setProps } = await render(
      <Fixture
        handle={createHandle()}
        keepMounted
        rootProps={{ open: true, triggerId: 'first' }}
      />,
    );
    const positioner = screen.getByTestId('positioner');
    const popup = screen.getByTestId('popup');
    await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));
    await setProps({ rootProps: { open: false, triggerId: 'first' } });
    await waitFor(() => expect(positioner).toHaveAttribute('hidden'));

    const enter = recordTransitions(popup);
    await setProps({ rootProps: { open: true, triggerId: 'second' } });
    await waitFor(() => expect(enter.started).toContain('opacity'));
    await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));
    expect(popup).not.toHaveAttribute('data-instant');
  });

  it('animates a switch then resumes instant tracking', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const { user } = await render(
      <Fixture
        handle={createHandle()}
        rootProps={{ defaultOpen: true, defaultTriggerId: 'first' }}
      />,
    );
    const positioner = screen.getByTestId('positioner');
    await waitFor(() => expect(positioner.style.transition).toBe(''));
    await waitFor(() => expect(screen.getByTestId('popup').getAnimations()).toHaveLength(0));
    expect(positioner).toHaveAttribute('data-instant');

    const transitions = recordTransitions(positioner);
    await activate(user, 'Second');
    await waitFor(() => expect(transitions.started).toContain('transform'));
    await waitFor(() => expect(positioner).toHaveAttribute('data-instant', 'trigger-change'));
    expect(positioner.getAnimations()).toHaveLength(0);
    expect(positioner.getBoundingClientRect().top).toBeCloseTo(
      screen.getByText('Second').getBoundingClientRect().top,
      0,
    );
  });

  it.each([{ side: 'top' }, { side: 'left' }] as const)(
    'animates the side axis and popup size together with side=$side',
    async ({ side }) => {
      const { transitionProperty, dimension, initialSize, finalSize, popupEdge, triggerEdge } =
        side === 'top'
          ? ({
              transitionProperty: /^(top|bottom)$/,
              dimension: 'height',
              initialSize: 30,
              finalSize: 50,
              popupEdge: 'bottom',
              triggerEdge: 'top',
            } as const)
          : ({
              transitionProperty: /^(left|right)$/,
              dimension: 'width',
              initialSize: 80,
              finalSize: 120,
              popupEdge: 'right',
              triggerEdge: 'left',
            } as const);
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      const { user } = await render(
        <Fixture
          handle={createHandle()}
          withViewport
          side={side}
          resizeOnSwitch
          holdSwitch
          rootProps={{ defaultOpen: true, defaultTriggerId: 'first' }}
        />,
      );
      const positioner = screen.getByTestId('positioner');
      const popup = screen.getByTestId('popup');
      await waitFor(() => expect(positioner.style.transition).toBe(''));
      await waitFor(() => expect(popup.style.transition).toBe(''));
      await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));
      expect(positioner).toHaveAttribute('data-side', side);
      expect(positioner).toHaveAttribute('data-instant');
      expect(popup.getBoundingClientRect()[dimension]).toBe(initialSize);
      expect(popup.getBoundingClientRect()[popupEdge]).toBeCloseTo(
        screen.getByText('First').getBoundingClientRect()[triggerEdge],
        0,
      );

      const positionerTransitions = recordTransitions(positioner, { pause: true });
      const popupTransitions = recordTransitions(popup, { pause: true });

      await activate(user, 'Second');
      await waitFor(() =>
        expect(positionerTransitions.started).toEqual(
          expect.arrayContaining([expect.stringMatching(transitionProperty)]),
        ),
      );
      await waitFor(() => expect(popupTransitions.started).toContain(dimension));
      expect(popup.getAnimations()[0].playState).toBe('paused');
      await act(async () => {
        positioner.getAnimations().forEach((animation) => animation.finish());
      });
      await waitFor(() => expect(positioner.getAnimations()).toHaveLength(0));
      // The switch also waits for the popup size transition.
      expect(positioner).not.toHaveAttribute('data-instant');

      await act(async () => {
        popup.getAnimations().forEach((animation) => animation.finish());
      });
      await waitFor(() => expect(positioner).toHaveAttribute('data-instant'));
      expect(popup.getBoundingClientRect()[dimension]).toBe(finalSize);
      expect(popup.getBoundingClientRect()[popupEdge]).toBeCloseTo(
        screen.getByText('Second').getBoundingClientRect()[triggerEdge],
        0,
      );
    },
  );

  it('keeps tracking instant after a canceled trigger switch', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const onOpenChange = vi.fn((_open: boolean, details: { cancel: () => void }) =>
      details.cancel(),
    );
    const { user } = await render(
      <Fixture
        handle={createHandle()}
        rootProps={{ defaultOpen: true, defaultTriggerId: 'first', onOpenChange }}
      />,
    );
    const positioner = screen.getByTestId('positioner');
    await waitFor(() => expect(positioner.style.transition).toBe(''));
    expect(positioner).toHaveAttribute('data-instant');
    const previousPosition = positioner.style.transform;

    await activate(user, 'Second');
    await waitFor(() => expect(onOpenChange).toHaveBeenCalled());
    await act(async () => {
      await waitSingleFrame();
      await waitSingleFrame();
    });
    expect(positioner).toHaveAttribute('data-instant');
    expect(positioner.getAnimations()).toHaveLength(0);
    expect(positioner.style.transform).toBe(previousPosition);
  });

  it('restores instant tracking when reopened during a trigger switch', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const { setProps } = await render(
      <Fixture
        handle={createHandle()}
        keepMounted
        holdSwitch
        holdExit
        rootProps={{ open: true, triggerId: 'first' }}
      />,
    );
    const positioner = screen.getByTestId('positioner');
    const popup = screen.getByTestId('popup');
    await waitFor(() => expect(positioner.style.transition).toBe(''));
    await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));

    const move = recordTransitions(positioner, { pause: true });
    await setProps({ rootProps: { open: true, triggerId: 'second' } });
    await waitFor(() => expect(move.started).toContain('transform'));
    expect(positioner.getAnimations()[0].playState).toBe('paused');
    expect(positioner).not.toHaveAttribute('data-instant');
    const exit = recordTransitions(popup, { pause: true });
    await setProps({ rootProps: { open: false, triggerId: 'second' } });
    expect(popup).toHaveAttribute('data-ending-style');
    await waitFor(() => expect(exit.started).toContain('opacity'));
    expect(popup.getAnimations()[0].playState).toBe('paused');
    exit.stop();
    await setProps({ rootProps: { open: true, triggerId: 'second' } });
    await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));
    expect(positioner).not.toHaveAttribute('data-instant');

    // The move ends after the reopen, so it must not write the closed cycle's instant state.
    await act(async () => {
      positioner.getAnimations().forEach((animation) => animation.finish());
    });
    await waitFor(() => expect(positioner).toHaveAttribute('data-instant'));
    expect(popup).not.toHaveAttribute('data-instant');
    expect(popup).toHaveAttribute('data-open');
  });

  it('keeps a switch transition running when the popup closes during it', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const { setProps } = await render(
      <Fixture
        handle={createHandle()}
        holdSwitch
        holdExit
        rootProps={{ open: true, triggerId: 'first' }}
      />,
    );
    const positioner = screen.getByTestId('positioner');
    const popup = screen.getByTestId('popup');
    await waitFor(() => expect(positioner.style.transition).toBe(''));
    await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));

    const move = recordTransitions(positioner, { pause: true });
    await setProps({ rootProps: { open: true, triggerId: 'second' } });
    await waitFor(() => expect(move.started).toContain('transform'));
    const exit = recordTransitions(popup, { pause: true });
    await setProps({ rootProps: { open: false, triggerId: 'second' } });
    await waitFor(() => expect(exit.started).toContain('opacity'));

    expect(positioner).not.toHaveAttribute('data-instant');
    expect(move.canceled).toEqual([]);
    expect(positioner.getAnimations()).toHaveLength(1);

    await act(async () => {
      positioner.getAnimations().forEach((animation) => animation.finish());
    });
    await waitFor(() => expect(positioner).toHaveAttribute('data-instant'));
    expect(popup).toHaveAttribute('data-ending-style');
  });

  it('keeps the Arrow instant when collision shifting changes its offset', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    await render(<ArrowFixture handle={createHandle()} />);
    const positioner = screen.getByTestId('positioner');
    const arrow = screen.getByTestId('arrow');
    const first = screen.getByText('First');
    await waitFor(() => expect(positioner.style.transition).toBe(''));
    await waitFor(() => expect(screen.getByTestId('popup').getAnimations()).toHaveLength(0));
    expect(arrow).toHaveAttribute('data-instant');

    const transitions = recordTransitions(arrow);
    const previousLeft = arrow.style.left;
    await act(async () => {
      screen.getByTestId('first-wrapper').style.left = '40px';
    });
    await waitFor(() => expect(arrow.style.left).not.toBe(previousLeft));
    await act(async () => {
      await waitSingleFrame();
      await waitSingleFrame();
    });

    expect(transitions.started).toEqual([]);
    const triggerRect = first.getBoundingClientRect();
    expect(arrow.getBoundingClientRect().left + 6).toBeCloseTo(
      triggerRect.left + triggerRect.width / 2,
      0,
    );
  });

  it('animates the Arrow through a switch when the Positioner stays in place', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const { user } = await render(<ArrowFixture handle={createHandle()} />);
    const positioner = screen.getByTestId('positioner');
    const arrow = screen.getByTestId('arrow');
    await waitFor(() => expect(positioner.style.transition).toBe(''));
    await waitFor(() => expect(screen.getByTestId('popup').getAnimations()).toHaveLength(0));
    const positionerLeft = positioner.getBoundingClientRect().left;
    const positionerTransitions = recordTransitions(positioner);
    const arrowTransitions = recordTransitions(arrow);

    await activate(user, 'Second');
    await waitFor(() => expect(arrowTransitions.finished).toContain('left'));
    await waitFor(() => expect(arrow).toHaveAttribute('data-instant'));

    expect(arrowTransitions.canceled).toEqual([]);
    expect(positionerTransitions.started).toEqual([]);
    expect(positioner.getBoundingClientRect().left).toBe(positionerLeft);
  });

  it.each([
    { name: 'a hidden-until-found Collapsible panel', kind: 'collapsible' },
    { name: 'an unrelated content animation', kind: 'animation' },
    { name: 'a nested Viewport transition', kind: 'viewport' },
  ] as const)('ends a switch without waiting for $name', async ({ kind }) => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const { user } = await render(
      <Fixture
        handle={createHandle()}
        rootProps={{ defaultOpen: true, defaultTriggerId: 'first' }}
        content={
          {
            collapsible: (
              <Collapsible.Root>
                <Collapsible.Panel hiddenUntilFound>Details</Collapsible.Panel>
              </Collapsible.Root>
            ),
            animation: <div className="tracking-content-animation" />,
            // Stands in for the Viewport of a nested popup that renders inside this one.
            viewport: <div data-transitioning="" />,
          }[kind]
        }
      />,
    );
    const positioner = screen.getByTestId('positioner');
    await waitFor(() => expect(positioner.style.transition).toBe(''));
    await waitFor(() => expect(screen.getByTestId('popup').getAnimations()).toHaveLength(0));
    const transitions = recordTransitions(positioner);

    await activate(user, 'Second');
    await waitFor(() => expect(transitions.finished).toContain('transform'));
    await waitFor(() => expect(positioner).toHaveAttribute('data-instant'));
  });

  it('resumes instant tracking when the anchor scrolls during a switch', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const { user } = await render(
      <Fixture
        handle={createHandle()}
        holdSwitch
        rootProps={{ defaultOpen: true, defaultTriggerId: 'first' }}
      />,
    );
    const positioner = screen.getByTestId('positioner');
    await waitFor(() => expect(positioner.style.transition).toBe(''));
    await waitFor(() => expect(screen.getByTestId('popup').getAnimations()).toHaveLength(0));

    const move = recordTransitions(positioner, { pause: true });
    await activate(user, 'Second');
    await waitFor(() => expect(move.started).toContain('transform'));
    expect(positioner).not.toHaveAttribute('data-instant');
    move.stop();

    await act(async () => {
      screen.getByTestId('scroller').scrollTop += 20;
    });
    await waitFor(() => expect(positioner).toHaveAttribute('data-instant'));
    // Let the events of the canceled move dispatch before recording.
    await act(async () => {
      await waitSingleFrame();
      await waitSingleFrame();
    });

    const transitions = recordTransitions(positioner);
    await act(async () => {
      screen.getByTestId('scroller').scrollTop += 20;
    });
    await act(async () => {
      await waitSingleFrame();
      await waitSingleFrame();
    });
    expect(transitions.started).toEqual([]);
  });

  it.each([
    { anchorKind: 'element', keepMounted: false },
    { anchorKind: 'virtual', keepMounted: true },
  ] as const)(
    'tracks a scrolling $anchorKind anchor outside the triggers during a switch (keepMounted=$keepMounted)',
    async ({ anchorKind, keepMounted }) => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      function Test({ triggerId = 'first' }) {
        const [anchorElement, setAnchorElement] = React.useState<HTMLDivElement | null>(null);
        const anchor = React.useMemo(() => {
          if (!anchorElement || anchorKind === 'element') {
            return anchorElement;
          }
          return {
            getBoundingClientRect: () => anchorElement.getBoundingClientRect(),
            contextElement: anchorElement,
          };
        }, [anchorElement]);

        return (
          <Root open triggerId={triggerId} modal={false}>
            {({ payload }: { payload: unknown }) => (
              <React.Fragment>
                <style>{`
                  .override-tracking-positioner { transition: transform 60s linear; }
                  .override-tracking-popup { transition: width 60s linear; }
                  .override-tracking-positioner[data-instant], .override-tracking-popup[data-instant] { transition: none; }
                `}</style>
                <Trigger id="first" payload="first" {...triggerProps}>
                  First
                </Trigger>
                <Trigger id="second" payload="second" {...triggerProps}>
                  Second
                </Trigger>
                <div
                  data-testid="anchor-scroller"
                  style={{
                    position: 'fixed',
                    left: 200,
                    top: 100,
                    width: 300,
                    height: 200,
                    overflow: 'auto',
                  }}
                >
                  <div style={{ height: 600, paddingTop: 80 }}>
                    <div
                      ref={setAnchorElement}
                      data-testid="anchor"
                      style={{ width: 80, height: 20 }}
                    />
                  </div>
                </div>
                <Portal keepMounted={keepMounted}>
                  <Positioner
                    anchor={anchor}
                    side="bottom"
                    align="start"
                    data-testid="positioner"
                    className="override-tracking-positioner"
                  >
                    <Popup
                      data-testid="popup"
                      className="override-tracking-popup"
                      style={{ width: payload === 'second' ? 120 : 80, height: 40 }}
                    >
                      Popup
                    </Popup>
                  </Positioner>
                </Portal>
              </React.Fragment>
            )}
          </Root>
        );
      }

      const { setProps } = await render(<Test />);
      const positioner = screen.getByTestId('positioner');
      const popup = screen.getByTestId('popup');
      const anchor = screen.getByTestId('anchor');
      await waitFor(() => expect(positioner.style.transition).toBe(''));
      await waitFor(() => expect(popup.style.transition).toBe(''));
      await waitFor(() => expect(positioner).toHaveAttribute('data-instant'));
      expect(positioner.getBoundingClientRect().top).toBeCloseTo(
        anchor.getBoundingClientRect().bottom,
        0,
      );

      const sizeMove = recordTransitions(popup, { pause: true });
      const moves = recordTransitions(positioner);
      await setProps({ triggerId: 'second' });
      await waitFor(() => expect(sizeMove.started).toContain('width'));
      expect(positioner).not.toHaveAttribute('data-instant');
      expect(popup.getAnimations()[0].playState).toBe('paused');
      const previousAnchorTop = anchor.getBoundingClientRect().top;

      await act(async () => {
        screen.getByTestId('anchor-scroller').scrollTop = 40;
        await waitSingleFrame();
        await waitSingleFrame();
      });
      expect(anchor.getBoundingClientRect().top).toBe(previousAnchorTop - 40);
      await waitFor(() =>
        expect(new (ownerWindow(positioner).DOMMatrix)(positioner.style.transform).m42).toBeCloseTo(
          anchor.getBoundingClientRect().bottom,
          0,
        ),
      );
      await waitFor(() => expect(positioner).toHaveAttribute('data-instant'));
      expect(positioner.getBoundingClientRect().top).toBeCloseTo(
        anchor.getBoundingClientRect().bottom,
        0,
      );
      expect(moves.started).toEqual([]);
    },
  );

  it('tracks a parent resize instantly during a switch', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const handle = createHandle();
    const triggerStyle = triggerProps?.style as React.CSSProperties | undefined;
    const { user } = await render(
      <React.Fragment>
        <style>{`
          .resize-tracking-positioner { transition: transform 60s linear; }
          .resize-tracking-positioner[data-instant] { transition: none; }
        `}</style>
        <div
          data-testid="anchor-container"
          style={{
            position: 'fixed',
            left: 100,
            top: 100,
            width: 400,
            height: 120,
            overflow: 'auto',
          }}
        >
          <Trigger
            handle={handle}
            id="first"
            {...triggerProps}
            style={{ ...triggerStyle, position: 'absolute', left: 0, top: 20, width: 80 }}
          >
            First
          </Trigger>
          <Trigger
            handle={handle}
            id="second"
            {...triggerProps}
            style={{ ...triggerStyle, position: 'absolute', left: '50%', top: 20, width: '25%' }}
          >
            Second
          </Trigger>
        </div>
        <Root handle={handle} defaultOpen defaultTriggerId="first" modal={false}>
          <Portal>
            <Positioner
              data-testid="positioner"
              className="resize-tracking-positioner"
              side="bottom"
              align="start"
              collisionAvoidance={{ side: 'none', align: 'none' }}
            >
              <Popup style={{ width: 80, height: 40 }}>Popup</Popup>
            </Positioner>
          </Portal>
        </Root>
      </React.Fragment>,
    );
    const positioner = screen.getByTestId('positioner');
    const anchor = screen.getByText('Second');
    await waitFor(() => expect(positioner.style.transition).toBe(''));
    await waitFor(() => expect(positioner).toHaveAttribute('data-instant'));
    const move = recordTransitions(positioner, { pause: true });
    await activate(user, 'Second');
    await waitFor(() => expect(move.started).toContain('transform'));
    expect(positioner).not.toHaveAttribute('data-instant');
    expect(positioner.getAnimations()[0].playState).toBe('paused');
    move.stop();

    const previousAnchorLeft = anchor.getBoundingClientRect().left;
    const transitions = recordTransitions(positioner);
    await act(async () => {
      screen.getByTestId('anchor-container').style.width = '600px';
      await waitSingleFrame();
      await waitSingleFrame();
    });
    expect(anchor.getBoundingClientRect().left).toBe(previousAnchorLeft + 100);
    await waitFor(() =>
      expect(new (ownerWindow(positioner).DOMMatrix)(positioner.style.transform).m41).toBeCloseTo(
        anchor.getBoundingClientRect().left,
        0,
      ),
    );
    await waitFor(() => expect(positioner).toHaveAttribute('data-instant'));
    expect(positioner.getBoundingClientRect().left).toBeCloseTo(
      anchor.getBoundingClientRect().left,
      0,
    );
    expect(transitions.started).toEqual([]);
  });

  it('keeps a switch running while the popup content scrolls', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const { user } = await render(
      <Fixture
        handle={createHandle()}
        holdSwitch
        rootProps={{ defaultOpen: true, defaultTriggerId: 'first' }}
        content={
          <div data-testid="popup-scroller" style={{ height: 10, overflow: 'auto' }}>
            <div style={{ height: 100 }} />
          </div>
        }
      />,
    );
    const positioner = screen.getByTestId('positioner');
    await waitFor(() => expect(positioner.style.transition).toBe(''));
    await waitFor(() => expect(screen.getByTestId('popup').getAnimations()).toHaveLength(0));

    const move = recordTransitions(positioner, { pause: true });
    await activate(user, 'Second');
    await waitFor(() => expect(move.started).toContain('transform'));

    await act(async () => {
      screen.getByTestId('popup-scroller').scrollTop += 20;
    });
    await act(async () => {
      await waitSingleFrame();
      await waitSingleFrame();
    });

    expect(screen.getByTestId('popup-scroller').scrollTop).toBe(20);
    expect(positioner).not.toHaveAttribute('data-instant');
    expect(move.canceled).toEqual([]);
  });

  it('resumes instant tracking when a closing popup returns to its previous trigger', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const { setProps } = await render(
      <Fixture
        handle={createHandle()}
        holdSwitch
        holdExit
        rootProps={{ open: true, triggerId: 'first' }}
      />,
    );
    const positioner = screen.getByTestId('positioner');
    const popup = screen.getByTestId('popup');
    await waitFor(() => expect(positioner.style.transition).toBe(''));
    await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));

    const move = recordTransitions(positioner, { pause: true });
    await setProps({ rootProps: { open: true, triggerId: 'second' } });
    await waitFor(() => expect(move.started).toContain('transform'));
    expect(positioner).not.toHaveAttribute('data-instant');
    move.stop();

    const exit = recordTransitions(popup, { pause: true });
    await setProps({ rootProps: { open: false, triggerId: 'first' } });
    await waitFor(() => expect(exit.started).toContain('opacity'));
    exit.stop();
    await setProps({ rootProps: { open: true, triggerId: 'first' } });
    await act(async () => {
      positioner.getAnimations().forEach((animation) => animation.finish());
    });
    await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));

    await waitFor(() => expect(positioner).toHaveAttribute('data-instant'));
  });
}
