'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import {
  useVirtualizer,
  type VirtualizerEstimateSize,
  type VirtualizerItemKey,
} from '../../internals/virtualization';
import {
  useComboboxDerivedItemsContext,
  useComboboxRootContext,
} from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { ComboboxVirtualItemContext } from './ComboboxVirtualItemContext';

/**
 * Renders only the visible items in the combobox list.
 * Renders a scrollable `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxVirtualizer = React.forwardRef(function ComboboxVirtualizer<Value>(
  componentProps: ComboboxVirtualizer.Props<Value>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    style,
    children,
    estimateSize,
    getItemKey,
    overscan = 1,
    paddingStart = 0,
    paddingEnd = 0,
    scrollPaddingStart = 0,
    scrollPaddingEnd = 0,
    enabled: enabledProp = true,
    ...elementProps
  } = componentProps;

  const store = useComboboxRootContext();
  const { flatFilteredItems } = useComboboxDerivedItemsContext();

  const activeIndex = useStore(store, selectors.activeIndex);
  const open = useStore(store, selectors.open);
  const inline = useStore(store, selectors.inline);

  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
  const enabled = enabledProp && (open || inline);

  const getKey = React.useCallback(
    (index: number) => {
      const item = flatFilteredItems[index] as Value;
      return getItemKey ? getItemKey(item, index) : index;
    },
    [flatFilteredItems, getItemKey],
  );

  const virtualizer = useVirtualizer({
    count: flatFilteredItems.length,
    enabled,
    estimateSize,
    getItemKey: getKey,
    getScrollElement: () => scrollElementRef.current,
    overscan,
    paddingStart,
    paddingEnd,
    scrollPaddingStart,
    scrollPaddingEnd,
  });
  const { scrollToIndex } = virtualizer;

  const handleScrollElementRef = useStableCallback((element: HTMLDivElement | null) => {
    scrollElementRef.current = element;
    if (element) {
      virtualizer.measure();
    }
  });

  useIsoLayoutEffect(() => {
    store.update({
      virtualizerMounted: true,
      virtualized: true,
    });

    return () => {
      store.update({
        virtualizerMounted: false,
        virtualized: store.state.externalVirtualized,
      });
    };
  }, [store]);

  useIsoLayoutEffect(() => {
    if (
      !enabled ||
      activeIndex == null ||
      activeIndex < 0 ||
      activeIndex >= flatFilteredItems.length
    ) {
      return;
    }

    scrollToIndex(activeIndex, { align: 'nearest' });
  }, [activeIndex, enabled, flatFilteredItems.length, scrollToIndex]);

  const totalSize = virtualizer.getTotalSize();
  const virtualItems = virtualizer.getVirtualItems();

  const state: ComboboxVirtualizerState = {
    empty: flatFilteredItems.length === 0,
    totalSize,
  };

  const defaultProps: HTMLProps = {
    role: 'presentation',
    style: {
      ['--total-size' as string]: `${totalSize}px`,
      overflow: 'auto',
    } as React.CSSProperties,
    children: (
      <div
        role="presentation"
        style={{
          height: totalSize,
          position: 'relative',
          width: '100%',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = flatFilteredItems[virtualItem.index] as Value | undefined;

          if (virtualItem.index >= flatFilteredItems.length) {
            return null;
          }

          const itemStyle: React.CSSProperties = {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: virtualItem.size,
            transform: `translateY(${virtualItem.start}px)`,
          };

          return (
            <ComboboxVirtualItemContext.Provider
              key={virtualItem.key}
              value={{
                index: virtualItem.index,
                measureRef: virtualItem.measureRef,
                props: {
                  'aria-posinset': virtualItem.index + 1,
                  'aria-setsize': flatFilteredItems.length,
                  'data-index': virtualItem.index,
                  style: itemStyle,
                },
              }}
            >
              {children(item as Value, virtualItem.index)}
            </ComboboxVirtualItemContext.Provider>
          );
        })}
      </div>
    ),
  };

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, handleScrollElementRef],
    props: [defaultProps, elementProps],
  });
}) as {
  <Value = any>(
    props: ComboboxVirtualizer.Props<Value> & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
};

/**
 * State metadata exposed to the `Combobox.Virtualizer` render props.
 */
export interface ComboboxVirtualizerState {
  /**
   * Whether the virtualized collection has no items.
   */
  empty: boolean;
  /**
   * Total virtual content size in pixels.
   */
  totalSize: number;
}

/**
 * Props for the `Combobox.Virtualizer` component.
 */
export interface ComboboxVirtualizerProps<Value = any> extends Omit<
  BaseUIComponentProps<'div', ComboboxVirtualizerState>,
  'children'
> {
  /**
   * Renders an item for the given value and logical index.
   */
  children: (item: Value, index: number) => React.ReactNode;
  /**
   * Estimated item size used before item elements have been measured.
   */
  estimateSize: VirtualizerEstimateSize;
  /**
   * Returns a stable key for the item value and logical index.
   */
  getItemKey?: ((item: Value, index: number) => VirtualizerItemKey) | undefined;
  /**
   * Number of extra items to render before and after the visible range.
   * @default 1
   */
  overscan?: number | undefined;
  /**
   * Empty space before the first item in the virtual content.
   * @default 0
   */
  paddingStart?: number | undefined;
  /**
   * Empty space after the last item in the virtual content.
   * @default 0
   */
  paddingEnd?: number | undefined;
  /**
   * Start-side viewport padding used when computing visible range and scroll alignment.
   * @default 0
   */
  scrollPaddingStart?: number | undefined;
  /**
   * End-side viewport padding used when computing visible range and scroll alignment.
   * @default 0
   */
  scrollPaddingEnd?: number | undefined;
  /**
   * Whether scroll and measurement observers should be active.
   * @default true
   */
  enabled?: boolean | undefined;
}

/**
 * Type helpers for the `Combobox.Virtualizer` component.
 */
export namespace ComboboxVirtualizer {
  /**
   * State metadata exposed to render props.
   */
  export type State = ComboboxVirtualizerState;
  /**
   * Props accepted by the component.
   */
  export type Props<Value = any> = ComboboxVirtualizerProps<Value>;
}
