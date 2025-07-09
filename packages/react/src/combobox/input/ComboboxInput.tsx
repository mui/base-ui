'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';
import { useEventCallback } from '../../utils/useEventCallback';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { fieldValidityMapping } from '../../field/utils/constants';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useComboboxChipsContext } from '../chips/ComboboxChipsContext';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { stopEvent } from '../../floating-ui-react/utils';

const customStyleHookMapping: CustomStyleHookMapping<ComboboxInput.State> = {
  ...triggerOpenStateMapping,
  ...fieldValidityMapping,
};

/**
 * A text input to search for items in the list.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
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
    setSelectedValue,
    setOpen,
    keyboardActiveRef,
    onItemHighlighted,
    disabled: comboboxDisabled,
    readOnly,
    fieldControlValidation,
    inputRef,
    setInputValue,
    handleEnterSelection,
  } = useComboboxRootContext();
  const comboboxChipsContext = useComboboxChipsContext();

  const triggerProps = useSelector(store, selectors.triggerProps);
  const open = useSelector(store, selectors.open);
  const activeIndex = useSelector(store, selectors.activeIndex);
  const selectedValue = useSelector(store, selectors.selectedValue);
  const inputValue = useSelector(store, selectors.inputValue);

  const disabled = fieldDisabled || comboboxDisabled || disabledProp;

  const setTriggerElement = useEventCallback((element) => {
    store.set('triggerElement', element);
  });

  const state: ComboboxInput.State = React.useMemo(
    () => ({
      ...fieldState,
      open,
      disabled,
      readOnly,
    }),
    [fieldState, open, disabled, readOnly],
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!comboboxChipsContext) {
      return undefined;
    }

    let nextIndex: number | undefined;

    const { highlightedChipIndex } = comboboxChipsContext;

    if (highlightedChipIndex !== undefined) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (highlightedChipIndex > 0) {
          nextIndex = highlightedChipIndex - 1;
        } else {
          nextIndex = undefined;
        }
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (highlightedChipIndex < selectedValue.length - 1) {
          nextIndex = highlightedChipIndex + 1;
        } else {
          nextIndex = undefined;
        }
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        // Move highlight appropriately after removal.
        const computedNextIndex =
          highlightedChipIndex >= selectedValue.length - 1
            ? selectedValue.length - 2
            : highlightedChipIndex;
        // If the computed index is negative, treat it as no highlight.
        nextIndex = computedNextIndex >= 0 ? computedNextIndex : undefined;
      }
      return nextIndex;
    }

    // Handle navigation when no chip is highlighted
    if (
      event.key === 'ArrowLeft' &&
      (event.currentTarget.selectionStart ?? 0) === 0 &&
      selectedValue.length > 0
    ) {
      event.preventDefault();
      const lastChipIndex = Math.max(selectedValue.length - 1, 0);
      nextIndex = lastChipIndex;
    } else if (
      event.key === 'Backspace' &&
      event.currentTarget.value === '' &&
      selectedValue.length > 0
    ) {
      event.preventDefault();
    }

    return nextIndex;
  }

  const element = useRenderElement('input', componentProps, {
    state,
    ref: [forwardedRef, setTriggerElement, inputRef],
    props: [
      triggerProps,
      {
        value: componentProps.value ?? inputValue,
        'aria-readonly': readOnly || undefined,
        'aria-labelledby': labelId,
        disabled: disabled || undefined,
        readOnly,
        onFocus() {
          setFocused(true);
        },
        onBlur() {
          setTouched(true);
          setFocused(false);

          if (validationMode === 'onBlur') {
            fieldControlValidation.commitValidation(selectedValue);
          }
        },
        onChange(event: React.ChangeEvent<HTMLInputElement>) {
          // If consumer didn't control value prop, sync with context
          if (componentProps.value === undefined) {
            setInputValue(event.target.value, event.nativeEvent, 'input-change');
          }
          // When the user types, ensure the list resets its highlight so that
          // virtual focus returns to the input (aria-activedescendant is
          // cleared).
          if (open && activeIndex !== null) {
            store.set('activeIndex', null);
            onItemHighlighted(undefined, keyboardActiveRef.current ? 'keyboard' : 'pointer');
          }
        },
        onKeyDown(event) {
          if (readOnly) {
            return;
          }

          keyboardActiveRef.current = true;

          // Handle deletion when no chip is highlighted and the input is empty.
          if (
            comboboxChipsContext &&
            event.key === 'Backspace' &&
            event.currentTarget.value === '' &&
            comboboxChipsContext.highlightedChipIndex === undefined &&
            Array.isArray(selectedValue) &&
            selectedValue.length > 0
          ) {
            const newValue = selectedValue.slice(0, -1);
            setSelectedValue(newValue, event.nativeEvent, undefined);
            return;
          }

          const nextIndex = handleKeyDown(event);

          comboboxChipsContext?.setHighlightedChipIndex(nextIndex);

          if (nextIndex !== undefined) {
            comboboxChipsContext?.chipsRef.current[nextIndex]?.focus();
          } else {
            inputRef.current?.focus();
          }

          // Printable characters
          if (
            !disabled &&
            (event.key === 'Backspace' ||
              (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey))
          ) {
            setOpen(true, event.nativeEvent, undefined);
            store.set('activeIndex', null);
            store.set('selectedIndex', null);
            if (activeIndex !== null) {
              onItemHighlighted(undefined, keyboardActiveRef.current ? 'keyboard' : 'pointer');
            }
          }

          if (activeIndex === null) {
            return;
          }

          if (event.key === 'Enter') {
            stopEvent(event);
            handleEnterSelection(event.nativeEvent);
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
  export interface State extends FieldRoot.State {
    /**
     * Whether the combobox popup is open.
     */
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'input', State> {
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
  }
}
