'use client';
import type * as React from 'react';
import { TreeRows } from '../../tree/list/TreeRows';

/**
 * Renders the row of each item, after the header row.
 * Doesn't render its own HTML element.
 *
 * Without a header row, pass the function to `TreeGrid.Table` instead, which renders it the same way.
 *
 * Documentation: [Base UI Tree Grid](https://base-ui.com/react/components/tree-grid)
 */
export function TreeGridCollection(props: TreeGridCollection.Props): React.JSX.Element {
  return <TreeRows>{props.children}</TreeRows>;
}

export interface TreeGridCollectionState {}

export interface TreeGridCollectionProps {
  /**
   * The render function for the row of each item.
   * Annotate the `item` parameter to type it.
   */
  children: (item: any) => React.ReactNode;
}

export namespace TreeGridCollection {
  export type State = TreeGridCollectionState;
  export type Props = TreeGridCollectionProps;
}
