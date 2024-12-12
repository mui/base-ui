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
 * Indicates whether the checkbox is ticked.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
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
     * Whether to keep the element in the DOM when the checkbox is not checked.
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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Whether to keep the element in the DOM when the checkbox is not checked.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { CheckboxIndicator };
