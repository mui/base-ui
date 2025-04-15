'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useProgressRootContext } from '../root/ProgressRootContext';
import type { ProgressRoot } from '../root/ProgressRoot';
import { progressStyleHookMapping } from '../root/styleHooks';
/**
 * A text label displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
const ProgressValue = React.forwardRef(function ProgressValue(
  componentProps: ProgressValue.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, children, ...elementProps } = componentProps;

  const { value, formattedValue, state } = useProgressRootContext();

  const formattedValueArg = value == null ? 'indeterminate' : formattedValue;
  const formattedValueDisplay = value == null ? null : formattedValue;

  const renderElement = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        'aria-hidden': true,
        children:
          typeof children === 'function'
            ? children(formattedValueArg, value)
            : formattedValueDisplay,
      },
      elementProps,
    ],
    customStyleHookMapping: progressStyleHookMapping,
  });

  return renderElement();
});

namespace ProgressValue {
  export interface Props
    extends Omit<BaseUIComponentProps<'span', ProgressRoot.State>, 'children'> {
    children?: null | ((formattedValue: string | null, value: number | null) => React.ReactNode);
  }
}

export { ProgressValue };

ProgressValue.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.func,
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
