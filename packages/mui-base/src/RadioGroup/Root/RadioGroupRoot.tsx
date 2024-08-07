import * as React from 'react';
import PropTypes from 'prop-types';
import { CompositeRoot } from '../../Composite/Root/CompositeRoot';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { RadioGroupRootOwnerState, RadioGroupRootProps } from './RadioGroupRoot.types';
import { useRadioGroupRoot } from './useRadioGroupRoot';
import { type RadioGroupRootContextValue, RadioGroupRootContext } from './RadioGroupRootContext';
import { visuallyHidden } from '../../utils/visuallyHidden';

const RadioGroupRoot = React.forwardRef(function RadioGroupRoot(
  props: RadioGroupRootProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, disabled, ...otherProps } = props;

  const { getRootProps, checkedItem, setCheckedItem } = useRadioGroupRoot(props);

  const ownerState: RadioGroupRootOwnerState = React.useMemo(
    () => ({
      disabled: disabled ?? false,
    }),
    [disabled],
  );

  const contextValue: RadioGroupRootContextValue = React.useMemo(
    () => ({
      checkedItem,
      setCheckedItem,
      disabled,
    }),
    [checkedItem, setCheckedItem, disabled],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
  });

  return (
    <RadioGroupRootContext.Provider value={contextValue}>
      <CompositeRoot render={renderElement()} />
      {checkedItem && props.name && (
        <input type="hidden" name={props.name} value={checkedItem} style={visuallyHidden} />
      )}
    </RadioGroupRootContext.Provider>
  );
});

RadioGroupRoot.propTypes /* remove-proptypes */ = {
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
   * The default value of the selected radio button. Use when uncontrolled.
   */
  defaultValue: PropTypes.string,
  /**
   * Whether the radio group is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * The name of the radio group submitted with the form data.
   */
  name: PropTypes.string,
  /**
   * Callback fired when the value changes.
   */
  onValueChange: PropTypes.func,
  /**
   * The orientation of the radio group.
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The value of the selected radio button. Use when controlled.
   */
  value: PropTypes.string,
} as any;

export { RadioGroupRoot };
