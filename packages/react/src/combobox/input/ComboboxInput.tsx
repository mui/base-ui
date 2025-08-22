'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { fieldValidityMapping } from '../../field/utils/constants';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useComboboxChipsContext } from '../chips/ComboboxChipsContext';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { stopEvent } from '../../floating-ui-react/utils';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';

const customStyleHookMapping: CustomStyleHookMapping<ComboboxInput.State> = {
  ...triggerOpenStateMapping,
  ...fieldValidityMapping,
};

/**
 * A text input to search for items in the list.
 * Renders an `<input>` element.
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
    openOnInputClick,
    name,
    selectionMode,
  } = useComboboxRootContext();
  const comboboxChipsContext = useComboboxChipsContext();
  const hasPositionerParent = Boolean(useComboboxPositionerContext(true));

  const inputProps = useStore(store, selectors.inputProps);
  const open = useStore(store, selectors.open);
  const activeIndex = useStore(store, selectors.activeIndex);
  const selectedValue = useStore(store, selectors.selectedValue);
  const inputValue = useStore(store, selectors.inputValue);

  const disabled = fieldDisabled || comboboxDisabled || disabledProp;

  const setAnchorElement = useEventCallback((element) => {
    // Combobox.Trigger is the anchor element for Combobox.Positioner
    if (hasPositionerParent) {
      return;
    }

    store.set('anchorElement', element);
  });

  const setInputElement = useEventCallback((element) => {
    store.set('inputElement', element);
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
        store.apply({ selectedIndex: null, activeIndex: null });
        onItemHighlighted(undefined, { type: 'keyboard', index: -1 });
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
      store.apply({ selectedIndex: null, activeIndex: null });
      onItemHighlighted(undefined, { type: 'keyboard', index: -1 });
      event.preventDefault();
    }

    return nextIndex;
  }

  const element = useRenderElement('input', componentProps, {
    state,
    ref: [forwardedRef, setAnchorElement, inputRef, setInputElement],
    props: [
      inputProps,
      {
        value: componentProps.value ?? inputValue,
        'aria-readonly': readOnly || undefined,
        'aria-labelledby': labelId,
        disabled: disabled || undefined,
        readOnly,
        ...(selectionMode === 'none' && name && { name }),
        onFocus() {
          setFocused(true);
        },
        onBlur() {
          setTouched(true);
          setFocused(false);

          if (validationMode === 'onBlur') {
            const valueToValidate = selectionMode === 'none' ? inputValue : selectedValue;
            fieldControlValidation.commitValidation(valueToValidate);
          }
        },
        onChange(event: React.ChangeEvent<HTMLInputElement>) {
          setInputValue(event.currentTarget.value, event.nativeEvent, 'input-change');

          if (event.currentTarget.value === '' && !openOnInputClick && !hasPositionerParent) {
            setOpen(false, event.nativeEvent, undefined);
          }

          if (!readOnly && !disabled) {
            const trimmed = event.currentTarget.value.trim();
            if (trimmed !== '') {
              setOpen(true, event.nativeEvent, undefined);
              store.apply({ activeIndex: null, selectedIndex: null });
              if (activeIndex !== null) {
                onItemHighlighted(undefined, {
                  type: keyboardActiveRef.current ? 'keyboard' : 'pointer',
                  index: -1,
                });
              }
            }
          }

          // When the user types, ensure the list resets its highlight so that
          // virtual focus returns to the input (aria-activedescendant is
          // cleared).
          if (open && activeIndex !== null) {
            store.apply({ activeIndex: null, selectedIndex: null });
            onItemHighlighted(undefined, {
              type: keyboardActiveRef.current ? 'keyboard' : 'pointer',
              index: -1,
            });
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
            // If the removed item was also the active (highlighted) item, clear highlight
            store.apply({ selectedIndex: null, activeIndex: null });
            onItemHighlighted(undefined, { type: 'keyboard', index: -1 });
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

          if (event.key === 'Enter') {
            stopEvent(event);

            if (activeIndex === null) {
              setOpen(false, event.nativeEvent, undefined);
              return;
            }

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
