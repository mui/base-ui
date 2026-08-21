import * as React from 'react';
import { expect, vi } from 'vitest';
import { randomStringValue, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import { activeElement } from '../src/floating-ui-react/utils/element';
import { createAttribute } from '../src/floating-ui-react/utils/createAttribute';

export function popupConformanceTests(config: PopupTestConfig) {
  const {
    createComponent,
    triggerMouseAction,
    render,
    expectedPopupRole,
    expectedAriaHasPopupValue = expectedPopupRole,
    alwaysMounted: alwaysMountedParam = false,
    combobox = false,
  } = config;

  const alwaysMounted = alwaysMountedParam === 'only-after-open' ? false : alwaysMountedParam;

  const prepareComponent = (props: TestedComponentProps) => {
    return createComponent({
      ...props,
      trigger: {
        'data-testid': 'trigger',
        ...props.trigger,
      },
      popup: {
        'data-testid': 'popup',
        ...props.popup,
      },
    });
  };

  describe('Popup conformance', () => {
    describe('controlled mode', () => {
      it('opens the popup with the `open` prop', async () => {
        const { rerender } = await render(prepareComponent({ root: { open: false } }));
        if (!alwaysMounted) {
          expect(getPopup()).toBe(null);
        } else {
          expect(getPopup()).toBeInaccessible();
        }

        await rerender(prepareComponent({ root: { open: true } }));
        expect(getPopup()).not.toBe(null);
      });
    });

    if (triggerMouseAction === 'click') {
      describe('uncontrolled mode', () => {
        it('opens the popup when clicking on the trigger', async () => {
          const { user } = await render(prepareComponent({}));

          const trigger = getTrigger();
          if (!alwaysMounted) {
            expect(getPopup()).toBe(null);
          } else {
            expect(getPopup()).toBeInaccessible();
          }

          await user.click(trigger);
          await waitFor(() => {
            expect(getPopup()).not.toBe(null);
          });
        });
      });
    }

    if (expectedPopupRole || triggerMouseAction === 'click') {
      describe('ARIA attributes', () => {
        if (expectedPopupRole) {
          it(`has the ${expectedPopupRole} role on the popup`, async () => {
            await render(prepareComponent({ root: { open: true } }));
            const popup = getPopup();
            expect(popup).not.toBe(null);
            expect(popup).toHaveAttribute('role', expectedPopupRole);
          });
        }

        if (triggerMouseAction === 'click') {
          it('has the `aria-controls` attribute on the trigger', async () => {
            await render(prepareComponent({ root: { open: true } }));
            const trigger = getTrigger();
            const popup = getPopup();
            expect(trigger).toHaveAttribute('aria-controls', popup?.id);
          });

          it('has the `aria-expanded` attribute on the trigger when open', async () => {
            const { user } = await render(prepareComponent({}));
            const trigger = getTrigger();
            if (!alwaysMounted) {
              expect(getPopup()).toBe(null);
            } else {
              expect(getPopup()).toBeInaccessible();
            }
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
            await user.click(trigger);
            await waitFor(() => {
              if (combobox) {
                expect(getPopup()).toHaveAttribute('role', 'listbox');
              } else {
                expect(getPopup()).toHaveAttribute('data-open');
              }
            });
            expect(trigger).toHaveAttribute('aria-expanded', 'true');
          });

          if (expectedAriaHasPopupValue) {
            it('has the `aria-haspopup` attribute on the trigger', async () => {
              await render(prepareComponent({ root: { open: true } }));
              const trigger = getTrigger();
              expect(trigger).toHaveAttribute('aria-haspopup', expectedAriaHasPopupValue);
            });
          }

          it('allows a custom `id` prop', async () => {
            await render(prepareComponent({ root: { open: true }, popup: { id: 'TestId' } }));
            const trigger = getTrigger();
            const popup = getPopup();
            expect(trigger.getAttribute('aria-controls')).toBe(popup?.getAttribute('id'));
          });
        }
      });
    }

    describe('animations', () => {
      beforeEach(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      });

      afterEach(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      it('removes the popup when there is no exit animation defined', async ({ skip }) => {
        if (isJSDOM) {
          skip();
        }

        const { rerender } = await render(prepareComponent({ root: { open: true } }));

        await waitFor(() => {
          expect(getPopup()).not.toBe(null);
        });

        await rerender(prepareComponent({ root: { open: false } }));
        await waitFor(() => {
          if (!alwaysMounted && alwaysMountedParam !== 'only-after-open') {
            expect(getPopup()).toBe(null);
          } else {
            expect(getPopup()).toBeInaccessible();
          }
        });
      });

      it('removes the popup when the animation finishes', async ({ skip }) => {
        // XXX: revisit after feedback from the team
        skip();

        if (isJSDOM) {
          skip();
        }

        const handleAnimationEnd = vi.fn();
        const animationName = `anim-${randomStringValue()}`;

        function Test(props: { open: boolean }) {
          const style = `
            @keyframes ${animationName} {
              to {
                opacity: 0;
              }
            }

            .animation-test-popup-${animationName}[data-open] {
              opacity: 1;
            }

            .animation-test-popup-${animationName}[data-ending-style] {
              animation: ${animationName} 150ms;
            }
          `;

          return (
            <div>
              {/* eslint-disable-next-line react/no-danger */}
              <style dangerouslySetInnerHTML={{ __html: style }} />
              {prepareComponent({
                root: { open: props.open },
                portal: { keepMounted: true },
                popup: {
                  className: `animation-test-popup-${animationName}`,
                  onAnimationEnd: handleAnimationEnd,
                },
              })}
            </div>
          );
        }

        const { setProps } = await render(<Test open />);
        await setProps({ open: false });

        await waitFor(() => {
          const popup = getPopup();
          expect(popup).not.toBe(null);
          expect(popup).toBeInaccessible();
        });

        await waitFor(() => {
          expect(handleAnimationEnd).toHaveBeenCalledTimes(1);
        });
      });

      it('makes the popup inert while it animates out', async ({ skip }) => {
        // Only the components that hand focus back when the popup closes go fully inert. The
        // hover-triggered ones render no `FloatingFocusManager`, so going inert there would blur
        // whatever is focused inside them for the whole exit animation.
        if (isJSDOM || triggerMouseAction !== 'click') {
          skip();
        }

        const animationName = `anim-${randomStringValue()}`;
        // Target the attribute rather than a class on a specific part: the `popup` props land on
        // a different element per component, and the exit animation has to be on whichever
        // element carries `data-ending-style` for the subtree to stay mounted.
        const style = `
          @keyframes ${animationName} {
            to {
              opacity: 0;
            }
          }

          [data-ending-style] {
            animation: ${animationName} 500ms linear;
          }
        `;

        function Test(props: { open: boolean }) {
          return (
            <div>
              {/* eslint-disable-next-line react/no-danger */}
              <style dangerouslySetInnerHTML={{ __html: style }} />
              {prepareComponent({ root: { open: props.open } })}
            </div>
          );
        }

        const { setProps } = await render(<Test open />);
        await waitFor(() => {
          expect(getPopup()).not.toBe(null);
        });

        await setProps({ open: false });
        await waitFor(() => {
          expect(document.querySelector('[data-ending-style]')).not.toBe(null);
        });

        // The popup is logically closed, so the subtree kept mounted for the animation must be
        // out of the accessibility tree and out of sequential focus navigation. Components with
        // a Positioner carry `inert` there; Dialog-like popups carry it on the popup itself.
        expect(isInert(getPopup())).toBe(true);
      });

      it('keeps keyboard navigation unstuck while the popup animates out', async ({ skip }) => {
        // Hover-triggered popups reopen as soon as their trigger takes focus, so the premise of
        // tabbing around a closed-but-animating popup doesn't hold for them. They also have no
        // trigger focus guards, which is what these moves exercise.
        if (isJSDOM || triggerMouseAction !== 'click') {
          skip();
        }

        const animationName = `anim-${randomStringValue()}`;
        const style = `
          @keyframes ${animationName} {
            to {
              opacity: 0;
            }
          }

          [data-ending-style] {
            animation: ${animationName} 500ms linear;
          }
        `;

        function Test(props: { open: boolean }) {
          return (
            <div>
              {/* eslint-disable-next-line react/no-danger */}
              <style dangerouslySetInnerHTML={{ __html: style }} />
              <button type="button" data-testid="tab-before">
                before
              </button>
              {prepareComponent({ root: { open: props.open } })}
              <button type="button" data-testid="tab-after">
                after
              </button>
            </div>
          );
        }

        const { user, setProps } = await render(<Test open />);
        await waitFor(() => {
          expect(getPopup()).not.toBe(null);
        });

        await setProps({ open: false });
        await waitFor(() => {
          expect(document.querySelector('[data-ending-style]')).not.toBe(null);
        });

        // Focus guards around a trigger redirect focus while the popup is open. Once it is closed
        // and only animating out they must neither swallow focus nor send it back where it came
        // from, so each move has exactly one correct destination.
        const before = screen.getByTestId('tab-before');
        const after = screen.getByTestId('tab-after');
        const trigger = getTrigger();

        const label = (element: Element | null) => {
          if (element === before) {
            return 'tab-before';
          }
          if (element === after) {
            return 'tab-after';
          }
          if (element === trigger) {
            return 'trigger';
          }
          if (element?.hasAttribute(createAttribute('focus-guard'))) {
            return 'focus-guard';
          }
          return element ? element.nodeName.toLowerCase() : 'null';
        };

        const moves = [
          { name: 'Tab from the trigger', from: trigger, key: '{Tab}', to: 'tab-after' },
          {
            name: 'Shift+Tab from the trigger',
            from: trigger,
            key: '{Shift>}{Tab}{/Shift}',
            to: 'tab-before',
          },
          { name: 'Tab towards the trigger', from: before, key: '{Tab}', to: 'trigger' },
          {
            name: 'Shift+Tab towards the trigger',
            from: after,
            key: '{Shift>}{Tab}{/Shift}',
            to: 'trigger',
          },
        ];

        const landed: string[] = [];
        for (const move of moves) {
          move.from.focus();
          // eslint-disable-next-line no-await-in-loop
          await user.keyboard(move.key);
          landed.push(`${move.name} -> ${label(activeElement(document))}`);
        }

        // Every destination above also resolves through ordinary tab order once the popup has
        // finished animating out, so a run that overran would pass without testing anything.
        // Matches the setup's own predicate: components differ on which element carries the
        // attribute.
        expect(document.querySelector('[data-ending-style]')).not.toBe(null);
        expect(landed).toEqual(moves.map((move) => `${move.name} -> ${move.to}`));
      });
    });
  });
}

function isInert(element: Element | null) {
  for (let node = element; node != null; node = node.parentElement) {
    if (node.hasAttribute('inert')) {
      return true;
    }
  }
  return false;
}

function getTrigger() {
  return screen.getByTestId('trigger');
}

function getPopup() {
  return screen.queryByTestId('popup');
}

export interface PopupTestConfig {
  /**
   * A function that returns a JSX tree with a component to test.
   * Its parameters contain props to be spread on the component's parts.
   */
  createComponent: (props: TestedComponentProps) => React.JSX.Element;
  /**
   * How the popup is triggered.
   */
  triggerMouseAction: 'click' | 'hover';
  /**
   * Render function returned from `createRenderer`.
   */
  render: ReturnType<typeof createRenderer>['render'];
  /**
   * Expected `role` attribute of the popup element.
   */
  expectedPopupRole?: string;
  /**
   * Expected `aria-haspopup` attribute of the trigger element.
   */
  expectedAriaHasPopupValue?: string;
  /**
   * Whether the popup contents are always present in the DOM.
   */
  alwaysMounted?: boolean | 'only-after-open';
  /**
   * Whether the popup is a combobox.
   */
  combobox?: boolean;
}

interface RootProps {
  open?: boolean;
  onOpenChange?: (open: boolean | null) => void;
}

interface TriggerProps {
  'data-testid'?: string;
}

interface PopupProps {
  className?: string;
  id?: string;
  'data-testid'?: string;
  onAnimationEnd?: () => void;
}

interface PortalProps {
  keepMounted?: boolean;
}

interface TestedComponentProps {
  root?: RootProps;
  popup?: PopupProps;
  trigger?: TriggerProps;
  portal?: PortalProps;
}
