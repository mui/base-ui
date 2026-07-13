'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useControlled } from '@base-ui/utils/useControlled';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { useRenderElement } from '../internals/useRenderElement';
import type { BaseUIComponentProps, HTMLProps, Orientation } from '../internals/types';
import { CompositeRoot } from '../internals/composite/root/CompositeRoot';
import { useToolbarRootContext } from '../toolbar/root/ToolbarRootContext';
import { useToolbarGroupContext } from '../toolbar/group/ToolbarGroupContext';
import { ToggleGroupContext } from './ToggleGroupContext';
import type { BaseUIChangeEventDetails } from '../internals/createBaseUIEventDetails';
import { REASONS } from '../internals/reasons';

/**
 * Provides a shared state to a series of toggle buttons.
 *
 * Documentation: [Base UI Toggle Group](https://base-ui.com/react/components/toggle-group)
 */
export const ToggleGroup = React.forwardRef(function ToggleGroup<Value extends string>(
  componentProps: ToggleGroup.Props<Value>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    defaultValue = EMPTY_ARRAY,
    disabled: disabledProp = false,
    loopFocus = true,
    onValueChange,
    orientation = 'horizontal',
    multiple = false,
    value: valueProp,
    className,
    render,
    style,
    ...elementProps
  } = componentProps;

  const toolbarContext = useToolbarRootContext(true);
  const toolbarGroupContext = useToolbarGroupContext();

  const isValueInitialized = valueProp !== undefined || componentProps.defaultValue !== undefined;
  const disabled =
    (toolbarContext?.disabled ?? false) || (toolbarGroupContext?.disabled ?? false) || disabledProp;

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

      onValueChange?.(newGroupValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueState(newGroupValue);
    },
  );

  const state: ToggleGroupState = { disabled, multiple, orientation };

  const contextValue: ToggleGroupContext<Value> = React.useMemo(
    () => ({
      disabled,
      setGroupValue,
      value: groupValue,
      isValueInitialized,
    }),
    [disabled, setGroupValue, groupValue, isValueInitialized],
  );

  const defaultProps: HTMLProps = {
    role: 'group',
  };

  const element = useRenderElement('div', componentProps, {
    enabled: Boolean(toolbarContext),
    state,
    ref: forwardedRef,
    props: [defaultProps, elementProps],
  });

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      {toolbarContext ? (
        element
      ) : (
        <CompositeRoot
          render={render}
          className={className}
          style={style}
          state={state}
          refs={[forwardedRef]}
          props={[defaultProps, elementProps]}
          loopFocus={loopFocus}
          enableHomeAndEndKeys
          orientation={orientation}
        />
      )}
    </ToggleGroupContext.Provider>
  );
}) as {
  <Value extends string>(
    props: ToggleGroup.Props<Value> & React.RefAttributes<HTMLDivElement>,
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
  /**
   * The orientation of the toggle group.
   */
  orientation: Orientation;
}

export interface ToggleGroupProps<Value extends string> extends BaseUIComponentProps<
  'div',
  ToggleGroupState
> {
  /**
   * The pressed state of the toggle group represented by an array of
   * the values of all pressed toggle buttons.
   * This is the controlled counterpart of `defaultValue`.
   */
  value?: readonly Value[] | undefined;
  /**
   * The pressed state of the toggle group represented by an array of
   * the values of all pressed toggle buttons.
   * This is the uncontrolled counterpart of `value`.
   */
  defaultValue?: readonly Value[] | undefined;
  /**
   * Callback fired when the pressed states of the toggle group changes.
   */
  onValueChange?:
    | ((groupValue: Value[], eventDetails: ToggleGroup.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether the toggle group should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * @default 'horizontal'
   */
  orientation?: Orientation | undefined;
  /**
   * Whether to loop keyboard focus back to the first item
   * when the end of the list is reached while using the arrow keys.
   * @default true
   */
  loopFocus?: boolean | undefined;
  /**
   * When `false` only one item in the group can be pressed. If any item in
   * the group becomes pressed, the others will become unpressed.
   * When `true` multiple items can be pressed.
   * @default false
   */
  multiple?: boolean | undefined;
}

export type ToggleGroupChangeEventReason = typeof REASONS.none;

export type ToggleGroupChangeEventDetails = BaseUIChangeEventDetails<ToggleGroup.ChangeEventReason>;

export namespace ToggleGroup {
  export type State = ToggleGroupState;
  export type Props<Value extends string = string> = ToggleGroupProps<Value>;
  export type ChangeEventReason = ToggleGroupChangeEventReason;
  export type ChangeEventDetails = ToggleGroupChangeEventDetails;
}
