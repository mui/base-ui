'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { useRenderElement } from '../../utils/useRenderElement';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';

/**
 * Displays an element positioned against the anchor.
 * Renders a `<div>` element.
 */
export const ComboboxArrow = React.forwardRef(function ComboboxArrow(
  componentProps: ComboboxArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const { arrowRef, side, align, arrowUncentered, arrowStyles } = useComboboxPositionerContext();

  const open = useStore(store, selectors.open);

  const state: ComboboxArrowState = {
    open,
    side,
    align,
    uncentered: arrowUncentered,
  };

  return useRenderElement('div', componentProps, {
    ref: [arrowRef, forwardedRef],
    stateAttributesMapping: popupStateMapping,
    state,
    props: {
      style: arrowStyles,
      'aria-hidden': true,
      ...elementProps,
    },
  });
});

export interface ComboboxArrowState {
  /**
   * Whether the popup is currently open.
   */
  open: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side;
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the arrow cannot be centered on the anchor.
   */
  uncentered: boolean;
}

export interface ComboboxArrowProps extends BaseUIComponentProps<'div', ComboboxArrowState> {}

export namespace ComboboxArrow {
  export type State = ComboboxArrowState;
  export type Props = ComboboxArrowProps;
}
