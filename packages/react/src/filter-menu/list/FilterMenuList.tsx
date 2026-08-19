'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import {
  FilterDropdownList,
  type FilterDropdownListProps,
  type FilterDropdownListState,
} from '../../filter-dropdown/list/FilterDropdownList';
import { mergeProps } from '../../merge-props';
import { useFilterMenuReferenceKeyDown } from '../utils/useFilterMenuReferenceKeyDown';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import { useCompositeListContext } from '../../internals/composite/list/CompositeListContext';
import {
  useFilterDropdownItemContext,
  useFilterDropdownRootContext,
} from '../../filter-dropdown/root/FilterDropdownRootContext';

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
  const { orientation, store: menuStore } = useMenuRootContext();
  const { inline } = useFilterDropdownRootContext();
  const { store } = useFilterDropdownItemContext();
  const { subscribeMapChange } = useCompositeListContext();
  const handleReferenceKeyDown = useFilterMenuReferenceKeyDown();
  const syncItemIds = useStableCallback((map: Map<Element, unknown>) => {
    const items = Array.from(map.keys());
    // Composite items receive their final indexes from this map update. Read their rendered ids
    // after those synchronous layout updates commit instead of publishing the previous indexes.
    queueMicrotask(() => {
      store.set(
        'itemIds',
        items.map((item) => item.id),
      );
    });
  });

  useIsoLayoutEffect(() => {
    return inline ? undefined : subscribeMapChange(syncItemIds);
  }, [inline, subscribeMapChange, syncItemIds]);

  const setInlinePopupElement = useStableCallback((element: HTMLDivElement | null) => {
    menuStore.context.popupRef.current = element;
    menuStore.set('popupElement', element);
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
    <CompositeList
      elementsRef={menuStore.context.itemDomElements}
      labelsRef={menuStore.context.itemLabels}
      onMapChange={syncItemIds}
    >
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
