'use client';
import * as React from 'react';
import {
  FilterDropdownInput,
  type FilterDropdownInputProps,
  type FilterDropdownInputState,
} from '../../filter-dropdown/input/FilterDropdownInput';
import { useFilterDropdownItemContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectFilterTrapsFocus } from '../filter-root/useSelectFilterTrapsFocus';
import { mergeProps } from '../../merge-props';
import type { BaseUIEvent } from '../../internals/types';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { dispatchClickWithModifiers } from '../../utils/dispatchClickWithModifiers';
import { stopEvent } from '../../floating-ui-react/utils/event';

/**
 * A search field that filters the select options.
 * Requires the select to be wrapped in `Select.FilterProvider`.
 * Automatically receives focus whenever the popup opens, after the popup is positioned.
 * The `autoFocus` prop is not needed and does not change this behavior.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectFilterInput = React.forwardRef(function SelectFilterInput(
  componentProps: SelectFilterInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const store = useSelectRootContext();
  const { listRef, store: filterStore } = useFilterDropdownItemContext();
  const trapsFocus = useSelectFilterTrapsFocus();

  const inputProps = mergeProps<typeof FilterDropdownInput>(
    {
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLInputElement>>) {
        if (event.key === 'Tab') {
          // Mirror the plain select: Shift+Tab closes the popup and returns focus to the
          // trigger. The generic close branch in `useListNavigation` skips virtual focus, and a
          // forward Tab already closes through focus-out once focus leaves the popup. A trapped
          // popup keeps both Tabs inside instead.
          if (event.shiftKey && !trapsFocus) {
            stopEvent(event);
            const trigger = store.state.triggerElement;
            store.context.setOpen(
              false,
              createChangeEventDetails(REASONS.focusOut, event.nativeEvent),
            );
            trigger?.focus();
          }
          return;
        }

        // List navigation leaves activation keys to a typeable reference, so Enter is committed
        // here. Enter that commits an IME composition belongs to the input, not the list.
        if (event.key !== 'Enter' || event.which === 229) {
          return;
        }

        const activeItem = listRef.current[filterStore.select('activeIndex') ?? -1];
        if (activeItem) {
          event.preventDefault();
          dispatchClickWithModifiers(activeItem, event);
        }
      },
    },
    componentProps,
  );

  return <FilterDropdownInput {...inputProps} ref={forwardedRef} />;
});

export interface SelectFilterInputState extends FilterDropdownInputState {}
export interface SelectFilterInputProps extends FilterDropdownInputProps {}

export namespace SelectFilterInput {
  export type State = SelectFilterInputState;
  export type Props = SelectFilterInputProps;
}
