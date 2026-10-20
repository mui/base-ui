import * as React from 'react';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import type { UserEvent } from '@testing-library/user-event';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import type { createRenderer } from '#test-utils';
import { isJSDOM, waitForPositioned, waitSingleFrame } from '#test-utils';
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
  triggerProps,
  interaction = 'click',
}: TriggerSwitchTestParts & Pick<PositionerTestConfig, 'render'>) {
  async function activate(user: UserEvent, name: 'First' | 'Second') {
    const trigger = screen.getByText(name);
    if (interaction === 'hover') {
      // The pointer moves from the other trigger, as it does when a user switches triggers.
      fireEvent.mouseLeave(screen.getByText(name === 'First' ? 'Second' : 'First'));
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);
    } else {
      await user.click(trigger);
    }
  }

  function Fixture({
    handle,
    rootProps,
    keepMounted = false,
    withViewport = false,
  }: {
    handle: ReturnType<typeof createHandle>;
    rootProps?: Record<string, unknown>;
    keepMounted?: boolean;
    withViewport?: boolean;
  }) {
    return (
      <React.Fragment>
        <style>{`
          .tracking-positioner {
            transition: transform 200ms linear, top 200ms linear, right 200ms linear,
              bottom 200ms linear, left 200ms linear;
          }
          .tracking-positioner[data-instant] { transition: none; }
          .tracking-popup { opacity: 1; transition: opacity 200ms linear; }
          .tracking-popup[data-starting-style], .tracking-popup[data-ending-style] { opacity: 0; }
          .tracking-popup[data-instant] { transition: none; }
        `}</style>
        <div data-testid="scroller" style={{ width: 400, height: 200, overflow: 'auto' }}>
          <div
            data-testid="layout"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 40,
              paddingTop: 40,
              width: '25vw',
              height: 500,
            }}
          >
            <Trigger handle={handle} id="first" {...triggerProps}>
              First
            </Trigger>
            <Trigger handle={handle} id="second" {...triggerProps}>
              Second
            </Trigger>
          </div>
        </div>
        <Root handle={handle} modal={false} {...rootProps}>
          <Portal keepMounted={keepMounted}>
            <Positioner
              data-testid="positioner"
              className="tracking-positioner"
              side="right"
              align="start"
            >
              <Popup
                data-testid="popup"
                className="tracking-popup"
                style={{ width: 80, height: 30 }}
              >
                {withViewport ? <Viewport>Popup</Viewport> : 'Popup'}
              </Popup>
            </Positioner>
          </Portal>
        </Root>
      </React.Fragment>
    );
  }

  describe.each([
    { name: 'transform', withViewport: false },
    { name: 'top/left', withViewport: true },
  ])('trigger transitions ($name)', ({ withViewport }) => {
    describe.each([
      { name: 'before switching triggers', afterSwitch: false },
      { name: 'after switching triggers', afterSwitch: true },
    ])('tracking $name', ({ afterSwitch }) => {
      it.each([
        {
          name: 'ancestor scroll',
          update: () => {
            screen.getByTestId('scroller').scrollTop += 20;
          },
        },
        {
          name: 'layout resize',
          update: () => {
            screen.getByTestId('layout').style.width = '300px';
          },
        },
        {
          name: 'viewport resize',
          update: async () => {
            const { page } = await import('vitest/browser');
            const { innerWidth, innerHeight } = window;
            onTestFinished(() => page.viewport(innerWidth, innerHeight));
            await page.viewport(innerWidth + 100, innerHeight);
          },
        },
      ])('tracks $name without a position transition', async ({ update }) => {
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
        const transitionRun = vi.fn();
        positioner.addEventListener('transitionrun', (event) => {
          if (event.target === positioner) {
            transitionRun();
          }
        });
        const previousPosition = positioner.style.cssText;
        await act(async () => update());
        await waitFor(() => expect(positioner.style.cssText).not.toBe(previousPosition));
        await act(async () => {
          await waitSingleFrame();
          await waitSingleFrame();
        });

        expect(transitionRun).not.toHaveBeenCalled();
        expect(positioner.getBoundingClientRect().top).toBeCloseTo(
          trigger.getBoundingClientRect().top,
          0,
        );
        expect(
          Math.abs(positioner.getBoundingClientRect().left - trigger.getBoundingClientRect().right),
        ).toBeLessThan(1);
      });
    });
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

    await setProps({ rootProps: { open: true, triggerId: 'first' } });
    const popup = screen.getByTestId('popup');
    await waitFor(() => expect(popup.getAnimations().length).toBeGreaterThan(0));
    expect(popup).not.toHaveAttribute('data-instant');
    expect(screen.getByTestId('positioner')).toHaveAttribute('data-instant');
    await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));

    await setProps({ rootProps: { open: false, triggerId: 'first' } });
    expect(popup).toHaveAttribute('data-ending-style');
    await waitFor(() => expect(popup.getAnimations().length).toBeGreaterThan(0));
    expect(popup).not.toHaveAttribute('data-instant');
  });

  it.each([
    { name: 'an uncontrolled trigger', mode: 'trigger' },
    { name: 'controlled triggerId', mode: 'controlled' },
    { name: 'imperative handle', mode: 'imperative' },
  ])('animates a switch through $name then resumes instant tracking', async ({ mode }) => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const handle = createHandle();
    const { setProps, user } = await render(
      <Fixture
        handle={handle}
        rootProps={
          mode === 'controlled'
            ? { open: true, triggerId: 'first' }
            : { defaultOpen: true, defaultTriggerId: 'first' }
        }
      />,
    );
    const positioner = screen.getByTestId('positioner');
    await waitFor(() => expect(positioner.style.transition).toBe(''));
    await waitFor(() => expect(screen.getByTestId('popup').getAnimations()).toHaveLength(0));
    expect(positioner).toHaveAttribute('data-instant');

    if (mode === 'controlled') {
      await setProps({ rootProps: { open: true, triggerId: 'second' } });
    } else if (mode === 'trigger') {
      await activate(user, 'Second');
    } else {
      await act(async () => handle.open('second'));
    }
    await waitFor(() => expect(positioner.getAnimations().length).toBeGreaterThan(0));
    expect(positioner).not.toHaveAttribute('data-instant');
    await waitFor(() => expect(positioner).toHaveAttribute('data-instant', 'trigger-change'));
    expect(positioner.getAnimations()).toHaveLength(0);
    expect(positioner.getBoundingClientRect().top).toBeCloseTo(
      screen.getByText('Second').getBoundingClientRect().top,
      0,
    );
  });

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
        rootProps={{ open: true, triggerId: 'first' }}
      />,
    );
    const positioner = screen.getByTestId('positioner');
    const popup = screen.getByTestId('popup');
    await waitFor(() => expect(positioner.style.transition).toBe(''));
    await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));

    await setProps({ rootProps: { open: true, triggerId: 'second' } });
    await waitFor(() => expect(positioner.getAnimations().length).toBeGreaterThan(0));
    expect(positioner).not.toHaveAttribute('data-instant');
    await setProps({ rootProps: { open: false, triggerId: 'second' } });
    expect(popup).toHaveAttribute('data-ending-style');
    await waitFor(() => expect(popup.getAnimations().length).toBeGreaterThan(0));
    await setProps({ rootProps: { open: true, triggerId: 'second' } });
    await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));

    expect(positioner).toHaveAttribute('data-instant');
    expect(popup).not.toHaveAttribute('data-instant');
    expect(popup).toHaveAttribute('data-open');
  });
}
