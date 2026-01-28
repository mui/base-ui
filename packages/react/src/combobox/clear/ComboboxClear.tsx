'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useComboboxInputValueContext, useComboboxRootContext } from '../root/ComboboxRootContext';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { selectors } from '../store';
import { useButton } from '../../use-button';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';

const stateAttributesMapping: StateAttributesMapping<ComboboxClear.State> = {
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
  const open = useStore(store, selectors.open);
  const selectedValue = useStore(store, selectors.selectedValue);
  const hasSelectionChips = useStore(store, selectors.hasSelectionChips);

  const inputValue = useComboboxInputValueContext();

  let visible = false;
  if (selectionMode === 'none') {
    visible = inputValue !== '';
  } else if (selectionMode === 'single') {
    visible = selectedValue != null;
  } else {
    visible = hasSelectionChips;
  }

  const disabled = fieldDisabled || comboboxDisabled || disabledProp;

  const { buttonRef, getButtonProps } = useButton({
    native: nativeButton,
    disabled,
  });

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(visible);

  const state: ComboboxClear.State = {
    disabled,
    open,
    transitionStatus,
  };

  useOpenChangeComplete({
    open: visible,
    ref: store.state.clearRef,
    onComplete() {
      if (!visible) {
        setMounted(false);
      }
    },
  });

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef, store.state.clearRef],
    props: [
      {
        tabIndex: -1,
        children: 'x',
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

          store.state.setInputValue(
            '',
            createChangeEventDetails(REASONS.clearPress, event.nativeEvent),
          );

          if (selectionMode !== 'none') {
            store.state.setSelectedValue(
              Array.isArray(selectedValue) ? [] : null,
              createChangeEventDetails(REASONS.clearPress, event.nativeEvent),
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
    stateAttributesMapping,
  });

  const shouldRender = keepMounted || mounted;
  if (!shouldRender) {
    return null;
  }

  return element;
});

export interface ComboboxClearState {
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

export interface ComboboxClearProps
  extends NativeButtonProps, BaseUIComponentProps<'button', ComboboxClear.State> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether the component should remain mounted in the DOM when not visible.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace ComboboxClear {
  export type State = ComboboxClearState;
  export type Props = ComboboxClearProps;
}
