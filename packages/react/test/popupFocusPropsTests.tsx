import * as React from 'react';
import { expect, vi, describe, it } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { createRenderer } from '#test-utils';
import { waitSingleFrame } from '#test-utils';

/**
 * Value resolution of the `initialFocus` and `finalFocus` popup props: elements, refs, functions
 * and their `true`/`null`/`false`/`undefined` results, and the interaction type passed to functions.
 */
export function popupFocusPropsTests(config: PopupFocusPropsTestsConfig) {
  const {
    render,
    createComponent,
    initialFocus: testInitialFocus = true,
    triggerRole = 'button',
    alwaysMounted = false,
  } = config;

  function Test(props: { popupProps?: PopupFocusProps; withPopupInputs?: boolean }) {
    const { popupProps = {}, withPopupInputs = false } = props;
    const outsideRef = React.useRef<HTMLInputElement>(null);
    const insideRef = React.useRef<HTMLInputElement>(null);

    const targets: FocusTargets = { outside: outsideRef, inside: insideRef };
    const resolve = (value: PopupFocusPropFactory) =>
      typeof value === 'function' ? value(targets) : value;

    return (
      <div>
        <input data-testid="outside-before" />
        {createComponent({
          initialFocus: resolve(popupProps.initialFocus),
          finalFocus: resolve(popupProps.finalFocus),
          children: withPopupInputs ? (
            <React.Fragment>
              <input data-testid="inside-1" />
              <input data-testid="inside-2" ref={insideRef} />
            </React.Fragment>
          ) : null,
        })}
        <input data-testid="outside-target" ref={outsideRef} />
      </div>
    );
  }

  // A combobox trigger is named by its label rather than its content, so find it by role alone.
  const getTrigger = () =>
    triggerRole === 'combobox'
      ? screen.getByRole('combobox')
      : screen.getByRole('button', { name: 'Open' });

  function expectClosed() {
    if (alwaysMounted) {
      expect(screen.getByText('Close')).toBeInaccessible();
    } else {
      expect(screen.queryByText('Close')).toBe(null);
    }
  }

  async function closeWithPointer(user: Awaited<ReturnType<typeof render>>['user']) {
    const close = await screen.findByText('Close');
    // Positioners ignore pointer events until they have been positioned.
    await waitFor(() => {
      expect(getComputedStyle(close).pointerEvents).not.toBe('none');
    });
    await user.click(close);
  }

  if (testInitialFocus) {
    describe('prop: initialFocus', () => {
      it('focuses the first focusable element by default', async () => {
        const { user } = await render(<Test withPopupInputs />);

        await user.click(getTrigger());
        await waitFor(() => {
          expect(screen.getByTestId('inside-1')).toHaveFocus();
        });
      });

      it.each([
        {
          name: 'a ref',
          initialFocus: ({ inside }: FocusTargets) => inside,
          focused: 'inside-2',
        },
        {
          name: 'a function returning an element',
          initialFocus:
            ({ inside }: FocusTargets) =>
            () =>
              inside.current,
          focused: 'inside-2',
        },
        {
          name: 'a function returning true',
          initialFocus: () => () => true,
          focused: 'inside-1',
        },
        {
          name: 'a function returning null',
          initialFocus: () => () => null,
          focused: 'inside-1',
        },
      ])('focuses the right element when given $name', async ({ initialFocus, focused }) => {
        const { user } = await render(<Test withPopupInputs popupProps={{ initialFocus }} />);

        await user.click(getTrigger());
        await waitFor(() => {
          expect(screen.getByTestId(focused)).toHaveFocus();
        });
      });

      it('does not move focus when `false`', async () => {
        const { user } = await render(
          <Test withPopupInputs popupProps={{ initialFocus: false }} />,
        );

        const trigger = getTrigger();
        await user.click(trigger);
        await screen.findByText('Close');
        await act(() => waitSingleFrame());

        expect(trigger).toHaveFocus();
      });

      it('passes the interaction type to a function, and does nothing when it returns undefined', async () => {
        const initialFocusSpy = vi.fn();

        const { user } = await render(
          <Test
            withPopupInputs
            popupProps={{
              initialFocus:
                ({ inside }) =>
                (openType: InteractionType) => {
                  initialFocusSpy(openType);
                  return openType === 'keyboard' ? inside.current : undefined;
                },
            }}
          />,
        );

        const trigger = getTrigger();

        await user.click(trigger);
        await waitFor(() => {
          expect(initialFocusSpy).toHaveBeenLastCalledWith('mouse');
        });
        expect(trigger).toHaveFocus();

        await user.keyboard('[Escape]');
        await waitFor(() => {
          expectClosed();
        });

        await act(async () => trigger.focus());
        await user.keyboard('[Enter]');
        await waitFor(() => {
          expect(screen.getByTestId('inside-2')).toHaveFocus();
        });
        expect(initialFocusSpy).toHaveBeenLastCalledWith('keyboard');

        await user.keyboard('[Escape]');
        await waitFor(() => {
          expectClosed();
        });

        fireEvent.pointerDown(trigger, { pointerType: 'touch' });
        fireEvent.click(trigger, { detail: 1 });
        await waitFor(() => {
          expect(initialFocusSpy).toHaveBeenLastCalledWith('touch');
        });
        expect(initialFocusSpy).toHaveBeenCalledTimes(3);
      });

      it('is not called again when the popup closes', async () => {
        const initialFocusSpy = vi.fn();

        const { user } = await render(
          <Test
            withPopupInputs
            popupProps={{
              initialFocus:
                ({ inside }) =>
                () => {
                  initialFocusSpy();
                  return inside.current;
                },
            }}
          />,
        );

        await user.click(getTrigger());
        await waitFor(() => {
          expect(screen.getByTestId('inside-2')).toHaveFocus();
        });
        expect(initialFocusSpy).toHaveBeenCalledTimes(1);

        await closeWithPointer(user);
        await waitFor(() => {
          expect(getTrigger()).toHaveFocus();
        });
        expect(initialFocusSpy).toHaveBeenCalledTimes(1);
      });
    });
  }

  describe('prop: finalFocus', () => {
    it('focuses the trigger by default', async () => {
      const { user } = await render(<Test />);

      await user.click(getTrigger());
      await closeWithPointer(user);

      await waitFor(() => {
        expect(getTrigger()).toHaveFocus();
      });
    });

    it.each([
      {
        name: 'a ref',
        finalFocus: ({ outside }: FocusTargets) => outside,
        focused: 'outside-target',
      },
      {
        name: 'a function returning an element',
        finalFocus:
          ({ outside }: FocusTargets) =>
          () =>
            outside.current,
        focused: 'outside-target',
      },
      {
        name: 'a function returning true',
        finalFocus: () => () => true,
        focused: 'trigger',
      },
      {
        name: 'a function returning null',
        finalFocus: () => () => null,
        focused: 'trigger',
      },
    ])('focuses the right element when given $name', async ({ finalFocus, focused }) => {
      const { user } = await render(<Test popupProps={{ finalFocus }} />);

      await user.click(getTrigger());
      await closeWithPointer(user);

      await waitFor(() => {
        expect(focused === 'trigger' ? getTrigger() : screen.getByTestId(focused)).toHaveFocus();
      });
    });

    it('does not move focus when `false`', async () => {
      const { user } = await render(<Test popupProps={{ finalFocus: false }} />);

      await user.click(getTrigger());
      await closeWithPointer(user);
      await waitFor(() => {
        expectClosed();
      });
      await act(() => waitSingleFrame());

      expect(getTrigger()).not.toHaveFocus();
      if (!alwaysMounted) {
        // The focused close control was removed, so focus falls back to the body.
        expect(document.body).toHaveFocus();
      }
    });

    it('passes the close type to a function', async () => {
      const finalFocusSpy = vi.fn();

      const { user } = await render(
        <Test
          popupProps={{
            finalFocus:
              ({ outside }) =>
              (closeType: InteractionType) => {
                finalFocusSpy(closeType);
                return closeType === 'keyboard' ? outside.current : true;
              },
          }}
        />,
      );

      const trigger = getTrigger();

      await user.click(trigger);
      await closeWithPointer(user);
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
      expect(finalFocusSpy).toHaveBeenCalledTimes(1);

      await user.click(trigger);
      await screen.findByText('Close');
      await act(() => waitSingleFrame());
      await user.keyboard('[Escape]');
      await waitFor(() => {
        expect(screen.getByTestId('outside-target')).toHaveFocus();
      });
      expect(finalFocusSpy).toHaveBeenLastCalledWith('keyboard');
      expect(finalFocusSpy).toHaveBeenCalledTimes(2);
    });
  });
}

