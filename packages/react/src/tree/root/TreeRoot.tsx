'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDirection } from '../../direction-provider/DirectionContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { TreeRootContext } from './TreeRootContext';
import { TreeStore, type TreeStoreParameters } from '../store/TreeStore';
import { selectors } from '../store/selectors';
import type {
  TreeDefaultItemModel,
  TreeRootActions,
  TreeRootExpansionChangeEventReason,
  TreeRootExpansionChangeEventDetails,
  TreeRootSelectionChangeEventReason,
  TreeRootSelectionChangeEventDetails,
  TreeSelectionMode,
  TreeItemFocusEventReason,
  TreeItemFocusEventDetails,
  TreeItemClickEventReason,
  TreeItemClickEventDetails,
  TreeItemLabelChangeEventReason,
  TreeItemLabelChangeEventDetails,
  TreeItemExpansionToggleEventDetails,
  TreeItemSelectionToggleEventDetails,
} from '../store/types';
import { EMPTY_OBJECT } from '../../utils/constants';
import { TreeItemModelProvider } from '../utils/TreeItemModelProvider';

const defaultItemToId = (item: any) => item.id;
const defaultItemToLabel = (item: any) => item.label;
const defaultItemToChildren = (item: any) => item.children;
const defaultIsItemDisabled = (item: any) => !!item.disabled;
const defaultIsItemSelectionDisabled = (item: any) => !!item.disabled;

