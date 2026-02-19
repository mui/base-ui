import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, isJSDOM, popupConformanceTests } from '#test-utils';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { OPEN_DELAY } from '../utils/constants';
import { REASONS } from '../../utils/reasons';

describe('<Tooltip.Root />', () => {
  beforeEach(async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  afterEach(async () => {
    await act(async () => {
      document.body.click();
    });
  });

  const { render, clock } = createRenderer();

  popupConformanceTests({
    createComponent: (props) => (
      <Tooltip.Root {...props.root}>
        <Tooltip.Trigger {...props.trigger}>Open menu</Tooltip.Trigger>
        <Tooltip.Portal {...props.portal}>
          <Tooltip.Positioner>
            <Tooltip.Popup {...props.popup}>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ),
    render,
    triggerMouseAction: 'hover',
  });

  describe.for([
    { name: 'contained triggers', Component: ContainedTriggerTooltip },
    { name: 'detached triggers', Component: DetachedTriggerTooltip },
    { name: 'multiple detached triggers', Component: MultipleDetachedTriggersTooltip },
  ])('when using $name', ({ Component: TestTooltip }) => {
    describe('uncontrolled open', () => {
      clock.withFakeTimers();

      it('should open when the trigger is hovered', async () => {
        await render(<TestTooltip />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);

        clock.tick(OPEN_DELAY);

        await flushMicrotasks();

        expect(screen.getByText('Content')).not.to.equal(null);
      });

      it('should close when the trigger is unhovered', async () => {
        await render(<TestTooltip />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);

        clock.tick(OPEN_DELAY);

        await flushMicrotasks();

        fireEvent.mouseLeave(trigger);

        await flushMicrotasks();
        expect(screen.queryByText('Content')).to.equal(null);
      });

      it('should open when the trigger is focused', async ({ skip }) => {
        if (isJSDOM) {
          skip();
        }

        await render(<TestTooltip />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        await act(async () => trigger.focus());

        await flushMicrotasks();

        expect(screen.getByText('Content')).not.to.equal(null);
      });

      it('should close when the trigger is blurred', async () => {
        await render(<TestTooltip />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        await act(async () => {
          trigger.focus();
        });

        clock.tick(OPEN_DELAY);
        await flushMicrotasks();

        await act(async () => {
          trigger.blur();
        });

        clock.tick(OPEN_DELAY);

        expect(screen.queryByText('Content')).to.equal(null);
      });
    });

    describe('controlled open', () => {
      clock.withFakeTimers();
      it('should call onOpenChange when the open state changes', async () => {
        const handleChange = spy();

        function App() {
          const [open, setOpen] = React.useState(false);

          return (
            <TestTooltip
              rootProps={{
                open,
                onOpenChange: (nextOpen) => {
                  handleChange(open);
                  setOpen(nextOpen);
                },
              }}
            />
          );
        }

        await render(<App />);

        expect(screen.queryByText('Content')).to.equal(null);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);

        clock.tick(OPEN_DELAY);

        await flushMicrotasks();

        expect(screen.getByText('Content')).not.to.equal(null);

        fireEvent.mouseLeave(trigger);

        expect(screen.queryByText('Content')).to.equal(null);
        expect(handleChange.callCount).to.equal(2);
        expect(handleChange.firstCall.args[0]).to.equal(false);
        expect(handleChange.secondCall.args[0]).to.equal(true);
      });

      it('should not call onChange when the open state does not change', async () => {
        const handleChange = spy();

        function App() {
          const [open, setOpen] = React.useState(false);

          return (
            <TestTooltip
              rootProps={{
                open,
                onOpenChange: (nextOpen) => {
                  handleChange(open);
                  setOpen(nextOpen);
                },
              }}
            />
          );
        }

        await render(<App />);

        expect(screen.queryByText('Content')).to.equal(null);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);

        clock.tick(OPEN_DELAY);

        await flushMicrotasks();

        expect(screen.getByText('Content')).not.to.equal(null);
        expect(handleChange.callCount).to.equal(1);
        expect(handleChange.firstCall.args[0]).to.equal(false);
      });
    });

    describe('prop: defaultOpen', () => {
      it('should open when the component is rendered', async () => {
        await render(<TestTooltip rootProps={{ defaultOpen: true }} />);

        await flushMicrotasks();

        expect(screen.getByText('Content')).not.to.equal(null);
      });

      it('should not open when the component is rendered and open is controlled', async () => {
        await render(<TestTooltip rootProps={{ defaultOpen: true, open: false }} />);

        await flushMicrotasks();

        expect(screen.queryByText('Content')).to.equal(null);
      });

      it('should not close when the component is rendered and open is controlled', async () => {
        await render(<TestTooltip rootProps={{ defaultOpen: true, open: true }} />);

        await flushMicrotasks();

        expect(screen.getByText('Content')).not.to.equal(null);
      });

      it('should remain uncontrolled', async () => {
        await render(<TestTooltip rootProps={{ defaultOpen: true }} />);

        await flushMicrotasks();

        expect(screen.getByText('Content')).not.to.equal(null);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.mouseLeave(trigger);

        await flushMicrotasks();

        expect(screen.queryByText('Content')).to.equal(null);
      });
    });

    describe('prop: delay', () => {
      clock.withFakeTimers();

      it('should open after rest delay', async () => {
        await render(<TestTooltip triggerProps={{ delay: 100 }} />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);

        await flushMicrotasks();

        expect(screen.queryByText('Content')).to.equal(null);

        clock.tick(100);

        await flushMicrotasks();

        expect(screen.getByText('Content')).not.to.equal(null);
      });
    });

    describe('prop: closeDelay', () => {
      clock.withFakeTimers();

      it('should close after delay', async () => {
        await render(<TestTooltip triggerProps={{ closeDelay: 100 }} />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);

        clock.tick(OPEN_DELAY);

        await flushMicrotasks();

        expect(screen.getByText('Content')).not.to.equal(null);

        fireEvent.mouseLeave(trigger);

        expect(screen.getByText('Content')).not.to.equal(null);

        clock.tick(100);

        expect(screen.queryByText('Content')).to.equal(null);
      });
    });

    describe('prop: actionsRef', () => {
      it('unmounts the tooltip when the `unmount` method is called', async () => {
        const actionsRef = {
          current: {
            unmount: spy(),
            close: spy(),
          },
        };

        const { user } = await render(
          <TestTooltip
            rootProps={{
              actionsRef,
              onOpenChange: (open, details) => {
                details.preventUnmountOnClose();
              },
            }}
          />,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        await user.hover(trigger);

        await waitFor(() => {
          expect(screen.queryByTestId('positioner')).not.to.equal(null);
        });

        await user.unhover(trigger);

        await waitFor(() => {
          expect(screen.queryByTestId('positioner')).not.to.equal(null);
        });

        await act(async () => actionsRef.current.unmount());

        await waitFor(() => {
          expect(screen.queryByTestId('positioner')).to.equal(null);
        });
      });
    });

    describe.skipIf(isJSDOM)('prop: onOpenChangeComplete', () => {
      it('is called on close when there is no exit animation defined', async () => {
        const onOpenChangeComplete = spy();

        function Test() {
          const [open, setOpen] = React.useState(true);
          return (
            <div>
              <button onClick={() => setOpen(false)}>Close</button>
              <Tooltip.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
                <Tooltip.Portal>
                  <Tooltip.Positioner>
                    <Tooltip.Popup data-testid="popup" />
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          );
        }

        const { user } = await render(<Test />);

        const closeButton = screen.getByText('Close');
        await user.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByTestId('popup')).to.equal(null);
        });

        expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
        expect(onOpenChangeComplete.lastCall.args[0]).to.equal(false);
      });

      it('is called on close when the exit animation finishes', async () => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        const onOpenChangeComplete = spy();

        function Test() {
          const style = `
          @keyframes test-anim {
            to {
              opacity: 0;
            }
          }

          .animation-test-indicator[data-ending-style] {
            animation: test-anim 1ms;
          }
        `;

          const [open, setOpen] = React.useState(true);

          return (
            <div>
              {/* eslint-disable-next-line react/no-danger */}
              <style dangerouslySetInnerHTML={{ __html: style }} />
              <button onClick={() => setOpen(false)}>Close</button>
              <Tooltip.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
                <Tooltip.Portal>
                  <Tooltip.Positioner>
                    <Tooltip.Popup className="animation-test-indicator" data-testid="popup" />
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          );
        }

        const { user } = await render(<Test />);

        expect(screen.getByTestId('popup')).not.to.equal(null);

        // Wait for open animation to finish
        await waitFor(() => {
          expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
        });

        const closeButton = screen.getByText('Close');
        await user.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByTestId('popup')).to.equal(null);
        });

        expect(onOpenChangeComplete.lastCall.args[0]).to.equal(false);
      });

      it('is called on open when there is no enter animation defined', async () => {
        const onOpenChangeComplete = spy();

        function Test() {
          const [open, setOpen] = React.useState(false);
          return (
            <div>
              <button onClick={() => setOpen(true)}>Open</button>
              <Tooltip.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
                <Tooltip.Portal>
                  <Tooltip.Positioner>
                    <Tooltip.Popup data-testid="popup" />
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          );
        }

        const { user } = await render(<Test />);

        const openButton = screen.getByText('Open');
        await user.click(openButton);

        await waitFor(() => {
          expect(screen.queryByTestId('popup')).not.to.equal(null);
        });

        expect(onOpenChangeComplete.callCount).to.equal(2);
        expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
      });

      it('is called on open when the enter animation finishes', async () => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        const onOpenChangeComplete = spy();

        function Test() {
          const style = `
          @keyframes test-anim {
            from {
              opacity: 0;
            }
          }

          .animation-test-indicator[data-starting-style] {
            animation: test-anim 1ms;
          }
        `;

          const [open, setOpen] = React.useState(false);

          return (
            <div>
              {/* eslint-disable-next-line react/no-danger */}
              <style dangerouslySetInnerHTML={{ __html: style }} />
              <button onClick={() => setOpen(true)}>Open</button>
              <Tooltip.Root
                open={open}
                onOpenChange={setOpen}
                onOpenChangeComplete={onOpenChangeComplete}
              >
                <Tooltip.Portal>
                  <Tooltip.Positioner>
                    <Tooltip.Popup className="animation-test-indicator" data-testid="popup" />
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          );
        }

        const { user } = await render(<Test />);

        const openButton = screen.getByText('Open');
        await user.click(openButton);

        // Wait for open animation to finish
        await waitFor(() => {
          expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
        });

        expect(screen.queryByTestId('popup')).not.to.equal(null);
      });

      it('does not get called on mount when not open', async () => {
        const onOpenChangeComplete = spy();

        await render(
          <Tooltip.Root onOpenChangeComplete={onOpenChangeComplete}>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="popup" />
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>,
        );

        expect(onOpenChangeComplete.callCount).to.equal(0);
      });
    });

    describe.skipIf(isJSDOM)('animations', () => {
      it('toggles instant animations for adjacent tooltips only while opening', async () => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        const style = `
          .tooltip {
            transition: opacity 20ms;
          }
          .tooltip[data-starting-style],
          .tooltip[data-ending-style] {
            opacity: 0;
          }

          .tooltip[data-instant] {
            transition: none;
          }
        `;

        const { user } = await render(
          <Tooltip.Provider>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <Tooltip.Root>
              <Tooltip.Trigger data-testid="trigger-1" delay={0}>
                First
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup className="tooltip" data-testid="popup-1">
                    First tooltip
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
            <Tooltip.Root>
              <Tooltip.Trigger data-testid="trigger-2" delay={0}>
                Second
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup className="tooltip" data-testid="popup-2">
                    Second tooltip
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>,
        );

        const firstTrigger = screen.getByTestId('trigger-1');
        const secondTrigger = screen.getByTestId('trigger-2');

        await user.hover(firstTrigger);

        const firstPopup = await screen.findByTestId('popup-1');
        expect(firstPopup.dataset.instant).to.equal(undefined);

        await user.unhover(firstTrigger);
        await user.hover(secondTrigger);

        const secondPopup = await screen.findByTestId('popup-2');

        await waitFor(() => {
          expect(secondPopup.dataset.instant).to.equal('delay');
          expect(secondPopup.getAnimations().length).to.equal(0);
        });

        await user.unhover(secondTrigger);

        await waitFor(() => {
          expect(secondPopup.dataset.endingStyle).to.equal('');
          expect(secondPopup.dataset.instant).to.equal(undefined);
          expect(secondPopup.getAnimations().length).to.equal(1);
        });
      });

      it('inline opacity: 0 is removed before user CSS transitions run', async () => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        // The inline opacity: 0 applied before positioning must be removed
        // before CSS transitions start, so it does not trigger an unwanted
        // opacity transition.
        const style = `
          .tooltip {
            transition: opacity 200ms;
            opacity: 1;
          }
        `;

        const { user } = await render(
          <Tooltip.Root>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <Tooltip.Trigger data-testid="trigger" delay={0}>
              Trigger
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup className="tooltip" data-testid="popup">
                  Tooltip
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>,
        );

        await user.hover(screen.getByTestId('trigger'));

        const popup = await screen.findByTestId('popup');

        // Opacity should be 1 immediately — no unwanted fade from 0 to 1.
        // No opacity transition should be running.
        await waitFor(() => {
          expect(Number(getComputedStyle(popup).opacity)).to.equal(1);
          const opacityAnimations = popup
            .getAnimations()
            .filter((a) => (a as CSSTransition).transitionProperty === 'opacity');
          expect(opacityAnimations.length).to.equal(0);
        });
      });
    });

    describe('prop: disabled', () => {
      it('should not open when disabled', async () => {
        await render(<TestTooltip rootProps={{ disabled: true }} triggerProps={{ delay: 0 }} />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);

        await flushMicrotasks();

        expect(screen.queryByText('Content')).to.equal(null);

        await act(async () => trigger.focus());

        expect(screen.queryByText('Content')).to.equal(null);
      });

      it('should not open on focus when the trigger is disabled', async () => {
        await render(<TestTooltip triggerProps={{ disabled: true, delay: 0 }} />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        await act(async () => trigger.focus());
        await flushMicrotasks();

        expect(screen.queryByText('Content')).to.equal(null);
      });

      it('should close if open when becoming disabled', async () => {
        function App() {
          const [disabled, setDisabled] = React.useState(false);
          return (
            <div>
              <TestTooltip
                rootProps={{ defaultOpen: true, disabled }}
                triggerProps={{ delay: 0 }}
              />
              <button
                data-testid="disabled"
                onClick={() => {
                  setDisabled(true);
                }}
              />
            </div>
          );
        }

        await render(<App />);

        expect(screen.queryByText('Content')).not.to.equal(null);

        const disabledButton = screen.getByTestId('disabled');
        fireEvent.click(disabledButton);

        expect(screen.queryByText('Content')).to.equal(null);
      });

      it('does not throw error when combined with defaultOpen', async () => {
        await render(<TestTooltip rootProps={{ defaultOpen: true, disabled: true }} />);

        expect(screen.queryByText('Content')).to.equal(null);
      });
    });

    describe('prop: disableHoverablePopup', () => {
      it('applies pointer-events: none to the positioner when `disableHoverablePopup = true`', async () => {
        await render(
          <TestTooltip rootProps={{ disableHoverablePopup: true }} triggerProps={{ delay: 0 }} />,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);

        await flushMicrotasks();

        expect(screen.getByTestId('positioner').style.pointerEvents).to.equal('none');
      });

      it('does not apply pointer-events: none to the positioner when `disableHoverablePopup = false`', async () => {
        await render(
          <TestTooltip rootProps={{ disableHoverablePopup: false }} triggerProps={{ delay: 0 }} />,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);

        await flushMicrotasks();

        expect(screen.getByTestId('positioner').style.pointerEvents).to.equal('');
      });
    });

    describe('BaseUIChangeEventDetails', () => {
      it('onOpenChange cancel() prevents opening while uncontrolled', async () => {
        await render(
          <TestTooltip
            rootProps={{
              onOpenChange: (nextOpen, eventDetails) => {
                if (nextOpen) {
                  eventDetails.cancel();
                }
              },
            }}
            triggerProps={{ delay: 0 }}
          />,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);

        await flushMicrotasks();

        expect(screen.queryByText('Content')).to.equal(null);
      });

      it('allowPropagation() prevents stopPropagation on Escape while still closing', async () => {
        const stopPropagationSpy = spy(Event.prototype as any, 'stopPropagation');

        await render(
          <TestTooltip
            rootProps={{
              defaultOpen: true,
              onOpenChange: (nextOpen, eventDetails) => {
                if (!nextOpen && eventDetails.reason === REASONS.escapeKey) {
                  eventDetails.allowPropagation();
                }
              },
            }}
            triggerProps={{ delay: 0 }}
          />,
        );

        expect(screen.getByText('Content')).not.to.equal(null);

        fireEvent.keyDown(document.body, { key: 'Escape' });

        await waitFor(() => {
          expect(screen.queryByText('Content')).to.equal(null);
        });

        expect(stopPropagationSpy.called).to.equal(false);
        stopPropagationSpy.restore();
      });
    });

    describe('dismissal', () => {
      clock.withFakeTimers();

      it('should not open when the trigger was clicked before delay duration', async () => {
        await render(<TestTooltip />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);

        clock.tick(OPEN_DELAY / 2);

        fireEvent.click(trigger);

        clock.tick(OPEN_DELAY / 2);

        await flushMicrotasks();

        expect(screen.queryByText('Content')).to.equal(null);
      });

      it('should open when the trigger was clicked before delay duration and closeOnClick is false', async () => {
        await render(<TestTooltip triggerProps={{ closeOnClick: false }} />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);

        clock.tick(OPEN_DELAY / 2);

        fireEvent.click(trigger);

        clock.tick(OPEN_DELAY / 2);

        await flushMicrotasks();

        expect(screen.getByText('Content')).not.to.equal(null);
      });

      it('should close when the trigger is clicked after delay duration', async () => {
        await render(<TestTooltip />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);

        clock.tick(OPEN_DELAY);

        await flushMicrotasks();

        expect(screen.getByText('Content')).not.to.equal(null);

        fireEvent.click(trigger);

        expect(screen.queryByText('Content')).to.equal(null);
      });

      it('should not close when the trigger is clicked after delay duration and closeOnClick is false', async () => {
        await render(<TestTooltip triggerProps={{ closeOnClick: false }} />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);

        clock.tick(OPEN_DELAY);

        await flushMicrotasks();

        expect(screen.getByText('Content')).not.to.equal(null);

        fireEvent.click(trigger);

        expect(screen.getByText('Content')).not.to.equal(null);
      });
    });
  });

  it('keeps the tooltip open when moving across spaced triggers without a closeDelay', async () => {
    const testTooltip = Tooltip.createHandle();
    const { user } = await render(
      <Tooltip.Provider timeout={400}>
        <div style={{ display: 'flex', gap: 32 }}>
          <Tooltip.Trigger handle={testTooltip} delay={0}>
            Trigger 1
          </Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip} delay={0}>
            Trigger 2
          </Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip} delay={0}>
            Trigger 3
          </Tooltip.Trigger>
        </div>

        <Tooltip.Root handle={testTooltip}>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup data-testid="popup">Tooltip Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    const [trigger1, trigger2, trigger3] = screen.getAllByRole('button');

    await user.hover(trigger1);
    await waitFor(() => {
      expect(screen.getByTestId('popup')).toBeVisible();
    });

    await user.unhover(trigger1);
    await user.hover(trigger2);
    await waitFor(() => {
      expect(screen.getByTestId('popup')).toBeVisible();
    });

    fireEvent.mouseLeave(trigger2, { relatedTarget: document.body, clientX: 120, clientY: 0 });
    await user.hover(trigger3);

    await waitFor(() => {
      expect(screen.getByTestId('popup')).toBeVisible();
    });

    fireEvent.mouseMove(document.body, { clientX: 300, clientY: 0 });

    await waitFor(() => {
      expect(screen.getByTestId('popup')).toBeVisible();
    });
  });
});

