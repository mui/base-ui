'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import {
  useComboboxDerivedItemsContext,
  useComboboxFloatingContext,
  useComboboxRootContext,
} from '../root/ComboboxRootContext';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';
import { selectors } from '../store';
import { ComboboxCollection } from '../collection/ComboboxCollection';
import { CompositeList } from '../../composite/list/CompositeList';
import { stopEvent } from '../../floating-ui-react/utils';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { itemIncludes } from '../../utils/itemEquality';

/**
 * A list container for the items.
 * Renders a `<div>` element.
 */
export const ComboboxList = React.forwardRef(function ComboboxList(
  componentProps: ComboboxList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, children, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const { filterQuery } = useComboboxDerivedItemsContext();
  const floatingRootContext = useComboboxFloatingContext();
  const hasPositionerContext = Boolean(useComboboxPositionerContext(true));

  const items = useStore(store, selectors.items);
  const hasFilteredItemsProp = useStore(store, selectors.hasFilteredItemsProp);
  const visibleItemCount = useStore(store, selectors.visibleItemCount);
  const labelsRef = useStore(store, selectors.labelsRef);
  const listRef = useStore(store, selectors.listRef);
  const valuesRef = useStore(store, selectors.valuesRef);
  const selectionMode = useStore(store, selectors.selectionMode);
  const grid = useStore(store, selectors.grid);
  const popupProps = useStore(store, selectors.popupProps);
  const disabled = useStore(store, selectors.disabled);
  const readOnly = useStore(store, selectors.readOnly);
  const virtualized = useStore(store, selectors.virtualized);

  const multiple = selectionMode === 'multiple';
  const empty = visibleItemCount === 0;

  const setPositionerElement = useStableCallback((element) => {
    store.set('positionerElement', element);
  });

  const setListElement = useStableCallback((element) => {
    store.set('listElement', element);
  });

  // Support "closed template" API: if children is a function, implicitly wrap it
  // with a Combobox.Collection that reads items from context/root.
  // Ensures this component's `popupProps` subscription does not cause <Combobox.Item>
  // to re-render on every active index change.
  const resolvedChildren = React.useMemo(() => {
    if (typeof children === 'function') {
      return <ComboboxCollection>{children}</ComboboxCollection>;
    }
    return children;
  }, [children]);

  const state: ComboboxList.State = {
    empty,
  };

  const floatingId = floatingRootContext.useState('floatingId');

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, setListElement, hasPositionerContext ? null : setPositionerElement],
    props: [
      popupProps,
      {
        children: resolvedChildren,
        tabIndex: -1,
        id: floatingId,
        role: grid ? 'grid' : 'listbox',
        'aria-multiselectable': multiple ? 'true' : undefined,
        onKeyDown(event) {
          if (disabled || readOnly) {
            return;
          }

          if (event.key === 'Enter') {
            const activeIndex = store.state.activeIndex;

            if (activeIndex == null) {
              // Allow form submission when no item is highlighted.
              return;
            }

            stopEvent(event);

            const nativeEvent = event.nativeEvent;
            const listItem = store.state.listRef.current[activeIndex];

            if (listItem) {
              store.state.selectionEventRef.current = nativeEvent;
              listItem.click();
              store.state.selectionEventRef.current = null;
            }
          }
        },
        onKeyDownCapture() {
          store.state.keyboardActiveRef.current = true;
        },
        onPointerMoveCapture() {
          store.state.keyboardActiveRef.current = false;
        },
      },
      elementProps,
    ],
  });

  const prevMapSizeRef = React.useRef(0);

  const handleMapChange = useStableCallback((map: Map<Element, any>) => {
    if (items || hasFilteredItemsProp) {
      return;
    }

    const nextValues: any[] = [];
    const nextList: Array<HTMLElement | null> = [];
    const itemValueMap = store.state.itemValueMapRef.current;

    map.forEach((_metadata, node) => {
      nextValues.push(itemValueMap.get(node));
      nextList.push(node as HTMLElement);
    });

    valuesRef.current = nextValues;
    listRef.current = nextList;
    store.set('visibleItemCount', nextValues.length);

    const shouldUpdateAllValues =
      filterQuery === '' || store.state.allValuesRef.current.length === 0;
    if (shouldUpdateAllValues) {
      store.state.allValuesRef.current = nextValues.slice();
    }

    if (filterQuery !== '' || selectionMode === 'none') {
      return;
    }

    const prevSize = prevMapSizeRef.current;
    prevMapSizeRef.current = map.size;

    if (prevSize === 0 || map.size === prevSize) {
      return;
    }

    const eventDetails = createChangeEventDetails(REASONS.none);
    const comparer = store.state.isItemEqualToValue;
    const currentSelectedValue = store.state.selectedValue;

    if (selectionMode === 'multiple') {
      const current = Array.isArray(currentSelectedValue) ? currentSelectedValue : [];
      const next = current.filter((value) => itemIncludes(nextValues, value, comparer));
      if (next.length !== current.length) {
        store.state.setSelectedValue(next, eventDetails);
      }
      return;
    }

    if (currentSelectedValue != null && !itemIncludes(nextValues, currentSelectedValue, comparer)) {
      const fallback = store.state.defaultSelectedValue;
      const nextValue =
        fallback != null && itemIncludes(nextValues, fallback, comparer) ? fallback : null;
      store.state.setSelectedValue(nextValue, eventDetails);
    }
  });

  if (virtualized) {
    return element;
  }

  return (
    <CompositeList
      elementsRef={listRef}
      labelsRef={items ? undefined : labelsRef}
      onMapChange={handleMapChange}
    >
      {element}
    </CompositeList>
  );
});

export interface ComboboxListState {
  /**
   * Whether the list is empty.
   */
  empty: boolean;
}

export interface ComboboxListProps extends Omit<
  BaseUIComponentProps<'div', ComboboxList.State>,
  'children'
> {
  children?: React.ReactNode | ((item: any, index: number) => React.ReactNode);
}

export namespace ComboboxList {
  export type State = ComboboxListState;
  export type Props = ComboboxListProps;
}
