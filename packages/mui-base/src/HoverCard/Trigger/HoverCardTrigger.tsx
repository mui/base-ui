'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { HoverCardTriggerOwnerState, HoverCardTriggerProps } from './HoverCardTrigger.types';
import { useHoverCardRootContext } from '../Root/HoverCardContext';
import { useForkRef } from '../../utils/useForkRef';

const HoverCardTrigger = React.forwardRef(function HoverCardTrigger(
  props: HoverCardTriggerProps,
  forwardedRef: React.ForwardedRef<HTMLAnchorElement>,
) {
  const { render, className, ...otherProps } = props;

  const { open, getRootTriggerProps, setTriggerElement } = useHoverCardRootContext();

  const ownerState: HoverCardTriggerOwnerState = React.useMemo(() => ({ open }), [open]);

  const mergedRef = useForkRef(setTriggerElement, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getRootTriggerProps,
    render: render ?? 'a',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: otherProps,
  });

  return renderElement();
});

HoverCardTrigger.propTypes /* remove-proptypes */ = {
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

export { HoverCardTrigger };
