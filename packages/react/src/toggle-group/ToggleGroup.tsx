'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useControlled } from '@base-ui/utils/useControlled';
import { useRenderElement } from '../utils/useRenderElement';
import type { BaseUIComponentProps, HTMLProps, Orientation } from '../utils/types';
import { CompositeRoot } from '../composite/root/CompositeRoot';
import { useToolbarRootContext } from '../toolbar/root/ToolbarRootContext';
import { ToggleGroupContext } from './ToggleGroupContext';
import { ToggleGroupDataAttributes } from './ToggleGroupDataAttributes';
import type { BaseUIChangeEventDetails } from '../utils/createBaseUIEventDetails';
import { REASONS } from '../utils/reasons';
import { ToggleValue } from '../toggle/Toggle';

const stateAttributesMapping = {
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
export const ToggleGroup = React.forwardRef(function ToggleGroup<Value extends ToggleValue>(
  componentProps: ToggleGroup.Props<Value>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    defaultValue: defaultValueProp,
    disabled: disabledProp = false,
    loopFocus = true,
    onValueChange,
    orientation = 'horizontal',
    multiple = false,
    value: valueProp,
    className,
    render,
    ...elementProps
  } = componentProps;

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

  const setGroupValue = useStableCallback(
    (
      newValue: Value,
      nextPressed: boolean,
      eventDetails: BaseUIChangeEventDetails<typeof REASONS.none>,
    ) => {
      let newGroupValue: Value[];
      if (multiple) {
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
        onValueChange?.(newGroupValue, eventDetails);

        if (eventDetails.isCanceled) {
          return;
        }

        setValueState(newGroupValue);
      }
    },
  );

  const state: ToggleGroup.State = React.useMemo(
    () => ({ disabled, multiple, orientation }),
    [disabled, orientation, multiple],
  );

  const contextValue: ToggleGroupContext<Value> = React.useMemo(
    () => ({
      disabled,
      orientation,
      setGroupValue,
      value: groupValue,
    }),
    [disabled, orientation, setGroupValue, groupValue],
  );

  const defaultProps: HTMLProps = {
    role: 'group',
  };

  const element = useRenderElement('div', componentProps, {
    enabled: Boolean(toolbarContext),
    state,
    ref: forwardedRef,
    props: [defaultProps, elementProps],
    stateAttributesMapping,
  });

  return (
    <ToggleGroupContext.Provider value={contextValue as ToggleGroupContext<unknown>}>
      {toolbarContext ? (
        element
      ) : (
        <CompositeRoot
          render={render}
          className={className}
          state={state}
          refs={[forwardedRef]}
          props={[defaultProps, elementProps]}
          stateAttributesMapping={stateAttributesMapping}
          loopFocus={loopFocus}
        />
      )}
    </ToggleGroupContext.Provider>
  );
}) as {
  <Value extends ToggleValue>(
    props: ToggleGroup.Props<Value> & { ref?: React.RefObject<HTMLDivElement> },
  ): React.JSX.Element;
};

export interface ToggleGroupState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * When `false` only one item in the group can be pressed. If any item in
   * the group becomes pressed, the others will become unpressed.
   * When `true` multiple items can be pressed.
   * @default false
   */
  multiple: boolean;
}

export interface ToggleGroupProps<Value extends ToggleValue> extends BaseUIComponentProps<
  'div',
  ToggleGroup.State
> {
  /**
   * The open state of the toggle group represented by an array of
   * the values of all pressed toggle buttons.
   * This is the controlled counterpart of `defaultValue`.
   */
  value?: Value[];
  /**
   * The open state of the toggle group represented by an array of
   * the values of all pressed toggle buttons.
   * This is the uncontrolled counterpart of `value`.
   */
  defaultValue?: Value[];
  /**
   * Callback fired when the pressed states of the toggle group changes.
   */
  onValueChange?: (groupValue: Value[], eventDetails: ToggleGroup.ChangeEventDetails) => void;
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
  loopFocus?: boolean;
  /**
   * When `false` only one item in the group can be pressed. If any item in
   * the group becomes pressed, the others will become unpressed.
   * When `true` multiple items can be pressed.
   * @default false
   */
  multiple?: boolean;
}

export type ToggleGroupChangeEventReason = typeof REASONS.none;

export type ToggleGroupChangeEventDetails = BaseUIChangeEventDetails<ToggleGroup.ChangeEventReason>;

export namespace ToggleGroup {
  export type State = ToggleGroupState;
  export type Props<Value extends ToggleValue> = ToggleGroupProps<Value>;
  export type ChangeEventReason = ToggleGroupChangeEventReason;
  export type ChangeEventDetails = ToggleGroupChangeEventDetails;
}
