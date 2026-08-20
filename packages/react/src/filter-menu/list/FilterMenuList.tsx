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
  const { store: menuStore } = useMenuRootContext();
  const { inline } = useFilterDropdownRootContext();
  const { store } = useFilterDropdownItemContext();
  const { subscribeMapChange } = useCompositeListContext();
  const handleReferenceKeyDown = useFilterMenuReferenceKeyDown();
  const syncItemIds = useStableCallback((map: Map<Element, unknown>) => {
    const items = Array.from(map.keys());
    // Composite items receive their final indexes from this map update. Read their rendered ids
    // after those synchronous layout updates commit instead of publishing the previous indexes.
    queueMicrotask(() => {
      const nextIds = items.map((item) => item.id);
      const currentIds = store.state.itemIds;
      // A fresh array always fails the store's identity check, and every item, group, and the
      // input subscribe to it. Filtering rarely changes the ids themselves, so compare first.
      if (
        currentIds.length !== nextIds.length ||
        nextIds.some((id, index) => id !== currentIds[index])
      ) {
        store.set('itemIds', nextIds);
      }
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

  // The inline list registers as the menu's floating element but doesn't spread the full
  // floating props. Pointer-modality tracking lives in the floating `onPointerMove`; without
  // it, leaving the list after keyboard navigation retains a stale highlight.
  const handleInlinePointerMove = useStableCallback((event: React.PointerEvent<HTMLDivElement>) => {
    menuStore.select('popupProps').onPointerMove?.(event);
  });

  const props = mergeProps<typeof FilterDropdownList>(
    {
      onKeyDown: handleReferenceKeyDown,
      onPointerMove: inline ? handleInlinePointerMove : undefined,
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
