import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@mui/internal-test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { Popover } from '@base-ui/react/popover';
import { createRenderer, isJSDOM } from '#test-utils';

type PopupState = Pick<Popover.Popup.State, 'open' | 'transitionStatus'>;

const TrackedPopup = React.forwardRef(function TrackedPopup(
  {
    state,
    onState,
    ...props
  }: React.ComponentProps<'div'> & {
    state: PopupState;
    onState: (state: PopupState) => void;
  },
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const { open, transitionStatus } = state;
  // This is the input used by transition components such as Material UI Grow.
  const enter = open && transitionStatus !== 'starting';
  useIsoLayoutEffect(() => {
    onState({ open, transitionStatus });
  }, [open, transitionStatus, onState]);
  return <div {...props} ref={ref} data-enter={enter || undefined} />;
});

describe.skipIf(isJSDOM)('Popover popup transition state', () => {
  const { render } = createRenderer();

  it('starts each opening once when the popup is kept mounted', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const states: PopupState[] = [];
    function onState(state: PopupState) {
      const previous = states[states.length - 1];
      if (previous?.open !== state.open || previous?.transitionStatus !== state.transitionStatus) {
        states.push(state);
      }
    }
    const completed = vi.fn();

    function TestPopover() {
      return (
        <React.Fragment>
          <style>{`
            .transition-state-popup { opacity: 0; transition: opacity 10s linear; }
            .transition-state-popup[data-enter] { opacity: 1; }
          `}</style>
          <Popover.Root onOpenChangeComplete={completed}>
            <Popover.Trigger>Toggle</Popover.Trigger>
            <Popover.Portal keepMounted>
              <Popover.Positioner>
                <Popover.Popup
                  className="transition-state-popup"
                  render={(props, state) => (
                    <TrackedPopup {...props} state={state} onState={onState} />
                  )}
                >
                  Content
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </React.Fragment>
      );
    }

    const { user } = await render(<TestPopover />);
    const trigger = screen.getByRole('button', { name: 'Toggle' });

    // The transition lasts longer than any phase of the test, so it cannot end before it is
    // observed on a busy runner. Each phase is finished explicitly instead of waited out.
    async function finishPhase(element: HTMLElement) {
      await waitFor(() => expect(element.getAnimations().length).toBeGreaterThan(0));
      expect(completed).not.toHaveBeenCalled();
      element.getAnimations().forEach((animation) => animation.finish());
    }

    async function openPopover() {
      states.length = 0;
      completed.mockClear();
      await user.click(trigger);
      const popup = await screen.findByRole('dialog');
      await finishPhase(popup);
      await waitFor(() => expect(completed).toHaveBeenCalledExactlyOnceWith(true));
      expect(states.filter((state) => state.open)).toEqual([
        { open: true, transitionStatus: 'starting' },
        { open: true, transitionStatus: undefined },
      ]);
      return popup;
    }

    async function closePopover(popup: HTMLElement) {
      completed.mockClear();
      await user.keyboard('{Escape}');
      await finishPhase(popup);
      await waitFor(() => expect(completed).toHaveBeenCalledExactlyOnceWith(false));
      // `keepMounted` retains the element, so the next opening reuses it.
      expect(popup.isConnected).toBe(true);
    }

    const popup = await openPopover();
    await closePopover(popup);
    expect(await openPopover()).toBe(popup);
  });
});
