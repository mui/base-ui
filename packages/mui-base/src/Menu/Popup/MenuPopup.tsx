'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { Side, useFloatingTree } from '@floating-ui/react';
import { useMenuPopup } from './useMenuPopup';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { useMenuPositionerContext } from '../Positioner/MenuPositionerContext';
import { commonStyleHooks } from '../utils/commonStyleHooks';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { BaseUIComponentProps } from '../../utils/types';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

const customStyleHookMapping: CustomStyleHookMapping<MenuPopup.OwnerState> = {
  ...commonStyleHooks,
  entering(value) {
    return value ? { 'data-menu-entering': '' } : null;
  },
  exiting(value) {
    return value ? { 'data-menu-exiting': '' } : null;
  },
};

const MenuPopup = React.forwardRef(function MenuPopup(
  props: MenuPopup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...other } = props;
  const { open, setOpen, popupRef, transitionStatus } = useMenuRootContext();
  const { side, alignment } = useMenuPositionerContext();
  const { events: menuEvents } = useFloatingTree()!;

  useMenuPopup({
    setOpen,
    menuEvents,
  });

  const mergedRef = useForkRef(forwardedRef, popupRef);

  const ownerState: MenuPopup.OwnerState = {
    entering: transitionStatus === 'entering',
    exiting: transitionStatus === 'exiting',
    side,
    alignment,
    open,
  };

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    ownerState,
    extraProps: other,
    customStyleHookMapping,
    ref: mergedRef,
  });

  return renderElement();
});

namespace MenuPopup {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    children?: React.ReactNode;
    /**
     * The id of the popup element.
     */
    id?: string;
  }

  export type OwnerState = {
    entering: boolean;
    exiting: boolean;
    side: Side;
    alignment: 'start' | 'end' | 'center';
    open: boolean;
  };
}

MenuPopup.propTypes /* remove-proptypes */ = {
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
   * The id of the popup element.
   */
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { MenuPopup };
