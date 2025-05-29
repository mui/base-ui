'use client';
import * as React from 'react';
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
export const ToggleGroup = React.forwardRef(function ToggleGroup(
  componentProps: ToggleGroup.Props,
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
    ...elementProps
  } = componentProps;

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

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        role: 'group',
      },
      elementProps,
    ],
    customStyleHookMapping,
  });

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      {toolbarContext ? (
        element
      ) : (
        <CompositeRoot direction={direction} loop={loop} render={element} stopEventPropagation />
      )}
    </ToggleGroupContext.Provider>
  );
});

export namespace ToggleGroup {
  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    multiple: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The open state of the toggle group represented by an array of
     * the values of all pressed toggle buttons.
     * This is the controlled counterpart of `defaultValue`.
     */
    value?: readonly any[];
    /**
     * The open state of the toggle group represented by an array of
     * the values of all pressed toggle buttons.
     * This is the uncontrolled counterpart of `value`.
     */
    defaultValue?: readonly any[];
    /**
     * Callback fired when the pressed states of the toggle group changes.
     *
     * @param {any[]} groupValue An array of the `value`s of all the pressed items.
     * @param {Event} event The corresponding event that initiated the change.
     */
    onValueChange?: (groupValue: any[], event: Event) => void;
    /**
     * Whether the toggle group should ignore user interaction.
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
