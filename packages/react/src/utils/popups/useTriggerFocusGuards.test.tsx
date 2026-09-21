import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { act, ignoreActWarnings, screen, waitFor } from '@mui/internal-test-utils';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import { Popover } from '@base-ui/react/popover';
import { createRenderer, isJSDOM } from '#test-utils';

describe.skipIf(isJSDOM)('useTriggerFocusGuards', () => {
  const { render } = createRenderer();

  describe.each([
    { name: 'Popover', Component: Popover },
    { name: 'Menu', Component: Menu },
  ])('$name', ({ name, Component }) => {
    describe.each(['forward', 'backward'] as const)('tabbing %s', (direction) => {
      it.each([
        ['ref', 0],
        ['function', 0],
        ['ref', -1],
        ['function', -1],
      ] as const)(
        'preserves the tab destination after the exit transition with finalFocus as a %s and trigger tabIndex=%s',
        async (finalFocusType, tabIndex) => {
          ignoreActWarnings();
          const { userEvent: user } = await import('vitest/browser');
          globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

          const finalFocusRef = React.createRef<HTMLButtonElement>();

          await render(
            <div>
              <style>{`
                .popup { transition: opacity 200ms; }
                .popup[data-ending-style] { opacity: 0; }
              `}</style>
              <button data-testid="before">Before</button>
              <Component.Root modal={false}>
                <Component.Trigger tabIndex={tabIndex}>Toggle</Component.Trigger>
                <Component.Portal>
                  <Component.Positioner>
                    <Component.Popup
                      className="popup"
                      data-testid="popup"
                      finalFocus={finalFocusType === 'ref' ? finalFocusRef : () => true}
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
              <button data-testid="after">After</button>
              <button ref={finalFocusRef}>Final focus</button>
            </div>,
          );

          const trigger = screen.getByRole('button', { name: 'Toggle' });
          await user.click(trigger);
          await waitFor(() => {
            expect(screen.getByTestId(name === 'Popover' ? 'inside' : 'popup')).toHaveFocus();
          });

          if (direction === 'backward') {
            if (name === 'Popover') {
              await user.tab({ shift: true });
            } else {
              // Menu closes on Shift+Tab from its content. Keep it open while focusing the trigger.
              await act(async () => trigger.focus());
            }
          } else {
            await act(async () => screen.getByTestId('inside').focus());
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

      it('preserves the surrounding modal dialog focus trap', async () => {
        ignoreActWarnings();
        const { userEvent: user } = await import('vitest/browser');
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        await render(
          <div>
            <button>Outside dialog</button>
            <Dialog.Root defaultOpen>
              <Dialog.Portal>
                <Dialog.Popup style={{ position: 'relative' }}>
                  {direction === 'forward' && <button>Inside dialog</button>}
                  <Component.Root modal={false}>
                    <Component.Trigger tabIndex={-1}>Toggle</Component.Trigger>
                    <Component.Portal>
                      <Component.Positioner>
                        <Component.Popup data-testid="popup">
                          {name === 'Menu' ? (
                            <Menu.Item data-testid="inside">Inside</Menu.Item>
                          ) : (
                            <button data-testid="inside">Inside</button>
                          )}
                        </Component.Popup>
                      </Component.Positioner>
                    </Component.Portal>
                  </Component.Root>
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
        const trigger = screen.getByRole('button', { name: 'Toggle' });
        await user.click(trigger);
        await waitFor(() => {
          expect(screen.getByTestId(name === 'Popover' ? 'inside' : 'popup')).toHaveFocus();
        });
        await act(async () => {
          (direction === 'backward' ? trigger : screen.getByTestId('inside')).focus();
        });

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
          ignoreActWarnings();
          const { userEvent: user } = await import('vitest/browser');
          globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

          await render(
            <Component.Root modal={false}>
              <Component.Trigger tabIndex={tabIndex}>Toggle</Component.Trigger>
              <Component.Portal>
                <Component.Positioner>
                  <Component.Popup data-testid="popup">
                    {name === 'Menu' ? (
                      <Menu.Item data-testid="inside">Inside</Menu.Item>
                    ) : (
                      <button data-testid="inside">Inside</button>
                    )}
                  </Component.Popup>
                </Component.Positioner>
              </Component.Portal>
            </Component.Root>,
          );

          const trigger = screen.getByRole('button', { name: 'Toggle' });
          await user.click(trigger);
          await waitFor(() => {
            expect(screen.getByTestId(name === 'Popover' ? 'inside' : 'popup')).toHaveFocus();
          });
          await act(async () => {
            (direction === 'backward' ? trigger : screen.getByTestId('inside')).focus();
          });

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
