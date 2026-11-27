'use client';
import * as React from 'react';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { warn } from '@base-ui/utils/warn';
import { useDirection } from '../../direction-provider';
import { TreeRootContext } from './TreeRootContext';
import { TreeRootFeaturesContext } from './TreeRootFeatures';
import type { TreeRootFeatureState } from './TreeRootFeatures';
import { TreeStore } from '../store/TreeStore';
import type {
  TreeDefaultItem,
  TreeRootActions,
  TreeRootExpansionChangeEventReason,
  TreeRootExpansionChangeEventDetails,
  TreeRootSelectionChangeEventReason,
  TreeRootSelectionChangeEventDetails,
  TreeMultiple,
  TreeStoreContext,
  TreeRootHighlightEventReason,
  TreeRootHighlightEventDetails,
  TreeRootItemsChangeEventReason,
  TreeRootItemsChangeEventDetails,
  TreeRootItemExpansionToggleEventDetails,
  TreeRootItemExpansionToggleValue,
  TreeRootItemSelectionToggleEventDetails,
  TreeRootItemSelectionToggleValue,
  TreeStateDefaultedKeys,
  TreeStoreParameters,
  TreeCheckboxSelectionPropagation,
} from '../store/types';
import { normalizeTreeItemCollection } from '../items/itemCollection';
import type { TreeItemCollection } from '../items/itemCollection';

const CHECKBOX_SELECTION_PROPAGATION_DISABLED = { parents: false, descendants: false } as const;

