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
import { FormProvider, useFormContext } from '../../Form/FormContext';

/**
 * @ignore - internal component.
 */
const CheckboxGroupRootComponent = React.forwardRef(function CheckboxGroupRootComponent(
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

  const { labelId, setLabelId } = useFormContext();

  const { getRootProps, value, setValue, parent } = useCheckboxGroupRoot({
    value: externalValue,
    allValues,
    defaultValue,
    onValueChange,
    labelId,
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
    [labelId, setLabelId, allValues, value, setValue, parent],
  );

  return (
    <CheckboxGroupRootContext.Provider value={contextValue}>
      {renderElement()}
    </CheckboxGroupRootContext.Provider>
  );
});

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
  return (
    <FormProvider>
      <CheckboxGroupRootComponent {...props} ref={forwardedRef} />
    </FormProvider>
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
   * @ignore
   */
  defaultValue: PropTypes.arrayOf(PropTypes.string),
  /**
   * @ignore
   */
  onValueChange: PropTypes.func,
  /**
   * @ignore
   */
  value: PropTypes.arrayOf(PropTypes.string),
} as any;

export { CheckboxGroupRoot };
