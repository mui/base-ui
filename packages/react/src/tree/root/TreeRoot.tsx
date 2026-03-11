'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { TreeRootContext } from './TreeRootContext';
import { TreeItemContext, type TreeItemContextValue } from '../item/TreeItemContext';
import { TreeStore, type TreeStoreParameters } from '../store/TreeStore';
import { selectors } from '../store/selectors';
import type {
  TreeItemModel,
  TreeRootActions,
  TreeRootExpansionChangeEventReason,
  TreeRootExpansionChangeEventDetails,
  TreeRootSelectionChangeEventReason,
  TreeRootSelectionChangeEventDetails,
  TreeSelectionMode,
} from '../store/types';
import { EMPTY_OBJECT } from '../../utils/constants';

/**
 * Groups all parts of the tree.
 * Renders a `<ul>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeRoot = React.forwardRef(function TreeRoot<
  Mode extends TreeSelectionMode | undefined = undefined,
>(componentProps: TreeRoot.Props<Mode>, forwardedRef: React.ForwardedRef<HTMLUListElement>) {
  const {
    // Rendering props
    className,
    render,
    // Data
    items,
    children,
    // Expansion
    expandedItems,
    defaultExpandedItems,
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
    getItemId,
    getItemLabel,
    getItemChildren,
    isItemDisabled,
    isItemSelectionDisabled,
    isItemEditable,
    // Focus
    itemFocusableWhenDisabled,
    onItemFocus,
    // Actions
    actionsRef,
    // Other
    onItemClick,
    onItemLabelChange,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const rootRef = React.useRef<HTMLUListElement>(null);

  const store = useRefWithInit(
    () =>
      new TreeStore<Mode>({
        items,
        expandedItems,
        defaultExpandedItems,
        onExpandedItemsChange,
        onItemExpansionToggle,
        selectedItems,
        defaultSelectedItems,
        onSelectedItemsChange,
        onItemSelectionToggle,
        selectionMode,
        disallowEmptySelection,
        selectionPropagation,
        getItemId,
        getItemLabel,
        getItemChildren,
        isItemDisabled,
        isItemSelectionDisabled,
        isItemEditable,
        itemFocusableWhenDisabled,
        onItemFocus,
        onItemClick,
        onItemLabelChange,
        rootRef,
      }),
  ).current;

  // Sync controlled props
  store.useControlledProp('expandedItems', expandedItems);
  store.useControlledProp('selectedItems', selectedItems as any);
  store.useSyncedValues({
    selectionMode: selectionMode ?? 'single',
    disallowEmptySelection: disallowEmptySelection ?? false,
    selectionPropagation: selectionPropagation ?? EMPTY_OBJECT,
    itemFocusableWhenDisabled: itemFocusableWhenDisabled ?? false,
  });
  store.useContextCallback('onExpandedItemsChange', onExpandedItemsChange);
  store.useContextCallback('onItemExpansionToggle', onItemExpansionToggle);
  store.useContextCallback('onSelectedItemsChange', onSelectedItemsChange as any);
  store.useContextCallback('onItemSelectionToggle', onItemSelectionToggle);
  store.useContextCallback('onItemFocus', onItemFocus);
  store.useContextCallback('onItemClick', onItemClick);
  store.useContextCallback('onItemLabelChange', onItemLabelChange);

  // Rebuild items state when items prop changes
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    store.rebuildItemsState(items);
  }, [store, items]);

  // Expose imperative actions
  React.useImperativeHandle(actionsRef, () => store.getActions(), [store]);

  // Get flat list of visible items
  const flatItemIds = useStore(store, selectors.flatList);

  const state: TreeRoot.State = {};

  const element = useRenderElement('ul', componentProps, {
    state,
    ref: [forwardedRef, rootRef],
    props: [
      {
        role: 'tree',
        'aria-multiselectable': selectionMode === 'multiple' || undefined,
        children: flatItemIds.map((itemId) => {
          // eslint-disable-next-line react/jsx-no-constructed-context-values -- unique per item
          const contextValue: TreeItemContextValue = { itemId };
          const model = store.state.itemModelLookup[itemId];
          return (
            <TreeItemContext.Provider key={itemId} value={contextValue}>
              {(children as (item: TreeItemModel) => React.ReactNode)(model)}
            </TreeItemContext.Provider>
          );
        }),
        onFocus: store.rootEventHandlers.onFocus,
        onBlur: store.rootEventHandlers.onBlur,
        onKeyDown: store.rootEventHandlers.onKeyDown,
      },
      elementProps,
    ],
  });

  return <TreeRootContext.Provider value={store}>{element}</TreeRootContext.Provider>;
}) as {
  <Mode extends TreeSelectionMode | undefined = undefined>(
    props: TreeRoot.Props<Mode>,
  ): React.JSX.Element;
};

export interface TreeRootState {}

export interface TreeRootProps<Mode extends TreeSelectionMode | undefined = undefined>
  extends
    Omit<BaseUIComponentProps<'ul', TreeRootState>, 'children'>,
    Omit<TreeStoreParameters<Mode>, 'treeId' | 'rootRef'> {
  /**
   * The render function for each tree item.
   * Called with the item model for each visible item.
   */
  children: (item: TreeItemModel) => React.ReactNode;
  /**
   * A ref to imperative actions on the tree.
   */
  actionsRef?: React.RefObject<TreeRootActions | null> | undefined;
}

export namespace TreeRoot {
  export type State = TreeRootState;
  export type Props<Mode extends TreeSelectionMode | undefined = undefined> = TreeRootProps<Mode>;
  export type Actions = TreeRootActions;
  export type ExpansionChangeEventReason = TreeRootExpansionChangeEventReason;
  export type ExpansionChangeEventDetails = TreeRootExpansionChangeEventDetails;
  export type SelectionChangeEventReason = TreeRootSelectionChangeEventReason;
  export type SelectionChangeEventDetails = TreeRootSelectionChangeEventDetails;
}
