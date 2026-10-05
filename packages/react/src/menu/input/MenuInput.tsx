'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { FilterDropdownInput } from '../../filter-dropdown/input/FilterDropdownInput';
import type {
  FilterDropdownInputProps,
  FilterDropdownInputState,
} from '../../filter-dropdown/input/FilterDropdownInput';
import { useFilterDropdownValueContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { mergeProps } from '../../merge-props';
import { activeElement } from '../../floating-ui-react/utils';
import { useMenuFilterKeyDown } from '../filter-root/useMenuFilterKeyDown';
import { useMenuFilterPart } from '../filter-root/MenuFilterContext';
import { useMenuRootContext } from '../root/MenuRootContext';

/**
 * A search field that filters the menu items.
 * Requires the menu to be wrapped in `Menu.FilterProvider`.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuInput = React.forwardRef(function MenuInput(
  componentProps: MenuInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  useMenuFilterPart('Input');
  const { store } = useMenuRootContext();
  const value = useFilterDropdownValueContext();

  const { onKeyDown, ...navigationProps } = store.useState('inputProps');
  const activeItemId = store.useState('highlightedItemId');

  const handleKeyDown = useMenuFilterKeyDown(value !== '');
  const handleInputRef = React.useCallback(
    (input: HTMLInputElement | null) => {
      if (input == null) {
        return undefined;
      }

      // Autofocus may precede this ref, and Strict Mode can replay its cleanup without moving
      // DOM focus. Read the active element on every attachment to restore the store if needed.
      if (activeElement(ownerDocument(input)) === input) {
        store.set('focusedInput', input);
      }

      return () => {
        if (store.state.focusedInput === input) {
          store.set('focusedInput', null);
        }
      };
    },
    [store],
  );

  const mergedRefs = useMergedRefs(forwardedRef, handleInputRef);
  const inputProps = mergeProps<typeof FilterDropdownInput>(
    {
      onKeyDown: handleKeyDown,
      onFocus(event) {
        store.set('focusedInput', event.currentTarget);
      },
      onBlur() {
        store.set('focusedInput', null);
      },
    },
    componentProps,
  );

  return (
    <FilterDropdownInput
      {...inputProps}
      activeItemId={activeItemId}
      navigationProps={navigationProps}
      ref={mergedRefs}
    />
  );
});

export interface MenuInputState extends FilterDropdownInputState {}
export interface MenuInputProps extends FilterDropdownInputProps {}

export namespace MenuInput {
  export type State = MenuInputState;
  export type Props = MenuInputProps;
}
