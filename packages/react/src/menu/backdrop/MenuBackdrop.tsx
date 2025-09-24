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
import { useBodySize } from '../../utils/useBodySize';
import { MenuBackdropCssVars } from './MenuBackdropCssVars';

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

  const { open, mounted, transitionStatus, lastOpenChangeReason } = useMenuRootContext();
  const contextMenuContext = useContextMenuRootContext();

  const backdropRef = React.useRef<HTMLDivElement | null>(null);

  const bodySize = useBodySize(contextMenuContext?.backdropRef || backdropRef, open);

  const state: MenuBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  return useRenderElement('div', componentProps, {
    ref: contextMenuContext?.backdropRef
      ? [backdropRef, forwardedRef, contextMenuContext.backdropRef]
      : [backdropRef, forwardedRef],
    state,
    stateAttributesMapping,
    props: [
      {
        role: 'presentation',
        hidden: !mounted,
        style: {
          pointerEvents: lastOpenChangeReason === 'trigger-hover' ? 'none' : undefined,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          [MenuBackdropCssVars.bodyWidth as string]: `${bodySize.width}px`,
          [MenuBackdropCssVars.bodyHeight as string]: `${bodySize.height}px`,
        },
      },
      elementProps,
    ],
  });
});

export namespace MenuBackdrop {
  export interface State {
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
