import * as React from 'react';
import { expect, describe, it, beforeEach, afterEach } from 'vitest';
import { act, ignoreActWarnings, screen, waitFor } from '@mui/internal-test-utils';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import type { createRenderer } from '#test-utils';
import { isJSDOM, waitSingleFrame } from '#test-utils';
import type { Side } from '../src/internals/useAnchorPositioning';

const morphTransitionStyles = `
  [data-transitioning] [data-current] {
    transition: transform 10s linear, opacity 10s linear;
  }
  [data-transitioning] [data-current][data-starting-style] {
    transform: translateX(30%);
    opacity: 0;
  }
  [data-transitioning] [data-previous] {
    transition: transform 10s linear, opacity 10s linear;
  }
  [data-transitioning] [data-previous][data-ending-style] {
    transform: translateX(-30%);
    opacity: 0;
  }
`;

/**
 * Tests the morphing behavior that `usePopupViewport` gives every `*.Viewport` part:
 * the `current`/`previous` containers, the transition attributes, and popup anchoring.
 */
export function viewportConformanceTests(config: ViewportTestConfig) {
  const { createComponent, render, openOn } = config;

  /**
   * @param waitsOutsideAct Whether the test waits for frames outside `act`, letting
   * positioning updates commit there.
   */
  function setup(waitsOutsideAct = false) {
    if (openOn === 'focus' || waitsOutsideAct) {
      // Focus-opened popups commit their delayed open state outside `act`.
      ignoreActWarnings();
    }
  }

  async function activateTrigger(trigger: HTMLElement, user: RenderResult['user']) {
    if (openOn === 'click') {
      await user.click(trigger);
      return;
    }

    await waitSingleFrame();
    await act(async () => trigger.focus());
  }

  describe('Viewport conformance', () => {
    it('renders children in the `current` container by default', async () => {
      setup();
      await render(
        createComponent({
          root: { open: true },
          triggers: [{ children: 'Trigger' }],
          viewport: { 'data-testid': 'viewport' },
          renderContent: () => <div data-testid="content">Content</div>,
        }),
      );

      const currentContainer = screen.getByTestId('content').closest('[data-current]');
      expect(currentContainer).not.toBe(null);
      expect(currentContainer!.textContent).toBe('Content');
      expect(document.querySelector('[data-previous]')).toBe(null);

      const viewport = screen.getByTestId('viewport');
      expect(viewport).not.toHaveAttribute('data-transitioning');
      expect(viewport).not.toHaveAttribute('data-activation-direction');
    });

    it('remounts the `current` container when the active trigger changes', async () => {
      setup();
      const { user } = await render(
        createComponent({
          triggers: [
            { payload: 'first', 'data-testid': 'trigger1', children: 'Trigger 1' },
            { payload: 'second', 'data-testid': 'trigger2', children: 'Trigger 2' },
          ],
          renderContent: (payload) => (
            <React.Fragment>
              {payload === 'first' ? (
                <img data-testid="payload-image-1" src="about:blank" alt="Preview 1" />
              ) : null}
              {payload === 'second' ? (
                <img data-testid="payload-image-2" src="about:blank" alt="Preview 2" />
              ) : null}
            </React.Fragment>
          ),
        }),
      );

      await activateTrigger(screen.getByTestId('trigger1'), user);

      const firstImage = await screen.findByTestId('payload-image-1');
      const firstContainer = firstImage.closest('[data-current]');
      expect(firstContainer).not.toBe(null);

      await activateTrigger(screen.getByTestId('trigger2'), user);

      await waitFor(() => {
        expect(screen.getByTestId('payload-image-2').closest('[data-current]')).not.toBe(null);
      });
      expect(screen.getByTestId('payload-image-2').closest('[data-current]')).not.toBe(
        firstContainer,
      );
    });

    it.each([{ strict: false }, { strict: true }])(
      'does not restart a transition when the active trigger remounts while closed and retained (strict: $strict)',
      async ({ strict }) => {
        setup();

        function Test({ triggerKey }: { triggerKey: string }) {
          return createComponent({
            root: {
              defaultOpen: true,
              defaultTriggerId: 'trigger',
              onOpenChange: (open, eventDetails) => {
                if (!open) {
                  eventDetails.preventUnmountOnClose();
                }
              },
            },
            triggers: [{ key: triggerKey, id: 'trigger', children: 'Trigger' }],
            popup: { 'data-testid': 'popup' },
            viewport: { 'data-testid': 'viewport' },
            renderContent: () => 'Content',
          });
        }

        const { user, rerender } = await render(<Test triggerKey="a" />, { strict });

        await user.keyboard('[Escape]');
        await waitFor(() => {
          expect(screen.getByTestId('popup')).toHaveAttribute('data-closed');
        });

        await rerender(<Test triggerKey="b" />);

        expect(screen.getByTestId('popup')).toHaveAttribute('data-closed');
        expect(screen.getByTestId('viewport')).not.toHaveAttribute('data-transitioning');
        expect(document.querySelector('[data-previous]')).toBe(null);
      },
    );

    it.each([
      {
        side: 'top',
        direction: 'ltr',
        expected: { position: 'absolute', bottom: '0px', left: '0px' },
      },
      {
        side: 'top',
        direction: 'rtl',
        expected: { position: 'absolute', bottom: '0px', left: '0px' },
      },
      { side: 'bottom', direction: 'ltr', expected: {} },
      { side: 'bottom', direction: 'rtl', expected: {} },
      {
        side: 'left',
        direction: 'ltr',
        expected: { position: 'absolute', top: '0px', right: '0px' },
      },
      {
        side: 'left',
        direction: 'rtl',
        expected: { position: 'absolute', top: '0px', right: '0px' },
      },
      { side: 'right', direction: 'ltr', expected: {} },
      { side: 'right', direction: 'rtl', expected: {} },
      {
        side: 'inline-start',
        direction: 'ltr',
        expected: { position: 'absolute', top: '0px', right: '0px' },
      },
      { side: 'inline-start', direction: 'rtl', expected: {} },
      { side: 'inline-end', direction: 'ltr', expected: {} },
      {
        side: 'inline-end',
        direction: 'rtl',
        expected: { position: 'absolute', top: '0px', right: '0px' },
      },
    ] satisfies AnchoringCase[])(
      'anchors the popup for side=$side in $direction mode',
      async ({ side, direction, expected }) => {
        setup();
        await render(
          <DirectionProvider direction={direction}>
            {createComponent({
              root: { open: true },
              triggers: [{ children: 'Trigger' }],
              positioner: { side, collisionAvoidance: { side: 'none' } },
              popup: { 'data-testid': 'popup' },
              renderContent: () => 'Content',
            })}
          </DirectionProvider>,
        );

        const { style } = screen.getByTestId('popup');
        expect(style.position).toBe(expected.position ?? '');
        expect(style.top).toBe(expected.top ?? '');
        expect(style.right).toBe(expected.right ?? '');
        expect(style.bottom).toBe(expected.bottom ?? '');
        expect(style.left).toBe(expected.left ?? '');
      },
    );

    describe.skipIf(isJSDOM)('morphing containers', () => {
      beforeEach(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      });

      afterEach(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      function renderPositionedTriggers(
        first: TriggerPosition,
        second: TriggerPosition,
        animationDuration: string,
      ) {
        return render(
          <div>
            <style>{getMorphAnimationStyles(animationDuration)}</style>
            {createComponent({
              triggers: [
                {
                  payload: 0,
                  'data-testid': 'trigger1',
                  style: getTriggerStyle(first),
                  children: 'Trigger 1',
                },
                {
                  payload: 1,
                  'data-testid': 'trigger2',
                  style: getTriggerStyle(second),
                  children: 'Trigger 2',
                },
              ],
              viewport: { 'data-testid': 'viewport' },
              renderContent: (payload) => (
                <div data-testid="content">Content {payload as number}</div>
              ),
            })}
          </div>,
        );
      }

      it('creates morphing containers during transitions', async () => {
        setup();
        const { user } = await renderPositionedTriggers(
          { top: 10, left: 10 },
          { top: 100, left: 200 },
          '0.3s',
        );

        await activateTrigger(screen.getByTestId('trigger1'), user);
        await waitFor(() => {
          expect(screen.getByText('Content 0')).toBeVisible();
        });
        const viewport = screen.getByTestId('viewport');
        expect(viewport).not.toHaveAttribute('data-transitioning');
        expect(viewport).not.toHaveAttribute('data-activation-direction');

        await activateTrigger(screen.getByTestId('trigger2'), user);

        let previousContainer: HTMLElement | null = null;
        await waitFor(() => {
          previousContainer = document.querySelector('[data-previous]');
          expect(previousContainer).not.toBe(null);
        });

        expect(viewport).toHaveAttribute('data-transitioning', '');
        expect(viewport).toHaveAttribute('data-activation-direction', 'right down');
        expect(previousContainer).toHaveAttribute('inert');
        expect(previousContainer!.textContent).toBe('Content 0');
        expect(previousContainer!.style.getPropertyValue('--popup-width')).toMatch(
          /^\d+(?:\.\d+)?px$/,
        );
        expect(previousContainer!.style.getPropertyValue('--popup-height')).toMatch(
          /^\d+(?:\.\d+)?px$/,
        );

        const currentContainer = document.querySelector('[data-current]');
        expect(currentContainer).not.toBe(null);
        expect(currentContainer!.textContent).toBe('Content 1');

        // The previous container is removed once the animations finish.
        await waitFor(() => {
          expect(document.querySelector('[data-previous]')).toBe(null);
        });

        expect(viewport).not.toHaveAttribute('data-transitioning');
        expect(document.querySelector('[data-current]')).toBeVisible();
        expect(screen.getByText('Content 1')).toBeVisible();
      });

      it('sets `data-activation-direction` from the previous to the new trigger', async () => {
        setup();
        // `getActivationDirection` unit tests cover every direction and the tolerance.
        // This case checks the measured trigger centers reach the attribute.
        const { user } = await renderPositionedTriggers(
          { top: 100, left: 200 },
          { top: 10, left: 10 },
          '0.2s',
        );

        await activateTrigger(screen.getByTestId('trigger1'), user);
        await waitFor(() => {
          expect(screen.getByText('Content 0')).toBeVisible();
        });

        await activateTrigger(screen.getByTestId('trigger2'), user);

        await waitFor(() => {
          expect(screen.getByTestId('viewport')).toHaveAttribute(
            'data-activation-direction',
            'left up',
          );
        });
      });

      it('creates morphing containers after a kept-mounted popup closes and reopens', async () => {
        setup();
        let setOpenExternal: ((open: boolean) => void) | undefined;

        function Test() {
          const [open, setOpen] = React.useState(false);
          setOpenExternal = setOpen;

          return (
            <div>
              <style>{getMorphAnimationStyles('0.2s')}</style>
              {createComponent({
                root: { open, onOpenChange: setOpen },
                triggers: [
                  { payload: 0, 'data-testid': 'trigger1', children: 'Trigger 1' },
                  { payload: 1, 'data-testid': 'trigger2', children: 'Trigger 2' },
                ],
                portal: { keepMounted: true },
                popup: { 'data-testid': 'popup' },
                renderContent: (payload) => `Content ${payload as number}`,
              })}
            </div>
          );
        }

        const { user } = await render(<Test />);

        const trigger1 = screen.getByTestId('trigger1');
        const trigger2 = screen.getByTestId('trigger2');

        await activateTrigger(trigger1, user);
        await waitFor(() => {
          expect(screen.getByText('Content 0')).toBeVisible();
        });

        await activateTrigger(trigger2, user);
        await waitFor(() => {
          expect(document.querySelector('[data-previous]')).not.toBe(null);
        });
        await waitFor(() => {
          expect(document.querySelector('[data-previous]')).toBe(null);
        });

        await act(async () => setOpenExternal?.(false));
        await waitFor(() => {
          expect(screen.getByTestId('popup')).not.toBeVisible();
        });

        await activateTrigger(trigger1, user);
        await waitFor(() => {
          expect(screen.getByText('Content 0')).toBeVisible();
        });

        await activateTrigger(trigger2, user);

        let previousContainer: HTMLElement | null = null;
        await waitFor(() => {
          previousContainer = document.querySelector('[data-previous]');
          expect(previousContainer).not.toBe(null);
        });

        expect(previousContainer!.textContent).toBe('Content 0');
        expect(screen.getByText('Content 1')).toBeVisible();
      });

      it('shows the latest content after rapid trigger changes', async () => {
        setup();
        const { user } = await render(
          <div>
            <style>{getMorphAnimationStyles('0.2s')}</style>
            {createComponent({
              triggers: [
                { payload: 1, 'data-testid': 'trigger1', children: 'Trigger 1' },
                { payload: 2, 'data-testid': 'trigger2', children: 'Trigger 2' },
                { payload: 3, 'data-testid': 'trigger3', children: 'Trigger 3' },
              ],
              renderContent: (payload) => `Content ${payload as number}`,
            })}
          </div>,
        );

        const trigger1 = screen.getByTestId('trigger1');

        await activateTrigger(trigger1, user);
        await activateTrigger(screen.getByTestId('trigger2'), user);
        await activateTrigger(screen.getByTestId('trigger3'), user);
        await activateTrigger(trigger1, user);

        const content = await screen.findByText('Content 1');
        await waitFor(() => {
          expect(content).toBeVisible();
        });
      });

      it('keeps the latest transition active during rapid trigger changes', async () => {
        setup(true);
        const { user } = await render(
          <div>
            <style>{getMorphAnimationStyles('10s')}</style>
            {createComponent({
              triggers: [
                { payload: 1, 'data-testid': 'trigger1', children: 'Trigger 1' },
                { payload: 2, 'data-testid': 'trigger2', children: 'Trigger 2' },
                { payload: 3, 'data-testid': 'trigger3', children: 'Trigger 3' },
              ],
              viewport: { 'data-testid': 'viewport' },
              renderContent: (payload) => `Content ${payload as number}`,
            })}
          </div>,
        );

        await activateTrigger(screen.getByTestId('trigger1'), user);
        await waitFor(() => {
          expect(screen.getByText('Content 1')).toBeVisible();
        });
        await activateTrigger(screen.getByTestId('trigger2'), user);

        await waitFor(() => {
          expect(
            screen.getByText('Content 2').closest('[data-current]')?.getAnimations(),
          ).toHaveLength(1);
        });
        // Allow `useAnimationsFinished` to begin waiting before replacing the current container.
        await waitSingleFrame();

        await activateTrigger(screen.getByTestId('trigger3'), user);
        await waitSingleFrame();

        const currentContainer = screen.getByText('Content 3').closest('[data-current]');
        expect(currentContainer?.getAnimations()).toHaveLength(1);
        expect(screen.getByTestId('viewport')).toHaveAttribute('data-transitioning', '');
        expect(document.querySelector('[data-previous]')).toHaveTextContent('Content 2');

        // A frame after the switch, the containers move from starting to ending styles.
        await waitFor(() => {
          expect(document.querySelector('[data-previous]')).toHaveAttribute(
            'data-ending-style',
            '',
          );
        });
        expect(screen.getByText('Content 3').closest('[data-current]')).not.toHaveAttribute(
          'data-starting-style',
        );
      });

      it('cleans up the transition when a lagging payload remounts the current container', async () => {
        setup(true);

        let setPayload2: ((value: string | undefined) => void) | undefined;

        function Test() {
          const [payload2, setPayload2State] = React.useState<string | undefined>(undefined);
          setPayload2 = setPayload2State;

          return (
            <div>
              <style>{morphTransitionStyles}</style>
              {createComponent({
                triggers: [
                  {
                    'data-testid': 'trigger1',
                    style: getTriggerStyle({ top: 10, left: 10 }),
                    children: 'Trigger 1',
                  },
                  {
                    payload: payload2,
                    'data-testid': 'trigger2',
                    style: getTriggerStyle({ top: 100, left: 200 }),
                    children: 'Trigger 2',
                  },
                ],
                viewport: { 'data-testid': 'viewport' },
                renderContent: (payload) => `Content ${String(payload)}`,
              })}
            </div>
          );
        }

        const { user } = await render(<Test />);

        await activateTrigger(screen.getByTestId('trigger1'), user);
        await waitFor(() => {
          expect(document.querySelector('[data-current]')).not.toBe(null);
        });

        await activateTrigger(screen.getByTestId('trigger2'), user);

        // The morph is in progress: the previous snapshot exists and both containers
        // are running their (long) transitions.
        await waitFor(() => {
          expect(document.querySelector('[data-previous]')).not.toBe(null);
        });
        await waitFor(() => {
          expect(
            document.querySelector('[data-previous]')?.getAnimations().length,
          ).toBeGreaterThanOrEqual(1);
        });
        await waitFor(() => {
          expect(
            document.querySelector('[data-current]')?.getAnimations().length,
          ).toBeGreaterThanOrEqual(1);
        });

        // Allow `useAnimationsFinished` to begin waiting before the container is replaced.
        await waitSingleFrame();
        await waitSingleFrame();

        const containerBeforePayload = document.querySelector('[data-current]');

        // The payload for the already-active trigger arrives a render later, which
        // bumps the content key and remounts the current container mid-morph.
        await act(async () => {
          setPayload2?.('ready');
        });

        await waitFor(() => {
          expect(document.querySelector('[data-current]')).not.toBe(containerBeforePayload);
        });
        expect(document.querySelector('[data-current]')!.textContent).toBe('Content ready');

        // The remounted container must restart its entry transition, otherwise the
        // cleanup watcher finds nothing to await and truncates the exit transition.
        await waitFor(() => {
          expect(
            document.querySelector('[data-current]')?.getAnimations().length,
          ).toBeGreaterThanOrEqual(1);
        });

        // The previous container's exit transition is still running, so it must not
        // have been torn down in the frames right after the remount.
        await waitSingleFrame();
        await waitSingleFrame();
        await waitSingleFrame();
        await waitSingleFrame();
        expect(document.querySelector('[data-previous]')).not.toBe(null);

        // Finish the live animations so the cleanup watcher can settle.
        await waitFor(async () => {
          await act(async () => {
            document.querySelectorAll('[data-previous], [data-current]').forEach((element) => {
              element.getAnimations().forEach((animation) => animation.finish());
            });
          });
          expect(document.querySelector('[data-previous]')).toBe(null);
        });

        await waitFor(() => {
          expect(screen.getByTestId('viewport')).not.toHaveAttribute('data-transitioning');
        });
      });
    });
  });
}

