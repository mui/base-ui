'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import {
  FilterDropdownInput,
  type FilterDropdownInputProps,
  type FilterDropdownInputState,
} from '../../filter-dropdown/input/FilterDropdownInput';
import { mergeProps } from '../../merge-props';
import type { BaseUIEvent } from '../../internals/types';
import { useMenuFilterableRootContext } from '../root/MenuRootContext';
import { MenuInputDataAttributes } from './MenuInputDataAttributes';

/**
 * A text input used to filter the menu items.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuInput = React.forwardRef(function MenuInput(
  componentProps: MenuInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { store, parent } = useMenuFilterableRootContext('Input');
  const parentDisabled = parent.type === 'menu' && parent?.store.useState('disabled');
  const disabled = store.useState('disabled');
  const isFocusVisible = store.useState('inputFocusVisible');
  const listNavigationProps = store.useState('inputProps');
  const mergedRefs = useMergedRefs(forwardedRef, store.context.inputRef);

  const inputProps = mergeProps<typeof FilterDropdownInput>(
    listNavigationProps,
    {
      [MenuInputDataAttributes.focusVisible as string]: isFocusVisible ? '' : undefined,
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLInputElement>>) {
        const activeIndex = store.state.activeIndex;
        const activeItem = store.context.itemDomElements.current[activeIndex ?? -1];

        if (event.key === 'Enter' && activeItem) {
          // Prevent a containing form from submitting before the active item handles selection.
          event.preventDefault();
          activeItem.click();
        }
      },
    },
    componentProps,
    { disabled: componentProps.disabled || disabled || parentDisabled },
  );

  return <FilterDropdownInput {...inputProps} ref={mergedRefs} />;
});

export interface MenuInputState extends FilterDropdownInputState {}
export interface MenuInputProps extends FilterDropdownInputProps {}

export namespace MenuInput {
  export type State = MenuInputState;
  export type Props = MenuInputProps;
}
