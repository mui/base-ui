import * as React from 'react';
import { PreviewCard } from '@base-ui/react/preview-card';
import { act, fireEvent, screen, flushMicrotasks, waitFor } from '@mui/internal-test-utils';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, isJSDOM, popupConformanceTests } from '#test-utils';
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants';

describe('<PreviewCard.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render, clock } = createRenderer();

  popupConformanceTests({
    createComponent: (props) => (
      <PreviewCard.Root {...props.root}>
        <PreviewCard.Trigger href="#" {...props.trigger}>
          Link
        </PreviewCard.Trigger>
        <PreviewCard.Portal {...props.portal}>
          <PreviewCard.Positioner>
            <PreviewCard.Popup {...props.popup}>Content</PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>
    ),
    render,
    triggerMouseAction: 'hover',
  });

  describe.for([
    { name: 'contained triggers', Component: ContainedTriggerPreviewCard },
    { name: 'detached triggers', Component: DetachedTriggerPreviewCard },
    { name: 'multiple detached triggers', Component: MultipleDetachedTriggersPreviewCard },
  ])('when using $name', ({ Component: TestPreviewCard }) => {
    describe('uncontrolled open', () => {
      clock.withFakeTimers();

      it('should open when the trigger is hovered', async () => {
        await render(<TestPreviewCard />);

        const trigger = screen.getByRole('link', { name: 'Link' });

        fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);

        clock.tick(OPEN_DELAY);

        await flushMicrotasks();

        expect(screen.getByText('Content')).not.to.equal(null);
      });

      it('should close when the trigger is unhovered', async () => {
        await render(<TestPreviewCard />);

        const trigger = screen.getByRole('link', { name: 'Link' });

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

        await render(<TestPreviewCard />);

        const trigger = screen.getByRole('link', { name: 'Link' });

        await act(async () => trigger.focus());

        clock.tick(OPEN_DELAY);

        await flushMicrotasks();

        expect(screen.getByText('Content')).not.to.equal(null);
      });

      it('should close when the trigger is blurred', async () => {
        await render(<TestPreviewCard />);

        const trigger = screen.getByRole('link', { name: 'Link' });

        await act(async () => trigger.focus());
        clock.tick(OPEN_DELAY);
        await flushMicrotasks();

        await act(async () => trigger.blur());
        clock.tick(CLOSE_DELAY);

        expect(screen.queryByText('Content')).to.equal(null);
      });
    });

    describe('prop: onOpenChange', () => {
      clock.withFakeTimers();

      it('should call onOpenChange when the open state changes', async () => {
        const handleChange = spy();

        function App() {
          const [open, setOpen] = React.useState(false);

          return (
            <TestPreviewCard
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

        const trigger = screen.getByRole('link', { name: 'Link' });

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
            <TestPreviewCard
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

        const trigger = screen.getByRole('link', { name: 'Link' });

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
          <TestPreviewCard
            rootProps={{
              defaultOpen: true,
            }}
          />,
        );

        expect(screen.getByText('Content')).not.to.equal(null);
      });

      it('should not open when the component is rendered and open is controlled', async () => {
        await render(
          <TestPreviewCard
            rootProps={{
              defaultOpen: true,
              open: false,
            }}
          />,
        );

        expect(screen.queryByText('Content')).to.equal(null);
      });

      it('should not close when the component is rendered and open is controlled', async () => {
        await render(
          <TestPreviewCard
            rootProps={{
              defaultOpen: true,
              open: true,
            }}
          />,
        );

        expect(screen.getByText('Content')).not.to.equal(null);
      });

      it('should remain uncontrolled', async () => {
        await render(
          <TestPreviewCard
            rootProps={{
              defaultOpen: true,
            }}
          />,
        );

        expect(screen.getByText('Content')).not.to.equal(null);

        const trigger = screen.getByRole('link', { name: 'Link' });

        fireEvent.mouseLeave(trigger);

        clock.tick(CLOSE_DELAY);

        expect(screen.queryByText('Content')).to.equal(null);
      });
    });

    describe('prop: delay', () => {
      clock.withFakeTimers();

      it('should open after delay with rest type by default', async () => {
        await render(<TestPreviewCard triggerProps={{ delay: 100 }} />);

        const trigger = screen.getByRole('link', { name: 'Link' });

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
        await render(<TestPreviewCard triggerProps={{ closeDelay: 100 }} />);

        const trigger = screen.getByRole('link', { name: 'Link' });

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

    describe('BaseUIChangeEventDetails', () => {
      it('onOpenChange cancel() prevents opening while uncontrolled', async () => {
        await render(
          <TestPreviewCard
            rootProps={{
              onOpenChange: (nextOpen, eventDetails) => {
                if (nextOpen) {
                  eventDetails.cancel();
                }
              },
            }}
          />,
        );

        const trigger = screen.getByRole('link', { name: 'Link' });
        fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);
        await flushMicrotasks();

        expect(screen.queryByText('Content')).to.equal(null);
      });
    });

    describe.skipIf(!isJSDOM)('prop: actionsRef', () => {
      it('unmounts the preview card when the `unmount` method is called', async () => {
        const actionsRef = {
          current: {
            unmount: spy(),
            close: spy(),
          },
        };

        const { user } = await render(
          <TestPreviewCard
            rootProps={{
              actionsRef,
              onOpenChange: (open, details) => {
                details.preventUnmountOnClose();
              },
            }}
            triggerProps={{
              delay: 0,
              closeDelay: 0,
            }}
          />,
        );

        const trigger = screen.getByRole('link', { name: 'Link' });
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
              <TestPreviewCard
                rootProps={{
                  open,
                  onOpenChangeComplete,
                }}
              />
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
              <TestPreviewCard
                rootProps={{
                  open,
                  onOpenChangeComplete,
                }}
                popupProps={{
                  className: 'animation-test-indicator',
                }}
              />
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
              <TestPreviewCard
                rootProps={{
                  open,
                  onOpenChangeComplete,
                }}
              />
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
              <TestPreviewCard
                rootProps={{
                  open,
                  onOpenChangeComplete,
                }}
                popupProps={{
                  className: 'animation-test-indicator',
                }}
              />
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
              <TestPreviewCard
                rootProps={{
                  open,
                  onOpenChangeComplete,
                }}
              />
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
              <TestPreviewCard
                rootProps={{
                  open,
                  onOpenChangeComplete,
                }}
                popupProps={{
                  className: 'animation-test-indicator',
                }}
              />
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
          <TestPreviewCard
            rootProps={{
              onOpenChangeComplete,
            }}
          />,
        );

        expect(onOpenChangeComplete.callCount).to.equal(0);
      });
    });
  });
});

type TestPreviewCardProps = {
  rootProps?: PreviewCard.Root.Props;
  triggerProps?: PreviewCard.Trigger.Props;
  portalProps?: PreviewCard.Portal.Props;
  positionerProps?: PreviewCard.Positioner.Props;
  popupProps?: PreviewCard.Popup.Props;
};

function ContainedTriggerPreviewCard(props: TestPreviewCardProps) {
  const { rootProps, triggerProps, portalProps, positionerProps, popupProps } = props;

  const { children: triggerChildren, ...restTriggerProps } = triggerProps ?? {};
  const { children: popupChildren, ...restPopupProps } = popupProps ?? {};
  const { children: portalChildren, ...restPortalProps } = portalProps ?? {};

  const triggerContent = triggerChildren ?? 'Link';
  const popupContent = popupChildren ?? 'Content';

  return (
    <PreviewCard.Root {...rootProps}>
      <PreviewCard.Trigger href="#" data-testid="trigger" {...restTriggerProps}>
        {triggerContent}
      </PreviewCard.Trigger>
      <PreviewCard.Portal {...restPortalProps}>
        {portalChildren}
        <PreviewCard.Positioner data-testid="positioner" {...positionerProps}>
          <PreviewCard.Popup data-testid="popup" {...restPopupProps}>
            {popupContent}
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}

function DetachedTriggerPreviewCard(props: TestPreviewCardProps) {
  const { rootProps, triggerProps, portalProps, positionerProps, popupProps } = props;

  const { children: triggerChildren, ...restTriggerProps } = triggerProps ?? {};
  const { children: popupChildren, ...restPopupProps } = popupProps ?? {};
  const { children: portalChildren, ...restPortalProps } = portalProps ?? {};

  const triggerContent = triggerChildren ?? 'Link';
  const popupContent = popupChildren ?? 'Content';

  const previewCardHandle = useRefWithInit(() => PreviewCard.createHandle()).current;

  return (
    <React.Fragment>
      <PreviewCard.Trigger
        href="#"
        data-testid="trigger"
        {...restTriggerProps}
        handle={previewCardHandle}
      >
        {triggerContent}
      </PreviewCard.Trigger>
      <PreviewCard.Root {...rootProps} handle={previewCardHandle}>
        <PreviewCard.Portal {...restPortalProps}>
          {portalChildren}
          <PreviewCard.Positioner data-testid="positioner" {...positionerProps}>
            <PreviewCard.Popup data-testid="popup" {...restPopupProps}>
              {popupContent}
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>
    </React.Fragment>
  );
}

function MultipleDetachedTriggersPreviewCard(props: TestPreviewCardProps) {
  const { rootProps, triggerProps, portalProps, positionerProps, popupProps } = props;

  const { children: triggerChildren, ...restTriggerProps } = triggerProps ?? {};
  const { children: popupChildren, ...restPopupProps } = popupProps ?? {};
  const { children: portalChildren, ...restPortalProps } = portalProps ?? {};

  const triggerContent = triggerChildren ?? 'Link';
  const popupContent = popupChildren ?? 'Content';

  const previewCardHandle = useRefWithInit(() => PreviewCard.createHandle()).current;

  return (
    <React.Fragment>
      <PreviewCard.Trigger
        href="#"
        data-testid="trigger"
        {...restTriggerProps}
        handle={previewCardHandle}
      >
        {triggerContent}
      </PreviewCard.Trigger>
      <PreviewCard.Trigger href="#" data-testid="trigger-2" handle={previewCardHandle}>
        Another link
      </PreviewCard.Trigger>

      <PreviewCard.Root {...rootProps} handle={previewCardHandle}>
        <PreviewCard.Portal {...restPortalProps}>
          {portalChildren}
          <PreviewCard.Positioner data-testid="positioner" {...positionerProps}>
            <PreviewCard.Popup data-testid="popup" {...restPopupProps}>
              {popupContent}
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>
    </React.Fragment>
  );
}
