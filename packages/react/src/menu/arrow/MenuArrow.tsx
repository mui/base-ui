'use client';
import * as React from 'react';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';

/**
 * Displays an element positioned against the menu anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuArrow = React.forwardRef(function MenuArrow(
  props: MenuArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const { open } = useMenuRootContext();
  const { arrowRef, side, align, arrowUncentered, arrowStyles } = useMenuPositionerContext();

  const state: MenuArrow.State = React.useMemo(
    () => ({
      open,
      side,
      align,
      uncentered: arrowUncentered,
    }),
    [open, side, align, arrowUncentered],
  );

  const mergedRef = useForkRef(arrowRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
    ref: mergedRef,
    extraProps: {
      style: arrowStyles,
      'aria-hidden': true,
      ...otherProps,
    },
    stateAttributesMapping: popupStateMapping,
  });

  return renderElement();
});

export namespace MenuArrow {
  export interface State {
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    uncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
