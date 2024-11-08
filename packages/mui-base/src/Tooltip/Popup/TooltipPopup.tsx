'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer.js';
import { useTooltipRootContext } from '../Root/TooltipRootContext.js';
import { useTooltipPositionerContext } from '../Positioner/TooltipPositionerContext.js';
import { useForkRef } from '../../utils/useForkRef.js';
import type { BaseUIComponentProps } from '../../utils/types.js';
import type { Alignment, Side } from '../../utils/useAnchorPositioning.js';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps.js';
import { popupOpenStateMapping as baseMapping } from '../../utils/popupOpenStateMapping.js';
import type { TransitionStatus } from '../../utils/useTransitionStatus.js';

const customStyleHookMapping: CustomStyleHookMapping<TooltipPopup.OwnerState> = {
  ...baseMapping,
  transitionStatus(value) {
    if (value === 'entering') {
      return { 'data-entering': '' } as Record<string, string>;
    }
    if (value === 'exiting') {
      return { 'data-exiting': '' };
    }
    return null;
  },
};

/**
 * The tooltip popup element.
 *
 * Demos:
 *
 * - [Tooltip](https://base-ui.netlify.app/components/react-tooltip/)
 *
 * API:
 *
 * - [TooltipPopup API](https://base-ui.netlify.app/components/react-tooltip/#api-reference-TooltipPopup)
 */
const TooltipPopup = React.forwardRef(function TooltipPopup(
  props: TooltipPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const { open, instantType, transitionStatus, getRootPopupProps, popupRef } =
    useTooltipRootContext();
  const { side, alignment } = useTooltipPositionerContext();

  const ownerState: TooltipPopup.OwnerState = React.useMemo(
    () => ({
      open,
      side,
      alignment,
      instant: instantType,
      transitionStatus,
    }),
    [open, side, alignment, instantType, transitionStatus],
  );

  const mergedRef = useForkRef(popupRef, forwardedRef);

  // The content element needs to be a child of a wrapper floating element in order to avoid
  // conflicts with CSS transitions and the positioning transform.
  const { renderElement } = useComponentRenderer({
    propGetter: getRootPopupProps,
    render: render ?? 'div',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping,
  });

  return renderElement();
});

namespace TooltipPopup {
  export interface OwnerState {
    open: boolean;
    side: Side;
    alignment: Alignment;
    instant: 'delay' | 'focus' | 'dismiss' | undefined;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}
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
