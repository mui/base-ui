'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { TooltipTriggerProps } from './TooltipTrigger.types';
import { useTooltipRootContext } from '../Root/TooltipRootContext';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';
import { useTriggerStyleHooks } from './useStyleHooks';

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
function TooltipTrigger(props: TooltipTriggerProps) {
  const { children } = props;

  const { open, setTriggerEl, getTriggerProps } = useTooltipRootContext();

  const mergedRef = useRenderPropForkRef(children, setTriggerEl);

  const ownerState = React.useMemo(() => ({ open }), [open]);

  const styleHooks = useTriggerStyleHooks(ownerState);

  const mergedTriggerProps = getTriggerProps({
    ref: mergedRef,
    ...styleHooks,
  });

  if (typeof children === 'function') {
    return children(mergedTriggerProps);
  }

  return React.cloneElement(children, mergedTriggerProps);
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
