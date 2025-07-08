'use client';
import * as React from 'react';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useComboboxChipContext } from '../chip/ComboboxChipContext';
import { useButton } from '../../use-button';
import { stopEvent } from '../../floating-ui-react/utils';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';

/**
 * A button to remove a combobox chip.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxChipRemove = React.forwardRef(function ComboboxChipRemove(
  componentProps: ComboboxChipRemove.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, nativeButton = true, ...elementProps } = componentProps;

  const { store, inputRef, disabled, readOnly, setSelectedValue } = useComboboxRootContext();
  const { index } = useComboboxChipContext();

  const selectedValue = useSelector(store, selectors.selectedValue);

  const { buttonRef, getButtonProps } = useButton({
    native: nativeButton,
    disabled: disabled || readOnly,
    focusableWhenDisabled: true,
  });

  const state: ComboboxChipRemove.State = React.useMemo(
    () => ({
      disabled,
    }),
    [disabled],
  );

  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    state,
    props: [
      {
        tabIndex: -1,
        disabled,
        'aria-readonly': readOnly || undefined,
        onClick(event) {
          if (disabled || readOnly) {
            return;
          }
          event.stopPropagation();
          setSelectedValue(
            selectedValue.filter((_: any, i: number) => i !== index),
            event.nativeEvent,
            undefined,
          );
          inputRef.current?.focus();
        },
        onKeyDown(event) {
          if (disabled || readOnly) {
            return;
          }

          if (event.key === 'Enter' || event.key === ' ') {
            stopEvent(event);
            setSelectedValue(
              selectedValue.filter((_: any, i: number) => i !== index),
              event.nativeEvent,
              undefined,
            );
            inputRef.current?.focus();
          }
        },
      },
      elementProps,
      getButtonProps,
    ],
  });

  return element;
});

export namespace ComboboxChipRemove {
  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }
}
