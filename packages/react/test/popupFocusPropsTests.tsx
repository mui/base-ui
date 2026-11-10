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
    mouseCloseType = 'mouse',
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

  async function findClickableClose() {
    const close = await screen.findByText('Close');
    // Positioners ignore pointer events until they have been positioned.
    await waitFor(() => {
      expect(getComputedStyle(close).pointerEvents).not.toBe('none');
    });
    return close;
  }

  async function closeWithPointer(user: Awaited<ReturnType<typeof render>>['user']) {
    await user.click(await findClickableClose());
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

      it('focuses the element of a ref', async () => {
        const { user } = await render(
          <Test withPopupInputs popupProps={{ initialFocus: ({ inside }) => inside }} />,
        );

        await user.click(getTrigger());
        await waitFor(() => {
          expect(screen.getByTestId('inside-2')).toHaveFocus();
        });
      });

      it.each([
        {
          name: 'an element',
          returns: ({ inside }: FocusTargets) => inside.current,
          focused: 'inside-2',
        },
        // `true` and `null` keep the default target, so the spy proves the function was consulted.
        { name: 'true', returns: () => true, focused: 'inside-1' },
        { name: 'null', returns: () => null, focused: 'inside-1' },
      ])(
        'focuses the right element when a function returns $name',
        async ({ returns, focused }) => {
          const initialFocusSpy = vi.fn();
          const { user } = await render(
            <Test
              withPopupInputs
              popupProps={{
                initialFocus: (targets) => (openType: InteractionType) => {
                  initialFocusSpy(openType);
                  return returns(targets);
                },
              }}
            />,
          );

          await user.click(getTrigger());
          await waitFor(() => {
            expect(screen.getByTestId(focused)).toHaveFocus();
          });
          expect(initialFocusSpy).toHaveBeenCalledTimes(1);
        },
      );

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

    it('focuses the element of a ref', async () => {
      const { user } = await render(<Test popupProps={{ finalFocus: ({ outside }) => outside }} />);

      await user.click(getTrigger());
      await closeWithPointer(user);

      await waitFor(() => {
        expect(screen.getByTestId('outside-target')).toHaveFocus();
      });
    });

    it.each([
      {
        name: 'an element',
        returns: ({ outside }: FocusTargets) => outside.current,
        getFocused: () => screen.getByTestId('outside-target'),
      },
      // `true` and `null` keep the default target, so the spy proves the function was consulted.
      { name: 'true', returns: () => true, getFocused: getTrigger },
      { name: 'null', returns: () => null, getFocused: getTrigger },
    ])(
      'focuses the right element when a function returns $name',
      async ({ returns, getFocused }) => {
        const finalFocusSpy = vi.fn();
        const { user } = await render(
          <Test
            popupProps={{
              finalFocus: (targets) => (closeType: InteractionType) => {
                finalFocusSpy(closeType);
                return returns(targets);
              },
            }}
          />,
        );

        await user.click(getTrigger());
        await closeWithPointer(user);

        await waitFor(() => {
          expect(getFocused()).toHaveFocus();
        });
        expect(finalFocusSpy).toHaveBeenCalledTimes(1);
      },
    );

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
        // eslint-disable-next-line vitest/no-conditional-expect -- a kept-mounted close control is not removed, so focus doesn't fall back
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
      // user-event's synthetic clicks carry no pointer type, so the mouse press is dispatched
      // directly.
      const close = await findClickableClose();
      fireEvent.pointerDown(close, { pointerType: 'mouse' });
      fireEvent.click(close, { detail: 1 });
      await waitFor(() => {
        expectClosed();
      });
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
      expect(finalFocusSpy).toHaveBeenNthCalledWith(1, mouseCloseType);

      await user.click(trigger);
      await screen.findByText('Close');
      await act(() => waitSingleFrame());
      await user.keyboard('[Escape]');
      await waitFor(() => {
        expect(screen.getByTestId('outside-target')).toHaveFocus();
      });
      expect(finalFocusSpy).toHaveBeenNthCalledWith(2, 'keyboard');
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
  /**
   * The close type passed to a `finalFocus` function when the "Close" control is clicked with a
   * mouse. Only set it to document a popup whose close control doesn't report the pointer type.
   * @default 'mouse'
   */
  mouseCloseType?: InteractionType;
}
