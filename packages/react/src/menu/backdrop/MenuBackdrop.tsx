'use client';
import * as React from 'react';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps } from '../../internals/types';
import { popupTransitionStateMapping } from '../../utils/popupStateMapping';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';
import { REASONS } from '../../internals/reasons';

/**
 * An overlay displayed beneath the menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/menu)
 */
export const MenuBackdrop = React.forwardRef(function MenuBackdrop(
  componentProps: MenuBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;

  const { store } = useMenuRootContext();
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const transitionStatus = store.useState('transitionStatus');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');

  const contextMenuContext = useContextMenuRootContext();

  const state: MenuBackdropState = {
    open,
    transitionStatus,
  };

  return useRenderElement('div', componentProps, {
    ref: contextMenuContext?.backdropRef
      ? [forwardedRef, contextMenuContext.backdropRef]
      : forwardedRef,
    state,
    stateAttributesMapping: popupTransitionStateMapping,
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
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface MenuBackdropProps extends BaseUIComponentProps<'div', MenuBackdropState> {}

export namespace MenuBackdrop {
  export type State = MenuBackdropState;
  export type Props = MenuBackdropProps;
}
