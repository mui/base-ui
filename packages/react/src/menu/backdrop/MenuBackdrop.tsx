'use client';
import * as React from 'react';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { type StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';
import { REASONS } from '../../utils/reasons';

const stateAttributesMapping: StateAttributesMapping<MenuBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuBackdrop = React.forwardRef(function MenuBackdrop(
  componentProps: MenuBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { store } = useMenuRootContext();
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const transitionStatus = store.useState('transitionStatus');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');

  const contextMenuContext = useContextMenuRootContext();

  const state: MenuBackdrop.State = {
    open,
    transitionStatus,
  };

  return useRenderElement('div', componentProps, {
    ref: contextMenuContext?.backdropRef
      ? [forwardedRef, contextMenuContext.backdropRef]
      : forwardedRef,
    state,
    stateAttributesMapping,
    props: [
      {
        role: 'presentation',
        hidden: !mounted,
        style: {
          pointerEvents: lastOpenChangeReason === REASONS.triggerHover ? 'none' : undefined,
          userSelect: 'none',
          WebkitUserSelect: 'none',
        },
      },
      elementProps,
    ],
  });
});

export interface MenuBackdropState {
  /**
   * Whether the menu is currently open.
   */
  open: boolean;
  transitionStatus: TransitionStatus;
}

export interface MenuBackdropProps extends BaseUIComponentProps<'div', MenuBackdrop.State> {}

export namespace MenuBackdrop {
  export type State = MenuBackdropState;
  export type Props = MenuBackdropProps;
}
