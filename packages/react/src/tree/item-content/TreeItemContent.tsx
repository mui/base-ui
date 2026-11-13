'use client';
import type * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';

/**
 * Contains the interactive content of a tree item.
 * Renders a `<div>` element with `role="gridcell"`, named after its item.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemContent = fastComponentRef(function TreeItemContent(
  componentProps: TreeItemContent.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, style, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const itemId = useTreeItemContext();
  // Otherwise the cell's name joins every label inside it, which screen readers read when
  // focus moves to one of its controls: "Select Documents Collapse Documents Documents".
  const label = store.useState('itemLabel', itemId);

  return useRenderElement('div', componentProps, {
    state: {},
    ref: forwardedRef,
    props: [{ role: 'gridcell', 'aria-label': label }, elementProps],
  });
});

export interface TreeItemContentState {}

export interface TreeItemContentProps extends BaseUIComponentProps<'div', TreeItemContentState> {}

export namespace TreeItemContent {
  export type State = TreeItemContentState;
  export type Props = TreeItemContentProps;
}
