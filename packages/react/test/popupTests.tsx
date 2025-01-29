import * as React from 'react';
import { spy } from 'sinon';
import { expect } from 'chai';
import { randomStringValue, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';

interface RootProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface TriggerProps {
  'data-testid'?: string;
}

interface PopupProps {
  className?: string;
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

interface PopupTestConfig {
  createComponent: (props: TestedComponentProps) => React.JSX.Element;
  triggerMouseAction: 'click' | 'hover';
  render: ReturnType<typeof createRenderer>['render'];
  expectedPopupRole: string;
  alwaysMounted?: boolean;
}

function getTrigger() {
  return screen.getByTestId('trigger');
}

function getPopup() {
  return screen.queryByTestId('popup');
}

export function popupConformanceTests(config: PopupTestConfig) {
  const {
    createComponent,
    triggerMouseAction,
    render,
    expectedPopupRole,
    alwaysMounted = false,
  } = config;

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

          expect(getPopup()).not.to.equal(null);
        });
      });
    }

    describe('ARIA attributes', () => {
      it(`has the ${expectedPopupRole} role on the popup`, async () => {
        await render(prepareComponent({ root: { open: true } }));
        const popup = getPopup();
        expect(popup).not.to.equal(null);
        expect(popup).to.have.attribute('role', expectedPopupRole);
      });

      if (triggerMouseAction === 'click') {
        it('has the `aria-controls` attribute on the trigger', async () => {
          await render(prepareComponent({ root: { open: true } }));
          const trigger = getTrigger();
          const popup = getPopup();
          expect(trigger).to.have.attribute('aria-controls', popup?.id);
        });
      }
    });

    describe('animations', () => {
      afterEach(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      it('removes the popup when there is no exit animation defined', async ({ skip }) => {
        if (isJSDOM) {
          skip();
        }

        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        const { rerender } = await render(prepareComponent({ root: { open: true } }));

        await waitFor(() => {
          expect(getPopup()).not.to.equal(null);
        });

        await rerender(prepareComponent({ root: { open: false } }));
        await waitFor(() => {
          if (!alwaysMounted) {
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

        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

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
