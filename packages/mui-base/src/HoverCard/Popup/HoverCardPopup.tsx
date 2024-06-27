'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { HoverCardPopupOwnerState, HoverCardPopupProps } from './HoverCardPopup.types';
import { useHoverCardRootContext } from '../Root/HoverCardContext';
import { useHoverCardPositionerContext } from '../Positioner/HoverCardPositionerContext';
import { useHoverCardPopup } from './useHoverCardPopup';

const HoverCardPopup = React.forwardRef(function HoverCardPopup(
  props: HoverCardPopupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const { open, transitionStatus, getRootPopupProps } = useHoverCardRootContext();
  const { side, alignment } = useHoverCardPositionerContext();

  const { getPopupProps } = useHoverCardPopup({
    getProps: getRootPopupProps,
  });

  const ownerState: HoverCardPopupOwnerState = React.useMemo(
    () => ({
      open,
      side,
      alignment,
      entering: transitionStatus === 'entering',
      exiting: transitionStatus === 'exiting',
    }),
    [open, side, alignment, transitionStatus],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getPopupProps,
    ref: forwardedRef,
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping: {
      entering(value) {
        return value ? { 'data-entering': '' } : null;
      },
      exiting(value) {
        return value ? { 'data-exiting': '' } : null;
      },
      open(value) {
        return {
          'data-state': value ? 'open' : 'closed',
        };
      },
    },
  });

  return renderElement();
});

HoverCardPopup.propTypes /* remove-proptypes */ = {
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

export { HoverCardPopup };
