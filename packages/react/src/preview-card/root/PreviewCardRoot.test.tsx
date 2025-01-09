import * as React from 'react';
import { PreviewCard } from '@base-ui-components/react/preview-card';
import { act, fireEvent, screen, flushMicrotasks, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, isJSDOM } from '#test-utils';
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants';

function Root(props: PreviewCard.Root.Props) {
  return <PreviewCard.Root {...props} />;
}

function Trigger(props: PreviewCard.Trigger.Props) {
  return (
    <PreviewCard.Trigger href="#" {...props}>
      Link
    </PreviewCard.Trigger>
  );
}

describe('<PreviewCard.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render, clock } = createRenderer();

  describe('uncontrolled open', () => {
    clock.withFakeTimers();

    it('should open when the trigger is hovered', async () => {
      await render(
        <Root>
          <Trigger />
          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('link');

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
          <Trigger />
          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('link');

      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(OPEN_DELAY);

      await flushMicrotasks();

      fireEvent.mouseLeave(trigger);

      clock.tick(CLOSE_DELAY);

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should open when the trigger is focused', async () => {
      if (!isJSDOM) {
        // Ignore due to `:focus-visible` being required in the browser.
        return;
      }

      await render(
        <Root>
          <Trigger />
          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('link');

      await act(async () => trigger.focus());

      clock.tick(OPEN_DELAY);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when the trigger is blurred', async () => {
      await render(
        <Root>
          <Trigger />
          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('link');

      await act(async () => trigger.focus());
      clock.tick(OPEN_DELAY);
      await flushMicrotasks();

      await act(async () => trigger.blur());
      clock.tick(CLOSE_DELAY);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('controlled open', () => {
    it('should open when controlled open is true', async () => {
      await render(
        <Root open>
          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when controlled open is false', async () => {
      await render(
        <Root open={false}>
          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </Root>,
      );

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should remove the popup when there is no exit animation defined', async ({ skip }) => {
      if (isJSDOM) {
        skip();
      }

      function Test() {
        const [open, setOpen] = React.useState(true);
        const anchor = React.useRef<HTMLButtonElement>(null);

        return (
          <div>
            <button onClick={() => setOpen(false)} ref={anchor}>
              Close
            </button>
            <PreviewCard.Root open={open}>
              <PreviewCard.Portal>
                <PreviewCard.Positioner anchor={anchor}>
                  <PreviewCard.Popup>Content</PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </PreviewCard.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Content')).to.equal(null);
      });
    });

    it('should remove the popup when the animation finishes', async ({ skip }) => {
      if (isJSDOM) {
        skip();
      }

      let animationFinished = false;
      const notifyAnimationFinished = () => {
        animationFinished = true;
      };

      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

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
            animation: test-anim 50ms;
          }
        `;

        const [open, setOpen] = React.useState(true);
        const anchor = React.useRef<HTMLButtonElement>(null);

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={() => setOpen(false)} ref={anchor}>
              Close
            </button>
            <PreviewCard.Root open={open}>
              <PreviewCard.Portal keepMounted>
                <PreviewCard.Positioner data-testid="positioner" anchor={anchor}>
                  <PreviewCard.Popup
                    className="animation-test-popup"
                    onAnimationEnd={notifyAnimationFinished}
                  >
                    Content
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </PreviewCard.Root>
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

  describe('prop: onOpenChange', () => {
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
            <Trigger />
            <PreviewCard.Portal>
              <PreviewCard.Positioner>
                <PreviewCard.Popup>Content</PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </Root>
        );
      }

      await render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const trigger = screen.getByRole('link');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(OPEN_DELAY);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.mouseLeave(trigger);

      clock.tick(CLOSE_DELAY);

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
            <Trigger />
            <PreviewCard.Portal>
              <PreviewCard.Positioner>
                <PreviewCard.Popup>Content</PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </Root>
        );
      }

      await render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const trigger = screen.getByRole('link');

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
    clock.withFakeTimers();

    it('should open when the component is rendered', async () => {
      await render(
        <Root defaultOpen>
          <Trigger />
          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should not open when the component is rendered and open is controlled', async () => {
      await render(
        <Root defaultOpen open={false}>
          <Trigger />
          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </Root>,
      );

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should not close when the component is rendered and open is controlled', async () => {
      await render(
        <Root defaultOpen open>
          <Trigger />
          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should remain uncontrolled', async () => {
      await render(
        <Root defaultOpen>
          <Trigger />
          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);

      const trigger = screen.getByRole('link');

      fireEvent.mouseLeave(trigger);

      clock.tick(CLOSE_DELAY);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('prop: delay', () => {
    clock.withFakeTimers();

    it('should open after delay with rest type by default', async () => {
      await render(
        <Root delay={100}>
          <Trigger />
          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('link');

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
          <Trigger />
          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('link');

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
});
