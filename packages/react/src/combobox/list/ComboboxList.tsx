'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import {
  useComboboxDerivedItemsContext,
  useComboboxFloatingContext,
  useComboboxRootContext,
} from '../root/ComboboxRootContext';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';
import { selectors } from '../store';
import { ComboboxCollection } from '../collection/ComboboxCollection';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import { stopEvent } from '../../floating-ui-react/utils';
import { clickHighlightedItem } from '../utils/parts';
import { VirtualizationListContext } from '../../internals/virtualization/VirtualizationListContext';

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
  const { filteredItems, flatFilteredItems, hasItems } = useComboboxDerivedItemsContext();

  const selectionMode = useStore(store, selectors.selectionMode);
  const grid = useStore(store, selectors.grid);
  const popupProps = useStore(store, selectors.popupProps);
  const externallyVirtualized = useStore(store, selectors.externallyVirtualized);
  const forceMounted = useStore(store, selectors.forceMounted);

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
  // Ensures this component's `popupProps` subscription does not cause <Combobox.Item>
  // to re-render on every active index change.
  const resolvedChildren = React.useMemo(() => {
    if (typeof children === 'function') {
      return <ComboboxCollection>{children}</ComboboxCollection>;
    }
    return children;
  }, [children]);

  const state: ComboboxListState = {
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
          store.state.keyboardActiveRef.current = true;
        },
        onPointerMoveCapture() {
          store.state.keyboardActiveRef.current = false;
        },
      },
      elementProps,
    ],
  });

  const contextualElement = (
    <VirtualizationListContext.Provider value>{element}</VirtualizationListContext.Provider>
  );

  if (externallyVirtualized) {
    return contextualElement;
  }

  // With the `items` prop, typeahead labels are derived from the items so they survive the list
  // unmounting (unmounting clears the registered labels). Rendered labels only need to be
  // registered when the list is force-mounted to match browser autofill against rendered text.
  const labelsRef = hasItems && !forceMounted ? undefined : store.state.labelsRef;

  return (
    <CompositeList
      elementsRef={store.state.listRef}
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
