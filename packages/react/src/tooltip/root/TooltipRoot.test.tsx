import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, isJSDOM } from '#test-utils';
import { OPEN_DELAY } from '../utils/constants';

function Root(props: Tooltip.Root.Props) {
  return <Tooltip.Root {...props} />;
}

describe('<Tooltip.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render, clock } = createRenderer();

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

    it('should open when controlled open is true', async () => {
      await render(
        <Root open>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when controlled open is false', async () => {
      await render(
        <Root open={false}>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      expect(screen.queryByText('Content')).to.equal(null);
    });

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

    it('should open after delay with rest type by default', async () => {
      await render(
        <Root delay={100}>
          <Tooltip.Trigger />
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
        <Root closeDelay={100}>
          <Tooltip.Trigger />
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

  describe('prop: action', () => {
    it('unmounts the tooltip when the `unmount` method is called', async () => {
      const actionsRef = {
        current: {
          unmount: spy(),
        },
      };

      const { user } = await render(
        <Root actionsRef={actionsRef}>
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

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('popup')).to.equal(null);
      });

      expect(onOpenChangeComplete.lastCall.args[0]).to.equal(false);
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
});
