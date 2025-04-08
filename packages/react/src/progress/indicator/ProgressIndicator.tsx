'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { mergeProps } from '../../merge-props';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { valueToPercent } from '../../utils/valueToPercent';
import type { ProgressRoot } from '../root/ProgressRoot';
import { useProgressRootContext } from '../root/ProgressRootContext';
import { progressStyleHookMapping } from '../root/styleHooks';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Visualizes the completion status of the task.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
const ProgressIndicator = React.forwardRef(function ProgressIndicator(
  props: ProgressIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...otherProps } = props;

  const { max, min, value, state } = useProgressRootContext();

  const percentageValue =
    Number.isFinite(value) && value !== null ? valueToPercent(value, min, max) : null;

  const getStyles = React.useCallback(() => {
    if (percentageValue == null) {
      return {};
    }

    return {
      insetInlineStart: 0,
      height: 'inherit',
      width: `${percentageValue}%`,
    };
  }, [percentageValue]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    state,
    className,
    ref: forwardedRef,
    extraProps: mergeProps<'div'>(
      {
        style: getStyles(),
      },
      otherProps,
    ),
    customStyleHookMapping: progressStyleHookMapping,
  });

  return renderElement();
});

namespace ProgressIndicator {
  export interface Props extends BaseUIComponentProps<'div', ProgressRoot.State> {}
}

export { ProgressIndicator };

ProgressIndicator.propTypes /* remove-proptypes */ = {
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
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
