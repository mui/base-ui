import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@mui/internal-test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, isJSDOM } from '#test-utils';

type PopupState = Pick<Menu.Popup.State, 'open' | 'transitionStatus'>;

const TrackedPopup = React.forwardRef(function TrackedPopup(
  {
    state,
    onState,
    onEnter,
    ...props
  }: React.ComponentProps<'div'> & {
    state: PopupState;
    onState: (state: PopupState) => void;
    onEnter: () => void;
  },
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const { open, transitionStatus } = state;
  // This is the input used by transition components such as Material UI Grow.
  const enter = open && transitionStatus !== 'starting';
  const previousEnter = React.useRef(enter);
  useIsoLayoutEffect(() => {
    if (enter && !previousEnter.current) {
      onEnter();
    }
    previousEnter.current = enter;
  }, [enter, onEnter]);
  useIsoLayoutEffect(() => {
    onState({ open, transitionStatus });
  }, [open, transitionStatus, onState]);
  return <div {...props} ref={ref} data-enter={enter || undefined} />;
});

describe.skipIf(isJSDOM)('Menu popup transition state', () => {
  const { render } = createRenderer();

  [false, true].forEach((controlled) => {
    [false, true].forEach((keepMounted) => {
      [false, true].forEach((defaultOpen) => {
        it(`starts each opening once (controlled=${controlled}, keepMounted=${keepMounted}, defaultOpen=${defaultOpen})`, async () => {
          globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
          const states: PopupState[] = [];
          function onState(state: PopupState) {
            const previous = states[states.length - 1];
            if (
              previous?.open !== state.open ||
              previous?.transitionStatus !== state.transitionStatus
            ) {
              states.push(state);
            }
          }
          const completed = vi.fn(() => {
            expect(screen.queryByRole('menu')?.getAnimations() ?? []).toHaveLength(0);
          });
          const onEnter = vi.fn();

          function TestMenu() {
            const [open, setOpen] = React.useState(defaultOpen);
            return (
              <React.Fragment>
                <style>{`
                  .transition-state-popup { opacity: 0; transition: opacity 200ms linear; }
                  .transition-state-popup[data-enter] { opacity: 1; }
                `}</style>
                <Menu.Root
                  open={controlled ? open : undefined}
                  defaultOpen={defaultOpen}
                  onOpenChange={setOpen}
                  onOpenChangeComplete={completed}
                >
                  <Menu.Trigger>Toggle</Menu.Trigger>
                  <Menu.Portal keepMounted={keepMounted}>
                    <Menu.Positioner>
                      <Menu.Popup
                        className="transition-state-popup"
                        render={(props, state) => (
                          <TrackedPopup
                            {...props}
                            state={state}
                            onState={onState}
                            onEnter={onEnter}
                          />
                        )}
                      >
                        <Menu.Item>Item</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </React.Fragment>
            );
          }

          const { user } = await render(<TestMenu />);

          async function openMenu() {
            states.length = 0;
            onEnter.mockClear();
            completed.mockClear();
            await user.click(screen.getByRole('button', { name: 'Toggle' }));
            const popup = await screen.findByRole('menu');
            await waitFor(() => expect(popup.getAnimations().length).toBeGreaterThan(0));
            expect(onEnter).toHaveBeenCalledTimes(1);
            expect(completed).not.toHaveBeenCalled();
            await waitFor(() => expect(completed).toHaveBeenCalledExactlyOnceWith(true));
            expect(popup.getAnimations()).toHaveLength(0);
            expect(onEnter).toHaveBeenCalledTimes(1);
            expect(states.filter((state) => state.open)).toEqual([
              { open: true, transitionStatus: 'starting' },
              { open: true, transitionStatus: undefined },
            ]);
          }

          async function expectInitialOpen() {
            await waitFor(() => expect(completed).toHaveBeenCalledExactlyOnceWith(true));
            expect(onEnter).not.toHaveBeenCalled();
            expect(states).toEqual([{ open: true, transitionStatus: undefined }]);
          }

          if (defaultOpen) {
            await expectInitialOpen();
          } else {
            await openMenu();
          }

          async function closeAndReopen() {
            completed.mockClear();
            const popup = screen.getByRole('menu');
            await user.keyboard('{Escape}');
            await waitFor(() => expect(popup.getAnimations().length).toBeGreaterThan(0));
            expect(completed).not.toHaveBeenCalled();
            await waitFor(() => expect(completed).toHaveBeenCalledExactlyOnceWith(false));
            expect(popup.isConnected).toBe(keepMounted);
            await openMenu();
          }
          await closeAndReopen();
          await closeAndReopen();

          // A reversed exit keeps the lifecycle mounted. It must not start a new entry phase
          // or report completion for the canceled close.
          completed.mockClear();
          const popup = screen.getByRole('menu');
          await user.keyboard('{Escape}');
          await waitFor(() => expect(popup.getAnimations().length).toBeGreaterThan(0));
          // Keep the exit active while the user event runs, even on a busy test runner.
          popup.getAnimations().forEach((animation) => animation.pause());
          expect(completed).not.toHaveBeenCalled();
          states.length = 0;
          onEnter.mockClear();
          await user.click(screen.getByRole('button', { name: 'Toggle' }));
          await waitFor(() => expect(completed).toHaveBeenCalledExactlyOnceWith(true));
          expect(screen.getByRole('menu')).toBe(popup);
          expect(onEnter).toHaveBeenCalledTimes(1);
          expect(states.some((state) => state.transitionStatus === 'starting')).toBe(false);
          expect(popup.getAnimations()).toHaveLength(0);
        });
      });
    });
  });
});
