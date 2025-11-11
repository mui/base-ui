import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import {
  act,
  fireEvent,
  flushMicrotasks,
  randomStringValue,
  screen,
  waitFor,
} from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, isJSDOM, popupConformanceTests } from '#test-utils';
import { OPEN_DELAY } from '../utils/constants';
import { REASONS } from '../../utils/reasons';

function Root(props: Tooltip.Root.Props) {
  return <Tooltip.Root {...props} />;
}

describe('<Tooltip.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  afterEach(async () => {
    await act(async () => {
      document.body.click();
    });

    // Wait for all tooltips to unmount
    await waitFor(() => {
      const tooltips = document.querySelectorAll('[data-open]');
      expect(tooltips.length).to.equal(0);
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

  describe('uncontrolled open', () => {
    clock.withFakeTimers();

    it('should open when the trigger is hovered', async () => {
      await render(
        <Root>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(OPEN_DELAY);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when the trigger is unhovered', async () => {
      await render(
        <Root>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(OPEN_DELAY);

      await flushMicrotasks();

      fireEvent.mouseLeave(trigger);

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should open when the trigger is focused', async ({ skip }) => {
      if (isJSDOM) {
        skip();
      }

      await render(
        <Root>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      await act(async () => trigger.focus());

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when the trigger is blurred', async () => {
      await render(
        <Root>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');

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
          <Root
            open={open}
            onOpenChange={(nextOpen) => {
              handleChange(open);
              setOpen(nextOpen);
            }}
          >
            <Tooltip.Trigger />
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Root>
        );
      }

      await render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const trigger = screen.getByRole('button');

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
          <Root
            open={open}
            onOpenChange={(nextOpen) => {
              handleChange(open);
              setOpen(nextOpen);
            }}
          >
            <Tooltip.Trigger />
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Root>
        );
      }

      await render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const trigger = screen.getByRole('button');

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
      await render(
        <Root defaultOpen>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should not open when the component is rendered and open is controlled', async () => {
      await render(
        <Root defaultOpen open={false}>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      await flushMicrotasks();

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should not close when the component is rendered and open is controlled', async () => {
      await render(
        <Root defaultOpen open>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should remain uncontrolled', async () => {
      await render(
        <Root defaultOpen>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      const trigger = screen.getByRole('button');

      fireEvent.mouseLeave(trigger);

      await flushMicrotasks();

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('prop: delay', () => {
    clock.withFakeTimers();

    it('should open after rest delay', async () => {
      await render(
        <Root>
          <Tooltip.Trigger delay={100} />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');

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
      await render(
        <Root>
          <Tooltip.Trigger closeDelay={100} />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');

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
        <Root
          actionsRef={actionsRef}
          onOpenChange={(open, details) => {
            details.preventUnmountOnClose();
          }}
        >
          <Tooltip.Trigger data-testid="trigger" />
          <Tooltip.Portal>
            <Tooltip.Positioner data-testid="positioner">
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByTestId('trigger');
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
              <Tooltip.Popup />
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
            transition: opacity 1ms;
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

      expect(secondPopup.dataset.instant).to.equal('delay');
      expect(secondPopup.getAnimations().length).to.equal(0);

      await user.unhover(secondTrigger);

      expect(secondPopup.dataset.endingStyle).to.equal('');
      expect(secondPopup.dataset.instant).to.equal(undefined);
      expect(secondPopup.getAnimations().length).to.equal(1);
    });
  });

  describe('prop: disabled', () => {
    it('should not open when disabled', async () => {
      await render(
        <Root disabled>
          <Tooltip.Trigger delay={0} />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      await flushMicrotasks();

      expect(screen.queryByText('Content')).to.equal(null);

      await act(async () => trigger.focus());

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should close if open when becoming disabled', async () => {
      function App() {
        const [disabled, setDisabled] = React.useState(false);
        return (
          <div>
            <Root defaultOpen disabled={disabled}>
              <Tooltip.Trigger delay={0} />
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>Content</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Root>
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
      await render(
        <Root defaultOpen disabled>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('prop: disableHoverablePopup', () => {
    it('applies pointer-events: none to the positioner when `disableHoverablePopup = true`', async () => {
      await render(
        <Root disableHoverablePopup>
          <Tooltip.Trigger delay={0} />
          <Tooltip.Portal>
            <Tooltip.Positioner data-testid="positioner">
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      await flushMicrotasks();

      expect(screen.getByTestId('positioner').style.pointerEvents).to.equal('none');
    });

    it('does not apply pointer-events: none to the positioner when `disableHoverablePopup = false`', async () => {
      await render(
        <Root disableHoverablePopup={false}>
          <Tooltip.Trigger delay={0} />
          <Tooltip.Portal>
            <Tooltip.Positioner data-testid="positioner">
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');

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
        <Root
          onOpenChange={(nextOpen, eventDetails) => {
            if (nextOpen) {
              eventDetails.cancel();
            }
          }}
        >
          <Tooltip.Trigger delay={0} />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');
      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      await flushMicrotasks();

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('allowPropagation() prevents stopPropagation on Escape while still closing', async () => {
      const stopPropagationSpy = spy(Event.prototype as any, 'stopPropagation');

      await render(
        <Root
          defaultOpen
          onOpenChange={(nextOpen, eventDetails) => {
            if (!nextOpen && eventDetails.reason === REASONS.escapeKey) {
              eventDetails.allowPropagation();
            }
          }}
        >
          <Tooltip.Trigger delay={0} />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
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

  describe.skipIf(isJSDOM)('multiple triggers within Root', () => {
    type NumberPayload = { payload: number | undefined };

    it('should open the tooltip with any trigger on hover', async () => {
      const popupId = randomStringValue();
      const { user } = await render(
        <Tooltip.Root>
          <input type="text" aria-label="Initial focus" autoFocus />
          <Tooltip.Trigger delay={0}>Trigger 1</Tooltip.Trigger>
          <Tooltip.Trigger delay={0}>Trigger 2</Tooltip.Trigger>
          <Tooltip.Trigger delay={0}>Trigger 3</Tooltip.Trigger>

          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup data-testid={popupId}>Tooltip Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });

      await user.hover(trigger1);
      expect(screen.queryByTestId(popupId)).toBeVisible();
      await user.hover(document.body);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });

      await user.hover(trigger2);
      expect(screen.queryByTestId(popupId)).toBeVisible();
      await user.hover(document.body);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });

      await user.hover(trigger3);
      expect(screen.queryByTestId(popupId)).toBeVisible();
      await user.hover(document.body);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });
    });

    it('should open the tooltip with any trigger on focus', async () => {
      await render(
        <Tooltip.Root>
          <Tooltip.Trigger>Trigger 1</Tooltip.Trigger>
          <Tooltip.Trigger>Trigger 2</Tooltip.Trigger>
          <Tooltip.Trigger>Trigger 3</Tooltip.Trigger>

          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Tooltip Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByText('Tooltip Content')).to.equal(null);

      await act(async () => trigger1.focus());
      await flushMicrotasks();
      expect(screen.getByText('Tooltip Content')).toBeVisible();
      await act(async () => trigger1.blur());
      expect(screen.queryByText('Tooltip Content')).to.equal(null);

      await act(async () => trigger2.focus());
      await flushMicrotasks();
      expect(screen.getByText('Tooltip Content')).toBeVisible();
      await act(async () => trigger2.blur());
      expect(screen.queryByText('Tooltip Content')).to.equal(null);

      await act(async () => trigger3.focus());
      await flushMicrotasks();
      expect(screen.getByText('Tooltip Content')).toBeVisible();
      await act(async () => trigger3.blur());
      expect(screen.queryByText('Tooltip Content')).to.equal(null);
    });

    it('should set the payload and render content based on its value', async () => {
      const { user } = await render(
        <Tooltip.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Tooltip.Trigger payload={1} delay={0}>
                Trigger 1
              </Tooltip.Trigger>
              <Tooltip.Trigger payload={2} delay={0}>
                Trigger 2
              </Tooltip.Trigger>

              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>
                    <span data-testid="content">{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </React.Fragment>
          )}
        </Tooltip.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.hover(trigger1);
      expect(screen.getByTestId('content').textContent).to.equal('1');

      await user.unhover(trigger1);
      await user.hover(trigger2);
      expect(screen.getByTestId('content').textContent).to.equal('2');
    });

    it('should reuse the popup and positioner DOM nodes when switching triggers', async () => {
      await render(
        <Tooltip.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Tooltip.Trigger payload={1} delay={0}>
                Trigger 1
              </Tooltip.Trigger>
              <Tooltip.Trigger payload={2} delay={0}>
                Trigger 2
              </Tooltip.Trigger>

              <Tooltip.Portal>
                <Tooltip.Positioner data-testid="positioner" key="pos">
                  <Tooltip.Popup data-testid="popup" key="pop">
                    <span>{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </React.Fragment>
          )}
        </Tooltip.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await act(async () => trigger1.focus());
      const popupElement = screen.getByTestId('popup');
      const positionerElement = screen.getByTestId('positioner');

      await act(async () => trigger2.focus());
      expect(screen.getByTestId('positioner')).to.equal(positionerElement);
      expect(screen.getByTestId('popup')).to.equal(popupElement);
    });

    it('should allow controlling the tooltip state programmatically', async () => {
      function Test() {
        const [open, setOpen] = React.useState(false);
        const [activeTrigger, setActiveTrigger] = React.useState<string | null>(null);

        return (
          <div>
            <Tooltip.Root
              open={open}
              triggerId={activeTrigger}
              onOpenChange={(nextOpen, details) => {
                setActiveTrigger(details.trigger?.id ?? null);
                setOpen(nextOpen);
              }}
            >
              {({ payload }: NumberPayload) => (
                <React.Fragment>
                  <Tooltip.Trigger payload={1} id="trigger-1" delay={0}>
                    Trigger 1
                  </Tooltip.Trigger>
                  <Tooltip.Trigger payload={2} id="trigger-2" delay={0}>
                    Trigger 2
                  </Tooltip.Trigger>

                  <Tooltip.Portal>
                    <Tooltip.Positioner>
                      <Tooltip.Popup>
                        <span data-testid="content">{payload as number}</span>
                      </Tooltip.Popup>
                    </Tooltip.Positioner>
                  </Tooltip.Portal>
                </React.Fragment>
              )}
            </Tooltip.Root>
            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-1');
              }}
            >
              Open Trigger 1
            </button>
            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-2');
              }}
            >
              Open Trigger 2
            </button>
            <button onClick={() => setOpen(false)}>Close</button>
          </div>
        );
      }

      const { user } = await render(<Test />);
      await user.click(screen.getByRole('button', { name: 'Open Trigger 1' }));
      expect(screen.getByTestId('content').textContent).to.equal('1');
      await user.click(screen.getByRole('button', { name: 'Open Trigger 2' }));
      expect(screen.getByTestId('content').textContent).to.equal('2');
      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByTestId('content')).to.equal(null);
    });

    it('allows setting an initially open tooltip', async () => {
      const testTooltip = Tooltip.createHandle<number>();
      const triggerId = randomStringValue();
      await render(
        <Tooltip.Root handle={testTooltip} defaultOpen defaultTriggerId={triggerId}>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Tooltip.Trigger handle={testTooltip} payload={1}>
                Trigger 1
              </Tooltip.Trigger>
              <Tooltip.Trigger handle={testTooltip} payload={2} id={triggerId}>
                Trigger 2
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup data-testid="popup">
                    <span>{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </React.Fragment>
          )}
        </Tooltip.Root>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('popup').textContent).to.equal('2');
      });
    });
  });

  describe.skipIf(isJSDOM)('multiple detached triggers', () => {
    type NumberPayload = { payload: number | undefined };

    it('should open the tooltip with any trigger on hover', async () => {
      const testTooltip = Tooltip.createHandle();
      const popupId = randomStringValue();
      const { user } = await render(
        <div>
          <button type="button" aria-label="Initial focus" autoFocus />
          <Tooltip.Trigger handle={testTooltip} delay={0}>
            Trigger 1
          </Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip} delay={0}>
            Trigger 2
          </Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip} delay={0}>
            Trigger 3
          </Tooltip.Trigger>

          <Tooltip.Root handle={testTooltip}>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid={popupId}>Tooltip Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });

      await user.hover(trigger1);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).toBeVisible();
      });
      await user.unhover(trigger1);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });

      await user.hover(trigger2);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).toBeVisible();
      });
      await user.unhover(trigger2);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });

      await user.hover(trigger3);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).toBeVisible();
      });
      await user.unhover(trigger3);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });
    });

    it('should open the tooltip with any trigger on focus', async () => {
      const testTooltip = Tooltip.createHandle();
      await render(
        <div>
          <Tooltip.Trigger handle={testTooltip}>Trigger 1</Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip}>Trigger 2</Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip}>Trigger 3</Tooltip.Trigger>

          <Tooltip.Root handle={testTooltip}>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Tooltip Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByText('Tooltip Content')).to.equal(null);

      await act(async () => trigger1.focus());
      await flushMicrotasks();
      expect(screen.getByText('Tooltip Content')).toBeVisible();
      await act(async () => trigger1.blur());
      expect(screen.queryByText('Tooltip Content')).to.equal(null);

      await act(async () => trigger2.focus());
      await flushMicrotasks();
      expect(screen.getByText('Tooltip Content')).toBeVisible();
      await act(async () => trigger2.blur());
      expect(screen.queryByText('Tooltip Content')).to.equal(null);

      await act(async () => trigger3.focus());
      await flushMicrotasks();
      expect(screen.getByText('Tooltip Content')).toBeVisible();
      await act(async () => trigger3.blur());
      expect(screen.queryByText('Tooltip Content')).to.equal(null);
    });

    it('should set the payload and render content based on its value', async () => {
      const testTooltip = Tooltip.createHandle<number>();
      const { user } = await render(
        <div>
          <Tooltip.Trigger handle={testTooltip} payload={1} delay={0}>
            Trigger 1
          </Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip} payload={2} delay={0}>
            Trigger 2
          </Tooltip.Trigger>

          <Tooltip.Root handle={testTooltip}>
            {({ payload }: NumberPayload) => (
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>
                    <span data-testid="content">{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.hover(trigger1);
      expect(screen.getByTestId('content').textContent).to.equal('1');

      await user.unhover(trigger1);
      await user.hover(trigger2);
      expect(screen.getByTestId('content').textContent).to.equal('2');
    });

    it('should reuse the popup and positioner DOM nodes when switching triggers', async () => {
      const testTooltip = Tooltip.createHandle<number>();
      await render(
        <React.Fragment>
          <Tooltip.Trigger handle={testTooltip} payload={1} delay={0}>
            Trigger 1
          </Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip} payload={2} delay={0}>
            Trigger 2
          </Tooltip.Trigger>

          <Tooltip.Root handle={testTooltip}>
            {({ payload }: NumberPayload) => (
              <Tooltip.Portal>
                <Tooltip.Positioner data-testid="positioner">
                  <Tooltip.Popup data-testid="popup">
                    <span>{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </React.Fragment>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await act(async () => trigger1.focus());
      const popupElement = screen.getByTestId('popup');
      const positionerElement = screen.getByTestId('positioner');

      await act(async () => trigger2.focus());
      expect(screen.getByTestId('popup')).to.equal(popupElement);
      expect(screen.getByTestId('positioner')).to.equal(positionerElement);
    });

    it('should allow controlling the tooltip state programmatically', async () => {
      const testTooltip = Tooltip.createHandle<number>();
      function Test() {
        const [open, setOpen] = React.useState(false);
        const [activeTrigger, setActiveTrigger] = React.useState<string | null>(null);

        return (
          <div style={{ margin: 50 }}>
            <Tooltip.Trigger handle={testTooltip} payload={1} id="trigger-1" delay={0}>
              Trigger 1
            </Tooltip.Trigger>
            <Tooltip.Trigger handle={testTooltip} payload={2} id="trigger-2" delay={0}>
              Trigger 2
            </Tooltip.Trigger>

            <Tooltip.Root
              open={open}
              onOpenChange={(nextOpen, details) => {
                setActiveTrigger(details.trigger?.id ?? null);
                setOpen(nextOpen);
              }}
              triggerId={activeTrigger}
              handle={testTooltip}
            >
              {({ payload }: NumberPayload) => (
                <Tooltip.Portal>
                  <Tooltip.Positioner data-testid="positioner" side="bottom" align="start">
                    <Tooltip.Popup>
                      <span data-testid="content">{payload}</span>
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>

            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-1');
              }}
            >
              Open Trigger 1
            </button>
            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-2');
              }}
            >
              Open Trigger 2
            </button>
            <button onClick={() => setOpen(false)}>Close</button>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(screen.getByRole('button', { name: 'Open Trigger 1' }));
      expect(screen.getByTestId('content').textContent).to.equal('1');

      await waitFor(() => {
        expect(screen.getByTestId('positioner').getBoundingClientRect().left).to.be.approximately(
          trigger1.getBoundingClientRect().left,
          1,
        );
      });

      await user.click(screen.getByRole('button', { name: 'Open Trigger 2' }));
      expect(screen.getByTestId('content').textContent).to.equal('2');
      await waitFor(() => {
        expect(screen.getByTestId('positioner').getBoundingClientRect().left).to.be.approximately(
          trigger2.getBoundingClientRect().left,
          1,
        );
      });

      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByTestId('content')).to.equal(null);
    });

    it('allows setting an initially open tooltip', async () => {
      const testTooltip = Tooltip.createHandle<number>();
      const triggerId = randomStringValue();
      await render(
        <React.Fragment>
          <button type="button" aria-label="Initial focus" autoFocus />
          <Tooltip.Trigger handle={testTooltip} payload={1}>
            Trigger 1
          </Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip} payload={2} id={triggerId}>
            Trigger 2
          </Tooltip.Trigger>

          <Tooltip.Root handle={testTooltip} defaultOpen defaultTriggerId={triggerId}>
            {({ payload }: NumberPayload) => (
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup data-testid="popup">
                    <span>{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </React.Fragment>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('popup').textContent).to.equal('2');
      });
    });
  });

  describe.skipIf(isJSDOM)('imperative actions on the handle', () => {
    it('opens and closes the tooltip', async () => {
      const tooltip = Tooltip.createHandle();
      await render(
        <div>
          <Tooltip.Trigger handle={tooltip} id="trigger">
            Trigger
          </Tooltip.Trigger>
          <Tooltip.Root handle={tooltip}>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="content">Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'Trigger' });
      expect(screen.queryByTestId('content')).to.equal(null);

      await act(() => tooltip.open('trigger'));
      await waitFor(() => {
        expect(screen.queryByTestId('content')).not.to.equal(null);
      });

      expect(screen.getByTestId('content').textContent).to.equal('Content');
      expect(trigger).to.have.attribute('data-popup-open');

      await act(() => tooltip.close());
      await waitFor(() => {
        expect(screen.queryByTestId('content')).to.equal(null);
      });

      expect(trigger).not.to.have.attribute('data-popup-open');
    });

    it('sets the payload associated with the trigger', async () => {
      const tooltip = Tooltip.createHandle<number>();
      await render(
        <div>
          <Tooltip.Trigger handle={tooltip} id="trigger1" payload={1}>
            Trigger 1
          </Tooltip.Trigger>
          <Tooltip.Trigger handle={tooltip} id="trigger2" payload={2}>
            Trigger 2
          </Tooltip.Trigger>
          <Tooltip.Root handle={tooltip}>
            {({ payload }: { payload: number | undefined }) => (
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup data-testid="content">{payload}</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      expect(screen.queryByTestId('content')).to.equal(null);

      await act(() => tooltip.open('trigger2'));
      await waitFor(() => {
        expect(screen.queryByTestId('content')).not.to.equal(null);
      });

      expect(screen.getByTestId('content').textContent).to.equal('2');
      expect(trigger2).to.have.attribute('data-popup-open');
      expect(trigger1).not.to.have.attribute('data-popup-open');

      await act(() => tooltip.close());
      await waitFor(() => {
        expect(screen.queryByTestId('content')).to.equal(null);
      });

      expect(trigger2).not.to.have.attribute('data-popup-open');
    });
  });
});
