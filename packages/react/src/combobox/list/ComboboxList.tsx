'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import {
  useComboboxDerivedItemsContext,
  useComboboxFloatingContext,
  useComboboxRootContext,
} from '../root/ComboboxRootContext';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';
import { selectors, writeItemValues } from '../store';
import { ComboboxCollection } from '../collection/ComboboxCollection';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import { stopEvent } from '../../floating-ui-react/utils';
import { ComboboxPortalContext } from '../portal/ComboboxPortalContext';

interface ComboboxListItemMetadata {
  value: any;
}

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
  const keepPortalMounted = React.useContext(ComboboxPortalContext);
  const { filteredItems, hasItems } = useComboboxDerivedItemsContext();

  const selectionMode = useStore(store, selectors.selectionMode);
  const grid = useStore(store, selectors.grid);
  const popupProps = useStore(store, selectors.popupProps);
  const open = useStore(store, selectors.open);
  const mounted = useStore(store, selectors.mounted);
  const inline = useStore(store, selectors.inline);
  const forceMounted = useStore(store, selectors.forceMounted);
  const virtualized = useStore(store, selectors.virtualized);

  const multiple = selectionMode === 'multiple';
  const empty = filteredItems.length === 0;
  const registryActive = inline || open || mounted || keepPortalMounted || forceMounted;

  const setPositionerElement = useStableCallback((element) => {
    store.set('positionerElement', element);
  });

  const setListElement = useStableCallback((element) => {
    store.set('listElement', element);
  });

  const handleMapChange = useStableCallback(
    (map: Map<Element, ComboboxListItemMetadata | null>) => {
      if (!registryActive) {
        return;
      }

      const itemValues: any[] = [];
      map.forEach((metadata) => {
        if (metadata) {
          itemValues.push(metadata.value);
        }
      });

      store.state.valuesRef.current = itemValues;
      writeItemValues(store, hasItems, itemValues);
    },
  );

  useIsoLayoutEffect(() => {
    if (registryActive) {
      return;
    }

    const itemValues = store.state.itemValues;
    store.state.valuesRef.current = [];
    if (itemValues.length) {
      if (!hasItems) {
        store.set('allItemValues', itemValues);
      }
      store.set('itemValues', []);
    }
  }, [hasItems, registryActive, store]);

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

  if (virtualized) {
    return element;
  }

  return (
    <CompositeList
      elementsRef={store.state.listRef}
      labelsRef={hasItems ? undefined : store.state.labelsRef}
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
  BaseUIComponentProps<'div', ComboboxListState>,
  'children'
> {
  children?: React.ReactNode | ((item: any, index: number) => React.ReactNode);
}

export namespace ComboboxList {
  export type State = ComboboxListState;
  export type Props = ComboboxListProps;
}
