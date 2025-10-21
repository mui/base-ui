'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useStore } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { isAndroid, isFirefox } from '@base-ui-components/utils/detectBrowser';
import { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxInputValueContext, useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { fieldValidityMapping } from '../../field/utils/constants';
import { useLabelableContext } from '../../labelable-provider/LabelableContext';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useComboboxChipsContext } from '../chips/ComboboxChipsContext';
import { stopEvent } from '../../floating-ui-react/utils';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { useDirection } from '../../direction-provider/DirectionContext';

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
  const {
    render,
    className,
    disabled: disabledProp = false,
    id: idProp,
    ...elementProps
  } = componentProps;

  const {
    state: fieldState,
    disabled: fieldDisabled,
    setTouched,
    setFocused,
    validationMode,
  } = useFieldRootContext();
  const { labelId } = useLabelableContext();
  const comboboxChipsContext = useComboboxChipsContext();
  const hasPositionerParent = Boolean(useComboboxPositionerContext(true));
  const store = useComboboxRootContext();

  const direction = useDirection();

  const comboboxDisabled = useStore(store, selectors.disabled);
  const readOnly = useStore(store, selectors.readOnly);
  const fieldControlValidation = useStore(store, selectors.fieldControlValidation);
  const openOnInputClick = useStore(store, selectors.openOnInputClick);
  const name = useStore(store, selectors.name);
  const selectionMode = useStore(store, selectors.selectionMode);
  const autoHighlightMode = useStore(store, selectors.autoHighlight);
  const inputProps = useStore(store, selectors.inputProps);
  const triggerProps = useStore(store, selectors.triggerProps);
  const open = useStore(store, selectors.open);
  const selectedValue = useStore(store, selectors.selectedValue);
  const autoHighlightEnabled = Boolean(autoHighlightMode);

  const id = useBaseUiId(idProp);

  // `inputValue` can't be placed in the store.
  // https://github.com/mui/base-ui/issues/2703
  const inputValue = useComboboxInputValueContext();

  const disabled = fieldDisabled || comboboxDisabled || disabledProp;

  const [composingValue, setComposingValue] = React.useState<string | null>(null);
  const isComposingRef = React.useRef(false);

  const setInputElement = useEventCallback((element) => {
    // The search filter for the input-inside-popup pattern should be empty initially.
    if (hasPositionerParent && !store.state.hasInputValue) {
      store.state.setInputValue('', createChangeEventDetails('none'));
    }

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
        id,
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
          if (isAndroid) {
            return;
          }
          isComposingRef.current = true;
          setComposingValue(event.currentTarget.value);
        },
        onCompositionEnd(event) {
          isComposingRef.current = false;
          const next = event.currentTarget.value;
          setComposingValue(null);
          store.state.setInputValue(
            next,
            createChangeEventDetails('input-change', event.nativeEvent),
          );
        },
        onChange(event: React.ChangeEvent<HTMLInputElement>) {
          // During IME composition, avoid propagating controlled updates to prevent
          // filtering the options prematurely so `Empty` won't show incorrectly.
          // We can't rely on this check for Android due to how it handles composition
          // events with some keyboards (e.g. Samsung keyboard with predictive text on
          // treats all text as always-composing).
          // https://github.com/mui/base-ui/issues/2942
          if (isComposingRef.current) {
            const nextVal = event.currentTarget.value;
            setComposingValue(nextVal);

            if (nextVal === '' && !openOnInputClick && !hasPositionerParent) {
              store.state.setOpen(
                false,
                createChangeEventDetails('input-clear', event.nativeEvent),
              );
            }

            const trimmed = nextVal.trim();
            const shouldMaintainHighlight = autoHighlightEnabled && trimmed !== '';

            if (!readOnly && !disabled) {
              if (trimmed !== '') {
                store.state.setOpen(
                  true,
                  createChangeEventDetails('input-change', event.nativeEvent),
                );
                if (!autoHighlightEnabled) {
                  store.state.setIndices({
                    activeIndex: null,
                    selectedIndex: null,
                    type: store.state.keyboardActiveRef.current ? 'keyboard' : 'pointer',
                  });
                }
              }
            }

            if (open && store.state.activeIndex !== null && !shouldMaintainHighlight) {
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
            createChangeEventDetails('input-change', event.nativeEvent),
          );

          const empty = event.currentTarget.value === '';
          const clearDetails = createChangeEventDetails('input-clear', event.nativeEvent);

          if (empty && !hasPositionerParent) {
            if (selectionMode === 'single') {
              store.state.setSelectedValue(null, clearDetails);
            }

            if (!openOnInputClick) {
              store.state.setOpen(false, clearDetails);
            }
          }

          const trimmed = event.currentTarget.value.trim();
          if (!readOnly && !disabled) {
            if (trimmed !== '') {
              store.state.setOpen(
                true,
                createChangeEventDetails('input-change', event.nativeEvent),
              );
              // When autoHighlight is enabled, keep the highlight (will be set to 0 in root).
              if (!autoHighlightEnabled) {
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
          if (open && store.state.activeIndex !== null && !autoHighlightEnabled) {
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
          const input = event.currentTarget;
          const scrollAmount = input.scrollWidth - input.clientWidth;
          const isRTL = direction === 'rtl';

          if (event.key === 'Home') {
            stopEvent(event);
            const cursor = isFirefox && isRTL ? input.value.length : 0;
            input.setSelectionRange(cursor, cursor);
            input.scrollLeft = 0;
            return;
          }

          if (event.key === 'End') {
            stopEvent(event);
            const cursor = isFirefox && isRTL ? 0 : input.value.length;
            input.setSelectionRange(cursor, cursor);
            input.scrollLeft = isRTL ? -scrollAmount : scrollAmount;
            return;
          }

          if (!open && event.key === 'Escape') {
            const isClear =
              selectionMode === 'multiple' && Array.isArray(selectedValue)
                ? selectedValue.length === 0
                : selectedValue === null;

            const details = createChangeEventDetails('escape-key', event.nativeEvent);
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
            input.value === '' &&
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
              createChangeEventDetails('none', event.nativeEvent),
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
            const activeIndex = store.state.activeIndex;
            const nativeEvent = event.nativeEvent;

            if (activeIndex === null) {
              store.state.setOpen(false, createChangeEventDetails('none', nativeEvent));
              return;
            }

            const selectActiveItem = () => {
              const listItem = store.state.listRef.current[activeIndex];

              if (listItem) {
                store.state.selectionEventRef.current = nativeEvent;
                listItem.click();
                store.state.selectionEventRef.current = null;
                return;
              }

              store.state.handleSelection(nativeEvent);
            };

            if (store.state.alwaysSubmitOnEnter) {
              // Commit the input value update synchronously so the form reads the committed value.
              ReactDOM.flushSync(selectActiveItem);
              return;
            }

            stopEvent(event);
            selectActiveItem();
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

export interface ComboboxInputState extends FieldRoot.State {
  /**
   * Whether the popup is open.
   */
  open: boolean;
}

export interface ComboboxInputProps extends BaseUIComponentProps<'input', ComboboxInput.State> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
}

export namespace ComboboxInput {
  export type State = ComboboxInputState;
  export type Props = ComboboxInputProps;
}
