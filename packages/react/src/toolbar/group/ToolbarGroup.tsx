'use client';
import * as React from 'react';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useToolbarRootContext } from '../root/ToolbarRootContext';
import type { ToolbarRoot } from '../root/ToolbarRoot';
import { ToolbarGroupContext } from './ToolbarGroupContext';

/**
 * Groups several toolbar items or toggles.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export const ToolbarGroup = React.forwardRef(function ToolbarGroup(
  componentProps: ToolbarGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { className, disabled: disabledProp = false, render, ...elementProps } = componentProps;

  const { orientation, disabled: toolbarDisabled } = useToolbarRootContext();

  const disabled = toolbarDisabled || disabledProp;

  const contextValue: ToolbarGroupContext = React.useMemo(
    () => ({
      disabled,
    }),
    [disabled],
  );

  const state: ToolbarRoot.State = React.useMemo(
    () => ({
      disabled,
      orientation,
    }),
    [disabled, orientation],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [elementProps, { role: 'group' }],
  });

  return (
    <ToolbarGroupContext.Provider value={contextValue}>{element}</ToolbarGroupContext.Provider>
  );
});

export namespace ToolbarGroup {
  export interface Props extends BaseUIComponentProps<'div', ToolbarRoot.State> {
    /**
     * When `true` all toolbar items in the group are disabled.
     * @default false
     */
    disabled?: boolean;
  }
}
