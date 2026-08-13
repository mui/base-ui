'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import {
  FilterDropdownInput,
  type FilterDropdownInputProps,
  type FilterDropdownInputState,
} from '../../filter-dropdown/input/FilterDropdownInput';
import { mergeProps } from '../../merge-props';
import type { BaseUIEvent } from '../../internals/types';
import { useSelectFilterableRootContext } from '../../select/root/SelectRootContext';
import { selectors } from '../../select/store';
import { FilterSelectInputDataAttributes } from './FilterSelectInputDataAttributes';

/**
 * A text input used to filter the select items.
 * Renders an `<input>` element.
 */
export const FilterSelectInput = React.forwardRef(function FilterSelectInput(
  componentProps: FilterSelectInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const context = useSelectFilterableRootContext('Input');
  const isFocusVisible = useStore(context.store, selectors.inputFocusVisible);
  const listNavigationProps = useStore(context.store, selectors.inputProps);
  const mergedRefs = useMergedRefs(forwardedRef, context.filterInputRef);

  const inputProps = mergeProps<typeof FilterDropdownInput>(
    listNavigationProps,
    {
      [FilterSelectInputDataAttributes.focusVisible as string]: isFocusVisible ? '' : undefined,
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLInputElement>>) {
        const activeIndex = context.store.state.activeIndex;
        const activeItem = context.listRef.current[activeIndex ?? -1];

        if (event.key === 'Enter' && activeItem) {
          // Prevent a containing form from submitting before the active item handles selection.
          event.preventDefault();
          activeItem.click();
        }
      },
    },
    componentProps,
    { disabled: componentProps.disabled || context.disabled },
  );

  return <FilterDropdownInput {...inputProps} ref={mergedRefs} />;
});

export interface FilterSelectInputState extends FilterDropdownInputState {}
export interface FilterSelectInputProps extends FilterDropdownInputProps {}

export namespace FilterSelectInput {
  export type State = FilterSelectInputState;
  export type Props = FilterSelectInputProps;
}
