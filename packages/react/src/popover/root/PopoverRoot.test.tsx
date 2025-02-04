import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, isJSDOM } from '#test-utils';
import { OPEN_DELAY } from '../utils/constants';

function Root(props: Popover.Root.Props) {
  return <Popover.Root {...props} />;
}

describe('<Popover.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render, clock } = createRenderer();

  it('should render the children', async () => {
    await render(
      <Root>
        <Popover.Trigger>Content</Popover.Trigger>
      </Root>,
    );

    expect(screen.getByText('Content')).not.to.equal(null);
  });

  describe('uncontrolled open', () => {
    it('should open when the anchor is clicked', async () => {
      await render(
        <Root>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when the anchor is clicked twice', async () => {
      await render(
        <Root>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.click(anchor);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('controlled open', () => {
    it('should open when controlled open is true', async () => {
      await render(
        <Root open>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when controlled open is false', async () => {
      await render(
        <Root open={false}>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>,
      );

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should call onChange when the open state changes', async () => {
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
            <Popover.Trigger />
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Root>
        );
      }

      await render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.click(anchor);

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
            <Popover.Trigger />
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Root>
        );
      }

      await render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
      expect(handleChange.callCount).to.equal(1);
      expect(handleChange.firstCall.args[0]).to.equal(false);
    });

    it('should remove the popup when there is no exit animation defined', async ({ skip }) => {
      if (isJSDOM) {
        skip();
      }

      function Test() {
        const [open, setOpen] = React.useState(true);

        return (
          <div>
            <button onClick={() => setOpen(false)}>Close</button>
            <Popover.Root open={open}>
              <Popover.Portal keepMounted>
                <Popover.Positioner>
                  <Popover.Popup />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const closeButton = screen.getByText('Close');

      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });
    });

    it('should remove the popup when the animation finishes', async ({ skip }) => {
      if (isJSDOM) {
        skip();
      }

      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      let animationFinished = false;
      const notifyAnimationFinished = () => {
        animationFinished = true;
      };

      function Test() {
        const style = `
          @keyframes test-anim {
            to {
              opacity: 0;
            }
          }

          .animation-test-popup[data-open] {
            opacity: 1;
          }

          .animation-test-popup[data-ending-style] {
            animation: test-anim 1ms;
          }
        `;

        const [open, setOpen] = React.useState(true);

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={() => setOpen(false)}>Close</button>
            <Popover.Root open={open}>
              <Popover.Portal keepMounted>
                <Popover.Positioner data-testid="positioner">
                  <Popover.Popup
                    className="animation-test-popup"
                    onAnimationEnd={notifyAnimationFinished}
                  />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.getByTestId('positioner')).to.have.attribute('hidden');
      });

      expect(animationFinished).to.equal(true);
    });
  });

  describe('prop: defaultOpen', () => {
    it('should open when the component is rendered', async () => {
      await render(
        <Root defaultOpen>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should not open when the component is rendered and open is controlled', async () => {
      await render(
        <Root defaultOpen open={false}>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>,
      );

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should not close when the component is rendered and open is controlled', async () => {
      await render(
        <Root defaultOpen open>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should remain uncontrolled', async () => {
      await render(
        <Root defaultOpen>
          <Popover.Trigger data-testid="trigger" />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);

      const anchor = screen.getByTestId('trigger');

      fireEvent.click(anchor);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('prop: delay', () => {
    clock.withFakeTimers();

    it('should open after delay with rest type by default', async () => {
      await render(
        <Root openOnHover delay={100}>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

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
        <Root openOnHover closeDelay={100}>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

      clock.tick(OPEN_DELAY);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.mouseLeave(anchor);

      clock.tick(50);

      expect(screen.getByText('Content')).not.to.equal(null);

      clock.tick(50);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('focus management', () => {
    it('focuses the trigger after the popover is closed but not unmounted', async () => {
      const { user } = await render(
        <div>
          <input type="text" />
          <Popover.Root>
            <Popover.Trigger>Toggle</Popover.Trigger>
            <Popover.Portal keepMounted>
              <Popover.Positioner>
                <Popover.Popup>
                  <Popover.Close>Close</Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <input type="text" />
        </div>,
      );

      const toggle = screen.getByRole('button', { name: 'Toggle' });

      await user.click(toggle);
      await flushMicrotasks();

      const close = screen.getByRole('button', { name: 'Close' });

      await user.click(close);

      await waitFor(
        () => {
          expect(toggle).toHaveFocus();
        },
        { timeout: 1500 },
      );
    });

    it('does not move focus to the popover when opened with hover', async () => {
      const { user } = await render(
        <Popover.Root openOnHover delay={0}>
          <Popover.Trigger>Toggle</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Close>Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const toggle = screen.getByRole('button', { name: 'Toggle' });

      act(() => toggle.focus());

      await user.hover(toggle);
      await flushMicrotasks();

      const close = screen.getByRole('button', { name: 'Close' });

      expect(close).not.to.equal(null);
      expect(close).not.to.toHaveFocus();
    });

    it('does not change focus when opened with hover and closed', async () => {
      const style = `
        .popup {
          width: 100px;
          height: 100px;
          background-color: red;
          opacity: 1;
          transition: opacity 1ms;
        }

        .popup[data-exiting] {
          opacity: 0;
        }
      `;

      const { user } = await render(
        <div>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <input type="text" data-testid="first-input" />
          <Popover.Root openOnHover delay={0} closeDelay={0}>
            <Popover.Trigger>Toggle</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup className="popup" />
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <input type="text" data-testid="last-input" />
        </div>,
      );

      const toggle = screen.getByRole('button', { name: 'Toggle' });
      const firstInput = screen.getByTestId('first-input');
      const lastInput = screen.getByTestId('last-input');

      await act(async () => lastInput.focus());

      await user.hover(toggle);
      await flushMicrotasks();

      await user.hover(firstInput);
      await flushMicrotasks();

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });

      expect(lastInput).toHaveFocus();
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
            <Popover.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
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
            <Popover.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup className="animation-test-indicator" data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
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
            <Popover.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
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
            <Popover.Root
              open={open}
              onOpenChange={setOpen}
              onOpenChangeComplete={onOpenChangeComplete}
            >
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup className="animation-test-indicator" data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
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
        <Popover.Root onOpenChangeComplete={onOpenChangeComplete}>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup />
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(onOpenChangeComplete.callCount).to.equal(0);
    });
  });
});
