'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useFloatingTree } from '@floating-ui/react';
import { MenuPopupOwnerState, MenuPopupProps } from './MenuPopup.types';
import { useMenuPopup } from './useMenuPopup';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { useForkRef } from '../../utils/useForkRef';

const MenuPopup = React.forwardRef(function MenuPopup(
  props: MenuPopupProps,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...other } = props;
  const { setOpen, popupRef, transitionStatus } = useMenuRootContext();
  const { events: menuEvents } = useFloatingTree()!;

  useMenuPopup({
    setOpen,
    menuEvents,
  });

  const mergedRef = useForkRef(forwardedRef, popupRef);

  const ownerState: MenuPopupOwnerState = {
    entering: transitionStatus === 'entering',
    exiting: transitionStatus === 'exiting',
  };

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    ownerState,
    extraProps: other,
    customStyleHookMapping: {
      entering(value) {
        return value ? { 'data-entering': '' } : null;
      },
      exiting(value) {
        return value ? { 'data-exiting': '' } : null;
      },
    },
    ref: mergedRef,
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
