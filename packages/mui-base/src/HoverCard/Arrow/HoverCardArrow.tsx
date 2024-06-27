'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { HoverCardArrowOwnerState, HoverCardArrowProps } from './HoverCardArrow.types';
import { useHoverCardPositionerContext } from '../Positioner/HoverCardPositionerContext';
import { useHoverCardArrow } from './useHoverCardArrow';
import { useForkRef } from '../../utils/useForkRef';
import { useHoverCardRootContext } from '../Root/HoverCardContext';

const HoverCardArrow = React.forwardRef(function HoverCardArrow(
  props: HoverCardArrowProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, hideWhenUncentered, ...otherProps } = props;

  const { open } = useHoverCardRootContext();
  const { arrowRef, side, alignment, arrowUncentered, arrowStyles } =
    useHoverCardPositionerContext();

  const { getArrowProps } = useHoverCardArrow({
    arrowStyles,
    hidden: hideWhenUncentered && arrowUncentered,
  });

  const ownerState: HoverCardArrowOwnerState = React.useMemo(
    () => ({
      open,
      side,
      alignment,
    }),
    [open, side, alignment],
  );

  const mergedRef = useForkRef(arrowRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getArrowProps,
    render: render ?? 'div',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: otherProps,
  });

  return renderElement();
});

HoverCardArrow.propTypes /* remove-proptypes */ = {
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
   * Whether the `Arrow` is hidden when it can't point to the center of the anchor element.
   * @default false
   */
  hideWhenUncentered: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { HoverCardArrow };
