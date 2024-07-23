import * as React from 'react';
import PropTypes from 'prop-types';
import { MenuRadioGroupContext } from './MenuRadioGroupContext';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useControlled } from '../../utils/useControlled';

const EMPTY_OBJECT = {};

const MenuRadioGroup = React.forwardRef(function MenuRadioGroup(
  props: MenuRadioGroup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, value: valueProp, defaultValue, onValueChange, ...other } = props;

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'MenuRadioGroup',
  });

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
    ownerState: EMPTY_OBJECT,
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
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;
    value?: any;
    defaultValue?: any;
    onValueChange?: (newValue: any, event: Event) => void;
  }

  export type OwnerState = {};
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

const MemoizedMenuRadioGroup = React.memo(MenuRadioGroup);
export { MemoizedMenuRadioGroup as MenuRadioGroup };
