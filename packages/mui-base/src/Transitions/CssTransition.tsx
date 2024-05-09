'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTransitionStateManager } from '../useTransition';

export interface CssTransitionProps {
  children?: React.ReactElement;
  /**
   * The name of the CSS property that is transitioned the longest (has the largest `transition-duration`) on exit.
   * This is used to determine when the transition has ended.
   * If not specified, the transition will be considered finished end when the first property is transitioned.
   * If all properties have the same `transition-duration` (or there is just one transitioned property), this can be omitted.
   */
  lastTransitionedPropertyOnExit?: string;
}

export type TransitionStatus = 'unmounted' | 'initial' | 'opening' | 'closing';

/**
 * A utility component that hooks up to the Base UI transitions API and
 * applies a CSS transition to its children when necessary.
 *
 * Demos:
 *
 * - [Transitions](https://mui.com/base-ui/react-transitions/)
 *
 * API:
 *
 * - [CssTransition API](https://mui.com/base-ui/react-transitions/components-api/#css-transition)
 */
const CssTransition = function CssTransition(props: CssTransitionProps) {
  const { children, lastTransitionedPropertyOnExit } = props;
  const { requestedEnter, onExited, transitionStatus } = useTransitionStateManager();

  const handleTransitionEnd = React.useCallback(
    (event: React.TransitionEvent) => {
      if (
        !requestedEnter &&
        (lastTransitionedPropertyOnExit == null ||
          event.propertyName === lastTransitionedPropertyOnExit)
      ) {
        onExited();
      }
    },
    [onExited, requestedEnter, lastTransitionedPropertyOnExit],
  );

  const newProps = {
    onTransitionEnd: handleTransitionEnd,
    'data-status': transitionStatus,
  };

  return children && React.cloneElement(children, newProps);
};

CssTransition.propTypes /* remove-proptypes */ = {
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
   * The name of the CSS class applied to the component when the transition
   * is requested to enter.
   */
  enterClassName: PropTypes.string,
  /**
   * The name of the CSS class applied to the component when the transition
   * is requested to exit.
   */
  exitClassName: PropTypes.string,
  /**
   * The name of the CSS property that is transitioned the longest (has the largest `transition-duration`) on exit.
   * This is used to determine when the transition has ended.
   * If not specified, the transition will be considered finished end when the first property is transitioned.
   * If all properties have the same `transition-duration` (or there is just one transitioned property), this can be omitted.
   */
  lastTransitionedPropertyOnExit: PropTypes.string,
} as any;

export { CssTransition };
