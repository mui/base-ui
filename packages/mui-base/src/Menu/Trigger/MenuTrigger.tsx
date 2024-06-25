'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { MenuTriggerOwnerState, MenuTriggerProps } from './MenuTrigger.types';
import { useMenuTrigger } from './useMenuTrigger';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useMenuRootContext } from '../Root/MenuRootContext';

const MenuTrigger = React.forwardRef(function MenuTrigger(
  props: MenuTriggerProps,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    render,
    className,
    disabled = false,
    label,
    focusableWhenDisabled = false,
    ...other
  } = props;

  const { state, dispatch } = useMenuRootContext();

  const { getRootProps } = useMenuTrigger({
    disabled,
    focusableWhenDisabled,
    rootRef: forwardedRef,
    menuState: state,
    dispatch,
  });

  const ownerState: MenuTriggerOwnerState = {
    open: state.open,
  };

  const { renderElement } = useComponentRenderer({
    render: render || 'button',
    className,
    ownerState,
    propGetter: getRootProps,
    customStyleHookMapping: {
      open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
    },
    extraProps: other,
  });

  return renderElement();
});

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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, allows a disabled button to receive focus.
   * @default false
   */
  focusableWhenDisabled: PropTypes.bool,
  /**
   * Label of the button
   */
  label: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { MenuTrigger };
