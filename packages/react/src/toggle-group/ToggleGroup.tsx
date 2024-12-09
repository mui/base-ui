'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { NOOP } from '../utils/noop';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../utils/types';
import { CompositeRoot } from '../composite/root/CompositeRoot';
import { useDirection } from '../direction-provider/DirectionContext';
import { useToggleGroup, type UseToggleGroup } from './useToggleGroup';
import { ToggleGroupContext } from './ToggleGroupContext';

const customStyleHookMapping = {
  multiple(value: boolean) {
    if (value) {
      return { 'data-multiple': '' } as Record<string, string>;
    }
    return null;
  },
};
/**
 */
const ToggleGroup = React.forwardRef(function ToggleGroup(
  props: ToggleGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    defaultValue: defaultValueProp,
    disabled = false,
    loop = true,
    onValueChange: onValueChangeProp,
    orientation = 'horizontal',
    toggleMultiple = false,
    value: valueProp,
    className,
    render,
    ...otherProps
  } = props;

  const direction = useDirection();

  const defaultValue = React.useMemo(() => {
    if (valueProp === undefined) {
      return defaultValueProp ?? [];
    }

    return undefined;
  }, [valueProp, defaultValueProp]);

  const {
    getRootProps,
    disabled: isDisabled,
    setGroupValue,
    value,
  } = useToggleGroup({
    value: valueProp,
    defaultValue,
    disabled,
    toggleMultiple,
    onValueChange: onValueChangeProp ?? NOOP,
  });

  const state: ToggleGroup.State = React.useMemo(
    () => ({ disabled: isDisabled, multiple: toggleMultiple, orientation }),
    [isDisabled, orientation, toggleMultiple],
  );

  const contextValue: ToggleGroupContext = React.useMemo(
    () => ({
      disabled: isDisabled,
      orientation,
      setGroupValue,
      value,
    }),
    [isDisabled, orientation, setGroupValue, value],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    ref: forwardedRef,
    state,
    className,
    customStyleHookMapping,
    extraProps: otherProps,
  });

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      <CompositeRoot direction={direction} loop={loop} render={renderElement()} />
    </ToggleGroupContext.Provider>
  );
});

export { ToggleGroup };

export type ToggleGroupOrientation = 'horizontal' | 'vertical';

export namespace ToggleGroup {
  export interface State {
    disabled: boolean;
    multiple: boolean;
  }

  export interface Props
    extends Partial<UseToggleGroup.Parameters>,
      Omit<BaseUIComponentProps<'div', State>, 'defaultValue'> {
    /**
     * @default false
     */
    disabled?: boolean;
    /**
     * @default 'horizontal'
     */
    orientation?: ToggleGroupOrientation;
    /**
     * @default true
     */
    loop?: boolean;
  }
}

ToggleGroup.propTypes /* remove-proptypes */ = {
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
   * The open state of the ToggleGroup represented by an array of
   * the values of all pressed `<ToggleGroup.Item/>`s.
   * This is the uncontrolled counterpart of `value`.
   */
  defaultValue: PropTypes.array,
  /**
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * @default true
   */
  loop: PropTypes.bool,
  /**
   * Callback fired when the pressed states of the ToggleGroup changes.
   *
   * @param {any[]} groupValue An array of the `value`s of all the pressed items.
   * @param {Event} event The event source of the callback.
   */
  onValueChange: PropTypes.func,
  /**
   * @default 'horizontal'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * When `false` only one item in the group can be pressed. If any item in
   * the group becomes pressed, the others will become unpressed.
   * When `true` multiple items can be pressed.
   * @default false
   */
  toggleMultiple: PropTypes.bool,
  /**
   * The open state of the ToggleGroup represented by an array of
   * the values of all pressed `<ToggleGroup.Item/>`s
   * This is the controlled counterpart of `defaultValue`.
   */
  value: PropTypes.array,
} as any;
