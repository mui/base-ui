'use client';
import type * as React from 'react';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { ACTION_CONTROL_KEYS, useActionTreeItemControl } from '../utils/useActionTreeItemControl';
import type { ActionTreeItemControlKeys } from '../item-control/ActionTreeItemControl';
import { useTreeRootContext } from '../../tree/root/TreeRootContext';
import { useTreeItemContext } from '../../tree/item/TreeItemContext';
import { useActiveLink } from '../../tree/utils/useActiveLink';

/**
 * A link inside a tree item that takes part in the item's keyboard navigation.
 * Requires `ActionTree.Root`.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Action Tree](https://base-ui.com/react/components/action-tree)
 */
export const ActionTreeItemLink = fastComponentRef(function ActionTreeItemLink(
  componentProps: ActionTreeItemLink.Props,
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
  const control = useActionTreeItemControl({
    part: 'ItemLink',
    treePart: 'LinkItem',
    controlKeys,
    defaultKeys: ACTION_CONTROL_KEYS,
  });

  // The row takes focus instead of the link, so it reports the current page too.
  useActiveLink(store, itemId, active);

  const state: ActionTreeItemLink.State = { active, disabled };

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

// Like a disabled `ActionTree.ItemButton`, the link stays focusable but ignores the
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

export interface ActionTreeItemLinkState {
  /**
   * Whether the link is the currently active page.
   */
  active: boolean;
  /**
   * Whether the link is disabled, because its item or the tree is.
   */
  disabled: boolean;
}

export interface ActionTreeItemLinkProps extends BaseUIComponentProps<
  'a',
  ActionTreeItemLinkState,
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
  controlKeys?: ActionTreeItemControlKeys | undefined;
}

export namespace ActionTreeItemLink {
  export type State = ActionTreeItemLinkState;
  export type Props = ActionTreeItemLinkProps;
}
