'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useCheckboxRootContext } from '../root/CheckboxRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCustomStyleHookMapping } from '../utils/useCustomStyleHookMapping';
import type { CheckboxRoot } from '../root/CheckboxRoot';
import type { BaseUIComponentProps } from '../../utils/types';
import { useAfterExitAnimation } from '../../utils/useAfterExitAnimation';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useForkRef } from '../../utils/useForkRef';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { transitionStatusMapping } from '../../utils/styleHookMapping';

/**
 * The indicator part of the Checkbox.
 *
 * Demos:
 *
 * - [Checkbox](https://base-ui.com/components/react-checkbox/)
 *
 * API:
 *
 * - [CheckboxIndicator API](https://base-ui.com/components/react-checkbox/#api-reference-CheckboxIndicator)
 */
const CheckboxIndicator = React.forwardRef(function CheckboxIndicator(
  props: CheckboxIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = false, ...otherProps } = props;

  const rootState = useCheckboxRootContext();

  const rendered = rootState.checked || rootState.indeterminate;

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(rendered);

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);
  const mergedRef = useForkRef(forwardedRef, indicatorRef);

  const state: CheckboxIndicator.State = React.useMemo(
    () => ({
      ...rootState,
      transitionStatus,
    }),
    [rootState, transitionStatus],
  );

  useAfterExitAnimation({
    open: rendered,
    animatedElementRef: indicatorRef,
    onFinished() {
      setMounted(false);
    },
  });

  const baseStyleHookMapping = useCustomStyleHookMapping(rootState);

  const customStyleHookMapping: CustomStyleHookMapping<CheckboxIndicator.State> = React.useMemo(
    () => ({
      ...baseStyleHookMapping,
      ...transitionStatusMapping,
    }),
    [baseStyleHookMapping],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    ref: mergedRef,
    state,
    className,
    customStyleHookMapping,
    extraProps: {
      hidden: !mounted,
      ...otherProps,
    },
  });

  const shouldRender = keepMounted || state.checked || state.indeterminate;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace CheckboxIndicator {
  export interface State extends CheckboxRoot.State {
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Determines if the indicator stays mounted when unchecked.
     * @default false
     */
    keepMounted?: boolean;
  }
}

CheckboxIndicator.propTypes /* remove-proptypes */ = {
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
   * Determines if the indicator stays mounted when unchecked.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { CheckboxIndicator };
