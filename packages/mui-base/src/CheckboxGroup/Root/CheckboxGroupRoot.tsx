'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type {
  CheckboxGroupRootContextValue,
  CheckboxGroupRootProps,
} from './CheckboxGroupRoot.types';
import { useCheckboxGroupRoot } from './useCheckboxGroupRoot';
import { CheckboxGroupRootContext } from './CheckboxGroupRootContext';

/**
 * The foundation for building custom-styled checkbox groups.
 *
 * Demos:
 *
 * - [CheckboxGroup](https://mui.com/base-ui/react-checkbox-group/)
 *
 * API:
 *
 * - [CheckboxGroup API](https://mui.com/base-ui/react-checkbox/components-api/#checkbox-group-root)
 */
const CheckboxGroupRoot = React.forwardRef(function CheckboxGroupRoot(
  props: CheckboxGroupRootProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    value: externalValue,
    defaultValue,
    onValueChange,
    allValues,
    ...otherProps
  } = props;

  const { getRootProps, labelId, setLabelId, value, setValue, parent } = useCheckboxGroupRoot({
    value: externalValue,
    allValues,
    defaultValue,
    onValueChange,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    className,
    ownerState: {},
    ref: forwardedRef,
    extraProps: otherProps,
  });

  const contextValue: CheckboxGroupRootContextValue = React.useMemo(
    () => ({
      groupLabelId: labelId,
      setGroupLabelId: setLabelId,
      allValues,
      value,
      setValue,
      parent,
    }),
    [labelId, setLabelId, value, setValue, parent, allValues],
  );

  return (
    <CheckboxGroupRootContext.Provider value={contextValue}>
      {renderElement()}
    </CheckboxGroupRootContext.Provider>
  );
});

CheckboxGroupRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  allValues: PropTypes.arrayOf(PropTypes.string),
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  defaultValue: PropTypes.arrayOf(PropTypes.string),
  /**
   * @ignore
   */
  onValueChange: PropTypes.func,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  value: PropTypes.arrayOf(PropTypes.string),
} as any;

export { CheckboxGroupRoot };
