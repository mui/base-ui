'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useMenuTrigger } from './useMenuTrigger';
import { useMenuRootContext } from '../root/MenuRootContext';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';

/**
 * A button that opens the menu.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuTrigger = React.forwardRef(function MenuTrigger(
  props: MenuTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { render, className, disabled = false, label, ...other } = props;

  const {
    getTriggerProps: getRootTriggerProps,
    disabled: menuDisabled,
    setTriggerElement,
    open,
    setOpen,
    allowMouseUpTriggerRef,
    positionerRef,
  } = useMenuRootContext();

  const { getTriggerProps } = useMenuTrigger({
    disabled: disabled || menuDisabled,
    rootRef: forwardedRef,
    setTriggerElement,
    open,
    setOpen,
    allowMouseUpTriggerRef,
    positionerRef,
  });

  const state: MenuTrigger.State = React.useMemo(() => ({ open }), [open]);

  const { renderElement } = useComponentRenderer({
    render: render || 'button',
    className,
    state,
    propGetter: (externalProps) => getRootTriggerProps(getTriggerProps(externalProps)),
    customStyleHookMapping: pressableTriggerOpenStateMapping,
    extraProps: other,
  });

  return renderElement();
});

namespace MenuTrigger {
  export interface Props extends BaseUIComponentProps<'button', State> {
    children?: React.ReactNode;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Label of the button
     */
    label?: string;
  }

  export type State = {
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
  };
}

MenuTrigger.propTypes /* remove-proptypes */ = {
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
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Label of the button
   */
  label: PropTypes.string,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { MenuTrigger };
