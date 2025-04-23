'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
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
const ToolbarGroup = React.forwardRef(function ToolbarGroup(
  props: ToolbarGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { className, disabled: disabledProp = false, render, ...otherProps } = props;

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

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: forwardedRef,
    state,
    className,
    extraProps: {
      ...otherProps,
      role: 'group',
    },
  });

  return (
    <ToolbarGroupContext.Provider value={contextValue}>
      {renderElement()}
    </ToolbarGroupContext.Provider>
  );
});

namespace ToolbarGroup {
  export interface Props extends BaseUIComponentProps<'div', ToolbarRoot.State> {
    /**
     * When `true` all toolbar items in the group are disabled.
     * @default false
     */
    disabled?: boolean;
  }
}

export { ToolbarGroup };
