'use client';
import * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';

/**
 * Displays the label of a tree item.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemLabel = fastComponentRef(function TreeItemLabel(
  componentProps: TreeItemLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, children, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const itemId = useTreeItemContext();
  const label = store.useState('itemLabel', itemId);

  const element = useRenderElement('span', componentProps, {
    state: {},
    ref: forwardedRef,
    props: [
      {
        children: children ?? label,
      },
      elementProps,
    ],
  });

  return element;
});

export interface TreeItemLabelState {}

export interface TreeItemLabelProps extends BaseUIComponentProps<'span', TreeItemLabelState> {}

export namespace TreeItemLabel {
  export type State = TreeItemLabelState;
  export type Props = TreeItemLabelProps;
}
