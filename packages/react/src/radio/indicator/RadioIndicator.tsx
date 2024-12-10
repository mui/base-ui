'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useRadioRootContext } from '../root/RadioRootContext';
import { customStyleHookMapping } from '../utils/customStyleHookMapping';
import { useAfterExitAnimation } from '../../utils/useAfterExitAnimation';
import { useForkRef } from '../../utils/useForkRef';
import { useTransitionStatus } from '../../utils/useTransitionStatus';

/**
 *
 * Demos:
 *
 * - [Radio Group](https://base-ui.com/components/react-radio-group/)
 *
 * API:
 *
 * - [RadioIndicator API](https://base-ui.com/components/react-radio-group/#api-reference-RadioIndicator)
 */
const RadioIndicator = React.forwardRef(function RadioIndicator(
  props: RadioIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = true, ...otherProps } = props;

  const rootState = useRadioRootContext();

  const rendered = rootState.checked;

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(rendered);

  const state: RadioIndicator.State = React.useMemo(
    () => ({
      ...rootState,
      transitionStatus,
    }),
    [rootState, transitionStatus],
  );

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);
  const mergedRef = useForkRef(forwardedRef, indicatorRef);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    ref: mergedRef,
    className,
    state,
    extraProps: {
      hidden: !mounted,
      ...otherProps,
    },
    customStyleHookMapping,
  });

  useAfterExitAnimation({
    open: rendered,
    animatedElementRef: indicatorRef,
    onFinished() {
      setMounted(false);
    },
  });

  const shouldRender = keepMounted || state.checked;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace RadioIndicator {
  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Whether the component should be kept mounted when not checked.
     * @default true
     */
    keepMounted?: boolean;
  }

  export interface State {
    checked: boolean;
  }
}

RadioIndicator.propTypes /* remove-proptypes */ = {
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
   * Whether the component should be kept mounted when not checked.
   * @default true
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { RadioIndicator };
