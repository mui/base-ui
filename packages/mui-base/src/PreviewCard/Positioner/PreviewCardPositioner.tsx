'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { usePreviewCardRootContext } from '../Root/PreviewCardContext';
import { usePreviewCardPositioner } from './usePreviewCardPositioner';
import { PreviewCardPositionerContext } from './PreviewCardPositionerContext';
import { useForkRef } from '../../utils/useForkRef';
import { HTMLElementType } from '../../utils/proptypes';
import type { Side, Alignment } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import { popupOpenStateMapping } from '../../utils/popupOpenStateMapping';

/**
 *
 * Demos:
 *
 * - [Preview Card](https://base-ui.netlify.app/components/react-preview-card/)
 *
 * API:
 *
 * - [PreviewCardPositioner API](https://base-ui.netlify.app/components/react-preview-card/#api-reference-PreviewCardPositioner)
 */
const PreviewCardPositioner = React.forwardRef(function PreviewCardPositioner(
  props: PreviewCardPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    anchor,
    positionMethod = 'absolute',
    side = 'bottom',
    alignment = 'center',
    sideOffset = 0,
    alignmentOffset = 0,
    collisionBoundary = 'clippingAncestors',
    collisionPadding = 5,
    arrowPadding = 5,
    hideWhenDetached = false,
    sticky = false,
    keepMounted = false,
    container,
    ...otherProps
  } = props;

  const { open, mounted, floatingRootContext, triggerElement, setPositionerElement } =
    usePreviewCardRootContext();

  const positioner = usePreviewCardPositioner({
    anchor: anchor || triggerElement,
    floatingRootContext,
    positionMethod,
    container,
    open,
    mounted,
    keepMounted,
    side,
    sideOffset,
    alignment,
    alignmentOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    hideWhenDetached,
    sticky,
  });

  const ownerState: PreviewCardPositioner.OwnerState = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      alignment: positioner.alignment,
    }),
    [open, positioner.side, positioner.alignment],
  );

  const contextValue: PreviewCardPositionerContext = React.useMemo(
    () => ({
      side: positioner.side,
      alignment: positioner.alignment,
      arrowRef: positioner.arrowRef,
      arrowUncentered: positioner.arrowUncentered,
      arrowStyles: positioner.arrowStyles,
    }),
    [
      positioner.side,
      positioner.alignment,
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
    ownerState,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping: popupOpenStateMapping,
  });

  const shouldRender = keepMounted || mounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <PreviewCardPositionerContext.Provider value={contextValue}>
      <FloatingPortal root={container}>{renderElement()}</FloatingPortal>
    </PreviewCardPositionerContext.Provider>
  );
});

namespace PreviewCardPositioner {
  export interface OwnerState {
    open: boolean;
    side: Side;
    alignment: Alignment;
  }

  export interface Props
    extends usePreviewCardPositioner.SharedParameters,
      BaseUIComponentProps<'div', OwnerState> {}
}

PreviewCardPositioner.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The alignment of the preview card element to the anchor element along its cross axis.
   * @default 'center'
   */
  alignment: PropTypes.oneOf(['center', 'end', 'start']),
  /**
   * The offset of the preview card element along its alignment axis.
   * @default 0
   */
  alignmentOffset: PropTypes.number,
  /**
   * The anchor element to which the preview card popup will be placed at.
   */
  anchor: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.object,
    PropTypes.func,
  ]),
  /**
   * Determines the padding between the arrow and the preview card popup's edges. Useful when the
   * preview card popup has rounded corners via `border-radius`.
   * @default 5
   */
  arrowPadding: PropTypes.number,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The boundary that the preview card element should be constrained to.
   * @default 'clippingAncestors'
   */
  collisionBoundary: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.arrayOf(HTMLElementType),
    PropTypes.string,
    PropTypes.shape({
      height: PropTypes.number,
      width: PropTypes.number,
      x: PropTypes.number,
      y: PropTypes.number,
    }),
  ]),
  /**
   * The padding of the collision boundary.
   * @default 5
   */
  collisionPadding: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      bottom: PropTypes.number,
      left: PropTypes.number,
      right: PropTypes.number,
      top: PropTypes.number,
    }),
  ]),
  /**
   * The container element to which the preview card popup will be appended to.
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.func,
  ]),
  /**
   * If `true`, the preview card will be hidden if it is detached from its anchor element due to
   * differing clipping contexts.
   * @default false
   */
  hideWhenDetached: PropTypes.bool,
  /**
   * If `true`, preview card stays mounted in the DOM when closed.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * The CSS position strategy for positioning the preview card popup element.
   * @default 'absolute'
   */
  positionMethod: PropTypes.oneOf(['absolute', 'fixed']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The side of the anchor element that the preview card element should align to.
   * @default 'bottom'
   */
  side: PropTypes.oneOf(['bottom', 'left', 'right', 'top']),
  /**
   * The gap between the anchor element and the preview card element.
   * @default 0
   */
  sideOffset: PropTypes.number,
  /**
   * If `true`, allow the preview card to remain in stuck view while the anchor element is scrolled
   * out of view.
   * @default false
   */
  sticky: PropTypes.bool,
} as any;

export { PreviewCardPositioner };
