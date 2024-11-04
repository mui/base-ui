'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useRadioRootContext } from '../Root/RadioRootContext';

const customStyleHookMapping: CustomStyleHookMapping<RadioIndicator.OwnerState> = {
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
 * - [Radio Group](https://base-ui.netlify.app/components/react-radio-group/)
 *
 * API:
 *
 * - [RadioIndicator API](https://base-ui.netlify.app/components/react-radio-group/#api-reference-RadioIndicator)
 */
const RadioIndicator = React.forwardRef(function RadioIndicator(
  props: RadioIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = true, ...otherProps } = props;

  const ownerState = useRadioRootContext();

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping,
  });

  const shouldRender = keepMounted || ownerState.checked;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace RadioIndicator {
  export type Props = BaseUIComponentProps<'span', OwnerState> & {
    /**
     * Whether the component should be kept mounted when not checked.
     * @default true
     */
    keepMounted?: boolean;
  };

  export interface OwnerState {
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
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
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
