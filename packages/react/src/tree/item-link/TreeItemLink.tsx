'use client';
import type * as React from 'react';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { ACTION_CONTROL_KEYS, useTreeItemControl } from '../utils/useTreeItemControl';
import type { TreeItemControlKeys } from '../item-control/TreeItemControl';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';

/**
 * A link inside a tree item that takes part in the item's keyboard navigation.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemLink = fastComponentRef(function TreeItemLink(
  componentProps: TreeItemLink.Props,
  forwardedRef: React.ForwardedRef<HTMLAnchorElement>,
) {
  const {
    className,
    controlKeys,
    render,
    style,
    tabIndex,
    active = false,
    ...elementProps
  } = componentProps;

  const store = useTreeRootContext();
  const itemId = useTreeItemContext();
  const disabled = store.useState('isItemDisabled', itemId);
  const control = useTreeItemControl({ controlKeys, defaultKeys: ACTION_CONTROL_KEYS });

  // The row takes focus instead of the link, so it reports the current page too.
  useIsoLayoutEffect(() => {
    if (!active) {
      return undefined;
    }
    store.updateItemCount('activeLinkCounts', itemId, 1);
    return () => store.updateItemCount('activeLinkCounts', itemId, -1);
  }, [active, store, itemId]);

  const state: TreeItemLink.State = { active, disabled };

  return useRenderElement('a', componentProps, {
    state,
    ref: [forwardedRef, control.ref],
    props: [
      {
        'aria-current': active ? 'page' : undefined,
        'aria-disabled': disabled || undefined,
        tabIndex: tabIndex ?? control.tabIndex,
      },
      elementProps,
      disabled ? getDisabledLinkProps : EMPTY_OBJECT,
    ],
  });
});

// Like a disabled `Tree.ItemButton`, the link stays focusable but ignores the
// interactions that would activate it.
function getDisabledLinkProps(props: React.ComponentPropsWithRef<'a'>) {
  const { onClick, onAuxClick, onMouseDown, onPointerDown, onKeyDown, onKeyUp, ...otherProps } =
    props;
  return {
    ...otherProps,
    onClick: preventDefault,
    // Middle-click opens the `href` through `auxclick`, not `click`.
    onAuxClick: preventDefault,
  };
}

function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

export interface TreeItemLinkState {
  /**
   * Whether the link is the currently active page.
   */
  active: boolean;
  /**
   * Whether the link is disabled, because its item or the tree is.
   */
  disabled: boolean;
}

export interface TreeItemLinkProps extends BaseUIComponentProps<
  'a',
  TreeItemLinkState,
  React.ComponentPropsWithRef<'a'>
> {
  /**
   * Whether the link is the currently active page.
   * Marks the link and its item with `aria-current="page"`.
   * @default false
   */
  active?: boolean | undefined;
  /**
   * Which keys the link handles itself instead of the tree.
   * By default, the arrows, Home, End, and Escape navigate the tree.
   */
  controlKeys?: TreeItemControlKeys | undefined;
}

export namespace TreeItemLink {
  export type State = TreeItemLinkState;
  export type Props = TreeItemLinkProps;
}
