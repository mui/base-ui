'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';
import {
  pressableTriggerOpenStateMapping,
  triggerOpenStateMapping,
} from '../../utils/popupStateMapping';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { fieldValidityMapping } from '../../field/utils/constants';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useComboboxChipsContext } from '../chips/ComboboxChipsContext';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { stopEvent } from '../../floating-ui-react/utils';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';
import { createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';

const customStyleHookMapping: CustomStyleHookMapping<ComboboxInput.State> = {
  ...triggerOpenStateMapping,
  ...pressableTriggerOpenStateMapping,
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
    setIndices,
    disabled: comboboxDisabled,
    readOnly,
    fieldControlValidation,
    inputRef,
    setInputValue,
    handleEnterSelection,
    openOnInputClick,
    name,
    selectionMode,
    autoHighlight,
  } = useComboboxRootContext();
  const comboboxChipsContext = useComboboxChipsContext();
  const hasPositionerParent = Boolean(useComboboxPositionerContext(true));

  const inputProps = useStore(store, selectors.inputProps);
  const open = useStore(store, selectors.open);
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
    store.apply({
      inputElement: element,
      inputInsidePopup: hasPositionerParent,
    });
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
        setIndices({ activeIndex: null, selectedIndex: null, type: 'keyboard' });
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
      setIndices({ activeIndex: null, selectedIndex: null, type: 'keyboard' });
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
          setInputValue(
            event.currentTarget.value,
            createBaseUIEventDetails('input-change', event.nativeEvent),
          );

          if (event.currentTarget.value === '' && !openOnInputClick && !hasPositionerParent) {
            setOpen(false, createBaseUIEventDetails('input-clear', event.nativeEvent));
          }

          if (!readOnly && !disabled) {
            const trimmed = event.currentTarget.value.trim();
            if (trimmed !== '') {
              setOpen(true, createBaseUIEventDetails('none', event.nativeEvent));
              // When autoHighlight is enabled for autocomplete, keep the highlight (will be set to 0 in root).
              if (!(selectionMode === 'none' && autoHighlight)) {
                setIndices({
                  activeIndex: null,
                  selectedIndex: null,
                  type: keyboardActiveRef.current ? 'keyboard' : 'pointer',
                });
              }
            }
          }

          // When the user types, ensure the list resets its highlight so that
          // virtual focus returns to the input (aria-activedescendant is
          // cleared).
          if (
            open &&
            store.state.activeIndex !== null &&
            !(selectionMode === 'none' && autoHighlight && event.currentTarget.value.trim() !== '')
          ) {
            setIndices({
              activeIndex: null,
              selectedIndex: null,
              type: keyboardActiveRef.current ? 'keyboard' : 'pointer',
            });
          }
        },
        onKeyDown(event) {
          if (disabled || readOnly) {
            return;
          }

          if (!open && event.key === 'Escape') {
            const details = createBaseUIEventDetails('none', event.nativeEvent);
            const value = selectionMode === 'multiple' ? [] : null;
            setInputValue('', details);
            setSelectedValue(value, details);

            if (!details.isPropagationAllowed) {
              event.stopPropagation();
            }

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
            setIndices({
              activeIndex: null,
              selectedIndex: null,
              type: keyboardActiveRef.current ? 'keyboard' : 'pointer',
            });
            setSelectedValue(newValue, createBaseUIEventDetails('none', event.nativeEvent));
            return;
          }

          const nextIndex = handleKeyDown(event);

          comboboxChipsContext?.setHighlightedChipIndex(nextIndex);

          if (nextIndex !== undefined) {
            comboboxChipsContext?.chipsRef.current[nextIndex]?.focus();
          } else {
            inputRef.current?.focus();
          }

          // event.isComposing
          if (event.which === 229) {
            return;
          }

          if (event.key === 'Enter' && open) {
            stopEvent(event);

            if (store.state.activeIndex === null) {
              setOpen(false, createBaseUIEventDetails('none', event.nativeEvent));
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
