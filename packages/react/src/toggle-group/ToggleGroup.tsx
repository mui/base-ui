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
 * Provides a shared state to a series of toggle buttons.
 *
 * Documentation: [Base UI Toggle Group](https://base-ui.com/react/components/toggle-group)
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
     * Whether the component should ignore user actions.
     * @default false
     */
    disabled?: boolean;
    /**
     * @default 'horizontal'
     */
    orientation?: ToggleGroupOrientation;
    /**
     * Whether to loop keyboard focus back to the first item
     * when the end of the list is reached while using the arrow keys.
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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The open state of the ToggleGroup represented by an array of
   * the values of all pressed `<ToggleGroup.Item/>`s.
   * This is the uncontrolled counterpart of `value`.
   */
  defaultValue: PropTypes.array,
  /**
   * Whether the component should ignore user actions.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Whether to loop keyboard focus back to the first item
   * when the end of the list is reached while using the arrow keys.
   * @default true
   */
  loop: PropTypes.bool,
  /**
   * Callback fired when the pressed states of the ToggleGroup changes.
   *
   * @param {any[]} groupValue An array of the `value`s of all the pressed items.
   * @param {Event} event The corresponding event that initiated the change.
   */
  onValueChange: PropTypes.func,
  /**
   * @default 'horizontal'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
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
