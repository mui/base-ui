'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useTooltipRootContext } from '../Root/TooltipRootContext';
import type { TooltipTriggerProps } from './TooltipTrigger.types';
import { useStyleHooks } from './useStyleHooks';
import { resolveClassName } from '../../utils/resolveClassName';

/**
 * Renders a trigger element that will open the tooltip.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/)
 *
 * API:
 *
 * - [TooltipTrigger API](https://mui.com/base-ui/react-tooltip/components-api/#tooltip-trigger)
 */
const TooltipTrigger = React.forwardRef(function TooltipTrigger(
  props: TooltipTriggerProps,
  ref: React.ForwardedRef<any>,
) {
  const { className, render: renderProp, ...otherProps } = props;
  // eslint-disable-next-line jsx-a11y/control-has-associated-label
  const render = renderProp ?? <button type="button" />;

  const { open, setTriggerEl, getTriggerProps } = useTooltipRootContext();

  const ownerState = React.useMemo(() => ({ open }), [open]);
  const mergedRef = useRenderPropForkRef(render, ref, setTriggerEl);
  const styleHooks = useStyleHooks(ownerState);

  const mergedTriggerProps = getTriggerProps({
    ref: mergedRef,
    className: resolveClassName(className, ownerState),
    ...styleHooks,
    ...otherProps,
  });

  return evaluateRenderProp(render, mergedTriggerProps, ownerState);
});

TooltipTrigger.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { TooltipTrigger };
