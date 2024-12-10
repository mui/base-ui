'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { usePreviewCardPositionerContext } from '../positioner/PreviewCardPositionerContext';
import { usePreviewCardArrow } from './usePreviewCardArrow';
import { useForkRef } from '../../utils/useForkRef';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { popupStateMapping } from '../../utils/popupStateMapping';

/**
 *
 * Demos:
 *
 * - [Preview Card](https://base-ui.com/components/react-preview-card/)
 *
 * API:
 *
 * - [PreviewCardArrow API](https://base-ui.com/components/react-preview-card/#api-reference-PreviewCardArrow)
 */
const PreviewCardArrow = React.forwardRef(function PreviewCardArrow(
  props: PreviewCardArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...otherProps } = props;

  const { open } = usePreviewCardRootContext();
  const { arrowRef, side, align, arrowUncentered, arrowStyles } = usePreviewCardPositionerContext();

  const { getArrowProps } = usePreviewCardArrow({
    arrowStyles,
  });

  const state: PreviewCardArrow.State = React.useMemo(
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
    propGetter: getArrowProps,
    render: render ?? 'div',
    className,
    state,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping: popupStateMapping,
  });

  return renderElement();
});

namespace PreviewCardArrow {
  export interface State {
    open: boolean;
    side: Side;
    align: Align;
    uncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { PreviewCardArrow };
