'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { mergeProps } from '../../merge-props';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { MeterRoot } from '../root/MeterRoot';
import { useMeterRootContext } from '../root/MeterRootContext';
import { meterStyleHookMapping } from '../root/styleHooks';
/**
 * Visualizes the position of the value along the range.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
const MeterIndicator = React.forwardRef(function MeterIndicator(
  props: MeterIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...otherProps } = props;

  const { percentageValue, state } = useMeterRootContext();

  const getStyles = React.useCallback(() => {
    return {
      insetInlineStart: 0,
      // height: 'inherit',
      width: `${percentageValue}%`,
    };
  }, [percentageValue]);

  const getProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'div'>(externalProps, {
        style: getStyles(),
      }),
    [getStyles],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getProps,
    render: render ?? 'div',
    state,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: meterStyleHookMapping,
  });

  return renderElement();
});

namespace MeterIndicator {
  export interface State extends MeterRoot.State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

export { MeterIndicator };

MeterIndicator.propTypes /* remove-proptypes */ = {
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
