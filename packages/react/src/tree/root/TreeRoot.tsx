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
  TreeItemModel,
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

const defaultGetItemId = (item: TreeItemModel) => item.id;
const defaultGetItemLabel = (item: TreeItemModel) => item.label;
const defaultGetItemChildren = (item: TreeItemModel) => item.children;
const defaultIsItemDisabled = () => false;
const defaultIsItemSelectionDisabled = () => false;

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
    // Plugins
    lazyLoading,
    // Other
    onItemClick,
    onItemLabelChange,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const direction = useDirection();

  const rootRef = React.useRef<HTMLUListElement>(null);

  const store = useRefWithInit(
    () =>
      new TreeStore<Mode>({
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
        direction,
        rootRef,
        lazyLoading,
      }),
  ).current;

  useOnMount(store.mountEffect);

  // Sync controlled props
  store.useControlledProp('expandedItems', expandedItems);
  store.useControlledProp('selectedItems', selectedItems as any);
  const getItemIdFn = getItemId ?? defaultGetItemId;
  const getItemLabelFn = getItemLabel ?? defaultGetItemLabel;
  const getItemChildrenFn = getItemChildren ?? defaultGetItemChildren;
  const isItemDisabledFn = isItemDisabled ?? defaultIsItemDisabled;
  const isItemSelectionDisabledFn = isItemSelectionDisabled ?? defaultIsItemSelectionDisabled;
  store.useSyncedValues({
    disabled: disabled ?? false,
    items,
    expandOnClick: expandOnClick ?? false,
    selectionMode: selectionMode ?? 'single',
    disallowEmptySelection: disallowEmptySelection ?? false,
    selectionPropagation: selectionPropagation ?? EMPTY_OBJECT,
    itemFocusableWhenDisabled: itemFocusableWhenDisabled ?? false,
    getItemId: getItemIdFn,
    getItemLabel: getItemLabelFn,
    getItemChildren: getItemChildrenFn,
    isItemDisabled: isItemDisabledFn,
    isItemSelectionDisabled: isItemSelectionDisabledFn,
    isItemEditable: isItemEditable ?? false,
    direction,
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
      // AnimatedItemList (or other ReactNode) handles its own rendering
      return children;
    }

    return flatItemIds.map((itemId) => (
      <TreeItemModelProvider key={itemId} store={store} itemId={itemId}>
        {children}
      </TreeItemModelProvider>
    ));
  }, [flatItemIds, store, children]);

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
  <Mode extends TreeSelectionMode | undefined = undefined>(
    props: TreeRoot.Props<Mode>,
  ): React.JSX.Element;
};

export interface TreeRootState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface TreeRootProps<Mode extends TreeSelectionMode | undefined = undefined>
  extends
    Omit<BaseUIComponentProps<'ul', TreeRootState>, 'children'>,
    Omit<TreeStoreParameters<Mode>, 'treeId' | 'rootRef' | 'direction'> {
  /**
   * The render function for each tree item, or a `Tree.AnimatedItemList` element
   * for animated expand/collapse transitions.
   */
  children: ((item: TreeItemModel) => React.ReactNode) | React.ReactNode;
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
  export type ItemExpansionToggleEventDetails = TreeItemExpansionToggleEventDetails;
  export type ItemSelectionToggleEventDetails = TreeItemSelectionToggleEventDetails;
  export type ItemFocusEventReason = TreeItemFocusEventReason;
  export type ItemFocusEventDetails = TreeItemFocusEventDetails;
  export type ItemClickEventReason = TreeItemClickEventReason;
  export type ItemClickEventDetails = TreeItemClickEventDetails;
  export type ItemLabelChangeEventReason = TreeItemLabelChangeEventReason;
  export type ItemLabelChangeEventDetails = TreeItemLabelChangeEventDetails;
}
