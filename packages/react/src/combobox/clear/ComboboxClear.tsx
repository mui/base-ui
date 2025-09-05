'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { selectors } from '../store';
import { useButton } from '../../use-button';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';

const customStyleHookMapping: CustomStyleHookMapping<ComboboxClear.State> = {
  ...transitionStatusMapping,
  ...triggerOpenStateMapping,
};

/**
 * Clears the value when clicked.
 * Renders a `<button>` element.
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
    keepMounted = false,
    ...elementProps
  } = componentProps;

  const { disabled: fieldDisabled } = useFieldRootContext();
  const store = useComboboxRootContext();

  const selectionMode = useStore(store, selectors.selectionMode);
  const comboboxDisabled = useStore(store, selectors.disabled);
  const readOnly = useStore(store, selectors.readOnly);
  const clearRef = useStore(store, selectors.clearRef);
  const open = useStore(store, selectors.open);
  const selectedValue = useStore(store, selectors.selectedValue);
  const inputValue = useStore(store, selectors.inputValue);

  let visible = false;
  if (selectionMode === 'none') {
    visible = inputValue !== '';
  } else if (selectionMode === 'single') {
    visible = selectedValue != null;
  } else {
    visible = Array.isArray(selectedValue) && selectedValue.length > 0;
  }

  const disabled = fieldDisabled || comboboxDisabled || disabledProp;

  const { buttonRef, getButtonProps } = useButton({
    native: nativeButton,
    disabled,
  });

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(visible);

  const state: ComboboxClear.State = React.useMemo(
    () => ({
      disabled,
      open,
      transitionStatus,
    }),
    [disabled, open, transitionStatus],
  );

  useOpenChangeComplete({
    open: visible,
    ref: clearRef,
    onComplete() {
      if (!visible) {
        setMounted(false);
      }
    },
  });

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef, clearRef],
    props: [
      {
        tabIndex: -1,
        hidden: !mounted,
        children: 'x',
        disabled,
        'aria-readonly': readOnly || undefined,
        // Avoid stealing focus from the input.
        onMouseDown(event) {
          event.preventDefault();
        },
        onClick(event) {
          if (disabled || readOnly) {
            return;
          }

          const keyboardActiveRef = store.state.keyboardActiveRef;

          store.state.setInputValue('', createBaseUIEventDetails('clear-press', event.nativeEvent));

          if (selectionMode !== 'none') {
            store.state.setSelectedValue(
              Array.isArray(selectedValue) ? [] : null,
              createBaseUIEventDetails('clear-press', event.nativeEvent),
            );
            store.state.setIndices({
              activeIndex: null,
              selectedIndex: null,
              type: keyboardActiveRef.current ? 'keyboard' : 'pointer',
            });
          } else {
            store.state.setIndices({
              activeIndex: null,
              type: keyboardActiveRef.current ? 'keyboard' : 'pointer',
            });
          }

          store.state.inputRef.current?.focus();
        },
      },
      elementProps,
      getButtonProps,
    ],
    customStyleHookMapping,
  });

  const shouldRender = keepMounted || mounted;
  if (!shouldRender) {
    return null;
  }

  return element;
});

export namespace ComboboxClear {
  export interface State {
    /**
     * Whether the popup is open.
     */
    open: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends NativeButtonProps, BaseUIComponentProps<'button', State> {
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Whether the component should remain mounted in the DOM when not visible.
     * @default false
     */
    keepMounted?: boolean;
  }
}
