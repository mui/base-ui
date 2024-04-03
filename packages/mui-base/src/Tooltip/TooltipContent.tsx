import * as React from 'react';
import PropTypes from 'prop-types';
import useEnhancedEffect from '@mui/utils/useEnhancedEffect';
import type { ContentOwnerState, ContentProps } from './Tooltip.types';
import { resolveClassName } from '../utils/resolveClassName';
import { useTooltipContext } from './TooltipContext';
import { Portal } from '../Portal';
import { useTooltip } from '../useTooltip';
import { TooltipContentContext } from './TooltipContentContext';
import { evaluateRenderProp } from '../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../utils/useRenderPropForkRef';

function defaultRender(props: React.ComponentPropsWithRef<'div'>) {
  return <div {...props} />;
}

/**
 * The tooltip content element.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/)
 *
 * API:
 *
 * - [TooltipContent API](https://mui.com/base-ui/react-tooltip/components-api/#tooltip-content)
 */
const TooltipContent = React.forwardRef(function TooltipContent(
  props: ContentProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    anchor,
    className,
    render: renderProp,
    side = 'top',
    alignment = 'center',
    sideOffset = 0,
    alignmentOffset = 0,
    collisionBoundary,
    collisionPadding = 5,
    // This is the most sensible default for most `border-radius` values. However, we can't
    // determine the actual best value. It's up to the user to adjust this value if needed.
    arrowPadding = 3,
    hideWhenDetached = false,
    hoverable = true,
    sticky = false,
    followCursorAxis = 'none',
    keepMounted = false,
    container,
    ...otherProps
  } = props;
  const render = renderProp ?? defaultRender;

  const { open, setOpen, anchorEl, setAnchorProps, delay, delayType, closeDelay } =
    useTooltipContext();

  const tooltip = useTooltip({
    anchor: anchor || anchorEl,
    keepMounted,
    open,
    onOpenChange: setOpen,
    side,
    sideOffset,
    alignment,
    alignmentOffset,
    collisionBoundary,
    collisionPadding,
    hideWhenDetached,
    sticky,
    hoverable,
    followCursorAxis,
    delay,
    delayType,
    closeDelay,
    arrowPadding,
  });

  const getAnchorProps = tooltip.getAnchorProps;

  useEnhancedEffect(() => {
    setAnchorProps(getAnchorProps());
  }, [setAnchorProps, getAnchorProps]);

  const ownerState: ContentOwnerState = React.useMemo(
    () => ({
      open,
      side: tooltip.side,
      alignment: tooltip.alignment,
      status: tooltip.status,
    }),
    [open, tooltip.side, tooltip.alignment, tooltip.status],
  );

  const contextValue = React.useMemo(
    () => ({
      ...ownerState,
      arrowRef: tooltip.arrowRef,
      floatingContext: tooltip.floatingContext,
    }),
    [ownerState, tooltip.arrowRef, tooltip.floatingContext],
  );

  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const shouldRender = keepMounted || tooltip.mounted;
  if (!shouldRender) {
    return null;
  }

  const rootContentProps = tooltip.getContentProps();

  // The content element needs to be a child of a wrapper floating element in order to avoid
  // conflicts with CSS transitions and the positioning transform.
  const contentProps = {
    ref: mergedRef,
    className: resolveClassName(className, ownerState),
    ['data-side' as string]: tooltip.side,
    ['data-alignment' as string]: tooltip.alignment,
    ['data-status' as string]: tooltip.status,
    ['data-instant' as string]: tooltip.instantType,
    ...otherProps,
  };

  return (
    <TooltipContentContext.Provider value={contextValue}>
      <Portal container={container}>
        <div role="presentation" ref={tooltip.setContentEl} {...rootContentProps}>
          {evaluateRenderProp(render, contentProps, ownerState)}
        </div>
      </Portal>
    </TooltipContentContext.Provider>
  );
});

TooltipContent.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The alignment of the tooltip element to the anchor element along its cross axis.
   * @default 'center'
   */
  alignment: PropTypes.oneOf(['center', 'end', 'start']),
  /**
   * The offset of the tooltip element along its alignment axis.
   * @default 0
   */
  alignmentOffset: PropTypes.number,
  /**
   * The anchor element to which the tooltip content will be placed at.
   */
  anchor: PropTypes /* @typescript-to-proptypes-ignore */.any,
  /**
   * Determines the padding between the arrow and the tooltip content. Useful when the tooltip
   * has rounded corners via `border-radius`.
   * @default 3
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
   * The boundary that the tooltip element should be constrained to.
   * @default 'clippingAncestors'
   */
  collisionBoundary: PropTypes /* @typescript-to-proptypes-ignore */.any,
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
   * The container element to which the tooltip content will be appended to.
   * @default document.body
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.any,
  /**
   * Determines which axis the tooltip should follow the cursor on.
   * @default 'none'
   */
  followCursorAxis: PropTypes.oneOf(['both', 'none', 'x', 'y']),
  /**
   * If `true`, the tooltip will be hidden if it is detached from its anchor element due to
   * differing clipping contexts.
   * @default false
   */
  hideWhenDetached: PropTypes.bool,
  /**
   * If `true`, the tooltip content will be hoverable.
   * @default true
   */
  hoverable: PropTypes.bool,
  /**
   * If `true`, the tooltip content will be kept mounted in the DOM.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The side of the anchor element that the tooltip element should align to.
   * @default 'top'
   */
  side: PropTypes.oneOf(['bottom', 'left', 'right', 'top']),
  /**
   * The gap between the anchor element and the tooltip element.
   * @default 0
   */
  sideOffset: PropTypes.number,
  /**
   * If `true`, allow the tooltip to remain in stuck view while the anchor element is scrolled out
   * of view.
   * @default false
   */
  sticky: PropTypes.bool,
} as any;

export { TooltipContent };
