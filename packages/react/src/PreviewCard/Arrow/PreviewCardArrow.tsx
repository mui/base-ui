'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { usePreviewCardPositionerContext } from '../Positioner/PreviewCardPositionerContext';
import { usePreviewCardArrow } from './usePreviewCardArrow';
import { useForkRef } from '../../utils/useForkRef';
import { usePreviewCardRootContext } from '../Root/PreviewCardContext';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Alignment, Side } from '../../utils/useAnchorPositioning';
import { popupOpenStateMapping } from '../../utils/popupOpenStateMapping';

/**
 *
 * Demos:
 *
 * - [Preview Card](https://base-ui.netlify.app/components/react-preview-card/)
 *
 * API:
 *
 * - [PreviewCardArrow API](https://base-ui.netlify.app/components/react-preview-card/#api-reference-PreviewCardArrow)
 */
const PreviewCardArrow = React.forwardRef(function PreviewCardArrow(
  props: PreviewCardArrow.Props,
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

  const ownerState: PreviewCardArrow.OwnerState = React.useMemo(
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
    customStyleHookMapping: popupOpenStateMapping,
  });

  return renderElement();
});

namespace PreviewCardArrow {
  export interface OwnerState {
    open: boolean;
    side: Side;
    alignment: Alignment;
  }

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * Whether the `Arrow` is hidden when it can't point to the center of the anchor element.
     * @default false
     */
    hideWhenUncentered?: boolean;
  }
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
