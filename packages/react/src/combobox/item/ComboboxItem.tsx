'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import {
  useComboboxRootContext,
  useComboboxHasItemsContext,
  useComboboxDerivedItemsContext,
} from '../root/ComboboxRootContext';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import type { BaseUIComponentProps, HTMLProps, NonNativeButtonProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { ComboboxItemContext } from './ComboboxItemContext';
import { useButton } from '../../internals/use-button';
import { useComboboxRowContext } from '../row/ComboboxRowContext';
import {
  compareItemEquality,
  findItemIndex,
  shouldClaimSelectedIndex,
} from '../../internals/itemEquality';

interface ComboboxItemInnerProps {
  componentProps: ComboboxItem.Props;
  forwardedRef: React.ForwardedRef<HTMLDivElement>;
  /**
   * Whether the list is externally virtualized. Passed down from the wrapper (which already
   * subscribes to it) so the inner component doesn't re-subscribe to the store.
   */
  virtualized: boolean;
  /**
   * Pre-resolved index for the virtualized fallback (when no `index` prop is provided).
   * `undefined` for the common path, where the index is derived from `index` prop or the
   * composite list registration order.
   */
  indexFromFilter: number | undefined;
}

function ComboboxItemInner(props: ComboboxItemInnerProps) {
  const { componentProps, forwardedRef, virtualized, indexFromFilter } = props;
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
  const listItem = useCompositeListItem({
    guess: true,
    index: indexProp,
    textRef,
  });

  const store = useComboboxRootContext();
  const isRow = useComboboxRowContext();
  const hasItems = useComboboxHasItemsContext();

  const selectionMode = store.useState('selectionMode');
  const rootDisabled = store.useState('disabled');
  const readOnly = store.useState('readOnly');
  const isItemEqualToValue = store.useState('isItemEqualToValue');

  const disabled = rootDisabled || disabledProp;
  const selectable = selectionMode !== 'none';
  const index = indexProp ?? indexFromFilter ?? listItem.index;
  const hasRegistered = index !== -1;

  const rootId = store.useState('id');
  const highlighted = store.useState('isActive', index);
  const matchesSelectedValue = store.useState('isSelected', itemValue);
  const itemProps = store.useState('itemProps');

  const itemRef = React.useRef<HTMLDivElement | null>(null);

  const id = rootId != null && hasRegistered ? `${rootId}-${index}` : undefined;
  const selected = matchesSelectedValue && selectable;

  useIsoLayoutEffect(() => {
    const shouldRun = hasRegistered && (virtualized || indexProp != null);
    if (!shouldRun) {
      return undefined;
    }

    const list = store.context.listRef.current;
    list[index] = itemRef.current;

    return () => {
      delete list[index];
    };
  }, [hasRegistered, virtualized, index, indexProp, store]);

  useIsoLayoutEffect(() => {
    if (!hasRegistered || hasItems) {
      return undefined;
    }

    const visibleValues = store.context.valuesRef.current;
    visibleValues[index] = itemValue;

    return () => {
      delete visibleValues[index];
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

    if (store.state.selectionMode === 'multiple' && Array.isArray(selectedValue)) {
      // The first selected item in rendered order owns the index, so the anchor does not
      // depend on the order in which the values were added to the array.
      if (
        shouldClaimSelectedIndex(
          index,
          itemValue,
          store.context.valuesRef.current,
          selectedValue,
          isItemEqualToValue,
          store.state.selectedIndex,
        )
      ) {
        store.set('selectedIndex', index);
      }
      return;
    }

    if (compareItemEquality(itemValue, selectedValue, isItemEqualToValue)) {
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
      store.context.handleSelection(nativeEvent, itemValue);
    }

    if (store.state.submitOnItemClick) {
      ReactDOM.flushSync(selectItem);
      store.context.requestSubmit();
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
        store.context.pointerDownItemRef.current = event.currentTarget;
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
      const pointerStartedOnItem = store.context.pointerDownItemRef.current === event.currentTarget;
      store.context.pointerDownItemRef.current = null;

      if (disabled || readOnly || event.button !== 0 || pointerStartedOnItem || !highlighted) {
        return;
      }

      commitSelection(event.nativeEvent);
    },
  };

  const element = useRenderElement('div', componentProps, {
    ref: [buttonRef, forwardedRef, listItem.ref, itemRef],
    state,
    props: [itemProps, defaultProps, elementProps, getButtonProps],
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
  const isItemEqualToValue = store.useState('isItemEqualToValue');
  const { flatFilteredValues } = useComboboxDerivedItemsContext();

  const lookupValue = componentProps.value ?? null;
  const indexFromFilter = findItemIndex(flatFilteredValues, lookupValue, isItemEqualToValue);

  // Only reached when `virtualized` is true (see the wrapper below).
  return (
    <ComboboxItemInner
      componentProps={componentProps}
      forwardedRef={forwardedRef}
      virtualized
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
    const virtualized = store.useState('virtualized');

    // `virtualized` (and whether an item provides an explicit `index`) must be stable for an
    // item's lifetime: the two branches return different component types, so flipping it at
    // runtime remounts the item and resets its refs and effects.
    if (virtualized && componentProps.index == null) {
      return (
        <ComboboxItemVirtualizedIndex componentProps={componentProps} forwardedRef={forwardedRef} />
      );
    }

    return (
      <ComboboxItemInner
        componentProps={componentProps}
        forwardedRef={forwardedRef}
        virtualized={virtualized}
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