/**
 * Groups all parts of the tree.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export function TreeRoot<
  TItem = TreeDefaultItem,
  Multiple extends boolean | 'opt-in' | undefined = false,
>(componentProps: TreeRoot.Props<TItem, Multiple>): React.JSX.Element {
  // The selection's shape follows `multiple`, and the implementation handles every mode.
  const resolvedProps = componentProps as TreeRoot.Props<TItem, TreeMultiple>;
  const {
    // Data
    disabled = false,
    items,
    defaultItems,
    children,
    // Expansion
    expandedItems,
    defaultExpandedItems,
    expandOnClick = false,
    onExpandedItemsChange,
    transactionThrottle = 0,
    onItemExpansionToggle,
    // Selection
    selectedItems,
    defaultSelectedItems,
    onSelectedItemsChange,
    onItemSelectionToggle,
    multiple = false as TreeMultiple,
    disableEmptySelection = false,
    checkboxSelectionPropagation,
    // Focus
    itemFocusableWhenDisabled = true,
    onItemHighlighted,
    // Actions
    actionsRef,
    // Items mutation
    onItemsChange,
  } = resolvedProps;

  const itemsControlled = items !== undefined;
  const itemsInput = itemsControlled ? items : defaultItems;
  const inputCollection = React.useMemo(
    () => normalizeTreeItemCollection(itemsInput),
    [itemsInput],
  );
  // `defaultItems` only seeds the initial items, so an uncontrolled tree ignores
  // later data identities (an inline array would otherwise rebuild every lookup
  // on each parent render). Accessor changes still apply.
  const uncontrolledCollection = React.useMemo(
    () => inputCollection,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      inputCollection.itemToId,
      inputCollection.itemToStringLabel,
      inputCollection.itemToChildren,
      inputCollection.isItemDisabled,
      inputCollection.isItemSelectionDisabled,
      inputCollection.setItemChildren,
    ],
  );
  const itemCollection = itemsControlled ? inputCollection : uncontrolledCollection;
  const itemData = (itemCollection.data ?? EMPTY_ARRAY) as readonly TItem[];

  const direction = useDirection();

  const propagateToParents = checkboxSelectionPropagation?.parents ?? true;
  const propagateToDescendants = checkboxSelectionPropagation?.descendants ?? true;
  const multipleCheckboxSelectionPropagation = React.useMemo(
    () => ({ parents: propagateToParents, descendants: propagateToDescendants }),
    [propagateToParents, propagateToDescendants],
  );
  const effectiveCheckboxSelectionPropagation = multiple
    ? multipleCheckboxSelectionPropagation
    : CHECKBOX_SELECTION_PROPAGATION_DISABLED;

  if (process.env.NODE_ENV !== 'production') {
    if (
      !multiple &&
      (checkboxSelectionPropagation?.parents || checkboxSelectionPropagation?.descendants)
    ) {
      warn(
        'The `checkboxSelectionPropagation` prop has no effect with single selection. Set `multiple` to enable selection propagation.',
      );
    }
  }

  // With multiple selection, `null` selects nothing, so the tree stores it as `[]`.
  const selectedItemsProp = multiple && selectedItems === null ? EMPTY_ARRAY : selectedItems;

  const rootRef = React.useRef<HTMLElement>(null);
  const features = React.useContext(TreeRootFeaturesContext);
  const featureState: TreeRootFeatureState = {};
  for (const feature of features) {
    Object.assign(featureState, feature.state);
  }

  const store = useRefWithInit(() => {
    const created = new TreeStore<TreeMultiple, TItem>({
      disabled,
      items: itemsControlled ? itemData : undefined,
      defaultItems: itemsControlled ? undefined : itemData,
      itemCollection,
      expandedItems,
      defaultExpandedItems,
      expandOnClick,
      onExpandedItemsChange,
      onItemExpansionToggle,
      selectedItems: selectedItemsProp,
      defaultSelectedItems,
      onSelectedItemsChange,
      onItemSelectionToggle,
      multiple,
      disableEmptySelection,
      checkboxSelectionPropagation: effectiveCheckboxSelectionPropagation,
      itemFocusableWhenDisabled,
      onItemHighlighted,
      direction,
      rootRef,
      onItemsChange,
    });
    for (const feature of features) {
      feature.install?.(created);
    }
    created.update(featureState);
    return created;
  }).current;

  useOnMount(store.mountEffect);

  // Sync controlled props. Selection/expansion sync into a dedicated `*Prop`
  // slot so the plugins can tell whether they are controlled and avoid
  // self-mutating internal state.
  // Items and provider options sync first, so a controlled change in the same
  // render already sees them.
  store.useSyncedValues({
    disabled,
    itemsProp: itemsControlled ? itemData : undefined,
    itemCollection,
    expandOnClick,
    transactionThrottle,
    multiple,
    disableEmptySelection,
    checkboxSelectionPropagation: effectiveCheckboxSelectionPropagation,
    itemFocusableWhenDisabled,
    direction,
    hasItemsChangeHandler: onItemsChange != null,
    hasItemSelectionToggleHandler: onItemSelectionToggle != null,
    ...featureState,
  });
  store.useControlledProp('expandedItemsProp', expandedItems);
  store.useControlledProp('selectedItemsProp', selectedItemsProp);

  store.useContextCallback('onExpandedItemsChange', onExpandedItemsChange);
  store.useContextCallback('onItemExpansionToggle', onItemExpansionToggle);
  store.useContextCallback(
    'onSelectedItemsChange',
    onSelectedItemsChange as TreeStoreContext<TItem>['onSelectedItemsChange'],
  );
  store.useContextCallback('onItemSelectionToggle', onItemSelectionToggle);
  store.useContextCallback('onItemHighlighted', onItemHighlighted);
  store.useContextCallback('onItemsChange', onItemsChange);

  React.useImperativeHandle(actionsRef, () => store.getActions(), [store]);
  // After the imperative handle, so plugin callbacks can use `actionsRef`.
  useIsoLayoutEffect(() => store.layoutMountEffect(), [store]);

  return (
    <TreeRootContext.Provider value={store}>
      <TreeRootFeaturesContext.Provider value={EMPTY_ARRAY}>
        {children}
      </TreeRootFeaturesContext.Provider>
    </TreeRootContext.Provider>
  );
}

export interface TreeRootState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

/**
 * Keys that are required on TreeStoreParameters but optional on
 * TreeRootProps because TreeRoot provides defaults.
 */
type TreeRootDefaultedKeys = TreeStateDefaultedKeys;

export type TreeRootItems<TItem> =
  TreeItemCollection<TItem> | ([TItem] extends [TreeDefaultItem] ? readonly TItem[] : never);

type TreeRootInternalKeys = 'rootRef' | 'direction' | 'items' | 'defaultItems' | 'itemCollection';

