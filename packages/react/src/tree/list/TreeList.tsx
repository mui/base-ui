'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useTreeListElement } from './useTreeListElement';

/**
 * A container for the tree items.
 * Renders a `<div>` element.
 *
 * Render a group transition after each item of a function child to animate expand/collapse transitions.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeList = React.forwardRef(function TreeList<TItem = any>(
  componentProps: TreeList.Props<TItem>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, className, render, style, ...elementProps } = componentProps;
  return useTreeListElement(componentProps, forwardedRef, elementProps, children);
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
   * The items of the tree. A function renders each of the root's `items` in view, and receives
   * an item. Pass the item type to `Tree.List` to type it.
   * Otherwise, render an item part for each of the root's `items` as children, in order. Each
   * one renders nothing while it's out of view.
   */
  children?: React.ReactNode | ((item: TItem) => React.ReactNode);
}

export namespace TreeList {
  export type Props<TItem = any> = TreeListProps<TItem>;
  export type State = TreeListState;
}
