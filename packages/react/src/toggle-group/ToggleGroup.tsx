'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useRenderElement } from '../utils/useRenderElement';
import type { BaseUIComponentProps, Orientation } from '../utils/types';
import { CompositeRoot } from '../composite/root/CompositeRoot';
import { useControlled } from '../utils/useControlled';
import { useDirection } from '../direction-provider/DirectionContext';
import { useEventCallback } from '../utils/useEventCallback';
import { useToolbarRootContext } from '../toolbar/root/ToolbarRootContext';
import { ToggleGroupContext } from './ToggleGroupContext';
import { ToggleGroupDataAttributes } from './ToggleGroupDataAttributes';

const customStyleHookMapping = {
  multiple(value: boolean) {
    if (value) {
      return { [ToggleGroupDataAttributes.multiple]: '' } as Record<string, string>;
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
    disabled: disabledProp = false,
    loop = true,
    onValueChange,
    orientation = 'horizontal',
    toggleMultiple = false,
    value: valueProp,
    className,
    render,
    ...otherProps
  } = props;

  const direction = useDirection();

  const toolbarContext = useToolbarRootContext(true);

  const defaultValue = React.useMemo(() => {
    if (valueProp === undefined) {
      return defaultValueProp ?? [];
    }

    return undefined;
  }, [valueProp, defaultValueProp]);

  const disabled = (toolbarContext?.disabled ?? false) || disabledProp;

  const [groupValue, setValueState] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'ToggleGroup',
    state: 'value',
  });

  const setGroupValue = useEventCallback((newValue: string, nextPressed: boolean, event: Event) => {
    let newGroupValue: any[] | undefined;
    if (toggleMultiple) {
      newGroupValue = groupValue.slice();
      if (nextPressed) {
        newGroupValue.push(newValue);
      } else {
        newGroupValue.splice(groupValue.indexOf(newValue), 1);
      }
    } else {
      newGroupValue = nextPressed ? [newValue] : [];
    }
    if (Array.isArray(newGroupValue)) {
      setValueState(newGroupValue);
      onValueChange?.(newGroupValue, event);
    }
  });

  const state: ToggleGroup.State = React.useMemo(
    () => ({ disabled, multiple: toggleMultiple, orientation }),
    [disabled, orientation, toggleMultiple],
  );

  const contextValue: ToggleGroupContext = React.useMemo(
    () => ({
      disabled,
      orientation,
      setGroupValue,
      value: groupValue,
    }),
    [disabled, orientation, setGroupValue, groupValue],
  );

  const renderElement = useRenderElement('div', props, {
    state,
    ref: forwardedRef,
    props: [
      {
        role: 'group',
      },
      otherProps,
    ],
    customStyleHookMapping,
  });

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      {toolbarContext ? (
        renderElement()
      ) : (
        <CompositeRoot direction={direction} loop={loop} render={renderElement()} />
      )}
    </ToggleGroupContext.Provider>
  );
});

export { ToggleGroup };

namespace ToggleGroup {
  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    multiple: boolean;
  }

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'defaultValue'> {
    /**
     * The open state of the ToggleGroup represented by an array of
     * the values of all pressed toggle buttons
     * This is the controlled counterpart of `defaultValue`.
     */
    value?: readonly any[];
    /**
     * The open state of the ToggleGroup represented by an array of
     * the values of all pressed toggle buttons.
     * This is the uncontrolled counterpart of `value`.
     */
    defaultValue?: readonly any[];
    /**
     * Callback fired when the pressed states of the ToggleGroup changes.
     *
     * @param {any[]} groupValue An array of the `value`s of all the pressed items.
     * @param {Event} event The corresponding event that initiated the change.
     */
    onValueChange?: (groupValue: any[], event: Event) => void;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * @default 'horizontal'
     */
    orientation?: Orientation;
    /**
     * Whether to loop keyboard focus back to the first item
     * when the end of the list is reached while using the arrow keys.
     * @default true
     */
    loop?: boolean;
    /**
     * When `false` only one item in the group can be pressed. If any item in
     * the group becomes pressed, the others will become unpressed.
     * When `true` multiple items can be pressed.
     * @default false
     */
    toggleMultiple?: boolean;
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
   * the values of all pressed toggle buttons.
   * This is the uncontrolled counterpart of `value`.
   */
  defaultValue: PropTypes.array,
  /**
   * Whether the component should ignore user interaction.
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
  onValueChange: PropTypes.func.isRequired,
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
   * the values of all pressed toggle buttons
   * This is the controlled counterpart of `defaultValue`.
   */
  value: PropTypes.array,
} as any;
