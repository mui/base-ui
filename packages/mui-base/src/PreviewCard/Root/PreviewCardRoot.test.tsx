import * as React from 'react';
import * as PreviewCard from '@base_ui/react/PreviewCard';
import { act, createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants';

const waitForPosition = async () => act(async () => {});

function Root(props: PreviewCard.RootProps) {
  return <PreviewCard.Root animated={false} {...props} />;
}

function Trigger(props: PreviewCard.TriggerProps) {
  return <PreviewCard.Trigger href="#" {...props} />;
}

describe('<PreviewCard.Root />', () => {
  const { render, clock } = createRenderer();

  describe('uncontrolled open', () => {
    clock.withFakeTimers();

    it('should open when the trigger is hovered', async () => {
      render(
        <Root>
          <Trigger />
          <PreviewCard.Positioner>
            <PreviewCard.Popup>Content</PreviewCard.Popup>
          </PreviewCard.Positioner>
        </Root>,
      );

      const trigger = screen.getByRole('link');

      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(OPEN_DELAY);

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when the trigger is unhovered', async () => {
      render(
        <Root>
          <Trigger />
          <PreviewCard.Positioner>
            <PreviewCard.Popup>Content</PreviewCard.Popup>
          </PreviewCard.Positioner>
        </Root>,
      );

      const trigger = screen.getByRole('link');

      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(OPEN_DELAY);

      await waitForPosition();

      fireEvent.mouseLeave(trigger);

      clock.tick(CLOSE_DELAY);

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should open when the trigger is focused', async () => {
      if (!/jsdom/.test(window.navigator.userAgent)) {
        // Ignore due to `:focus-visible` being required in the browser.
        return;
      }

      render(
        <Root>
          <Trigger />
          <PreviewCard.Positioner>
            <PreviewCard.Popup>Content</PreviewCard.Popup>
          </PreviewCard.Positioner>
        </Root>,
      );

      const trigger = screen.getByRole('link');

      act(() => trigger.focus());

      clock.tick(OPEN_DELAY);

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when the trigger is blurred', async () => {
      render(
        <Root>
          <Trigger />
          <PreviewCard.Positioner>
            <PreviewCard.Popup>Content</PreviewCard.Popup>
          </PreviewCard.Positioner>
        </Root>,
      );

      const trigger = screen.getByRole('link');

      act(() => trigger.focus());

      clock.tick(OPEN_DELAY);

      await waitForPosition();

      act(() => trigger.blur());

      clock.tick(OPEN_DELAY);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  // describe('controlled open', () => {
  //   clock.withFakeTimers();

  //   it('should open when controlled open is true', async () => {
  //     render(
  //       <Root open>
  //         <PreviewCard.Positioner>
  //           <PreviewCard.Popup>Content</PreviewCard.Popup>
  //         </PreviewCard.Positioner>
  //       </Root>,
  //     );

  //     expect(screen.getByText('Content')).not.to.equal(null);
  //   });

  //   it('should close when controlled open is false', async () => {
  //     render(
  //       <Root open={false}>
  //         <PreviewCard.Positioner>
  //           <PreviewCard.Popup>Content</PreviewCard.Popup>
  //         </PreviewCard.Positioner>
  //       </Root>,
  //     );

  //     expect(screen.queryByText('Content')).to.equal(null);
  //   });

  //   it('should call onOpenChange when the open state changes', async () => {
  //     const handleChange = spy();

  //     function App() {
  //       const [open, setOpen] = React.useState(false);

  //       return (
  //         <Root
  //           open={open}
  //           onOpenChange={(nextOpen) => {
  //             handleChange(open);
  //             setOpen(nextOpen);
  //           }}
  //         >
  //           <Trigger />
  //           <PreviewCard.Positioner>
  //             <PreviewCard.Popup>Content</PreviewCard.Popup>
  //           </PreviewCard.Positioner>
  //         </Root>
  //       );
  //     }

  //     render(<App />);

  //     expect(screen.queryByText('Content')).to.equal(null);

  //     const trigger = screen.getByRole('link');

  //     fireEvent.mouseEnter(trigger);
  //     fireEvent.mouseMove(trigger);

  //     clock.tick(OPEN_DELAY);

  //     await waitForPosition();

  //     expect(screen.getByText('Content')).not.to.equal(null);

  //     fireEvent.mouseLeave(trigger);

  //     clock.tick(CLOSE_DELAY);

  //     expect(screen.queryByText('Content')).to.equal(null);
  //     expect(handleChange.callCount).to.equal(2);
  //     expect(handleChange.firstCall.args[0]).to.equal(false);
  //     expect(handleChange.secondCall.args[0]).to.equal(true);
  //   });

  //   it('should not call onChange when the open state does not change', async () => {
  //     const handleChange = spy();

  //     function App() {
  //       const [open, setOpen] = React.useState(false);

  //       return (
  //         <Root
  //           open={open}
  //           onOpenChange={(nextOpen) => {
  //             handleChange(open);
  //             setOpen(nextOpen);
  //           }}
  //         >
  //           <Trigger />
  //           <PreviewCard.Positioner>
  //             <PreviewCard.Popup>Content</PreviewCard.Popup>
  //           </PreviewCard.Positioner>
  //         </Root>
  //       );
  //     }

  //     render(<App />);

  //     expect(screen.queryByText('Content')).to.equal(null);

  //     const trigger = screen.getByRole('link');

  //     fireEvent.mouseEnter(trigger);
  //     fireEvent.mouseMove(trigger);

  //     clock.tick(OPEN_DELAY);

  //     await waitForPosition();

  //     expect(screen.getByText('Content')).not.to.equal(null);
  //     expect(handleChange.callCount).to.equal(1);
  //     expect(handleChange.firstCall.args[0]).to.equal(false);
  //   });
  // });

  // describe('prop: defaultOpen', () => {
  //   clock.withFakeTimers();

  //   it('should open when the component is rendered', async () => {
  //     render(
  //       <Root defaultOpen>
  //         <Trigger />
  //         <PreviewCard.Positioner>
  //           <PreviewCard.Popup>Content</PreviewCard.Popup>
  //         </PreviewCard.Positioner>
  //       </Root>,
  //     );

  //     await waitForPosition();

  //     expect(screen.getByText('Content')).not.to.equal(null);
  //   });

  //   it('should not open when the component is rendered and open is controlled', async () => {
  //     render(
  //       <Root defaultOpen open={false}>
  //         <Trigger />
  //         <PreviewCard.Positioner>
  //           <PreviewCard.Popup>Content</PreviewCard.Popup>
  //         </PreviewCard.Positioner>
  //       </Root>,
  //     );

  //     await waitForPosition();

  //     expect(screen.queryByText('Content')).to.equal(null);
  //   });

  //   it('should not close when the component is rendered and open is controlled', async () => {
  //     render(
  //       <Root defaultOpen open>
  //         <Trigger />
  //         <PreviewCard.Positioner>
  //           <PreviewCard.Popup>Content</PreviewCard.Popup>
  //         </PreviewCard.Positioner>
  //       </Root>,
  //     );

  //     await waitForPosition();

  //     expect(screen.getByText('Content')).not.to.equal(null);
  //   });

  //   it('should remain uncontrolled', async () => {
  //     render(
  //       <Root defaultOpen>
  //         <Trigger />
  //         <PreviewCard.Positioner>
  //           <PreviewCard.Popup>Content</PreviewCard.Popup>
  //         </PreviewCard.Positioner>
  //       </Root>,
  //     );

  //     await waitForPosition();

  //     expect(screen.getByText('Content')).not.to.equal(null);

  //     const trigger = screen.getByRole('link');

  //     fireEvent.mouseLeave(trigger);

  //     clock.tick(CLOSE_DELAY);

  //     expect(screen.queryByText('Content')).to.equal(null);
  //   });
  // });

  // describe('prop: delay', () => {
  //   clock.withFakeTimers();

  //   it('should open after delay with rest type by default', async () => {
  //     render(
  //       <Root delay={100}>
  //         <Trigger />
  //         <PreviewCard.Positioner>
  //           <PreviewCard.Popup>Content</PreviewCard.Popup>
  //         </PreviewCard.Positioner>
  //       </Root>,
  //     );

  //     const trigger = screen.getByRole('link');

  //     fireEvent.mouseEnter(trigger);
  //     fireEvent.mouseMove(trigger);

  //     await waitForPosition();

  //     expect(screen.queryByText('Content')).to.equal(null);

  //     clock.tick(100);

  //     await waitForPosition();

  //     expect(screen.getByText('Content')).not.to.equal(null);
  //   });

  //   it('should open after delay with hover type', async () => {
  //     render(
  //       <Root delayType="hover">
  //         <Trigger />
  //         <PreviewCard.Positioner>
  //           <PreviewCard.Popup>Content</PreviewCard.Popup>
  //         </PreviewCard.Positioner>
  //       </Root>,
  //     );

  //     const trigger = screen.getByRole('link');

  //     fireEvent.mouseEnter(trigger);
  //     clock.tick(OPEN_DELAY - 100);

  //     await waitForPosition();

  //     expect(screen.queryByText('Content')).to.equal(null);

  //     clock.tick(100);

  //     await waitForPosition();

  //     expect(screen.getByText('Content')).not.to.equal(null);
  //   });
  // });

  // describe('prop: closeDelay', () => {
  //   clock.withFakeTimers();

  //   it('should close after delay', async () => {
  //     render(
  //       <Root closeDelay={100}>
  //         <Trigger />
  //         <PreviewCard.Positioner>
  //           <PreviewCard.Popup>Content</PreviewCard.Popup>
  //         </PreviewCard.Positioner>
  //       </Root>,
  //     );

  //     const trigger = screen.getByRole('link');

  //     fireEvent.mouseEnter(trigger);
  //     fireEvent.mouseMove(trigger);

  //     clock.tick(OPEN_DELAY);

  //     await waitForPosition();

  //     expect(screen.getByText('Content')).not.to.equal(null);

  //     fireEvent.mouseLeave(trigger);

  //     expect(screen.getByText('Content')).not.to.equal(null);

  //     clock.tick(100);

  //     expect(screen.queryByText('Content')).to.equal(null);
  //   });
  // });
});
