'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  FilterDropdownList,
  type FilterDropdownListProps,
  type FilterDropdownListState,
} from '../../filter-dropdown/list/FilterDropdownList';
import { mergeProps } from '../../merge-props';
import { useFilterMenuReferenceKeyDown } from '../utils/useFilterMenuReferenceKeyDown';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import { useFilterDropdownRootContext } from '../../filter-dropdown/root/FilterDropdownRootContext';

/**
 * A container for the filter menu items.
 * Renders a `<div>` element with a `menu` role.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuList = React.forwardRef(function FilterMenuList(
  componentProps: FilterMenuList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { orientation, store } = useMenuRootContext();
  const { inline } = useFilterDropdownRootContext();
  const handleReferenceKeyDown = useFilterMenuReferenceKeyDown();
  const setInlinePopupElement = useStableCallback((element: HTMLDivElement | null) => {
    store.context.popupRef.current = element;
    store.set('popupElement', element);
  });
  const mergedRef = useMergedRefs(forwardedRef, inline ? setInlinePopupElement : null);

  const props = mergeProps<typeof FilterDropdownList>(
    {
      'aria-orientation': orientation,
      onKeyDown: handleReferenceKeyDown,
    },
    componentProps,
  );

  const element = <FilterDropdownList {...props} ref={mergedRef} />;

  if (!inline) {
    return element;
  }

  return (
    <CompositeList elementsRef={store.context.itemDomElements} labelsRef={store.context.itemLabels}>
      {element}
    </CompositeList>
  );
});

export interface FilterMenuListState extends FilterDropdownListState {}

export interface FilterMenuListProps extends FilterDropdownListProps {}

export namespace FilterMenuList {
  export type Props = FilterMenuListProps;
  export type State = FilterMenuListState;
}
