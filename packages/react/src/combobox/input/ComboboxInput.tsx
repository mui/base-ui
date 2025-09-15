'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxInputValueContext, useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { fieldValidityMapping } from '../../field/utils/constants';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useComboboxChipsContext } from '../chips/ComboboxChipsContext';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { stopEvent } from '../../floating-ui-react/utils';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';
import { createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';

const stateAttributesMapping: StateAttributesMapping<ComboboxInput.State> = {
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
  const comboboxChipsContext = useComboboxChipsContext();
  const hasPositionerParent = Boolean(useComboboxPositionerContext(true));
  const store = useComboboxRootContext();

  const comboboxDisabled = useStore(store, selectors.disabled);
  const readOnly = useStore(store, selectors.readOnly);
  const fieldControlValidation = useStore(store, selectors.fieldControlValidation);
  const openOnInputClick = useStore(store, selectors.openOnInputClick);
  const name = useStore(store, selectors.name);
  const selectionMode = useStore(store, selectors.selectionMode);
  const autoHighlight = useStore(store, selectors.autoHighlight);
  const inputProps = useStore(store, selectors.inputProps);
  const triggerProps = useStore(store, selectors.triggerProps);
  const open = useStore(store, selectors.open);
  const selectedValue = useStore(store, selectors.selectedValue);

  // `inputValue` can't be placed in the store.
  // https://github.com/mui/base-ui/issues/2703
  const inputValue = useComboboxInputValueContext();

  const disabled = fieldDisabled || comboboxDisabled || disabledProp;

  const [composingValue, setComposingValue] = React.useState<string | null>(null);
  const isComposingRef = React.useRef(false);

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
        store.state.setIndices({ activeIndex: null, selectedIndex: null, type: 'keyboard' });
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
      store.state.setIndices({ activeIndex: null, selectedIndex: null, type: 'keyboard' });
      event.preventDefault();
    }

    return nextIndex;
  }

  const element = useRenderElement('input', componentProps, {
    state,
    ref: [forwardedRef, store.state.inputRef, setInputElement],
    props: [
      inputProps,
      triggerProps,
      {
        type: 'text',
        value: componentProps.value ?? composingValue ?? inputValue,
        'aria-readonly': readOnly || undefined,
        'aria-labelledby': labelId,
        disabled,
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
            fieldControlValidation?.commitValidation(valueToValidate);
          }
        },
        onCompositionStart(event) {
          isComposingRef.current = true;
          setComposingValue(event.currentTarget.value);
        },
        onCompositionEnd(event) {
          isComposingRef.current = false;
          const next = event.currentTarget.value;
          setComposingValue(null);
          store.state.setInputValue(
            next,
            createBaseUIEventDetails('input-change', event.nativeEvent),
          );
        },
        onChange(event: React.ChangeEvent<HTMLInputElement>) {
          // During IME composition, avoid propagating controlled updates to preserve
          // its state.
          if (isComposingRef.current) {
            const nextVal = event.currentTarget.value;
            setComposingValue(nextVal);

            if (nextVal === '' && !openOnInputClick && !hasPositionerParent) {
              store.state.setOpen(
                false,
                createBaseUIEventDetails('input-clear', event.nativeEvent),
              );
            }

            if (!readOnly && !disabled) {
              const trimmed = nextVal.trim();
              if (trimmed !== '') {
                store.state.setOpen(true, createBaseUIEventDetails('none', event.nativeEvent));
                if (!autoHighlight) {
                  store.state.setIndices({
                    activeIndex: null,
                    selectedIndex: null,
                    type: store.state.keyboardActiveRef.current ? 'keyboard' : 'pointer',
                  });
                }
              }
            }

            if (
              open &&
              store.state.activeIndex !== null &&
              !(autoHighlight && nextVal.trim() !== '')
            ) {
              store.state.setIndices({
                activeIndex: null,
                selectedIndex: null,
                type: store.state.keyboardActiveRef.current ? 'keyboard' : 'pointer',
              });
            }

            return;
          }

          store.state.setInputValue(
            event.currentTarget.value,
            createBaseUIEventDetails('input-change', event.nativeEvent),
          );

          if (event.currentTarget.value === '' && !openOnInputClick && !hasPositionerParent) {
            store.state.setOpen(false, createBaseUIEventDetails('input-clear', event.nativeEvent));
          }

          if (!readOnly && !disabled) {
            const trimmed = event.currentTarget.value.trim();
            if (trimmed !== '') {
              store.state.setOpen(true, createBaseUIEventDetails('none', event.nativeEvent));
              // When autoHighlight is enabled, keep the highlight (will be set to 0 in root).
              if (!autoHighlight) {
                store.state.setIndices({
                  activeIndex: null,
                  selectedIndex: null,
                  type: store.state.keyboardActiveRef.current ? 'keyboard' : 'pointer',
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
            !(autoHighlight && event.currentTarget.value.trim() !== '')
          ) {
            store.state.setIndices({
              activeIndex: null,
              selectedIndex: null,
              type: store.state.keyboardActiveRef.current ? 'keyboard' : 'pointer',
            });
          }
        },
        onKeyDown(event) {
          if (disabled || readOnly) {
            return;
          }

          if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
            return;
          }

          store.state.keyboardActiveRef.current = true;

          if (event.key === 'Home') {
            stopEvent(event);
            event.currentTarget.setSelectionRange(0, 0);
            return;
          }

          if (event.key === 'End') {
            stopEvent(event);
            const length = event.currentTarget.value.length;
            event.currentTarget.setSelectionRange(length, length);
            return;
          }

          if (!open && event.key === 'Escape') {
            const isClear =
              selectionMode === 'multiple' && Array.isArray(selectedValue)
                ? selectedValue.length === 0
                : selectedValue === null;

            const details = createBaseUIEventDetails('none', event.nativeEvent);
            const value = selectionMode === 'multiple' ? [] : null;
            store.state.setInputValue('', details);
            store.state.setSelectedValue(value, details);

            if (!isClear && !store.state.inline && !details.isPropagationAllowed) {
              event.stopPropagation();
            }

            return;
          }

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
            store.state.setIndices({
              activeIndex: null,
              selectedIndex: null,
              type: store.state.keyboardActiveRef.current ? 'keyboard' : 'pointer',
            });
            store.state.setSelectedValue(
              newValue,
              createBaseUIEventDetails('none', event.nativeEvent),
            );
            return;
          }

          const nextIndex = handleKeyDown(event);

          comboboxChipsContext?.setHighlightedChipIndex(nextIndex);

          if (nextIndex !== undefined) {
            comboboxChipsContext?.chipsRef.current[nextIndex]?.focus();
          } else {
            store.state.inputRef.current?.focus();
          }

          // event.isComposing
          if (event.which === 229) {
            return;
          }

          if (event.key === 'Enter' && open) {
            stopEvent(event);

            if (store.state.activeIndex === null) {
              store.state.setOpen(false, createBaseUIEventDetails('none', event.nativeEvent));
              return;
            }

            store.state.handleSelection(event.nativeEvent);
          }
        },
        onPointerMove() {
          store.state.keyboardActiveRef.current = false;
        },
        onPointerDown() {
          store.state.keyboardActiveRef.current = false;
        },
      },
      fieldControlValidation
        ? fieldControlValidation.getValidationProps(elementProps)
        : elementProps,
    ],
    stateAttributesMapping,
  });

  return element;
});

export namespace ComboboxInput {
  export interface State extends FieldRoot.State {
    /**
     * Whether the popup is open.
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
