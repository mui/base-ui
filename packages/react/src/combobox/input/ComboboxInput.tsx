'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { platform } from '@base-ui/utils/platform';
import type { BaseUIComponentProps } from '../../internals/types';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useRenderElement } from '../../internals/useRenderElement';
import { useComboboxInputValueContext, useComboboxRootContext } from '../root/ComboboxRootContext';
import { triggerStateAttributesMapping } from '../utils/stateAttributesMapping';
import type { FieldRootState } from '../../field/root/FieldRoot';
import {
  DEFAULT_FIELD_ROOT_CONTEXT,
  FieldRootContext,
  useFieldRootContext,
} from '../../internals/field-root-context/FieldRootContext';
import { useSetFieldFocused } from '../../internals/field-root-context/useSetFieldFocused';
import { DEFAULT_FIELD_STATE_ATTRIBUTES } from '../../internals/field-constants/constants';
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext';
import { useComboboxChipsContext } from '../chips/ComboboxChipsContext';
import { stopEvent } from '../../floating-ui-react/utils';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { getHighlightReason } from '../../utils/getHighlightReason';
import type { Side } from '../../internals/useAnchorPositioning';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import { ComboboxInternalDismissButton } from '../utils/ComboboxInternalDismissButton';
import {
  clickHighlightedItem,
  getChipNavigationKeys,
  useListEmpty,
  usePopupSide,
} from '../utils/parts';

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
  const {
    render,
    className,
    disabled: disabledProp = false,
    id: idProp,
    style,
    ...elementProps
  } = componentProps;

  const {
    state: fieldState,
    disabled: fieldDisabled,
    setTouched,
    validationMode,
    validation,
  } = useFieldRootContext();
  const { labelId: fieldLabelId } = useLabelableContext();
  const comboboxChipsContext = useComboboxChipsContext();
  const positioning = useComboboxPositionerContext(true);
  const hasPositionerParent = Boolean(positioning);
  const store = useComboboxRootContext();
  // `inputValue` can't be placed in the store.
  // https://github.com/mui/base-ui/issues/2703
  const inputValue = useComboboxInputValueContext();
  const direction = useDirection();

  const required = store.useState('required');
  const comboboxDisabled = store.useState('disabled');
  const readOnly = store.useState('readOnly');
  const name = store.useState('name');
  const form = store.useState('form');
  const selectionMode = store.useState('selectionMode');
  const autoHighlightMode = store.useState('autoHighlight');
  const inputProps = store.useState('inputProps');
  const triggerProps = store.useState('triggerProps');
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const selectedValue = store.useState('selectedValue');
  const rootId = store.useState('id');
  const inline = store.useState('inline');
  const modal = store.useState('modal');

  const autoHighlightEnabled = Boolean(autoHighlightMode);
  const popupSide = usePopupSide(store);
  const disabled = fieldDisabled || comboboxDisabled || disabledProp;
  const listEmpty = useListEmpty();

  const setFocused = useSetFieldFocused(disabled, store.context.inputRef);

  const isInsidePopup = hasPositionerParent || inline;
  const focusManagerModal = !isInsidePopup || modal;
  const id = useBaseUiId(idProp ?? (!isInsidePopup ? rootId : undefined));
  const fieldStateForInput = hasPositionerParent ? DEFAULT_FIELD_STATE_ATTRIBUTES : fieldState;

  const [composingValue, setComposingValue] = React.useState<string | null>(null);
  const isComposingRef = React.useRef(false);
  const lastActiveIndexRef = React.useRef<number | null>(null);

  // Restore the saved highlight on refocus only within the same open cycle.
  useIsoLayoutEffect(() => {
    if (!open) {
      lastActiveIndexRef.current = null;
    }
  }, [open]);

  const inputOwnsFormValue = selectionMode === 'none' && !hasPositionerParent;

  const setInputElement = useStableCallback((element: HTMLInputElement | null) => {
    const nextIsInsidePopup = hasPositionerParent || store.state.inline;

    if (nextIsInsidePopup && !store.state.hasInputValue) {
      store.context.setInputValue('', createChangeEventDetails(REASONS.none));
    }

    store.update({
      inputElement: element,
      inputInsidePopup: nextIsInsidePopup,
      inputOwnsFormValue,
    });
  });

  const validationProps = hasPositionerParent
    ? elementProps
    : validation.getValidationProps(disabled, elementProps);

  function clearHighlight(event: Event) {
    store.context.setIndices({
      activeIndex: null,
      selectedIndex: null,
      type: getHighlightReason(event),
      event,
    });
  }

  const state: ComboboxInputState = {
    ...fieldStateForInput,
    open,
    disabled,
    readOnly,
    popupSide,
    listEmpty,
  };

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!comboboxChipsContext) {
      return undefined;
    }

    let nextIndex: number | undefined;

    const renderedChipsCount = comboboxChipsContext.chipsRef.current.length;
    const [previousChipKey] = getChipNavigationKeys(direction);

    if (
      event.key === previousChipKey &&
      (event.currentTarget.selectionStart ?? 0) === 0 &&
      selectedValue.length > 0
    ) {
      event.preventDefault();
      nextIndex = renderedChipsCount > 0 ? renderedChipsCount - 1 : undefined;
    }

    return nextIndex;
  }

  const element = useRenderElement('input', componentProps, {
    state,
    ref: [forwardedRef, store.context.inputRef, setInputElement],
    props: [
      inputProps,
      triggerProps,
      {
        value: composingValue ?? inputValue,
        'aria-readonly': readOnly || undefined,
        'aria-required': required || undefined,
        'aria-labelledby': fieldLabelId,
        disabled,
        readOnly,
        required: selectionMode === 'none' ? required : undefined,
        form,
        ...(inputOwnsFormValue && name && { name }),
        id,
        onFocus() {
          setFocused(true);

          if (!inline) {
            return;
          }

          const nextActiveIndex = lastActiveIndexRef.current;
          lastActiveIndexRef.current = null;

          if (
            nextActiveIndex == null ||
            // `valuesRef` can be sparse, so guard against restoring a removed slot.
            !Object.hasOwn(store.context.valuesRef.current, nextActiveIndex)
          ) {
            return;
          }

          store.context.setIndices({ activeIndex: nextActiveIndex });
        },
        onBlur() {
          setTouched(true);
          setFocused(false);

          const activeIndex = store.state.activeIndex;
          if (inline && activeIndex !== null && autoHighlightMode !== 'always') {
            lastActiveIndexRef.current = activeIndex;
            store.context.setIndices({ activeIndex: null });
          }

          if (validationMode === 'onBlur') {
            const valueToValidate = selectionMode === 'none' ? inputValue : selectedValue;
            validation.commit(valueToValidate);
          }
        },
        onCompositionStart(event) {
          if (platform.os.android) {
            return;
          }
          isComposingRef.current = true;
          setComposingValue(event.currentTarget.value);
        },
        onCompositionEnd(event) {
          isComposingRef.current = false;
          const next = event.currentTarget.value;
          setComposingValue(null);
          store.context.setInputValue(
            next,
            createChangeEventDetails(REASONS.inputChange, event.nativeEvent),
          );
        },
        onChange(event) {
          const nativeEvent = event.nativeEvent;
          // Autofill may not provide `inputType` (Chrome) or may report
          // `insertReplacementText` (Firefox).
          const inputType = (nativeEvent as InputEvent).inputType;
          const autofillLikeInput = !inputType || inputType === 'insertReplacementText';
          // During composition the input is always considered typed into.
          const shouldOpenOnInput = isComposingRef.current || !autofillLikeInput;

          function maybeOpenOnInput(trimmed: string) {
            if (readOnly || disabled || !trimmed || !shouldOpenOnInput) {
              return;
            }

            store.context.setOpen(true, createChangeEventDetails(REASONS.inputChange, nativeEvent));
            // When autoHighlight is enabled, keep the highlight (will be set to 0 in root).
            if (!autoHighlightEnabled) {
              clearHighlight(nativeEvent);
            }
          }

          // During IME composition, avoid propagating controlled updates to prevent
          // filtering the options prematurely so `Empty` won't show incorrectly.
          // We can't rely on this check for Android due to how it handles composition
          // events with some keyboards (e.g. Samsung keyboard with predictive text on
          // treats all text as always-composing).
          // https://github.com/mui/base-ui/issues/2942
          if (isComposingRef.current) {
            const nextVal = event.currentTarget.value;
            setComposingValue(nextVal);

            if (nextVal === '' && !store.state.openOnInputClick && !store.state.inputInsidePopup) {
              store.context.setOpen(
                false,
                createChangeEventDetails(REASONS.inputClear, nativeEvent),
              );
            }

            const trimmed = nextVal.trim();
            const shouldMaintainHighlight = autoHighlightEnabled && trimmed !== '';

            maybeOpenOnInput(trimmed);

            if (open && store.state.activeIndex !== null && !shouldMaintainHighlight) {
              clearHighlight(nativeEvent);
            }

            return;
          }

          const inputChangeDetails = createChangeEventDetails(REASONS.inputChange, nativeEvent);
          store.context.setInputValue(event.currentTarget.value, inputChangeDetails);

          if (inputChangeDetails.isCanceled) {
            return;
          }

          const empty = event.currentTarget.value === '';
          const clearDetails = createChangeEventDetails(REASONS.inputClear, nativeEvent);

          if (empty && !store.state.inputInsidePopup) {
            if (selectionMode === 'single') {
              store.context.setSelectedValue(null, clearDetails);
            }

            if (!store.state.openOnInputClick) {
              store.context.setOpen(false, clearDetails);
            }
          }

          maybeOpenOnInput(event.currentTarget.value.trim());

          // When the user types, ensure the list resets its highlight so that
          // virtual focus returns to the input (aria-activedescendant is
          // cleared).
          if (open && store.state.activeIndex !== null && !autoHighlightEnabled) {
            clearHighlight(nativeEvent);
          }
        },
        onKeyDown(event) {
          if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
            return;
          }

          if (disabled || readOnly) {
            // Browsing can highlight an item, and Enter there must not submit the form.
            if (readOnly && event.key === 'Enter' && open && store.state.activeIndex !== null) {
              stopEvent(event);
            }
            return;
          }

          const input = event.currentTarget;
          const scrollAmount = input.scrollWidth - input.clientWidth;
          const isRTL = direction === 'rtl';

          if (event.key === 'Home') {
            stopEvent(event);
            const cursor = platform.engine.gecko && isRTL ? input.value.length : 0;
            input.setSelectionRange(cursor, cursor);
            input.scrollLeft = 0;
            return;
          }

          if (event.key === 'End') {
            stopEvent(event);
            const cursor = platform.engine.gecko && isRTL ? 0 : input.value.length;
            input.setSelectionRange(cursor, cursor);
            input.scrollLeft = isRTL ? -scrollAmount : scrollAmount;
            return;
          }

          if (!mounted && event.key === 'Escape') {
            const isClear =
              selectionMode === 'multiple' && Array.isArray(selectedValue)
                ? selectedValue.length === 0
                : selectedValue === null;

            const details = createChangeEventDetails(REASONS.escapeKey, event.nativeEvent);
            const value = selectionMode === 'multiple' ? [] : null;
            store.context.setInputValue('', details);
            store.context.setSelectedValue(value, details);

            if (!isClear && !store.state.inline && !details.isPropagationAllowed) {
              event.stopPropagation();
            }

            return;
          }

          // Handle deletion when the input is empty.
          if (
            comboboxChipsContext &&
            event.key === 'Backspace' &&
            input.value === '' &&
            Array.isArray(selectedValue) &&
            selectedValue.length > 0
          ) {
            const renderedChipsCount = comboboxChipsContext.chipsRef.current.length;
            const removalIndex =
              renderedChipsCount > 0 ? renderedChipsCount - 1 : selectedValue.length - 1;

            const newValue = selectedValue.filter(
              (_: any, index: number) => index !== removalIndex,
            );
            // If the removed item was also the active (highlighted) item, clear highlight
            clearHighlight(event.nativeEvent);
            store.context.setSelectedValue(
              newValue,
              createChangeEventDetails(REASONS.none, event.nativeEvent),
            );
            return;
          }

          const nextIndex = handleKeyDown(event);

          if (nextIndex !== undefined) {
            comboboxChipsContext?.chipsRef.current[nextIndex]?.focus();
          }

          // event.isComposing
          if (event.which === 229) {
            return;
          }

          if (event.key === 'Enter' && open) {
            const activeIndex = store.state.activeIndex;
            const nativeEvent = event.nativeEvent;

            if (activeIndex === null) {
              if (inline) {
                return;
              }

              // Allow form submission when no item is highlighted.
              store.context.setOpen(false, createChangeEventDetails(REASONS.none, nativeEvent));
              return;
            }

            stopEvent(event);
            clickHighlightedItem(store, activeIndex, nativeEvent);
          }
        },
      },
      validationProps,
    ],
    stateAttributesMapping: triggerStateAttributesMapping,
  });

  const renderedInput = hasPositionerParent ? (
    <FieldRootContext.Provider value={DEFAULT_FIELD_ROOT_CONTEXT}>
      {element}
    </FieldRootContext.Provider>
  ) : (
    element
  );

  return (
    <React.Fragment>
      {open && focusManagerModal && (
        <ComboboxInternalDismissButton ref={store.context.startDismissRef} />
      )}
      {renderedInput}
    </React.Fragment>
  );
});

export interface ComboboxInputState extends FieldRootState {
  /**
   * Whether the corresponding popup is open.
   */
  open: boolean;
  /**
   * Indicates which side the corresponding popup is positioned relative to its anchor.
   */
  popupSide: Side | null;
  /**
   * Present when the corresponding items list is empty.
   */
  listEmpty: boolean;
  /**
   * Whether the component should ignore user edits.
   */
  readOnly: boolean;
}

export interface ComboboxInputProps extends BaseUIComponentProps<'input', ComboboxInputState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace ComboboxInput {
  export type State = ComboboxInputState;
  export type Props = ComboboxInputProps;
}
