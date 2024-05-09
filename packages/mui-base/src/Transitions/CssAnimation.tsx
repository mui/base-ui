'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTransitionStateManager } from '../useTransition';

export interface CssAnimationProps {
  children?: React.ReactElement;
  /**
   * The name of the CSS animation (the `animation-name` CSS property) applied to the component when
   * the transition is requested to exit.
   */
  exitAnimationName?: string;
}

/**
 *
 * Demos:
 *
 * - [Transitions](https://mui.com/base-ui/react-transitions/)
 *
 * API:
 *
 * - [CssAnimation API](https://mui.com/base-ui/react-transitions/components-api/#css-animation)
 */
function CssAnimation(props: CssAnimationProps) {
  const { children, exitAnimationName } = props;
  const { requestedEnter, onExited, transitionStatus } = useTransitionStateManager();

  const handleAnimationEnd = React.useCallback(
    (event: React.AnimationEvent) => {
      if (
        !requestedEnter &&
        (exitAnimationName == null || event.animationName === exitAnimationName)
      ) {
        onExited();
      }
    },
    [onExited, requestedEnter, exitAnimationName],
  );

  const newProps = {
    onAnimationEnd: handleAnimationEnd,
    'data-status': transitionStatus,
  };

  return children && React.cloneElement(children, newProps);
}

CssAnimation.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The name of the CSS animation (the `animation-name` CSS property) applied to the component when
   * the transition is requested to enter.
   */
  enterAnimationName: PropTypes.string,
  /**
   * The name of the CSS class applied to the component when the transition
   * is requested to enter.
   */
  enterClassName: PropTypes.string,
  /**
   * The name of the CSS animation (the `animation-name` CSS property) applied to the component when
   * the transition is requested to exit.
   */
  exitAnimationName: PropTypes.string,
  /**
   * The name of the CSS class applied to the component when the transition
   * is requested to exit.
   */
  exitClassName: PropTypes.string,
} as any;

export { CssAnimation };
