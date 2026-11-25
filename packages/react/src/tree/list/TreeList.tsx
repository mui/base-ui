'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { TreeRows } from './TreeRows';
import { useTreeListElement } from './useTreeListElement';

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
  return useTreeListElement(
    componentProps,
    forwardedRef,
    elementProps,
    <TreeRows>{children}</TreeRows>,
  );
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