type TestTooltipProps = {
  rootProps?: Tooltip.Root.Props;
  triggerProps?: Tooltip.Trigger.Props;
  portalProps?: Tooltip.Portal.Props;
  positionerProps?: Tooltip.Positioner.Props;
  popupProps?: Tooltip.Popup.Props;
  portalChildren?: React.ReactNode;
  beforeTrigger?: React.ReactNode;
  betweenTriggerAndPortal?: React.ReactNode;
  afterPortal?: React.ReactNode;
};

function ContainedTriggerTooltip(props: TestTooltipProps) {
  const {
    rootProps,
    triggerProps,
    portalProps,
    positionerProps,
    popupProps,
    beforeTrigger,
    betweenTriggerAndPortal,
    afterPortal,
  } = props;

  const { children: triggerChildren, ...restTriggerProps } = triggerProps ?? {};
  const { children: popupChildren, ...restPopupProps } = popupProps ?? {};
  const { children: portalChildren, ...restPortalProps } = portalProps ?? {};

  const triggerContent = triggerChildren ?? 'Toggle';
  const popupContent = popupChildren ?? 'Content';

  return (
    <Tooltip.Root {...rootProps}>
      {beforeTrigger}
      <Tooltip.Trigger data-testid="trigger" {...restTriggerProps}>
        {triggerContent}
      </Tooltip.Trigger>
      {betweenTriggerAndPortal}
      <Tooltip.Portal {...restPortalProps}>
        {portalChildren}
        <Tooltip.Positioner data-testid="positioner" {...positionerProps}>
          <Tooltip.Popup data-testid="popup" {...restPopupProps}>
            {popupContent}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
      {afterPortal}
    </Tooltip.Root>
  );
}

