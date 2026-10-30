import * as React from 'react';
import { expect, vi, describe, it, onTestFinished } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import type { createRenderer } from '#test-utils';
import { firePointer, isJSDOM, waitSingleFrame } from '#test-utils';

/**
 * Contracts that `Menu.FilterProvider` and `Select.FilterProvider` share: input focus by opening
 * modality, label resolution, the keyboard-opening state across controlled closes, the trigger's
 * relay of navigation and typing to the input, focus kept on the input when the list takes it,
 * and an input that ignores keys and edits while the popup animates out.
 *
 * `createComponent` renders a filterable popup with a trigger (`data-testid="trigger"`), an
 * input labelled "Filter", and the items "Alpha", "Beta", and "Gamma".
 */
export function filterablePopupConformanceTests(config: FilterablePopupConformanceTestsConfig) {
  const { render, createComponent, itemRole } = config;
  const listRole = itemRole === 'option' ? 'listbox' : 'menu';

  function ControlledTest(props: FilterablePopupTestProps & { open: boolean | undefined }) {
    const { open: openProp, ...otherProps } = props;
    const [open, setOpen] = React.useState(false);
    return createComponent({
      ...otherProps,
      rootProps: { ...otherProps.rootProps, open: openProp ?? open, onOpenChange: setOpen },
    });
  }

  function openWithPointer(trigger: HTMLElement, init: PointerEventInit) {
    firePointer.down(trigger, { ...init, timeStamp: 10 });
    fireEvent.mouseDown(trigger, { detail: 1 });
    firePointer.up(trigger, { ...init, timeStamp: 20 });
    fireEvent.mouseUp(trigger, { detail: 1 });
    fireEvent.click(trigger, { detail: 1 });
  }

  // Holds the popup in its exit animation until the test finishes it.
  function slowExitAnimation() {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    const style = document.createElement('style');
    style.textContent =
      '@keyframes filterable-popup-exit{to{opacity:0}}' +
      '[role="dialog"][data-ending-style]{animation:filterable-popup-exit 10s linear}';
    document.head.appendChild(style);
    onTestFinished(() => style.remove());
  }

  async function findFocusedInput() {
    const input = await screen.findByRole('searchbox', { name: 'Filter' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    return input;
  }

  describe('filterable popup conformance', () => {
    describe('input focus on open', () => {
      it.each([
        { pointerType: 'mouse', focuses: true },
        { pointerType: 'touch', focuses: false },
        { pointerType: 'pen', focuses: false },
      ])(
        'focuses the input only for a mouse open: $pointerType',
        async ({ pointerType, focuses }) => {
          const onInputFocus = vi.fn();
          await render(createComponent({ onInputFocus }));
          const trigger = screen.getByTestId('trigger');
          await act(async () => trigger.focus());

          openWithPointer(trigger, { pointerType });

          const input = await screen.findByRole('searchbox', { name: 'Filter' });
          await act(() => waitSingleFrame());
          await waitFor(() => {
            expect(input.matches(':focus')).toBe(focuses);
          });
          expect(onInputFocus.mock.calls.length > 0).toBe(focuses);
          expect(input).not.toHaveAttribute('aria-activedescendant');
        },
      );

      // iOS VoiceOver presses with a touch whose contact is under a pixel and carries no pressure.
      it.skipIf(isJSDOM)('focuses the input when a screen reader touch press opens', async () => {
        await render(createComponent({}));
        const trigger = screen.getByTestId('trigger');
        await act(async () => trigger.focus());

        openWithPointer(trigger, {
          pointerType: 'touch',
          width: 0.333,
          height: 0.333,
          pressure: 0,
        });

        const input = await screen.findByRole('searchbox', { name: 'Filter' });
        await waitFor(() => {
          expect(input).toHaveFocus();
        });
      });
    });

    describe('labels', () => {
      it.each([
        { name: 'popup prop', part: 'popup', props: { 'aria-label': 'Explicit' } },
        {
          name: 'popup render element',
          part: 'popup',
          props: { render: <div aria-label="Explicit" /> },
        },
        { name: 'list prop', part: 'list', props: { 'aria-label': 'Explicit' } },
        {
          name: 'list render element',
          part: 'list',
          props: { render: <div aria-label="Explicit" /> },
        },
      ] as const)('uses an explicit label from the $name', async ({ part, props }) => {
        const { user } = await render(
          createComponent(part === 'popup' ? { popupProps: props } : { listProps: props }),
        );
        await user.click(screen.getByTestId('trigger'));

        const element = await screen.findByRole(part === 'popup' ? 'dialog' : listRole, {
          name: 'Explicit',
        });
        expect(element).not.toHaveAttribute('aria-labelledby');
      });
    });

    it('does not highlight an item when a controlled open follows a keyboard open', async () => {
      const { user, setProps } = await render(<ControlledTest open={undefined} />);
      await act(async () => screen.getByTestId('trigger').focus());
      await user.keyboard('[ArrowDown]');
      const input = await findFocusedInput();
      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole(itemRole, { name: 'Alpha' }).id,
        );
      });

      await setProps({ open: false });
      await waitFor(() => {
        expect(screen.queryByRole('searchbox', { name: 'Filter' })).toBe(null);
      });
      await setProps({ open: true });

      const reopenedInput = await screen.findByRole('searchbox', { name: 'Filter' });
      await act(() => waitSingleFrame());
      expect(reopenedInput).not.toHaveAttribute('aria-activedescendant');
    });

    describe('list focus', () => {
      it('returns focus to the input when the list takes it from the input', async () => {
        const { user } = await render(createComponent({}));
        await user.click(screen.getByTestId('trigger'));
        const input = await findFocusedInput();
        const list = screen.getByRole(listRole);
        // A press on non-item content, such as a group label, focuses the list.
        expect(list).toHaveAttribute('tabindex');

        await act(async () => list.focus());

        expect(input).toHaveFocus();
      });

      it('leaves focus on the list when the input did not have it', async () => {
        const { user } = await render(createComponent({}));
        await user.click(screen.getByTestId('trigger'));
        const input = await findFocusedInput();
        const list = screen.getByRole(listRole);
        // A touch open leaves the input unfocused so the on-screen keyboard stays closed.
        await act(async () => input.blur());

        await act(async () => list.focus());

        expect(list).toHaveFocus();
      });
    });

    describe('while the popup animates out', () => {
      async function openWithKeyboardAndClose(user: Awaited<ReturnType<typeof render>>['user']) {
        const trigger = screen.getByTestId('trigger');
        await act(async () => trigger.focus());
        await user.keyboard('[ArrowDown]');
        const input = await findFocusedInput();
        await waitFor(() => {
          expect(input).toHaveAttribute('aria-activedescendant');
        });
        await user.keyboard('[Escape]');
        expect(screen.getByRole('dialog')).toHaveAttribute('data-ending-style');
        expect(input).toHaveFocus();
        return { trigger, input };
      }

      it.skipIf(isJSDOM).each(['ArrowDown', 'ArrowUp', 'Enter', 'End'])(
        'ignores %s in the input',
        async (key) => {
          slowExitAnimation();
          const onOpenChange = vi.fn();
          const { user } = await render(createComponent({ rootProps: { onOpenChange } }));
          const { trigger, input } = await openWithKeyboardAndClose(user);
          const activeItemId = input.getAttribute('aria-activedescendant');

          await user.keyboard(`[${key}]`);

          expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true, false]);
          expect(trigger).toHaveAttribute('aria-expanded', 'false');
          expect(input.getAttribute('aria-activedescendant')).toBe(activeItemId);
        },
      );

      it.skipIf(isJSDOM).each([
        { name: 'an empty query', query: '', matches: 3 },
        { name: 'a query', query: 'al', matches: 1 },
      ])('ignores text typed in the input with $name', async ({ query, matches }) => {
        slowExitAnimation();
        const onValueChange = vi.fn();
        const { user } = await render(
          createComponent({ providerProps: { defaultValue: query, onValueChange } }),
        );
        const { input } = await openWithKeyboardAndClose(user);
        // The closing popup keeps showing the query it closed with.
        expect(input).toHaveValue(query);
        expect(screen.getAllByRole(itemRole)).toHaveLength(matches);
        const changesBeforeTyping = onValueChange.mock.calls.map(([value, details]) => [
          value,
          details.reason,
        ]);

        await user.keyboard('m');

        expect(onValueChange.mock.calls.map(([value, details]) => [value, details.reason])).toEqual(
          changesBeforeTyping,
        );
        expect(input).toHaveValue(query);
        expect(screen.getAllByRole(itemRole)).toHaveLength(matches);
      });
    });

    describe('trigger relay', () => {
      async function openAndRefocusTrigger(user: Awaited<ReturnType<typeof render>>['user']) {
        await user.click(screen.getByTestId('trigger'));
        const input = await findFocusedInput();
        const trigger = screen.getByTestId('trigger');
        await act(async () => trigger.focus());
        expect(trigger).toHaveFocus();
        expect(input).not.toHaveAttribute('aria-activedescendant');
        return input;
      }

      it('moves focus to the input and highlights once for an arrow key on the trigger', async () => {
        const { user } = await render(createComponent({ rootProps: { modal: false } }));
        const input = await openAndRefocusTrigger(user);

        await user.keyboard('[ArrowDown]');

        expect(input).toHaveFocus();
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole(itemRole, { name: 'Alpha' }).id,
        );
      });

      it('moves typing on the trigger into the input', async () => {
        const { user } = await render(createComponent({ rootProps: { modal: false } }));
        const input = await openAndRefocusTrigger(user);

        await user.keyboard('b');

        expect(input).toHaveFocus();
        expect(input).toHaveValue('b');
        expect(screen.getAllByRole(itemRole).map((item) => item.textContent)).toEqual(['Beta']);
      });
    });
  });
}

export interface FilterablePopupTestProps {
  rootProps?: {
    open?: boolean | undefined;
    onOpenChange?: ((open: boolean) => void) | undefined;
    modal?: boolean | undefined;
  };
  popupProps?: { 'aria-label'?: string; render?: React.ReactElement };
  listProps?: { 'aria-label'?: string; render?: React.ReactElement };
  providerProps?: {
    defaultValue?: string | undefined;
    onValueChange?: ((value: string, eventDetails: { reason: string }) => void) | undefined;
  };
  onInputFocus?: () => void;
}

export interface FilterablePopupConformanceTestsConfig {
  render: ReturnType<typeof createRenderer>['render'];
  createComponent: (props: FilterablePopupTestProps) => React.JSX.Element;
  itemRole: 'menuitem' | 'option';
}
