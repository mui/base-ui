'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { useTooltipPositionerContext } from '../positioner/TooltipPositionerContext';
import { useForkRef } from '../../utils/useForkRef';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { transitionStatusMapping } from '../../utils/styleHookMapping';

const customStyleHookMapping: CustomStyleHookMapping<TooltipPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the tooltip contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
const TooltipPopup = React.forwardRef(function TooltipPopup(
  props: TooltipPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const { open, instantType, transitionStatus, getRootPopupProps, popupRef } =
    useTooltipRootContext();
  const { side, align } = useTooltipPositionerContext();

  const state: TooltipPopup.State = React.useMemo(
    () => ({
      open,
      side,
      align,
      instant: instantType,
      transitionStatus,
    }),
    [open, side, align, instantType, transitionStatus],
  );

  const mergedRef = useForkRef(popupRef, forwardedRef);

  // The content element needs to be a child of a wrapper floating element in order to avoid
  // conflicts with CSS transitions and the positioning transform.
  const { renderElement } = useComponentRenderer({
    propGetter: getRootPopupProps,
    render: render ?? 'div',
    className,
    state,
    ref: mergedRef,
    extraProps: mergeReactProps(otherProps, {
      style: transitionStatus === 'entering' ? { transition: 'none' } : {},
    }),
    customStyleHookMapping,
  });

  return renderElement();
});

namespace TooltipPopup {
  export interface State {
    open: boolean;
    side: Side;
    align: Align;
    instant: 'delay' | 'focus' | 'dismiss' | undefined;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

TooltipPopup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { TooltipPopup };
