'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { selectors } from '../store';
import { useButton } from '../../use-button';
import { useFieldRootContext } from '../../field/root/FieldRootContext';

/**
 * Clears the input and selected value when clicked.
 * Only renders when in single select mode and the input value is not empty.
 */
export const ComboboxClear = React.forwardRef(function ComboboxClear(
  componentProps: ComboboxClear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    nativeButton = true,
    ...elementProps
  } = componentProps;

  const {
    setInputValue,
    setSelectedValue,
    inputRef,
    store,
    selectionMode,
    disabled: comboboxDisabled,
    readOnly,
    clearRef,
    onItemHighlighted,
  } = useComboboxRootContext();
  const { disabled: fieldDisabled } = useFieldRootContext();

  const open = useStore(store, selectors.open);
  const selectedValue = useStore(store, selectors.selectedValue);

  const shouldRender = selectionMode === 'single' ? Boolean(selectedValue) : false;

  const disabled = fieldDisabled || comboboxDisabled || disabledProp;

  const { buttonRef, getButtonProps } = useButton({
    native: nativeButton,
    disabled,
    focusableWhenDisabled: true,
  });

  const state: ComboboxClear.State = React.useMemo(
    () => ({
      disabled,
      open,
    }),
    [disabled, open],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    enabled: shouldRender,
    ref: [forwardedRef, buttonRef, clearRef],
    props: [
      {
        disabled,
        'aria-readonly': readOnly || undefined,
        onMouseDown(event) {
          if (disabled || readOnly) {
            return;
          }
          event.preventDefault();
        },
        onClick(event) {
          if (disabled || readOnly) {
            return;
          }
          setInputValue('', event.nativeEvent, 'clear-press');
          setSelectedValue(undefined, event.nativeEvent, 'clear-press');
          store.apply({ activeIndex: null, selectedIndex: null });
          inputRef.current?.focus();
          onItemHighlighted(undefined, { type: 'none', index: -1 });
        },
      },
      elementProps,
      getButtonProps,
    ],
  });

  if (!shouldRender) {
    return null;
  }

  return element;
});

export namespace ComboboxClear {
  export interface State {
    /**
     * Whether the combobox popup is open.
     */
    open: boolean;
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
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
  }
}
