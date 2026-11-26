'use client';
import * as React from 'react';
import { TreeRoot } from '../../tree/root/TreeRoot';
import { TreeRootFeatureProvider } from '../../tree/root/TreeRootFeatures';
import type { TreeRootFeature } from '../../tree/root/TreeRootFeatures';
import { TreeGridPlugin } from '../plugins/TreeGridPlugin';
import type { TreeDefaultItem } from '../../tree/store/types';

const GRID_FEATURE: TreeRootFeature = { install: TreeGridPlugin.install };

/**
 * Groups all parts of the tree grid.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Tree Grid](https://base-ui.com/react/components/tree-grid)
 */
export function TreeGridRoot<
  TItem = TreeDefaultItem,
  Multiple extends boolean | 'opt-in' | undefined = false,
>(props: TreeGridRoot.Props<TItem, Multiple>): React.JSX.Element {
  return (
    <TreeRootFeatureProvider feature={GRID_FEATURE}>
      <TreeRoot {...props} />
    </TreeRootFeatureProvider>
  );
}

export type TreeGridRootState = TreeRoot.State;

export type TreeGridRootProps<
  TItem = TreeDefaultItem,
  Multiple extends boolean | 'opt-in' | undefined = false,
> = TreeRoot.Props<TItem, Multiple>;

export namespace TreeGridRoot {
  export type State = TreeGridRootState;
  export type Props<
    TItem = TreeDefaultItem,
    Multiple extends boolean | 'opt-in' | undefined = false,
  > = TreeGridRootProps<TItem, Multiple>;
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
