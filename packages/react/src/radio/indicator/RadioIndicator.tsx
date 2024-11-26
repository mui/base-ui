'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useRadioRootContext } from '../root/RadioRootContext';

const customStyleHookMapping: CustomStyleHookMapping<RadioIndicator.State> = {
  checked(value) {
    return {
      'data-radio': value ? 'checked' : 'unchecked',
    };
  },
};
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

  const state = useRadioRootContext();

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
    customStyleHookMapping,
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
