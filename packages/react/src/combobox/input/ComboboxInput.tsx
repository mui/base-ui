'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';
import { useEventCallback } from '../../utils/useEventCallback';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { fieldValidityMapping } from '../../field/utils/constants';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

/**
 * A text input to search for items in the list.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const customStyleHookMapping: CustomStyleHookMapping<ComboboxInput.State> = {
  ...triggerOpenStateMapping,
  ...fieldValidityMapping,
};

export const ComboboxInput = React.forwardRef(function ComboboxInput(
  componentProps: ComboboxInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { render, className, disabled: disabledProp = false, ...elementProps } = componentProps;

  const {
    state: fieldState,
    disabled: fieldDisabled,
    labelId,
    setTouched,
    setFocused,
    validationMode,
  } = useFieldRootContext();
  const {
    store,
    setValue,
    valuesRef,
    setOpen,
    keyboardActiveRef,
    onItemHighlighted,
    multiple,
    disabled: comboboxDisabled,
    fieldControlValidation,
  } = useComboboxRootContext();

  const triggerProps = useSelector(store, selectors.triggerProps);
  const open = useSelector(store, selectors.open);
  const activeIndex = useSelector(store, selectors.activeIndex);
  const value = useSelector(store, selectors.value);

  const disabled = fieldDisabled || comboboxDisabled || disabledProp;

  const setTriggerElement = useEventCallback((element) => {
    store.set('triggerElement', element);
  });

  const state: ComboboxInput.State = React.useMemo(
    () => ({
      ...fieldState,
      valid: fieldState.valid ?? true,
      open,
      disabled,
    }),
    [fieldState, open, disabled],
  );

  const [inputValue, setInputValue] = React.useState(value);

  useModernLayoutEffect(() => {
    setInputValue(value);
  }, [value]);

  const element = useRenderElement('input', componentProps, {
    state,
    ref: [forwardedRef, setTriggerElement],
    props: [
      triggerProps,
      {
        value: inputValue,
        'aria-disabled': disabled || undefined,
        'aria-labelledby': labelId,
        onChange(event) {
          setInputValue(event.target.value);
          store.set('activeIndex', null);
          if (activeIndex !== null) {
            onItemHighlighted(undefined, keyboardActiveRef.current ? 'keyboard' : 'pointer');
          }
        },
        onFocus() {
          setFocused(true);
        },
        onBlur() {
          setTouched(true);
          setFocused(false);

          if (validationMode === 'onBlur') {
            fieldControlValidation.commitValidation(value);
          }
        },
        onKeyDown(event) {
          keyboardActiveRef.current = true;

          // Printable characters
          if (
            event.key === 'Backspace' ||
            (event.key.length === 1 &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.altKey &&
              !event.shiftKey)
          ) {
            setOpen(true, event.nativeEvent, undefined);
            store.set('activeIndex', null);
            if (activeIndex !== null) {
              onItemHighlighted(undefined, keyboardActiveRef.current ? 'keyboard' : 'pointer');
            }
          }

          if (activeIndex === null) {
            return;
          }

          if (event.key === 'Enter') {
            event.preventDefault();
            setValue(valuesRef.current[activeIndex], event.nativeEvent, 'item-press');
            if (!multiple) {
              setOpen(false, event.nativeEvent, 'item-press');
            }
          }
        },
        onPointerMove() {
          keyboardActiveRef.current = false;
        },
        onPointerDown() {
          keyboardActiveRef.current = false;
        },
      },
      fieldControlValidation.getValidationProps(elementProps),
    ],
    customStyleHookMapping,
  });

  return element;
});

export namespace ComboboxInput {
  export interface State {
    /**
     * Whether the combobox popup is open.
     */
    open: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the field has been touched.
     */
    touched: boolean;
    /**
     * Whether the field value has been modified.
     */
    dirty: boolean;
    /**
     * Whether the field is valid.
     */
    valid: boolean;
    /**
     * Whether the field has a value.
     */
    filled: boolean;
    /**
     * Whether the field is focused.
     */
    focused: boolean;
  }

  export interface Props extends BaseUIComponentProps<'input', State> {
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
  }
}
