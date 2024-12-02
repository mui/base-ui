'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { NOOP } from '../../utils/noop';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { useToggleGroupRoot, type UseToggleGroupRoot } from './useToggleGroupRoot';
import { ToggleGroupRootContext } from './ToggleGroupRootContext';

const customStyleHookMapping = {
  multiple(value: boolean) {
    if (value) {
      return { 'data-multiple': '' } as Record<string, string>;
    }
    return null;
  },
};
/**
 *
 * Demos:
 *
 * - [ToggleGroup](https://base-ui.com/components/react-toggle-group/)
 *
 * API:
 *
 * - [ToggleGroupRoot API](https://base-ui.com/components/react-toggle-group/#api-reference-ToggleGroupRoot)
 */
const ToggleGroupRoot = React.forwardRef(function ToggleGroupRoot(
  props: ToggleGroupRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    value: valueProp,
    defaultValue: defaultValueProp,
    disabled: disabledProp = false,
    toggleMultiple = false,
    onValueChange = NOOP,
    className,
    render,
    ...otherProps
  } = props;

  const defaultValue = React.useMemo(() => {
    if (valueProp === undefined) {
      return defaultValueProp ?? [];
    }

    return undefined;
  }, [valueProp, defaultValueProp]);

  const { getRootProps, disabled, setGroupValue, value } = useToggleGroupRoot({
    value: valueProp,
    defaultValue,
    disabled: disabledProp,
    toggleMultiple,
    onValueChange,
  });

  const state: ToggleGroupRoot.State = React.useMemo(
    () => ({ disabled, multiple: toggleMultiple }),
    [disabled, toggleMultiple],
  );

  const contextValue: ToggleGroupRootContext = React.useMemo(
    () => ({
      disabled,
      setGroupValue,
      value,
    }),
    [disabled, value, setGroupValue],
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
    <ToggleGroupRootContext.Provider value={contextValue}>
      <CompositeRoot render={renderElement()} />
    </ToggleGroupRootContext.Provider>
  );
});

export { ToggleGroupRoot };

export namespace ToggleGroupRoot {
  export interface State {
    disabled: boolean;
    multiple: boolean;
  }

  export interface Props
    extends Partial<
        Pick<
          UseToggleGroupRoot.Parameters,
          'value' | 'defaultValue' | 'onValueChange' | 'disabled' | 'toggleMultiple'
        >
      >,
      Omit<BaseUIComponentProps<'div', State>, 'defaultValue'> {
    /**
     * @default false
     */
    disabled?: boolean;
  }
}

ToggleGroupRoot.propTypes /* remove-proptypes */ = {
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
   * the values of all pressed `<ToggleGroup.Item/>`s
   * This is the uncontrolled counterpart of `value`.
   */
  defaultValue: PropTypes.arrayOf(PropTypes.string),
  /**
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Callback fired when the pressed states of the ToggleGroup changes.
   *
   * @param {string[]} groupValue An array of the `value`s of all the pressed items.
   * @param {Event} event The event source of the callback.
   *
   * @default NOOP
   */
  onValueChange: PropTypes.func,
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
  value: PropTypes.arrayOf(PropTypes.string),
} as any;
