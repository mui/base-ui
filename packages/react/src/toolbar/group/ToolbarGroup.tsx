'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
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

export namespace ToolbarGroup {
  export interface Props extends BaseUIComponentProps<'div', ToolbarRoot.State> {
    /**
     * When `true` all toolbar items in the group are disabled.
     * @default false
     */
    disabled?: boolean;
  }
}

export { ToolbarGroup };

ToolbarGroup.propTypes /* remove-proptypes */ = {
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
   * When `true` all toolbar items in the group are disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
