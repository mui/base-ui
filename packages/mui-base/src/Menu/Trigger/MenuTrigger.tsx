'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { MenuTriggerOwnerState, MenuTriggerProps } from './MenuTrigger.types';
import { useMenuTrigger } from './useMenuTrigger';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

/**
 *
 * Demos:
 *
 * - [Menu](https://mui.com/base-ui/react-menu/)
 *
 * API:
 *
 * - [MenuButton API](https://mui.com/base-ui/react-menu/components-api/#menu-button)
 */
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

  const { getRootProps, open } = useMenuTrigger({
    disabled,
    focusableWhenDisabled,
    rootRef: forwardedRef,
  });

  const ownerState: MenuTriggerOwnerState = {
    open,
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
   * Class name applied to the root element.
   */
  className: PropTypes.string,
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
} as any;

export { MenuTrigger };
