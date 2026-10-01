'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FilterDropdownInput } from '../../filter-dropdown/input/FilterDropdownInput';
import type {
  FilterDropdownInputProps,
  FilterDropdownInputState,
} from '../../filter-dropdown/input/FilterDropdownInput';
import { useFilterDropdownValueContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { mergeProps } from '../../merge-props';
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

  // The store holds the highlighted element, so an id changed in place would otherwise leave
  // `aria-activedescendant` pointing at an id that no longer exists.
  useIsoLayoutEffect(() => {
    const item = store.state.highlightedItem;
    if (!item) {
      return undefined;
    }
    const observer = new MutationObserver(() => store.notifyAll());
    observer.observe(item, { attributeFilter: ['id'] });
    return () => observer.disconnect();
  }, [activeItemId, store]);

  const handleKeyDown = useMenuFilterKeyDown(value !== '');

  const inputProps = mergeProps<typeof FilterDropdownInput>(
    { onKeyDown: handleKeyDown },
    componentProps,
  );

  return (
    <FilterDropdownInput
      {...inputProps}
      activeItemId={activeItemId}
      navigationProps={navigationProps}
      ref={forwardedRef}
    />
  );
});

export interface MenuInputState extends FilterDropdownInputState {}
export interface MenuInputProps extends FilterDropdownInputProps {}

export namespace MenuInput {
  export type State = MenuInputState;
  export type Props = MenuInputProps;
}
