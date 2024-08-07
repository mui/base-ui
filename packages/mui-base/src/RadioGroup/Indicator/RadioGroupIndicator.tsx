'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useRadioGroupItemContext } from '../Item/RadioGroupItemContext';
import type {
  RadioGroupIndicatorOwnerState,
  RadioGroupIndicatorProps,
} from './RadioGroupIndicator.types';

const customStyleHookMapping: CustomStyleHookMapping<RadioGroupIndicatorOwnerState> = {
  checked(value) {
    return {
      'data-radio-group-item': value ? 'checked' : 'unchecked',
    };
  },
};

const RadioGroupIndicator = React.forwardRef(function RadioGroupIndicator(
  props: RadioGroupIndicatorProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...otherProps } = props;

  const { disabled, checked, required, readOnly } = useRadioGroupItemContext();

  const ownerState: RadioGroupIndicatorOwnerState = React.useMemo(
    () => ({
      disabled,
      checked,
      required,
      readOnly,
    }),
    [disabled, checked, required, readOnly],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping,
  });

  return renderElement();
});

RadioGroupIndicator.propTypes /* remove-proptypes */ = {
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { RadioGroupIndicator };
