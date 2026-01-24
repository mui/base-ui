'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useComboboxChipContext } from '../chip/ComboboxChipContext';
import { useButton } from '../../use-button';
import { stopEvent } from '../../floating-ui-react/utils';
import { selectors } from '../store';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { findItemIndex } from '../../utils/itemEquality';

/**
 * A button to remove a chip.
 * Renders a `<button>` element.
 */
export const ComboboxChipRemove = React.forwardRef(function ComboboxChipRemove(
  componentProps: ComboboxChipRemove.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    nativeButton = true,
    ...elementProps
  } = componentProps;

  const store = useComboboxRootContext();
  const { index } = useComboboxChipContext();

  const comboboxDisabled = useStore(store, selectors.disabled);
  const readOnly = useStore(store, selectors.readOnly);
  const selectedValue = useStore(store, selectors.selectedValue);
  const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);

  const disabled = comboboxDisabled || disabledProp;

  const { buttonRef, getButtonProps } = useButton({
    native: nativeButton,
    disabled: disabled || readOnly,
    focusableWhenDisabled: true,
  });

  const state: ComboboxChipRemove.State = {
    disabled,
  };

  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    state,
    props: [
      {
        tabIndex: -1,
        'aria-readonly': readOnly || undefined,
        onClick(event) {
          if (disabled || readOnly) {
            return;
          }

          const eventDetails = createChangeEventDetails(REASONS.chipRemovePress, event.nativeEvent);

          // If the removed chip was the active item, clear highlight
          const activeIndex = store.state.activeIndex;
          const removedItem = selectedValue[index];

          // Try current visible list first; if not found, it's filtered out. No need
          // to clear highlight in that case since it can't equal activeIndex.
          const removedIndex = findItemIndex(
            store.state.valuesRef.current,
            removedItem,
            isItemEqualToValue,
          );
          if (removedIndex !== -1 && activeIndex === removedIndex) {
            store.state.setIndices({
              activeIndex: null,
              type: store.state.keyboardActiveRef.current ? 'pointer' : 'keyboard',
            });
          }

          store.state.setSelectedValue(
            selectedValue.filter((_: any, i: number) => i !== index),
            eventDetails,
          );

          if (!eventDetails.isPropagationAllowed) {
            event.stopPropagation();
          }

          store.state.inputRef.current?.focus();
        },
        onKeyDown(event) {
          if (disabled || readOnly) {
            return;
          }

          const eventDetails = createChangeEventDetails(REASONS.chipRemovePress, event.nativeEvent);

          if (event.key === 'Enter' || event.key === ' ') {
            // If the removed chip was the active item, clear highlight
            const activeIndex = store.state.activeIndex;
            const removedItem = selectedValue[index];
            const removedIndex = findItemIndex(
              store.state.valuesRef.current,
              removedItem,
              isItemEqualToValue,
            );

            if (removedIndex !== -1 && activeIndex === removedIndex) {
              store.state.setIndices({
                activeIndex: null,
                type: store.state.keyboardActiveRef.current ? 'pointer' : 'keyboard',
              });
            }

            store.state.setSelectedValue(
              selectedValue.filter((_: any, i: number) => i !== index),
              eventDetails,
            );

            if (!eventDetails.isPropagationAllowed) {
              stopEvent(event);
            }

            store.state.inputRef.current?.focus();
          }
        },
      },
      elementProps,
      getButtonProps,
    ],
  });

  return element;
});

export interface ComboboxChipRemoveState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface ComboboxChipRemoveProps
  extends NativeButtonProps, BaseUIComponentProps<'button', ComboboxChipRemove.State> {}

export namespace ComboboxChipRemove {
  export type State = ComboboxChipRemoveState;
  export type Props = ComboboxChipRemoveProps;
}
