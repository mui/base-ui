'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { warn } from '@base-ui/utils/warn';
import {
  useComboboxRootContext,
  useComboboxHasItemsContext,
  useComboboxDerivedItemsContext,
} from '../root/ComboboxRootContext';
import {
  useCompositeListItem,
  IndexGuessBehavior,
} from '../../internals/composite/list/useCompositeListItem';
import type { BaseUIComponentProps, HTMLProps, NonNativeButtonProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { ComboboxItemContext } from './ComboboxItemContext';
import { selectors } from '../store';
import { useButton } from '../../internals/use-button';
import { useComboboxRowContext } from '../row/ComboboxRowContext';
import { compareItemEquality, findItemIndex } from '../../internals/itemEquality';
import {
  useComboboxVirtualItemContext,
  type ComboboxVirtualItemMetadata,
} from '../virtualizer/ComboboxVirtualItemContext';
import { useVirtualizationListContext } from '../../internals/virtualization/VirtualizationListContext';

interface ComboboxItemInnerProps {
  componentProps: ComboboxItem.Props;
  forwardedRef: React.ForwardedRef<HTMLDivElement>;
  /**
   * Whether this item uses a known virtual index. Passed down from the wrapper so the inner
   * component doesn't subscribe to virtualization state.
   */
  virtualized: boolean;
  /**
   * Metadata supplied by the built-in virtualizer for the row containing this item.
   * `undefined` for non-virtualized items and items managed by an external virtualizer.
   */
  virtualItem: ComboboxVirtualItemMetadata | undefined;
  /**
   * Pre-resolved index for the virtualized fallback (when no `index` prop is provided).
   * `undefined` for the common path, where the index is derived from `index` prop or the
   * composite list registration order.
   */
  indexFromFilter: number | undefined;
}

/**
 * Implements a Combobox item after the public wrapper has resolved its virtualization metadata.
 */
function ComboboxItemInner(props: ComboboxItemInnerProps) {
  const { componentProps, forwardedRef, virtualized, virtualItem, indexFromFilter } = props;
  const {
    render,
    className,
    style,
    value: itemValue = null,
    index: indexProp,
    disabled: disabledProp = false,
    nativeButton = false,
    ...elementProps
  } = componentProps;

  const textRef = React.useRef<HTMLElement | null>(null);
  if (process.env.NODE_ENV !== 'production') {
    if (virtualItem && indexProp != null && indexProp !== virtualItem.index) {
      warn(
        '<Combobox.Item> received an `index` prop that conflicts with the index provided by ' +
          '<Combobox.Virtualizer>. Remove the `index` prop from virtualized items.',
      );
    }
  }

  const explicitIndex = virtualItem?.index ?? indexProp;
  const listItem = useCompositeListItem({
    index: explicitIndex,
    textRef,
    indexGuessBehavior: IndexGuessBehavior.GuessFromOrder,
  });

  const store = useComboboxRootContext();
  const isRow = useComboboxRowContext();
  const hasItems = useComboboxHasItemsContext();

  const selectionMode = useStore(store, selectors.selectionMode);
  const readOnly = useStore(store, selectors.readOnly);
  const isItemDisabled = useStore(store, selectors.isItemDisabled);
  const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);

  const selectable = selectionMode !== 'none';
  const index = explicitIndex ?? (virtualized ? (indexFromFilter ?? -1) : listItem.index);
  const hasRegistered = listItem.index !== -1;
  const disabled = disabledProp || (index >= 0 && isItemDisabled?.(itemValue, index) === true);

  const rootId = useStore(store, selectors.id);
  const highlighted = useStore(store, selectors.isActive, index);
  const matchesSelectedValue = useStore(store, selectors.isSelected, itemValue);
  const itemProps = useStore(store, selectors.itemProps);

  const itemRef = React.useRef<HTMLDivElement | null>(null);

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => virtualItem?.registerItem?.(), [virtualItem]);
  }

  const id = rootId != null && hasRegistered ? `${rootId}-${index}` : undefined;
  const selected = matchesSelectedValue && selectable;

  useIsoLayoutEffect(() => {
    const shouldRun = hasRegistered && (virtualized || explicitIndex != null);
    if (!shouldRun) {
      return undefined;
    }

    const list = store.state.listRef.current;
    list[index] = itemRef.current;

    return () => {
      delete list[index];
    };
  }, [hasRegistered, virtualized, index, explicitIndex, store]);

  useIsoLayoutEffect(() => {
    if (!hasRegistered || hasItems) {
      return undefined;
    }

    const visibleMap = store.state.valuesRef.current;
    visibleMap[index] = itemValue;

    return () => {
      delete visibleMap[index];
    };
  }, [hasRegistered, hasItems, index, itemValue, store]);

  useIsoLayoutEffect(() => {
    if (!hasRegistered || hasItems) {
      return;
    }

    // Runs while closed as well (the list can stay mounted via `keepMounted` or a
    // force-mount) so the index tracks the item's composite position, keeping features
    // like closed-trigger typeahead in sync when the rendered order changes.
    const selectedValue = store.state.selectedValue;
    const lastSelectedValue = Array.isArray(selectedValue)
      ? selectedValue[selectedValue.length - 1]
      : selectedValue;

    if (compareItemEquality(itemValue, lastSelectedValue, isItemEqualToValue)) {
      store.set('selectedIndex', index);
    }
  }, [hasRegistered, hasItems, store, index, itemValue, isItemEqualToValue]);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton,
    composite: true,
  });

  const state: ComboboxItemState = {
    disabled,
    selected,
    highlighted,
  };

  function commitSelection(nativeEvent: MouseEvent) {
    function selectItem() {
      store.state.handleSelection(nativeEvent, itemValue);
    }

    if (store.state.submitOnItemClick) {
      ReactDOM.flushSync(selectItem);
      store.state.requestSubmit();
    } else {
      selectItem();
    }
  }

  const defaultProps: HTMLProps = {
    id,
    role: isRow ? 'gridcell' : 'option',
    'aria-selected': selectable ? selected : undefined,
    // Focusable items steal focus from the input upon mouseup.
    // Warn if the user renders a natively focusable element like `<button>`,
    // as it should be a `<div>` instead.
    tabIndex: undefined,
    onPointerDownCapture(event) {
      // The compat `mouseup` only fires for the primary pointer, so a non-primary
      // touch must not overwrite the shared ref — a mismatch would make the primary
      // pointer's release read as a drag-select and commit a second time after `click`.
      if (event.isPrimary) {
        store.state.pointerDownItemRef.current = event.currentTarget;
      }
      event.preventDefault();
    },
    onMouseDown(event) {
      // iOS Safari can emit a synthetic mousedown for touch taps without a preceding
      // pointerdown. Prevent default here too so tapping an item does not blur the input.
      event.preventDefault();
    },
    onClick(event) {
      if (disabled || readOnly) {
        return;
      }

      commitSelection(event.nativeEvent);
    },
    onMouseUp(event) {
      const pointerStartedOnItem = store.state.pointerDownItemRef.current === event.currentTarget;
      store.state.pointerDownItemRef.current = null;

      if (disabled || readOnly || event.button !== 0 || pointerStartedOnItem || !highlighted) {
        return;
      }

      commitSelection(event.nativeEvent);
    },
  };

  const element = useRenderElement('div', componentProps, {
    ref: [buttonRef, forwardedRef, listItem.ref, itemRef],
    state,
    props: [itemProps, virtualItem?.props, defaultProps, elementProps, getButtonProps],
  });

  const contextValue: ComboboxItemContext = React.useMemo(
    () => ({
      selected,
      textRef,
    }),
    [selected, textRef],
  );

  return (
    <ComboboxItemContext.Provider value={contextValue}>{element}</ComboboxItemContext.Provider>
  );
}

