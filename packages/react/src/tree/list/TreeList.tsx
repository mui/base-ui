'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';

import { useTreeRootProps } from '../utils/useTreeRootProps';
import { useTreeListViewport } from './useTreeListViewport';
import { TreeRows } from './TreeRows';

/**
 * Renders all tree items at once.
 * Renders a `<div>` element.
 *
 * Render a group transition after each item to animate expand/collapse transitions.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeList = React.forwardRef(function TreeList<TItem = any>(
  componentProps: TreeList.Props<TItem>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, className, render, style, ...elementProps } = componentProps;
  const { rootProps, rootRef, state } = useTreeRootProps(componentProps);

  const listRef = React.useRef<HTMLDivElement | null>(null);

  useTreeListViewport(listRef);

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, rootRef, listRef],
    props: [rootProps, { children: <TreeRows>{children}</TreeRows> }, elementProps],
  });
}) as <TItem = any>(
  props: TreeList.Props<TItem> & React.RefAttributes<HTMLDivElement>,
) => React.JSX.Element;

export interface TreeListState {
  /**
   * Whether the tree is disabled.
   */
  disabled: boolean;
  /**
   * Whether the tree has no visible rows, or no item matches the filter.
   */
  empty: boolean;
}

export interface TreeListProps<TItem = any> extends Omit<
  BaseUIComponentProps<'div', TreeListState>,
  'children'
> {
  /**
   * The render function for each tree item.
   * Pass the item type to `Tree.List` to type the `item` parameter.
   */
  children: (item: TItem) => React.ReactNode;
}

export namespace TreeList {
  export type Props<TItem = any> = TreeListProps<TItem>;
  export type State = TreeListState;
}
