'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { useComboboxInputValueContext, useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useLabelableContext } from '../../labelable-provider/LabelableContext';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { stopEvent } from '../../floating-ui-react/utils';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { fieldValidityMapping } from '../../field/utils/constants';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';

const stateAttributesMapping: StateAttributesMapping<ComboboxTrigger.State> = {
  ...pressableTriggerOpenStateMapping,
  ...fieldValidityMapping,
};

/**
 * A button that opens the popup.
 * Renders a `<button>` element.
 */
export const ComboboxTrigger = React.forwardRef(function ComboboxTrigger(
  componentProps: ComboboxTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    nativeButton = true,
    disabled: disabledProp = false,
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
  const store = useComboboxRootContext();

  const selectionMode = useStore(store, selectors.selectionMode);
  const fieldControlValidation = useStore(store, selectors.fieldControlValidation);
  const comboboxDisabled = useStore(store, selectors.disabled);
  const readOnly = useStore(store, selectors.readOnly);
  const listElement = useStore(store, selectors.listElement);
  const triggerProps = useStore(store, selectors.triggerProps);
  const typeaheadTriggerProps = useStore(store, selectors.typeaheadTriggerProps);
  const inputInsidePopup = useStore(store, selectors.inputInsidePopup);
  const open = useStore(store, selectors.open);
  const selectedValue = useStore(store, selectors.selectedValue);

  const inputValue = useComboboxInputValueContext();

  const disabled = fieldDisabled || comboboxDisabled || disabledProp;

  const focusTimeout = useTimeout();

  const currentPointerTypeRef = React.useRef<PointerEvent['pointerType']>('');

  function trackPointerType(event: React.PointerEvent) {
    currentPointerTypeRef.current = event.pointerType;
  }

  const { buttonRef, getButtonProps } = useButton({
    native: nativeButton,
    disabled,
  });

  const state: ComboboxTrigger.State = React.useMemo(
    () => ({
      ...fieldState,
      open,
      disabled,
    }),
    [fieldState, open, disabled],
  );

  const setTriggerElement = useStableCallback((element) => {
    store.set('triggerElement', element);
  });

  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef, setTriggerElement],
    state,
    props: [
      triggerProps,
      typeaheadTriggerProps,
      {
        tabIndex: inputInsidePopup ? 0 : -1,
        disabled,
        role: inputInsidePopup ? 'combobox' : undefined,
        'aria-expanded': open ? 'true' : 'false',
        'aria-haspopup': inputInsidePopup ? 'dialog' : 'listbox',
        'aria-controls': open ? listElement?.id : undefined,
        'aria-readonly': readOnly || undefined,
        'aria-labelledby': labelId,
        onPointerDown: trackPointerType,
        onPointerEnter: trackPointerType,
        onFocus() {
          setFocused(true);

          if (disabled || readOnly) {
            return;
          }

          focusTimeout.start(0, store.state.forceMount);
        },
        onBlur() {
          setTouched(true);
          setFocused(false);

          if (validationMode === 'onBlur') {
            const valueToValidate = selectionMode === 'none' ? inputValue : selectedValue;
            fieldControlValidation.commitValidation(valueToValidate);
          }
        },
        onMouseDown(event) {
          if (disabled || readOnly) {
            return;
          }

          // Ensure items are registered for initial selection highlight.
          store.state.forceMount();

          if (!store.state.inputInsidePopup) {
            event.preventDefault();
          }
        },
        onClick(event) {
          if (disabled || readOnly) {
            return;
          }

          const nextOpen = !open;
          store.state.setOpen(
            nextOpen,
            createChangeEventDetails('trigger-press', event.nativeEvent),
          );

          if (nextOpen && currentPointerTypeRef.current !== 'touch') {
            store.state.inputRef.current?.focus();
          }
        },
        onKeyDown(event) {
          if (disabled || readOnly) {
            return;
          }

          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            stopEvent(event);
            store.state.setOpen(
              true,
              createChangeEventDetails('list-navigation', event.nativeEvent),
            );
            store.state.inputRef.current?.focus();
          }
        },
      },
      fieldControlValidation
        ? fieldControlValidation.getValidationProps(elementProps)
        : elementProps,
      getButtonProps,
    ],
    stateAttributesMapping,
  });

  return element;
});

export interface ComboboxTriggerState extends FieldRoot.State {
  /**
   * Whether the popup is open.
   */
  open: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface ComboboxTriggerProps
  extends NativeButtonProps,
    BaseUIComponentProps<'button', ComboboxTrigger.State> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
}

export namespace ComboboxTrigger {
  export type State = ComboboxTriggerState;
  export type Props = ComboboxTriggerProps;
}
