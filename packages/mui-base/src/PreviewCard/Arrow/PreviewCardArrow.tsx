'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { PreviewCardArrowOwnerState, PreviewCardArrowProps } from './PreviewCardArrow.types';
import { usePreviewCardPositionerContext } from '../Positioner/PreviewCardPositionerContext';
import { usePreviewCardArrow } from './usePreviewCardArrow';
import { useForkRef } from '../../utils/useForkRef';
import { usePreviewCardRootContext } from '../Root/PreviewCardContext';

const PreviewCardArrow = React.forwardRef(function PreviewCardArrow(
  props: PreviewCardArrowProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, hideWhenUncentered, ...otherProps } = props;

  const { open } = usePreviewCardRootContext();
  const { arrowRef, side, alignment, arrowUncentered, arrowStyles } =
    usePreviewCardPositionerContext();

  const { getArrowProps } = usePreviewCardArrow({
    arrowStyles,
    hidden: hideWhenUncentered && arrowUncentered,
  });

  const ownerState: PreviewCardArrowOwnerState = React.useMemo(
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

PreviewCardArrow.propTypes /* remove-proptypes */ = {
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

export { PreviewCardArrow };