interface TreeRootOwnProps<TItem> {
  /**
   * The children of the component.
   */
  children?: React.ReactNode;
  /**
   * A ref to imperative actions on the tree.
   */
  actionsRef?: React.RefObject<TreeRootActions<TItem> | null> | undefined;
  /**
   * The controlled item data. Pass a standard item array, or a collection returned by
   * `Tree.createItems()` for a custom item model.
   * A model that extends the standard item must redeclare `children` with its own type.
   */
  items?: TreeRootItems<TItem> | undefined;
  /**
   * The item data used for an uncontrolled component on its initial render.
   * Accepts the same data as `items`.
   */
  defaultItems?: TreeRootItems<TItem> | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * The minimum time between two commits of `actionsRef.applyTransaction()`, in milliseconds.
   * The first transaction after a quiet period commits at once. The ones that follow within
   * the window are applied together, as a single items change, when the window ends.
   * Until then, the actions and the rendered items show the items as the last commit left them.
   * Call `actionsRef.flushTransactions()` to commit them right away.
   * @default 0
   */
  transactionThrottle?: number | undefined;
  /**
   * Whether clicking anywhere on an item row toggles expansion.
   * When `false`, clicking the row does not toggle expansion; clicking its expansion trigger does.
   * @default false
   */
  expandOnClick?: boolean | undefined;
  /**
   * Whether the user is prevented from deselecting the last selected item.
   * An empty initial or controlled selection is still allowed.
   * @default false
   */
  disableEmptySelection?: boolean | undefined;
  /**
   * Controls how checking an item propagates through the hierarchy: with its checkbox, on a
   * `Tree.CheckboxItem` or a row with a `TreeGrid.RowCheckbox`, or with `setItemSelection()`.
   * Pressing an item without a checkbox, replacing the selection, or selecting a range
   * doesn't propagate.
   *
   * When `checkboxSelectionPropagation.descendants` is set to `true`:
   * - Selecting a parent selects all its descendants automatically.
   * - Deselecting a parent deselects all its descendants automatically.
   *
   * When `checkboxSelectionPropagation.parents` is set to `true`:
   * - Selecting all descendants of a parent selects the parent automatically.
   * - Deselecting a descendant of a selected parent deselects the parent automatically.
   *
   * @default { parents: true, descendants: true }
   */
  checkboxSelectionPropagation?: TreeCheckboxSelectionPropagation | undefined;
  /**
   * Whether disabled items should be focusable.
   * A disabled tree leaves the tab order whatever this prop is.
   * @default true
   */
  itemFocusableWhenDisabled?: boolean | undefined;
}

export interface TreeRootProps<
  TItem = TreeDefaultItem,
  Multiple extends boolean | 'opt-in' | undefined = false,
>
  extends
    Omit<TreeStoreParameters<Multiple, TItem>, TreeRootInternalKeys | TreeRootDefaultedKeys>,
    TreeRootOwnProps<TItem> {
  /**
   * Whether multiple items can be selected, and how selecting an item affects the current selection.
   * - `false`: only one item can be selected.
   * - `true`: each item is toggled independently.
   * - `'opt-in'`: selecting an item moves the current selection to it, and users hold a modifier key
   *   to select more than one item. It behaves like `true` on touch devices, where there are no
   *   modifier keys, and for items with a checkbox.
   * @default false
   */
  multiple?: Multiple | undefined;
}

export namespace TreeRoot {
  export type State = TreeRootState;
  export type Props<
    TItem = TreeDefaultItem,
    Multiple extends boolean | 'opt-in' | undefined = false,
  > = TreeRootProps<TItem, Multiple>;
  export type Actions<TItem = TreeDefaultItem> = TreeRootActions<TItem>;
  export type ExpansionChangeEventReason = TreeRootExpansionChangeEventReason;
  export type ExpansionChangeEventDetails = TreeRootExpansionChangeEventDetails;
  export type SelectionChangeEventReason = TreeRootSelectionChangeEventReason;
  export type SelectionChangeEventDetails = TreeRootSelectionChangeEventDetails;
  export type ItemExpansionToggleEventDetails = TreeRootItemExpansionToggleEventDetails;
  export type ItemExpansionToggleValue = TreeRootItemExpansionToggleValue;
  export type ItemSelectionToggleEventDetails = TreeRootItemSelectionToggleEventDetails;
  export type ItemSelectionToggleValue = TreeRootItemSelectionToggleValue;
  export type HighlightEventReason = TreeRootHighlightEventReason;
  export type HighlightEventDetails = TreeRootHighlightEventDetails;
  export type ItemsChangeEventReason = TreeRootItemsChangeEventReason;
  export type ItemsChangeEventDetails<TItem = TreeDefaultItem> =
    TreeRootItemsChangeEventDetails<TItem>;
  export type Items<TItem = TreeDefaultItem> = TreeRootItems<TItem>;
}
