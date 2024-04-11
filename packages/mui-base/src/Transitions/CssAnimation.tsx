'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useTransitionStateManager } from '../useTransition';

export interface CssAnimationProps {
  children?: React.ReactNode;
  className?: string;
  /**
   * The name of the CSS animation (the `animation-name` CSS property) applied to the component when
   * the transition is requested to enter.
   */
  enterAnimationName?: string;
  /**
   * The name of the CSS class applied to the component when the transition
   * is requested to enter.
   */
  enterClassName?: string;
  /**
   * The name of the CSS animation (the `animation-name` CSS property) applied to the component when
   * the transition is requested to exit.
   */
  exitAnimationName?: string;
  /**
   * The name of the CSS class applied to the component when the transition
   * is requested to exit.
   */
  exitClassName?: string;
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
  const {
    children,
    className,
    enterAnimationName,
    enterClassName,
    exitAnimationName,
    exitClassName,
    ...other
  } = props;

  const { requestedEnter, onExited } = useTransitionStateManager();

  const hasExited = React.useRef(true);

  React.useEffect(() => {
    if (requestedEnter && hasExited.current) {
      hasExited.current = false;
    }
  }, [requestedEnter]);

  const handleAnimationEnd = React.useCallback(
    (event: React.AnimationEvent) => {
      if (event.animationName === exitAnimationName) {
        onExited();
        hasExited.current = true;
      } else if (event.animationName === enterAnimationName) {
        hasExited.current = false;
      }
    },
    [onExited, exitAnimationName, enterAnimationName],
  );

  return (
    <div
      onAnimationEnd={handleAnimationEnd}
      className={clsx(className, requestedEnter ? enterClassName : exitClassName)}
      {...other}
    >
      {children}
    </div>
  );
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
