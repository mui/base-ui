import * as React from 'react';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { act, ignoreActWarnings, screen, waitFor } from '@mui/internal-test-utils';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import { Popover } from '@base-ui/react/popover';
import { createRenderer, isJSDOM, resetBrowserPointer } from '#test-utils';

describe.skipIf(isJSDOM)('useTriggerFocusGuards', () => {
  const { render } = createRenderer();

  // Native Tab runs a microtask checkpoint between the trigger's blur and the guard's focus,
  // which `@testing-library`'s synthetic events skip.
  let user: Awaited<typeof import('vitest/browser')>['userEvent'];
  beforeAll(async () => {
    ({ userEvent: user } = await import('vitest/browser'));
  });

  beforeEach(resetBrowserPointer);
  beforeEach(() => {
    ignoreActWarnings();
    // The guards outlive `open` by a microtask only while exit animations run.
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
  });

  describe.each([
    { name: 'Popover', Component: Popover },
    { name: 'Menu', Component: Menu },
  ])('$name', ({ name, Component }) => {
    function TestPopup(props: {
      tabIndex?: number;
      openOnHover?: boolean;
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
      className?: string;
      finalFocus?: Popover.Popup.Props['finalFocus'];
      triggerKey?: string;
    }) {
      return (
        <Component.Root modal={false} open={props.open} onOpenChange={props.onOpenChange}>
          <Component.Trigger
            tabIndex={props.tabIndex}
            openOnHover={props.openOnHover}
            delay={0}
            render={props.triggerKey === undefined ? undefined : <button key={props.triggerKey} />}
          >
            Toggle
          </Component.Trigger>
          <Component.Portal>
            <Component.Positioner>
              <Component.Popup
                className={props.className}
                data-testid="popup"
                finalFocus={props.finalFocus}
              >
                {name === 'Menu' ? (
                  <Menu.Item data-testid="inside">Inside</Menu.Item>
                ) : (
                  <button data-testid="inside">Inside</button>
                )}
              </Component.Popup>
            </Component.Positioner>
          </Component.Portal>
        </Component.Root>
      );
    }

    async function openPopup() {
      const trigger = screen.getByRole('button', { name: 'Toggle' });
      await user.click(trigger);
      // Menu moves focus to the popup itself; Popover moves it to the first tabbable inside.
      await waitFor(() => {
        expect(screen.getByTestId(name === 'Popover' ? 'inside' : 'popup')).toHaveFocus();
      });
      return trigger;
    }

    describe.each(['forward', 'backward'] as const)('tabbing %s', (direction) => {
      /** Puts focus on the element the upcoming Tab should leave from. */
      async function focusTabOrigin(trigger: HTMLElement) {
        await act(async () =>
          (direction === 'backward' ? trigger : screen.getByTestId('inside')).focus(),
        );
      }

      it.each([
        { finalFocusType: 'default' },
        { finalFocusType: 'ref' },
        { finalFocusType: 'function' },
      ] as const)(
        'closes and moves focus past the trigger of a hover-opened popup through the exit transition with $finalFocusType finalFocus',
        async ({ finalFocusType }) => {
          const finalFocusRef = React.createRef<HTMLButtonElement>();
          const finalFocus = {
            default: undefined,
            ref: finalFocusRef,
            function: () => true,
          }[finalFocusType];

          await render(
            <div>
              <style>{`
                .popup { transition: opacity 200ms; }
                .popup[data-ending-style] { opacity: 0; }
              `}</style>
              <button data-testid="before">Before</button>
              <TestPopup openOnHover className="popup" finalFocus={finalFocus} />
              <button data-testid="after">After</button>
              <button ref={finalFocusRef}>Final focus</button>
            </div>,
          );

          const trigger = screen.getByRole('button', { name: 'Toggle' });
          await act(async () => trigger.focus());
          await user.hover(trigger);
          await waitFor(() => {
            expect(trigger).toHaveAttribute('aria-expanded', 'true');
          });
          // Menu moves focus into the popup when opened by hover, so refocus the trigger after that.
          await waitFor(() => {
            expect(name === 'Menu' ? screen.getByTestId('popup') : trigger).toHaveFocus();
          });
          await act(async () => trigger.focus());
          expect(trigger).toHaveFocus();
          expect(trigger).toHaveAttribute('aria-expanded', 'true');

          await user.tab({ shift: direction === 'backward' });

          const destination = screen.getByTestId(direction === 'backward' ? 'before' : 'after');
          expect(destination).toHaveFocus();
          expect(trigger).toHaveAttribute('aria-expanded', 'false');
          expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
          await waitFor(() => {
            expect(screen.queryByTestId('popup')).toBe(null);
          });
          expect(destination).toHaveFocus();
        },
      );

      // A Menu closes once focus leaves it, so it can't stay open while focus is outside.
      it.skipIf(name === 'Menu').each([
        { tabIndex: 0, result: 'focuses the trigger', focusesTrigger: true },
        { tabIndex: -1, result: 'closes and moves focus past the trigger', focusesTrigger: false },
      ])(
        '$result when tabbing toward the trigger of a hover-opened popup with tabIndex=$tabIndex',
        async ({ tabIndex, focusesTrigger }) => {
          await render(
            <div>
              <button data-testid="before">Before</button>
              <TestPopup openOnHover tabIndex={tabIndex} />
              <button data-testid="after">After</button>
            </div>,
          );

          const trigger = screen.getByRole('button', { name: 'Toggle' });
          await user.hover(trigger);
          await waitFor(() => {
            expect(trigger).toHaveAttribute('aria-expanded', 'true');
          });
          await act(async () =>
            screen.getByTestId(direction === 'backward' ? 'after' : 'before').focus(),
          );
          expect(trigger).toHaveAttribute('aria-expanded', 'true');

          await user.tab({ shift: direction === 'backward' });

          expect(
            focusesTrigger
              ? trigger
              : screen.getByTestId(direction === 'backward' ? 'before' : 'after'),
          ).toHaveFocus();
          expect(trigger).toHaveAttribute('aria-expanded', String(focusesTrigger));
        },
      );

      it.each([
        ['ref', 0],
        ['function', 0],
        ['ref', -1],
        ['function', -1],
      ] as const)(
        'preserves the tab destination after the exit transition with finalFocus as a %s and trigger tabIndex=%s',
        async (finalFocusType, tabIndex) => {
          const finalFocusRef = React.createRef<HTMLButtonElement>();

          await render(
            <div>
              <style>{`
                .popup { transition: opacity 200ms; }
                .popup[data-ending-style] { opacity: 0; }
              `}</style>
              <button data-testid="before">Before</button>
              <TestPopup
                tabIndex={tabIndex}
                className="popup"
                finalFocus={finalFocusType === 'ref' ? finalFocusRef : () => true}
              />
              <button data-testid="after">After</button>
              <button ref={finalFocusRef}>Final focus</button>
            </div>,
          );

          const trigger = await openPopup();

          if (direction === 'backward' && name === 'Popover') {
            await user.tab({ shift: true });
          } else {
            // Menu closes on Shift+Tab from its content, so focus the trigger directly instead.
            await focusTabOrigin(trigger);
          }

          expect(direction === 'backward' ? trigger : screen.getByTestId('inside')).toHaveFocus();
          expect(trigger).toHaveAttribute('aria-expanded', 'true');

          await user.tab({ shift: direction === 'backward' });

          const destination = screen.getByTestId(direction === 'backward' ? 'before' : 'after');
          expect(destination).toHaveFocus();
          await waitFor(() => {
            expect(screen.queryByTestId('popup')).toBe(null);
          });
          expect(destination).toHaveFocus();
          expect(trigger).toHaveAttribute('tabindex', String(tabIndex));
        },
      );

      it.each(['disabled', 'tabIndex', 'hidden', 'removed', 'inserted', 'reordered'] as const)(
        'uses the current tab order when an adjacent control is %s during close',
        async (change) => {
          function Fixture() {
            const [open, setOpen] = React.useState(false);
            const target = (
              <button key="target" data-testid="target">
                Target
              </button>
            );
            const candidate = (
              <button
                key="candidate"
                disabled={change === 'disabled' && !open}
                tabIndex={change === 'tabIndex' && !open ? -1 : 0}
                hidden={change === 'hidden' && !open}
              >
                Candidate
              </button>
            );
            let controls: React.ReactNode[];
            if (change === 'inserted') {
              controls = [!open && target, candidate];
            } else if (change === 'reordered') {
              controls = open ? [candidate, target] : [target, candidate];
            } else {
              controls = [change === 'removed' && !open ? null : candidate, target];
            }

            return (
              <div>
                {direction === 'backward' && controls.reverse()}
                <TestPopup tabIndex={-1} open={open} onOpenChange={setOpen} />
                {direction === 'forward' && controls}
              </div>
            );
          }

          await render(<Fixture />);
          await focusTabOrigin(await openPopup());
          await user.tab({ shift: direction === 'backward' });

          expect(screen.getByTestId('target')).toHaveFocus();
          await waitFor(() => {
            expect(screen.queryByTestId('popup')).toBe(null);
          });
          expect(screen.getByTestId('target')).toHaveFocus();
        },
      );

      it('moves focus past a trigger whose element is replaced during close', async () => {
        function Fixture() {
          const [open, setOpen] = React.useState(false);
          return (
            <div>
              <button data-testid="before">Before</button>
              <TestPopup open={open} onOpenChange={setOpen} triggerKey={open ? 'open' : 'closed'} />
              <button data-testid="after">After</button>
            </div>
          );
        }

        await render(<Fixture />);
        await openPopup();
        const trigger = screen.getByRole('button', { name: 'Toggle' });
        await focusTabOrigin(trigger);
        await user.tab({ shift: direction === 'backward' });

        expect(screen.getByTestId(direction === 'backward' ? 'before' : 'after')).toHaveFocus();
        expect(trigger).not.toBeInTheDocument();
      });

      it('preserves the surrounding modal dialog focus trap', async () => {
        await render(
          <div>
            <button>Outside dialog</button>
            <Dialog.Root defaultOpen>
              <Dialog.Portal>
                <Dialog.Popup style={{ position: 'relative' }}>
                  {direction === 'forward' && <button>Inside dialog</button>}
                  <TestPopup tabIndex={-1} />
                  {direction === 'backward' && <button>Inside dialog</button>}
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </div>,
        );

        const destination = screen.getByRole('button', { name: 'Inside dialog' });
        await waitFor(() => {
          expect(destination).toHaveFocus();
        });

        await focusTabOrigin(await openPopup());
        await user.tab({ shift: direction === 'backward' });

        await waitFor(() => {
          expect(screen.queryByTestId('popup')).toBe(null);
        });
        await waitFor(() => {
          expect(destination).toHaveFocus();
        });
      });

      it.each([0, -1])(
        'returns focus to the trigger when no outside element is tabbable and trigger tabIndex=%s',
        async (tabIndex) => {
          await render(<TestPopup tabIndex={tabIndex} />);

          const trigger = await openPopup();
          await focusTabOrigin(trigger);

          await user.tab({ shift: direction === 'backward' });

          expect(trigger).toHaveFocus();
          await waitFor(() => {
            expect(screen.queryByTestId('popup')).toBe(null);
          });
          expect(trigger).toHaveFocus();
          expect(trigger).toHaveAttribute('tabindex', String(tabIndex));
        },
      );
    });
  });
});
