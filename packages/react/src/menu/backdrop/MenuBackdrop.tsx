'use client';
import * as React from 'react';
import { useMenuRootContext } from '../root/MenuRootContext';
import type { BaseUIComponentProps } from '../../internals/types';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';
import { REASONS } from '../../internals/reasons';
import { usePopupBackdrop } from '../../utils/popups/popupParts';

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
  const { store } = useMenuRootContext();
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const contextMenuContext = useContextMenuRootContext();

  return usePopupBackdrop(componentProps, forwardedRef, store, {
    ref: contextMenuContext?.backdropRef,
    style: {
      pointerEvents: lastOpenChangeReason === REASONS.triggerHover ? 'none' : undefined,
    },
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
