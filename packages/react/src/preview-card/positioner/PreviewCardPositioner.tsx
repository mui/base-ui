'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import { usePreviewCardPositioner } from './usePreviewCardPositioner';
import { PreviewCardPositionerContext } from './PreviewCardPositionerContext';
import { useForkRef } from '../../utils/useForkRef';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { usePreviewCardPortalContext } from '../portal/PreviewCardPortalContext';

/**
 * Positions the popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardPositioner = React.forwardRef(function PreviewCardPositioner(
  props: PreviewCardPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    anchor,
    positionMethod = 'absolute',
    side = 'bottom',
    align = 'center',
    sideOffset = 0,
    alignOffset = 0,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding = 5,
    arrowPadding = 5,
    sticky = false,
    trackAnchor = true,
    ...otherProps
  } = props;

  const { open, mounted, floatingRootContext, setPositionerElement } = usePreviewCardRootContext();
  const keepMounted = usePreviewCardPortalContext();

  const positioner = usePreviewCardPositioner({
    anchor,
    floatingRootContext,
    positionMethod,
    mounted,
    side,
    sideOffset,
    align,
    alignOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    trackAnchor,
    keepMounted,
  });

  const state: PreviewCardPositioner.State = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      align: positioner.align,
      anchorHidden: positioner.anchorHidden,
    }),
    [open, positioner.side, positioner.align, positioner.anchorHidden],
  );

  const contextValue: PreviewCardPositionerContext = React.useMemo(
    () => ({
      side: positioner.side,
      align: positioner.align,
      arrowRef: positioner.arrowRef,
      arrowUncentered: positioner.arrowUncentered,
      arrowStyles: positioner.arrowStyles,
    }),
    [
      positioner.side,
      positioner.align,
      positioner.arrowRef,
      positioner.arrowUncentered,
      positioner.arrowStyles,
    ],
  );

  const mergedRef = useForkRef(setPositionerElement, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: positioner.getPositionerProps,
    render: render ?? 'div',
    className,
    state,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping: popupStateMapping,
  });

  return (
    <PreviewCardPositionerContext.Provider value={contextValue}>
      {renderElement()}
    </PreviewCardPositionerContext.Provider>
  );
});

export namespace PreviewCardPositioner {
  export interface State {
    /**
     * Whether the preview card is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    anchorHidden: boolean;
  }

  export interface Props
    extends usePreviewCardPositioner.SharedParameters,
      BaseUIComponentProps<'div', State> {}
}
