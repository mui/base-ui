'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { useSelectRootContext } from '../root/SelectRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { selectors } from '../store';

const stateAttributesMapping: StateAttributesMapping<SelectArrow.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * Displays an element positioned against the select popup anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectArrow = React.forwardRef(function SelectArrow(
  componentProps: SelectArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { store } = useSelectRootContext();
  const { side, align, arrowRef, arrowStyles, arrowUncentered, alignItemWithTriggerActive } =
    useSelectPositionerContext();

  const open = useStore(store, selectors.open, true);

  const state: SelectArrow.State = {
    open,
    side,
    align,
    uncentered: arrowUncentered,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [arrowRef, forwardedRef],
    props: [{ style: arrowStyles, 'aria-hidden': true }, elementProps],
    stateAttributesMapping,
  });

  if (alignItemWithTriggerActive) {
    return null;
  }

  return element;
});

export interface SelectArrowState {
  /**
   * Whether the select popup is currently open.
   */
  open: boolean;
  side: Side | 'none';
  align: Align;
  uncentered: boolean;
}

export interface SelectArrowProps extends BaseUIComponentProps<'div', SelectArrow.State> {}

export namespace SelectArrow {
  export type State = SelectArrowState;
  export type Props = SelectArrowProps;
}
