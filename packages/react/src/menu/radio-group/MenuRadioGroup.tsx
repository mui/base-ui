import * as React from 'react';
import PropTypes from 'prop-types';
import { MenuRadioGroupContext } from './MenuRadioGroupContext';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';

const EMPTY_OBJECT = {};
const NOOP = () => {};

/**
 * Groups related radio items.
 * Renders a `<div>` element.
 */
const MenuRadioGroup = React.forwardRef(function MenuRadioGroup(
  props: MenuRadioGroup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const {
    render,
    className,
    value: valueProp,
    defaultValue,
    onValueChange: onValueChangeProp = NOOP,
    ...other
  } = props;

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'MenuRadioGroup',
  });

  const onValueChange = useEventCallback(onValueChangeProp);

  const setValue = React.useCallback(
    (newValue: any, event: Event) => {
      setValueUnwrapped(newValue);
      onValueChange?.(newValue, event);
    },
    [onValueChange, setValueUnwrapped],
  );

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    state: EMPTY_OBJECT,
    extraProps: {
      role: 'group',
      ...other,
    },
    ref: forwardedRef,
  });

  const context = React.useMemo(
    () => ({
      value,
      setValue,
    }),
    [value, setValue],
  );

  return (
    <MenuRadioGroupContext.Provider value={context}>
      {renderElement()}
    </MenuRadioGroupContext.Provider>
  );
});

namespace MenuRadioGroup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;
    /**
     * The value of the selected radio button.
     */
    value?: any;
    /**
     * The uncontrolled value of the radio group when it’s initially rendered.
     * To render a controlled radio group, use the `value` prop instead.
     */
    defaultValue?: any;
    /**
     * Function called when the selected value changes.
     *
     * @default () => {}
     */
    onValueChange?: (value: any, event: Event) => void;
  }

  export type State = {};
}

MenuRadioGroup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The uncontrolled value of the radio group when it’s initially rendered.
   * To render a controlled radio group, use the `value` prop instead.
   */
  defaultValue: PropTypes.any,
  /**
   * Function called when the selected value changes.
   *
   * @default () => {}
   */
  onValueChange: PropTypes.func,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The value of the selected radio button.
   */
  value: PropTypes.any,
} as any;

const MemoizedMenuRadioGroup = React.memo(MenuRadioGroup);

/**
 * Groups related radio items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export { MemoizedMenuRadioGroup as MenuRadioGroup };