function DetachedTriggerTooltip(props: TestTooltipProps) {
  const {
    rootProps,
    triggerProps,
    portalProps,
    positionerProps,
    popupProps,
    beforeTrigger,
    betweenTriggerAndPortal,
    afterPortal,
  } = props;

  const { children: triggerChildren, ...restTriggerProps } = triggerProps ?? {};
  const { children: popupChildren, ...restPopupProps } = popupProps ?? {};
  const { children: portalChildren, ...restPortalProps } = portalProps ?? {};

  const triggerContent = triggerChildren ?? 'Toggle';
  const popupContent = popupChildren ?? 'Content';

  const tooltipHandle = useRefWithInit(() => Tooltip.createHandle()).current;

  return (
    <React.Fragment>
      {beforeTrigger}
      <Tooltip.Trigger data-testid="trigger" handle={tooltipHandle} {...restTriggerProps}>
        {triggerContent}
      </Tooltip.Trigger>
      {betweenTriggerAndPortal}
      <Tooltip.Root handle={tooltipHandle} {...rootProps}>
        <Tooltip.Portal {...restPortalProps}>
          {portalChildren}
          <Tooltip.Positioner data-testid="positioner" {...positionerProps}>
            <Tooltip.Popup data-testid="popup" {...restPopupProps}>
              {popupContent}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
        {afterPortal}
      </Tooltip.Root>
    </React.Fragment>
  );
}

