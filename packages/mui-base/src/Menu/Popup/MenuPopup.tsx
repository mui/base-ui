'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useFloatingTree } from '@floating-ui/react';
import { MenuPopupOwnerState, MenuPopupProps } from './MenuPopup.types';
import { useMenuPopup } from './useMenuPopup';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useMenuRootContext } from '../Root/MenuRootContext';

const EMPTY_OBJECT = {};

const MenuPopup = React.forwardRef(function MenuPopup(
  props: MenuPopupProps,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...other } = props;
  const { setOpen } = useMenuRootContext();
  const { events: menuEvents } = useFloatingTree()!;

  const { getRootProps } = useMenuPopup({
    setOpen,
    menuEvents,
  });

  const ownerState: MenuPopupOwnerState = EMPTY_OBJECT;

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    ownerState,
    propGetter: getRootProps,
    customStyleHookMapping: {
      open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
    },
    extraProps: other,
    ref: forwardedRef,
  });

  return renderElement();
});

MenuPopup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A ref with imperative actions that can be performed on the menu.
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { MenuPopup };
