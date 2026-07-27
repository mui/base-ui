'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import {
  FilterDropdownInput,
  type FilterDropdownInputProps,
  type FilterDropdownInputState,
} from '../../filter-dropdown/input/FilterDropdownInput';
import { mergeProps } from '../../merge-props';
import type { BaseUIEvent } from '../../internals/types';
import { useSelectFilterableRootContext } from '../root/SelectRootContext';
import { selectors } from '../store';
import { SelectInputDataAttributes } from './SelectInputDataAttributes';

/**
 * A text input used to filter the select items.
 * Renders an `<input>` element.
 */
export const SelectInput = React.forwardRef(function SelectInput(
  componentProps: SelectInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const context = useSelectFilterableRootContext('Input');
  const isFocusVisible = useStore(context.store, selectors.inputFocusVisible);
  const listNavigationProps = useStore(context.store, selectors.inputProps);

  const inputProps = mergeProps<typeof FilterDropdownInput>(
    listNavigationProps,
    {
      [SelectInputDataAttributes.focusVisible as string]: isFocusVisible ? '' : undefined,
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

  return <FilterDropdownInput {...inputProps} ref={forwardedRef} />;
});

export interface SelectInputState extends FilterDropdownInputState {}
export interface SelectInputProps extends FilterDropdownInputProps {}

export namespace SelectInput {
  export type State = SelectInputState;
  export type Props = SelectInputProps;
}
