'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { warn } from '@base-ui/utils/warn';
import { ListVirtualizer } from '../../internals/virtualization/ListVirtualizer';
import {
  useListVirtualizerAdapter,
  type ListVirtualizerAdapterActions,
  type ListVirtualizerAdapterProps,
  type ListVirtualizerAdapterState,
  type ListVirtualizerKeyProps,
} from '../../internals/virtualization/ListVirtualizerAdapter';
import { useVirtualizationListContext } from '../../internals/virtualization/VirtualizationListContext';
import {
  useComboboxDerivedItemsContext,
  useComboboxRootContext,
} from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { ComboboxVirtualItemContext } from './ComboboxVirtualItemContext';
import { ComboboxVirtualizerCssVars } from './ComboboxVirtualizerCssVars';

/**
 * Renders a window of visible and overscanned items in a flat combobox list.
 * Renders a scrollable `<div>` element.
 *
 * Requires the `items` prop on `<Combobox.Root>` and must be the only item-rendering child of
 * `<Combobox.List>`. The element must have a constrained height or maximum height for
 * virtualization to limit the number of mounted items.
 *
 * Grouped collections and grid mode are not currently supported.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxVirtualizer = React.forwardRef(function ComboboxVirtualizer<Value>(
  componentProps: ComboboxVirtualizer.Props<Value>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    actionsRef,
    children,
    estimatedItemHeight,
    getItemKey,
    overscanPx,
    enabled = true,
    ...elementProps
  } = componentProps;

  const store = useComboboxRootContext();
  const { flatFilteredItems, hasItems, isGrouped } = useComboboxDerivedItemsContext();
  const activeIndex = useStore(store, selectors.activeIndex);
  const externallyVirtualized = useStore(store, selectors.externallyVirtualized);
  const grid = useStore(store, selectors.grid);
  const highlightType = useStore(store, selectors.highlightType);
  const virtualizationState = useStore(store, selectors.virtualizationState);
  const insideList = useVirtualizationListContext();

  // Some list-level operations need every item mounted briefly (for example, collecting rendered
  // labels for browser autofill). Keep that mode reactive even if it begins before the virtualizer
  // has registered its imperative handle.
  const virtualizationEnabled = enabled && !virtualizationState.renderAllRows;
  const {
    apiRef: listVirtualizerRef,
    estimatedItemHeight: resolvedEstimatedItemHeight,
    focusedRowIndex,
    onUnconstrainedHeight: handleUnconstrainedHeight,
    pinnedRowIndexes,
    renderRow,
    rows,
  } = useListVirtualizerAdapter<Value, Value>({
    actionsRef,
    activeIndex,
    children,
    componentName: 'Combobox',
    estimatedItemHeight,
    getItemKey,
    getItemValue: getComboboxItemValue,
    items: flatFilteredItems as ReadonlyArray<Value>,
    registry: store.state.virtualizationRegistry,
    virtualItemContext: ComboboxVirtualItemContext,
  });

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (!hasItems) {
        warn('<Combobox.Virtualizer> requires the `items` prop on <Combobox.Root>.');
      }
      if (!insideList) {
        warn('<Combobox.Virtualizer> must be placed inside <Combobox.List>.');
      }
      if (externallyVirtualized) {
        warn(
          '<Combobox.Root> must not use the `virtualized` prop together with ' +
            '<Combobox.Virtualizer>. The prop is only for external virtualization.',
        );
      }
      if (isGrouped) {
        warn(
          '<Combobox.Virtualizer> does not currently support grouped collections. ' +
            'Render a flat item collection instead.',
        );
      }
      if (grid) {
        warn(
          '<Combobox.Virtualizer> does not currently support grid mode. ' +
            'Use a flat listbox instead.',
        );
      }
    }, [externallyVirtualized, grid, hasItems, insideList, isGrouped]);
  }

  const scrollToRowIndex = highlightType === 'pointer' ? undefined : focusedRowIndex;

  return (
    <ListVirtualizer
      {...elementProps}
      apiRef={listVirtualizerRef}
      enabled={virtualizationEnabled}
      estimatedItemHeight={resolvedEstimatedItemHeight}
      onUnconstrainedHeight={handleUnconstrainedHeight}
      overscanPx={overscanPx}
      pinnedRowIndexes={pinnedRowIndexes}
      ref={forwardedRef}
      renderRow={renderRow}
      restoreViewportVersion={virtualizationState.renderAllRowsRestoreVersion}
      rows={rows}
      scrollToRowIndex={scrollToRowIndex}
      totalSizeCssVariable={ComboboxVirtualizerCssVars.totalSize}
    />
  );
}) as {
  <Value>(
    props: ComboboxVirtualizer.Props<Value> & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
};

function getComboboxItemValue<Value>(item: Value) {
  return item;
}

/**
 * State metadata exposed to the `Combobox.Virtualizer` render props.
 */
export interface ComboboxVirtualizerState extends ListVirtualizerAdapterState {}

export interface ComboboxVirtualizerActions extends ListVirtualizerAdapterActions {}

/**
 * Props for the `Combobox.Virtualizer` component.
 */
export type ComboboxVirtualizerProps<Value = unknown> = ListVirtualizerAdapterProps<
  Value,
  ComboboxVirtualizerState
> & {
  /**
   * A ref to imperative actions.
   * - `scrollToIndex`: Scrolls an item into view by its logical collection index.
   */
  actionsRef?: React.RefObject<ComboboxVirtualizer.Actions | null> | undefined;
} & ListVirtualizerKeyProps<Value, Value>;

/**
 * Type helpers for the `Combobox.Virtualizer` component.
 */
export namespace ComboboxVirtualizer {
  /**
   * Imperative actions exposed by the component.
   */
  export type Actions = ComboboxVirtualizerActions;
  /**
   * State metadata exposed to render props.
   */
  export type State = ComboboxVirtualizerState;
  /**
   * Props accepted by the component.
   */
  export type Props<Value = unknown> = ComboboxVirtualizerProps<Value>;
}