interface FocusTargets {
  /**
   * An input rendered after the popup, outside of it.
   */
  outside: React.RefObject<HTMLInputElement | null>;
  /**
   * The second of two inputs rendered inside the popup.
   */
  inside: React.RefObject<HTMLInputElement | null>;
}

type FocusPropValue =
  | boolean
  | React.RefObject<HTMLElement | null>
  | ((interactionType: InteractionType) => boolean | HTMLElement | null | void)
  | undefined;

/**
 * A plain value, or a factory that builds the prop value from the test's focus targets.
 */
type PopupFocusPropFactory = boolean | undefined | ((targets: FocusTargets) => FocusPropValue);

interface PopupFocusProps {
  initialFocus?: PopupFocusPropFactory;
  finalFocus?: PopupFocusPropFactory;
}

export interface PopupFocusPropsTestsConfig {
  /**
   * Render function returned from `createRenderer`.
   */
  render: ReturnType<typeof createRenderer>['render'];
  /**
   * Returns the popup tree. It must render a trigger labeled "Open", spread `initialFocus` and
   * `finalFocus` on the popup, and render `children` followed by a control labeled "Close" that
   * closes the popup when clicked.
   */
  createComponent: (props: {
    initialFocus: FocusPropValue;
    finalFocus: FocusPropValue;
    children: React.ReactNode;
  }) => React.JSX.Element;
  /**
   * Whether the popup accepts `initialFocus`.
   * @default true
   */
  initialFocus?: boolean;
  /**
   * The role of the trigger. A `button` trigger must be labeled "Open"; there must be only one
   * `combobox`.
   * @default 'button'
   */
  triggerRole?: 'button' | 'combobox';
  /**
   * Whether the popup stays mounted (inaccessible) after it closes.
   * @default false
   */
  alwaysMounted?: boolean;
}
