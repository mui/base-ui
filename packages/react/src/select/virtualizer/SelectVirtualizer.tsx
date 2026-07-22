'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
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
import { useSelectDerivedItemsContext, useSelectRootContext } from '../root/SelectRootContext';
import { selectors } from '../store';
import type { SelectItemData } from '../utils/resolveSelectItems';
import { SelectVirtualItemContext } from './SelectVirtualItemContext';
import { SelectVirtualizerCssVars } from './SelectVirtualizerCssVars';
import { mergeProps } from '../../merge-props';

/**
 * Renders a window of visible and overscanned items in a flat select list.
 * Renders a scrollable `<div>` element.
 *
 * Requires the `items` prop on `<Select.Root>` and must be the only item-rendering child of
 * `<Select.List>`. Grouped collections are not currently supported.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectVirtualizer = React.forwardRef(function SelectVirtualizer<Value>(
  componentProps: SelectVirtualizer.Props<Value>,
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

  const { store, scrollHandlerRef } = useSelectRootContext();
  const { flatItems, hasItems, isGrouped } = useSelectDerivedItemsContext();
  const activeIndex = useStore(store, selectors.activeIndex);
  const highlightType = useStore(store, selectors.highlightType);
  const insideList = useVirtualizationListContext();
  const {
    apiRef: listVirtualizerRef,
    estimatedItemHeight: resolvedEstimatedItemHeight,
    focusedRowIndex,
    onUnconstrainedHeight: handleUnconstrainedHeight,
    renderRow,
    rows,
  } = useListVirtualizerAdapter<Value, SelectItemData<Value>>({
    actionsRef,
    activeIndex,
    children,
    componentName: 'Select',
    estimatedItemHeight,
    getItemKey,
    getItemValue: getSelectItemValue,
    items: flatItems as ReadonlyArray<SelectItemData<Value>>,
    registry: store.state.virtualizationRegistry,
    virtualItemContext: SelectVirtualItemContext,
  });

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (!hasItems) {
        warn('<Select.Virtualizer> requires the `items` prop on <Select.Root>.');
      }
      if (!insideList) {
        warn('<Select.Virtualizer> must be placed inside <Select.List>.');
      }
      if (isGrouped) {
        warn(
          '<Select.Virtualizer> does not currently support grouped collections. ' +
            'Render a flat item collection instead.',
        );
      }
    }, [hasItems, insideList, isGrouped]);
  }

  const setVirtualizerElement = store.useStateSetter('virtualizerElement');
  const mergedRef = useMergedRefs(forwardedRef, setVirtualizerElement);
  const mergedElementProps = mergeProps(
    {
      onScroll(event: React.UIEvent<HTMLDivElement>) {
        scrollHandlerRef.current?.(event.currentTarget);
      },
    },
    elementProps,
  );
  const scrollToRowIndex = highlightType === 'pointer' ? undefined : focusedRowIndex;

  return (
    <ListVirtualizer
      {...mergedElementProps}
      apiRef={listVirtualizerRef}
      enabled={enabled}
      estimatedItemHeight={resolvedEstimatedItemHeight}
      onUnconstrainedHeight={handleUnconstrainedHeight}
      overscanPx={overscanPx}
      pinnedRowIndex={focusedRowIndex}
      ref={mergedRef}
      renderRow={renderRow}
      rows={rows}
      scrollToRowIndex={scrollToRowIndex}
      totalSizeCssVariable={SelectVirtualizerCssVars.totalSize}
    />
  );
}) as {
  <Value>(
    props: SelectVirtualizer.Props<Value> & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
};

function getSelectItemValue<Value>(item: SelectItemData<Value>) {
  return item.value;
}

export interface SelectVirtualizerState extends ListVirtualizerAdapterState {}

export interface SelectVirtualizerActions extends ListVirtualizerAdapterActions {}

export type SelectVirtualizerProps<Value = unknown> = ListVirtualizerAdapterProps<
  SelectItemData<Value>,
  SelectVirtualizerState
> & {
  /**
   * A ref to imperative actions.
   * - `scrollToIndex`: Scrolls an item into view by its logical collection index.
   */
  actionsRef?: React.RefObject<SelectVirtualizer.Actions | null> | undefined;
} & ListVirtualizerKeyProps<Value, SelectItemData<Value>>;

export namespace SelectVirtualizer {
  export type Actions = SelectVirtualizerActions;
  export type State = SelectVirtualizerState;
  export type Props<Value = unknown> = SelectVirtualizerProps<Value>;
}
