'use client';
import * as React from 'react';
import { NOOP } from '../utils/noop';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../utils/types';
import { CompositeRoot } from '../composite/root/CompositeRoot';
import { useDirection } from '../direction-provider/DirectionContext';
import { useToolbarRootContext } from '../toolbar/root/ToolbarRootContext';
import { useToggleGroup } from './useToggleGroup';
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
    onValueChange: onValueChangeProp,
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

  const { getRootProps, disabled, setGroupValue, value } = useToggleGroup({
    value: valueProp,
    defaultValue,
    disabled: (toolbarContext?.disabled ?? false) || disabledProp,
    toggleMultiple,
    onValueChange: onValueChangeProp ?? NOOP,
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
      value,
    }),
    [disabled, orientation, setGroupValue, value],
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
      {toolbarContext ? (
        renderElement()
      ) : (
        <CompositeRoot direction={direction} loop={loop} render={renderElement()} />
      )}
    </ToggleGroupContext.Provider>
  );
});

export { ToggleGroup };

export type ToggleGroupOrientation = 'horizontal' | 'vertical';

namespace ToggleGroup {
  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    multiple: boolean;
  }

  export interface Props
    extends Partial<useToggleGroup.Parameters>,
      Omit<BaseUIComponentProps<'div', State>, 'defaultValue'> {
    /**
     * Whether the component should ignore user interaction.
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
