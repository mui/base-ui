import * as React from 'react';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { act, ignoreActWarnings, screen, waitFor } from '@mui/internal-test-utils';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import { Popover } from '@base-ui/react/popover';
import { createRenderer, isJSDOM } from '#test-utils';

describe.skipIf(isJSDOM)('useTriggerFocusGuards', () => {
  const { render } = createRenderer();

  // Native Tab runs a microtask checkpoint between the trigger's blur and the guard's focus,
  // which `@testing-library`'s synthetic events skip.
  let user: Awaited<typeof import('vitest/browser')>['userEvent'];
  beforeAll(async () => {
    ({ userEvent: user } = await import('vitest/browser'));
  });

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
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
      className?: string;
      finalFocus?: Popover.Popup.Props['finalFocus'];
    }) {
      return (
        <Component.Root modal={false} open={props.open} onOpenChange={props.onOpenChange}>
          <Component.Trigger tabIndex={props.tabIndex}>Toggle</Component.Trigger>
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
