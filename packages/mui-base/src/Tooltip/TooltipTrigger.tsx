import * as React from 'react';
import PropTypes from 'prop-types';
import type { TriggerProps } from './Tooltip.types';
import { useTooltipContext } from './TooltipContext';
import { useTooltipStyleHooks } from './utils';
import { useRenderPropForkRef } from '../utils/useRenderPropForkRef';

/**
 * Provides props for its child element to trigger the tooltip, anchoring it to the child element.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/)
 *
 * API:
 *
 * - [TooltipTrigger API](https://mui.com/base-ui/react-tooltip/components-api/#tooltip-trigger)
 */
function TooltipTrigger(props: TriggerProps) {
  const { children } = props;

  const { open, setAnchorEl, anchorProps } = useTooltipContext();

  const mergedRef = useRenderPropForkRef(children, setAnchorEl);

  const ownerState = React.useMemo(() => ({ open }), [open]);

  const styleHooks = useTooltipStyleHooks(ownerState);

  const mergedAnchorProps = {
    ref: mergedRef,
    ...anchorProps,
    ...styleHooks,
  };

  if (typeof children === 'function') {
    return children(mergedAnchorProps);
  }

  return React.cloneElement(children, mergedAnchorProps);
}

TooltipTrigger.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.func]).isRequired,
} as any;

export { TooltipTrigger };
