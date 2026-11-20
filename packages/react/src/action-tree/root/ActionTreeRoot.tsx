'use client';
import * as React from 'react';
import { TreeRoot } from '../../tree/root/TreeRoot';
import { TreeRootFeatureProvider } from '../../tree/root/TreeRootFeatures';
import type { TreeRootFeature } from '../../tree/root/TreeRootFeatures';
import { TreeGridPlugin } from '../plugins/TreeGridPlugin';
import type { TreeDefaultItem, TreeSelectionMode } from '../../tree/store/types';

const GRID_FEATURE: TreeRootFeature = { install: TreeGridPlugin.install };

/**
 * Groups all parts of the action tree.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Action Tree](https://base-ui.com/react/components/action-tree)
 */
export function ActionTreeRoot<
  TItem = TreeDefaultItem,
  Mode extends TreeSelectionMode | undefined = undefined,
>(props: ActionTreeRoot.Props<TItem, Mode>): React.JSX.Element {
  // The props are `Tree.Root`'s own, but TypeScript can't relate its conditional
  // props type across the generic boundary.
  return (
    <TreeRootFeatureProvider feature={GRID_FEATURE}>
      <TreeRoot {...(props as TreeRoot.Props)} />
    </TreeRootFeatureProvider>
  );
}

export type ActionTreeRootState = TreeRoot.State;

export type ActionTreeRootProps<
  TItem = TreeDefaultItem,
  Mode extends TreeSelectionMode | undefined = TreeSelectionMode | undefined,
> = TreeRoot.Props<TItem, Mode>;

export namespace ActionTreeRoot {
  export type State = ActionTreeRootState;
  export type Props<
    TItem = TreeDefaultItem,
    Mode extends TreeSelectionMode | undefined = TreeSelectionMode | undefined,
  > = ActionTreeRootProps<TItem, Mode>;
  export type Actions<TItem = TreeDefaultItem> = TreeRoot.Actions<TItem>;
  export type ExpansionChangeEventReason = TreeRoot.ExpansionChangeEventReason;
  export type ExpansionChangeEventDetails = TreeRoot.ExpansionChangeEventDetails;
  export type SelectionChangeEventReason = TreeRoot.SelectionChangeEventReason;
  export type SelectionChangeEventDetails = TreeRoot.SelectionChangeEventDetails;
  export type ItemExpansionToggleEventDetails = TreeRoot.ItemExpansionToggleEventDetails;
  export type ItemExpansionToggleValue = TreeRoot.ItemExpansionToggleValue;
  export type ItemSelectionToggleEventDetails = TreeRoot.ItemSelectionToggleEventDetails;
  export type ItemSelectionToggleValue = TreeRoot.ItemSelectionToggleValue;
  export type HighlightEventReason = TreeRoot.HighlightEventReason;
  export type HighlightEventDetails = TreeRoot.HighlightEventDetails;
  export type ItemsChangeEventReason = TreeRoot.ItemsChangeEventReason;
  export type ItemsChangeEventDetails<TItem = TreeDefaultItem> =
    TreeRoot.ItemsChangeEventDetails<TItem>;
  export type Items<TItem = TreeDefaultItem> = TreeRoot.Items<TItem>;
}
