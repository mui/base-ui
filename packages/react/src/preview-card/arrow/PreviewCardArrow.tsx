'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { usePreviewCardPositionerContext } from '../positioner/PreviewCardPositionerContext';
import { useForkRef } from '../../utils/useForkRef';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { mergeProps } from '../../merge-props';

/**
 * Displays an element positioned against the preview card anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
const PreviewCardArrow = React.forwardRef(function PreviewCardArrow(
  props: PreviewCardArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...otherProps } = props;

  const { open } = usePreviewCardRootContext();
  const { arrowRef, side, align, arrowUncentered, arrowStyles } = usePreviewCardPositionerContext();

  const getArrowProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'div'>(
        {
          style: arrowStyles,
          'aria-hidden': true,
        },
        externalProps,
      ),
    [arrowStyles],
  );

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
    /**
     * Whether the preview card is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    uncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

export { PreviewCardArrow };
