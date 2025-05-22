import * as React from 'react';
import { spy } from 'sinon';
import { expect } from 'chai';
import { randomStringValue, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';

export function popupConformanceTests(config: PopupTestConfig) {
  const {
    createComponent,
    triggerMouseAction,
    render,
    expectedPopupRole,
    expectedAriaHasPopupValue = expectedPopupRole,
    alwaysMounted: alwaysMountedParam = false,
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
          expect(getPopup()).to.equal(null);
        } else {
          expect(getPopup()).toBeInaccessible();
        }

        await rerender(prepareComponent({ root: { open: true } }));
        expect(getPopup()).not.to.equal(null);
      });
    });

    if (triggerMouseAction === 'click') {
      describe('uncontrolled mode', () => {
        it('opens the popup when clicking on the trigger', async () => {
          const { user } = await render(prepareComponent({}));

          const trigger = getTrigger();
          if (!alwaysMounted) {
            expect(getPopup()).to.equal(null);
          } else {
            expect(getPopup()).toBeInaccessible();
          }

          await user.click(trigger);
          await waitFor(() => {
            expect(getPopup()).not.to.equal(null);
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
            expect(popup).not.to.equal(null);
            expect(popup).to.have.attribute('role', expectedPopupRole);
          });
        }

        if (triggerMouseAction === 'click') {
          it('has the `aria-controls` attribute on the trigger', async () => {
            await render(prepareComponent({ root: { open: true } }));
            const trigger = getTrigger();
            const popup = getPopup();
            expect(trigger).to.have.attribute('aria-controls', popup?.id);
          });

          it('has the `aria-expanded` attribute on the trigger when open', async () => {
            const { user } = await render(prepareComponent({}));
            const trigger = getTrigger();
            if (!alwaysMounted) {
              expect(getPopup()).to.equal(null);
            } else {
              expect(getPopup()).toBeInaccessible();
            }
            expect(trigger).to.have.attribute('aria-expanded', 'false');
            await user.click(trigger);
            await waitFor(() => {
              expect(getPopup()).to.have.attribute('data-open');
            });
            expect(trigger).to.have.attribute('aria-expanded', 'true');
          });

          if (expectedAriaHasPopupValue) {
            it('has the `aria-haspopup` attribute on the trigger', async () => {
              await render(prepareComponent({ root: { open: true } }));
              const trigger = getTrigger();
              expect(trigger).to.have.attribute('aria-haspopup', expectedAriaHasPopupValue);
            });
          }

          it('allows a custom `id` prop', async () => {
            await render(prepareComponent({ root: { open: true }, popup: { id: 'TestId' } }));
            const trigger = getTrigger();
            const popup = getPopup();
            expect(trigger.getAttribute('aria-controls')).to.equal(popup?.getAttribute('id'));
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
          expect(getPopup()).not.to.equal(null);
        });

        await rerender(prepareComponent({ root: { open: false } }));
        await waitFor(() => {
          if (!alwaysMounted && alwaysMountedParam !== 'only-after-open') {
            expect(getPopup()).to.equal(null);
          } else {
            expect(getPopup()).toBeInaccessible();
          }
        });
      });

      it('removes the popup when the animation finishes', async ({ skip }) => {
        if (isJSDOM) {
          skip();
        }

        const handleAnimationEnd = spy();
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
          expect(popup).not.to.equal(null);
          expect(popup).toBeInaccessible();
        });

        await waitFor(() => {
          expect(handleAnimationEnd.callCount).to.equal(1);
        });
      });
    });
  });
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
}

interface RootProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