/**
 * Groups all parts of the tree.
 * Renders a `<ul>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeRoot = React.forwardRef(function TreeRoot<
  Mode extends TreeSelectionMode | undefined = undefined,
  TItem = TreeDefaultItemModel,
>(componentProps: TreeRoot.Props<Mode, TItem>, forwardedRef: React.ForwardedRef<HTMLUListElement>) {
  const {
    // Rendering props
    className,
    render,
    // Data
    disabled,
    items,
    children,
    // Expansion
    expandedItems,
    defaultExpandedItems,
    expandOnClick,
    onExpandedItemsChange,
    onItemExpansionToggle,
    // Selection
    selectedItems,
    defaultSelectedItems,
    onSelectedItemsChange,
    onItemSelectionToggle,
    selectionMode,
    disallowEmptySelection,
    selectionPropagation,
    // Item accessors
    itemToId = defaultItemToId,
    itemToLabel = defaultItemToLabel,
    itemToChildren = defaultItemToChildren,
    isItemDisabled = defaultIsItemDisabled,
    isItemSelectionDisabled = defaultIsItemSelectionDisabled,
    isItemEditable,
    // Focus
    itemFocusableWhenDisabled,
    onItemFocus,
    // Actions
    actionsRef,
    // Plugins
    lazyLoading,
    // Virtualization
    virtualized,
    // Other
    onItemClick,
    onItemLabelChange,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const direction = useDirection();

  if (process.env.NODE_ENV !== 'production') {
    if (
      (selectionMode === undefined || selectionMode === 'single') &&
      (selectionPropagation?.parents || selectionPropagation?.descendants)
    ) {
      console.warn(
        'Base UI: The `selectionPropagation` prop is not supported when `selectionMode="single"`. It will be ignored.',
      );
    }
  }

  const rootRef = React.useRef<HTMLUListElement>(null);

  const store = useRefWithInit(
    () =>
      new TreeStore<Mode, TItem>({
        disabled,
        items,
        expandedItems,
        defaultExpandedItems,
        expandOnClick,
        onExpandedItemsChange,
        onItemExpansionToggle,
        selectedItems,
        defaultSelectedItems,
        onSelectedItemsChange,
        onItemSelectionToggle,
        selectionMode,
        disallowEmptySelection,
        selectionPropagation,
        itemToId,
        itemToLabel,
        itemToChildren,
        isItemDisabled,
        isItemSelectionDisabled,
        isItemEditable,
        itemFocusableWhenDisabled,
        onItemFocus,
        onItemClick,
        onItemLabelChange,
        direction,
        rootRef,
        lazyLoading,
        virtualized,
      }),
  ).current;

  useOnMount(store.mountEffect);

  // Sync controlled props
  store.useControlledProp('expandedItems', expandedItems);
  store.useControlledProp('selectedItems', selectedItems as any);
  store.useSyncedValues({
    disabled: disabled ?? false,
    items,
    expandOnClick: expandOnClick ?? false,
    selectionMode: selectionMode ?? 'single',
    disallowEmptySelection: disallowEmptySelection ?? false,
    selectionPropagation: selectionPropagation ?? EMPTY_OBJECT,
    itemFocusableWhenDisabled: itemFocusableWhenDisabled ?? false,
    itemToId,
    itemToLabel,
    itemToChildren,
    isItemDisabled,
    isItemSelectionDisabled,
    isItemEditable: isItemEditable ?? false,
    direction,
    virtualized: virtualized ?? false,
  });

  store.useContextCallback('onExpandedItemsChange', onExpandedItemsChange);
  store.useContextCallback('onItemExpansionToggle', onItemExpansionToggle);
  store.useContextCallback('onSelectedItemsChange', onSelectedItemsChange as any);
  store.useContextCallback('onItemSelectionToggle', onItemSelectionToggle);
  store.useContextCallback('onItemFocus', onItemFocus);
  store.useContextCallback('onItemClick', onItemClick);
  store.useContextCallback('onItemLabelChange', onItemLabelChange);

  // Expose imperative actions
  React.useImperativeHandle(actionsRef, () => store.getActions(), [store]);

  // Get flat list of visible items
  const flatItemIds = useStore(store, selectors.flatList);

  const renderChildren = React.useMemo(() => {
    if (typeof children !== 'function') {
      // AnimatedItemList (or other ReactNode) handles its own rendering.
      // When virtualized, the consumer controls rendering via useVisibleItems().
      return children;
    }

    if (virtualized) {
      return null;
    }

    return flatItemIds.map((itemId) => (
      <TreeItemModelProvider key={itemId} store={store} itemId={itemId}>
        {children as any}
      </TreeItemModelProvider>
    ));
  }, [virtualized, flatItemIds, store, children]);

  const state: TreeRoot.State = {
    disabled: disabled ?? false,
  };

  const element = useRenderElement('ul', componentProps, {
    state,
    ref: [forwardedRef, rootRef],
    props: [
      {
        role: 'tree',
        'aria-multiselectable': selectionMode === 'multiple' || undefined,
        children: renderChildren,
        onFocus: store.rootEventHandlers.onFocus,
        onBlur: store.rootEventHandlers.onBlur,
        onKeyDown: store.rootEventHandlers.onKeyDown,
      },
      elementProps,
    ],
  });

  return <TreeRootContext.Provider value={store}>{element}</TreeRootContext.Provider>;
}) as {
  <Mode extends TreeSelectionMode | undefined = undefined, TItem = TreeDefaultItemModel>(
    props: TreeRoot.Props<Mode, TItem>,
  ): React.JSX.Element;
};

export interface TreeRootState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface TreeRootProps<
  Mode extends TreeSelectionMode | undefined = undefined,
  TItem = TreeDefaultItemModel,
>
  extends
    Omit<BaseUIComponentProps<'ul', TreeRootState>, 'children'>,
    Omit<TreeStoreParameters<Mode, TItem>, 'rootRef' | 'direction'> {
  /**
   * The render function for each tree item, or a `Tree.AnimatedItemList` element
   * for animated expand/collapse transitions.
   */
  children: ((item: TItem) => React.ReactNode) | React.ReactNode;
  /**
   * A ref to imperative actions on the tree.
   */
  actionsRef?: React.RefObject<TreeRootActions<TItem> | null> | undefined;
}

export namespace TreeRoot {
  export type State = TreeRootState;
  export type Props<
    Mode extends TreeSelectionMode | undefined = undefined,
    TItem = TreeDefaultItemModel,
  > = TreeRootProps<Mode, TItem>;
  export type Actions<TItem = TreeDefaultItemModel> = TreeRootActions<TItem>;
  export type ExpansionChangeEventReason = TreeRootExpansionChangeEventReason;
  export type ExpansionChangeEventDetails = TreeRootExpansionChangeEventDetails;
  export type SelectionChangeEventReason = TreeRootSelectionChangeEventReason;
  export type SelectionChangeEventDetails = TreeRootSelectionChangeEventDetails;
  export type ItemExpansionToggleEventDetails = TreeItemExpansionToggleEventDetails;
  export type ItemSelectionToggleEventDetails = TreeItemSelectionToggleEventDetails;
  export type ItemFocusEventReason = TreeItemFocusEventReason;
  export type ItemFocusEventDetails = TreeItemFocusEventDetails;
  export type ItemClickEventReason = TreeItemClickEventReason;
  export type ItemClickEventDetails = TreeItemClickEventDetails;
  export type ItemLabelChangeEventReason = TreeItemLabelChangeEventReason;
  export type ItemLabelChangeEventDetails = TreeItemLabelChangeEventDetails;
}
