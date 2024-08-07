import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useRadioGroupItemContext } from '../Item/RadioGroupItemContext';
import { useRadioGroupIndicator } from './useRadioGroupIndicator';
import type {
  RadioGroupIndicatorOwnerState,
  RadioGroupIndicatorProps,
} from './RadioGroupIndicator.types';

const customStyleHookMapping: CustomStyleHookMapping<RadioGroupIndicatorOwnerState> = {
  checked(value) {
    return {
      'data-state': value ? 'checked' : 'unchecked',
    };
  },
};

const RadioGroupIndicator = React.forwardRef(function RadioGroupIndicator(
  props: RadioGroupIndicatorProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, keepMounted = false, ...otherProps } = props;

  const { disabled, checked } = useRadioGroupItemContext();

  const { getIndicatorProps } = useRadioGroupIndicator();

  const ownerState: RadioGroupIndicatorOwnerState = React.useMemo(
    () => ({
      disabled,
      checked,
    }),
    [disabled, checked],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getIndicatorProps,
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping,
  });

  if (!keepMounted && !ownerState.checked) {
    return null;
  }

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
   * If `true`, the indicator stays mounted when unchecked. Useful for CSS animations.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { RadioGroupIndicator };
