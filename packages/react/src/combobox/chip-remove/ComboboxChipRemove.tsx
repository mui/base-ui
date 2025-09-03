'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useComboboxChipContext } from '../chip/ComboboxChipContext';
import { useButton } from '../../use-button';
import { stopEvent } from '../../floating-ui-react/utils';
import { selectors } from '../store';
import { createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';

/**
 * A button to remove a chip.
 * Renders a `<button>` element.
 */
export const ComboboxChipRemove = React.forwardRef(function ComboboxChipRemove(
  componentProps: ComboboxChipRemove.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, nativeButton = true, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const { index } = useComboboxChipContext();

  const disabled = useStore(store, selectors.disabled);
  const readOnly = useStore(store, selectors.readOnly);
  const valuesRef = useStore(store, selectors.valuesRef);
  const selectedValue = useStore(store, selectors.selectedValue);

  const { buttonRef, getButtonProps } = useButton({
    native: nativeButton,
    disabled: disabled || readOnly,
    focusableWhenDisabled: true,
  });

  const state: ComboboxChipRemove.State = React.useMemo(
    () => ({
      disabled,
    }),
    [disabled],
  );

  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    state,
    props: [
      {
        tabIndex: -1,
        disabled,
        'aria-readonly': readOnly || undefined,
        onClick(event) {
          if (disabled || readOnly) {
            return;
          }

          const eventDetails = createBaseUIEventDetails('chip-remove-press', event.nativeEvent);

          // If the removed chip was the active item, clear highlight
          const activeIndex = store.state.activeIndex;
          const removedItem = selectedValue[index];

          // Try current visible list first; if not found, it's filtered out. No need
          // to clear highlight in that case since it can't equal activeIndex.
          const removedIndex = valuesRef.current.indexOf(removedItem);
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

          const eventDetails = createBaseUIEventDetails('chip-remove-press', event.nativeEvent);

          if (event.key === 'Enter' || event.key === ' ') {
            // If the removed chip was the active item, clear highlight
            const activeIndex = store.state.activeIndex;
            const removedItem = selectedValue[index];
            const removedIndex = valuesRef.current.indexOf(removedItem);

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

export namespace ComboboxChipRemove {
  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }
}