function MultipleDetachedTriggersTooltip(props: TestTooltipProps) {
  const {
    rootProps,
    triggerProps,
    portalProps,
    positionerProps,
    popupProps,
    beforeTrigger,
    betweenTriggerAndPortal,
    afterPortal,
  } = props;

  const { children: triggerChildren, ...restTriggerProps } = triggerProps ?? {};
  const { children: popupChildren, ...restPopupProps } = popupProps ?? {};
  const { children: portalChildren, ...restPortalProps } = portalProps ?? {};

  const triggerContent = triggerChildren ?? 'Toggle';
  const popupContent = popupChildren ?? 'Content';

  const tooltipHandle = useRefWithInit(() => Tooltip.createHandle()).current;

  return (
    <React.Fragment>
      {beforeTrigger}
      <Tooltip.Trigger data-testid="trigger" handle={tooltipHandle} {...restTriggerProps}>
        {triggerContent}
      </Tooltip.Trigger>
      <Tooltip.Trigger data-testid="trigger-2" handle={tooltipHandle}>
        Toggle another
      </Tooltip.Trigger>
      {betweenTriggerAndPortal}
      <Tooltip.Root handle={tooltipHandle} {...rootProps}>
        <Tooltip.Portal {...restPortalProps}>
          {portalChildren}
          <Tooltip.Positioner data-testid="positioner" {...positionerProps}>
            <Tooltip.Popup data-testid="popup" {...restPopupProps}>
              {popupContent}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
        {afterPortal}
      </Tooltip.Root>
    </React.Fragment>
  );
}