function getMorphAnimationStyles(duration: string) {
  return `
    [data-transitioning] [data-previous] {
      animation: slide-out ${duration} ease-out forwards;
    }
    [data-transitioning] [data-current] {
      animation: slide-in ${duration} ease-out forwards;
    }
    @keyframes slide-out {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(-30%); opacity: 0; }
    }
    @keyframes slide-in {
      from { transform: translateX(30%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
}

interface TriggerPosition {
  top: number;
  left: number;
}

function getTriggerStyle({ top, left }: TriggerPosition): React.CSSProperties {
  return {
    position: 'absolute',
    top: `${top}px`,
    left: `${left}px`,
    width: '100px',
    height: '50px',
  };
}

interface AnchoringCase {
  side: Side;
  direction: 'ltr' | 'rtl';
  expected: React.CSSProperties;
}

type RenderResult = Awaited<ReturnType<ReturnType<typeof createRenderer>['render']>>;

export interface ViewportTestConfig {
  /**
   * Returns the component tree: a Root whose children render function receives the payload,
   * one Trigger per entry in `triggers`, and Portal > Positioner > Popup > Viewport,
   * with `renderContent(payload)` as the Viewport's children.
   * Spread each `props` entry on its part. Add props the component needs to open
   * instantly on `openOn` (for example `delay={0}`).
   */
  createComponent: (props: ViewportTestProps) => React.JSX.Element;
  /**
   * Render function returned from `createRenderer`.
   */
  render: ReturnType<typeof createRenderer>['render'];
  /**
   * How a trigger opens the popup or switches it to that trigger.
   */
  openOn: 'click' | 'focus';
}

export interface ViewportTestProps {
  root?: {
    open?: boolean;
    defaultOpen?: boolean;
    defaultTriggerId?: string;
    onOpenChange?: (open: boolean, eventDetails: { preventUnmountOnClose(): void }) => void;
  };
  triggers: ViewportTestTriggerProps[];
  portal?: { keepMounted?: boolean };
  positioner?: { side?: Side; collisionAvoidance?: { side: 'none' } };
  popup?: { 'data-testid'?: string };
  viewport?: { 'data-testid'?: string };
  renderContent: (payload: unknown) => React.ReactNode;
}

export interface ViewportTestTriggerProps {
  key?: string;
  id?: string;
  payload?: unknown;
  'data-testid'?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}
