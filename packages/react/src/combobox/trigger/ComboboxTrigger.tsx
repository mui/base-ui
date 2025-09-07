'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { stopEvent } from '../../floating-ui-react/utils';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';
import { fieldValidityMapping } from '../../field/utils/constants';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

const customStyleHookMapping: CustomStyleHookMapping<ComboboxTrigger.State> = {
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
    labelId,
    setTouched,
    setFocused,
    validationMode,
    fieldControlValidation,
  } = useFieldRootContext();
  const store = useComboboxRootContext();

  const selectionMode = useStore(store, selectors.selectionMode);
  const comboboxDisabled = useStore(store, selectors.disabled);
  const readOnly = useStore(store, selectors.readOnly);
  const listElement = useStore(store, selectors.listElement);
  const triggerProps = useStore(store, selectors.triggerProps);
  const typeaheadTriggerProps = useStore(store, selectors.typeaheadTriggerProps);
  const inputInsidePopup = useStore(store, selectors.inputInsidePopup);
  const open = useStore(store, selectors.open);
  const selectedValue = useStore(store, selectors.selectedValue);
  const inputValue = useStore(store, selectors.inputValue);

  const disabled = fieldDisabled || comboboxDisabled || disabledProp;

  const focusTimeout = useTimeout();

  const currentPointerTypeRef = React.useRef<PointerEvent['pointerType']>('');

  const trackPointerType = useEventCallback((event: React.PointerEvent) => {
    currentPointerTypeRef.current = event.pointerType;
  });

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

  const setTriggerElement = useEventCallback((element) => {
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
        'aria-expanded': open ? 'true' : 'false',
        'aria-haspopup': inputInsidePopup ? 'dialog' : 'listbox',
        'aria-controls': open ? listElement?.id : undefined,
        'aria-readonly': readOnly || undefined,
        'aria-labelledby': labelId,
        onPointerDown: trackPointerType,
        onPointerEnter: trackPointerType,
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

          if (disabled || readOnly) {
            return;
          }

          focusTimeout.start(0, () => store.state.forceMount());
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

          store.state.setOpen(!open, createBaseUIEventDetails('trigger-press', event.nativeEvent));

          if (currentPointerTypeRef.current !== 'touch') {
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
              createBaseUIEventDetails('list-navigation', event.nativeEvent),
            );
            store.state.inputRef.current?.focus();
          }
        },
      },
      fieldControlValidation.getValidationProps,
      elementProps,
      getButtonProps,
    ],
    customStyleHookMapping,
  });

  return element;
});

export namespace ComboboxTrigger {
  export interface State extends FieldRoot.State {
    /**
     * Whether the popup is open.
     */
    open: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  }

  export interface Props extends NativeButtonProps, BaseUIComponentProps<'button', State> {
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
  }
}
