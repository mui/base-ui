import { expect, describe, it } from 'vitest';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Tooltip.Portal />', () => {
  const { render } = createRenderer();

  describeConformance(<Tooltip.Portal />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Tooltip.Root open>{node}</Tooltip.Root>);
    },
  }));

  describe('prop: keepMounted', () => {
    function ClosedTooltip({ keepMounted }: { keepMounted?: boolean }) {
      return (
        <Tooltip.Root>
          <Tooltip.Trigger>Trigger</Tooltip.Trigger>
          <Tooltip.Portal keepMounted={keepMounted}>
            <Tooltip.Positioner>
              <Tooltip.Popup data-testid="popup">Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      );
    }

    it('renders the closed popup as hidden instead of unmounting it', async () => {
      await render(<ClosedTooltip keepMounted />);

      expect(screen.getByTestId('popup')).toBeInaccessible();
    });

    it('unmounts the closed popup by default', async () => {
      await render(<ClosedTooltip />);

      expect(screen.queryByTestId('popup')).toBe(null);
    });

    // A kept-mounted positioner forgets the trigger once the popup closes, so returning to the
    // window doesn't count as refocusing the trigger the popup last belonged to.
    it.each([
      { name: 'reopens on trigger focus after the window regains focus', keepMounted: true },
      { name: 'stays closed on trigger focus after the window regains focus', keepMounted: false },
    ])('with keepMounted=$keepMounted, $name', async ({ keepMounted }) => {
      const actionsRef: React.RefObject<Tooltip.Root.Actions | null> = { current: null };

      await render(
        <Tooltip.Root actionsRef={actionsRef}>
          <Tooltip.Trigger delay={0}>Trigger</Tooltip.Trigger>
          <Tooltip.Portal keepMounted={keepMounted}>
            <Tooltip.Positioner>
              <Tooltip.Popup data-testid="popup">Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      const isOpen = () => screen.queryByTestId('popup')?.hasAttribute('data-open') ?? false;
      const trigger = screen.getByRole('button', { name: 'Trigger' });
      await act(async () => trigger.focus());
      await waitFor(() => {
        expect(isOpen()).toBe(true);
      });

      // Close without moving focus off the trigger, and let the popup finish unmounting.
      await act(async () => actionsRef.current!.close());
      await waitFor(() => {
        expect(trigger).not.toHaveAttribute('data-popup-open');
      });
      expect(isOpen()).toBe(false);
      expect(trigger).toHaveFocus();

      // The user leaves the window and comes back to the still-focused trigger.
      fireEvent.blur(window);
      fireEvent.focus(trigger);

      expect(isOpen()).toBe(keepMounted);
    });
  });
});