/**
 * Resolves the index from the filtered items for the virtualized fallback (no `index` prop).
 * Isolated here so that this per-keystroke subscription to the derived-items context is only
 * paid by virtualized items. Those re-render on every input change anyway — the parent
 * virtualizer re-windows the list as the filtered set changes — so the extra subscription costs
 * them nothing, while it keeps every non-virtualized item off that context.
 */
function ComboboxItemVirtualizedIndex(props: {
  componentProps: ComboboxItem.Props;
  forwardedRef: React.ForwardedRef<HTMLDivElement>;
}) {
  const { componentProps, forwardedRef } = props;

  const store = useComboboxRootContext();
  const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);
  const { flatFilteredItems } = useComboboxDerivedItemsContext();

  const indexFromFilter = findItemIndex(
    flatFilteredItems,
    componentProps.value ?? null,
    isItemEqualToValue,
  );

  // Only reached when the root uses external virtualization (see the wrapper below).
  return (
    <ComboboxItemInner
      componentProps={componentProps}
      forwardedRef={forwardedRef}
      virtualized
      virtualItem={undefined}
      indexFromFilter={indexFromFilter}
    />
  );
}

/**
 * An individual item in the list.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxItem = React.memo(
  React.forwardRef(function ComboboxItem(
    componentProps: ComboboxItem.Props,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const store = useComboboxRootContext();
    const externallyVirtualized = useStore(store, selectors.externallyVirtualized);
    const virtualItem = useComboboxVirtualItemContext();
    const insideList = useVirtualizationListContext();

    if (process.env.NODE_ENV !== 'production') {
      // The build-time environment never changes during a component's lifetime.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useIsoLayoutEffect(() => {
        if (virtualItem != null || !insideList) {
          return undefined;
        }

        const registry = store.state.virtualizationRegistry;
        registry.nonVirtualItemCount += 1;

        if (registry.virtualizers.size > 0) {
          warn(
            '<Combobox.List> must not render static <Combobox.Item> elements alongside ' +
              '<Combobox.Virtualizer>. Render every list item through the virtualizer.',
          );
        }

        return () => {
          registry.nonVirtualItemCount -= 1;
        };
      }, [insideList, store, virtualItem]);
    }

    // External virtualization and whether an item provides an explicit `index` must be stable
    // for an item's lifetime: the two branches return different component types, so flipping
    // either at runtime remounts the item and resets its refs and effects. Built-in virtual
    // items receive their index from context and stay on the regular branch.
    if (externallyVirtualized && componentProps.index == null && virtualItem == null) {
      return (
        <ComboboxItemVirtualizedIndex componentProps={componentProps} forwardedRef={forwardedRef} />
      );
    }

    return (
      <ComboboxItemInner
        componentProps={componentProps}
        forwardedRef={forwardedRef}
        virtualized={externallyVirtualized || virtualItem != null}
        virtualItem={virtualItem}
        indexFromFilter={undefined}
      />
    );
  }),
);

export interface ComboboxItemState {
  /**
   * Whether the item should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is selected.
   */
  selected: boolean;
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
}

export interface ComboboxItemProps
  extends NonNativeButtonProps, Omit<BaseUIComponentProps<'div', ComboboxItemState>, 'id'> {
  children?: React.ReactNode;
  /**
   * An optional click handler for the item when selected.
   * It fires when clicking the item with the pointer, as well as when pressing `Enter` with the keyboard if the item is highlighted when the `Input` or `List` element has focus.
   */
  onClick?: BaseUIComponentProps<'div', ComboboxItemState>['onClick'] | undefined;
  /**
   * The index of the item in the list. Improves performance when specified by avoiding the need to calculate the index automatically from the DOM.
   */
  index?: number | undefined;
  /**
   * A unique value that identifies this item.
   * @default null
   */
  value?: any;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace ComboboxItem {
  export type State = ComboboxItemState;
  export type Props = ComboboxItemProps;
}
