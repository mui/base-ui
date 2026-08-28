'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import {
  useComboboxDerivedItemsContext,
  useComboboxFloatingContext,
  useComboboxRootContext,
} from '../root/ComboboxRootContext';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';
import { ComboboxCollection } from '../collection/ComboboxCollection';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import { stopEvent } from '../../floating-ui-react/utils';
import { clickHighlightedItem } from '../utils/parts';
import {
  ListVirtualizationHostContext,
  ListVirtualizationListStateContext,
  type ListVirtualizationHost,
  type ListVirtualizationListState,
} from '../../internals/virtualization/ListVirtualizationHostContext';
import { ComboboxVirtualItemContext } from '../item/ComboboxVirtualItemContext';

/**
 * A list container for the items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxList = React.forwardRef(function ComboboxList(
  componentProps: ComboboxList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, children, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const floatingRootContext = useComboboxFloatingContext();
  const hasPositionerContext = Boolean(useComboboxPositionerContext(true));
  const { filteredItems, flatFilteredItems, hasItems, isGrouped } =
    useComboboxDerivedItemsContext();

  const selectionMode = store.useState('selectionMode');
  const grid = store.useState('grid');
  const readOnly = store.useState('readOnly');
  const listProps = store.useState('listProps');
  const externallyVirtualized = store.useState('externallyVirtualized');
  const forceMounted = store.useState('forceMounted');
  // `listProps` already carries `aria-activedescendant`, so this component re-renders on every
  // highlight change regardless. Reading the virtualizer's state here adds no extra renders.
  const activeIndex = store.useState('activeIndex');
  const highlightType = store.useState('highlightType');
  const renderAllRows = store.useState('renderAllRows');

  const multiple = selectionMode === 'multiple';
  const empty = filteredItems.length === 0;

  const setPositionerElement = useStableCallback((element) => {
    store.set('positionerElement', element);
  });

  const setListElement = useStableCallback((element) => {
    store.set('listElement', element);
  });

  // Support "closed template" API: if children is a function, implicitly wrap it
  // with a Combobox.Collection that reads items from context/root.
  // Ensures this component's `listProps` subscription does not cause <Combobox.Item>
  // to re-render on every active index change.
  const resolvedChildren = React.useMemo(() => {
    if (typeof children === 'function') {
      return <ComboboxCollection>{children}</ComboboxCollection>;
    }
    return children;
  }, [children]);

  // Reads the flags at call time, so it stays stable while reporting the current configuration.
  const warnUnsupportedConfiguration = useStableCallback(() => {
    if (!hasItems) {
      warn('<Virtualizer> requires the `items` prop on <Combobox.Root>.');
    }
    if (isGrouped) {
      warn(
        '<Virtualizer> does not currently support grouped collections. ' +
          'Render a flat item collection instead.',
      );
    }
    if (externallyVirtualized) {
      warn(
        '<Combobox.Root> must not use the `virtualized` prop together with <Virtualizer>. ' +
          'The prop is only for external virtualization.',
      );
    }
    if (grid) {
      warn('<Virtualizer> does not currently support grid mode. Use a flat listbox instead.');
    }
  });

  // Kept free of reactive state: <Combobox.Item> reads this to detect that it is inside a list.
  const virtualizationHost = React.useMemo<ListVirtualizationHost>(
    () => ({
      componentName: 'Combobox',
      registry: store.context.virtualizationRegistry,
      virtualItemContext: ComboboxVirtualItemContext,
      warnUnsupportedConfiguration:
        process.env.NODE_ENV === 'production' ? undefined : warnUnsupportedConfiguration,
    }),
    [store, warnUnsupportedConfiguration],
  );

  const virtualizationListState = React.useMemo<ListVirtualizationListState>(
    () => ({
      activeIndex,
      items: flatFilteredItems,
      // Pointer highlights follow the cursor; scrolling to them would move the list under it.
      scrollActiveIntoView: highlightType !== 'pointer',
      // Combobox mounts the whole collection so autofill can read rendered labels; the virtualizer
      // only needs to know that windowing is off for the duration.
      windowingSuspended: renderAllRows,
    }),
    [activeIndex, flatFilteredItems, highlightType, renderAllRows],
  );

  const state: ComboboxListState = {
    empty,
  };

  const floatingId = floatingRootContext.useState('floatingId');

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, setListElement, hasPositionerContext ? null : setPositionerElement],
    props: [
      listProps,
      {
        children: resolvedChildren,
        tabIndex: -1,
        id: floatingId,
        role: grid ? 'grid' : 'listbox',
        'aria-multiselectable': multiple ? 'true' : undefined,
        // On a grid the attribute describes cell editability, not selection, so it's left to the
        // combobox element in that mode.
        'aria-readonly': !grid && readOnly ? true : undefined,
        onKeyDown(event) {
          if (store.state.disabled || store.state.readOnly) {
            return;
          }

          if (event.key === 'Enter') {
            const activeIndex = store.state.activeIndex;

            if (activeIndex == null) {
              // Allow form submission when no item is highlighted.
              return;
            }

            stopEvent(event);
            clickHighlightedItem(store, activeIndex, event.nativeEvent);
          }
        },
        onKeyDownCapture() {
          store.context.keyboardActiveRef.current = true;
        },
        onPointerMoveCapture() {
          store.context.keyboardActiveRef.current = false;
        },
      },
      elementProps,
    ],
  });

  const contextualElement = (
    <ListVirtualizationHostContext.Provider value={virtualizationHost}>
      <ListVirtualizationListStateContext.Provider value={virtualizationListState}>
        {element}
      </ListVirtualizationListStateContext.Provider>
    </ListVirtualizationHostContext.Provider>
  );

  if (externallyVirtualized) {
    return contextualElement;
  }

  // With the `items` prop, typeahead labels are derived from the items so they survive the list
  // unmounting (unmounting clears the registered labels). Rendered labels only need to be
  // registered when the list is force-mounted to match browser autofill against rendered text.
  const labelsRef = hasItems && !forceMounted ? undefined : store.context.labelsRef;

  return (
    <CompositeList
      elementsRef={store.context.listRef}
      itemCount={hasItems ? flatFilteredItems.length : undefined}
      labelsRef={labelsRef}
    >
      {contextualElement}
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
  BaseUIComponentProps<'div', ComboboxListState>,
  'children'
> {
  children?: React.ReactNode | ((item: any, index: number) => React.ReactNode);
}

export namespace ComboboxList {
  export type State = ComboboxListState;
  export type Props = ComboboxListProps;
}
