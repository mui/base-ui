import * as React from 'react';
import { MenuPositionerOwnerState, MenuPositionerProps } from './MenuPositioner.types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { MenuRootContext } from '../Root/MenuRootContext';

const MenuPositioner = React.forwardRef(function MenuPositioner(
  props: MenuPositionerProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, side, alignment, keepMounted, ...other } = props;

  const menuRootContext = React.useContext(MenuRootContext);
  if (menuRootContext == null) {
    throw new Error('Menu.Positioner must be placed within Menu.Root.');
  }

  const { open } = menuRootContext.state;

  const ownerState: MenuPositionerOwnerState = { open };

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: other,
    ref: forwardedRef,
  });

  if (!keepMounted && !open) {
    return null;
  }

  return renderElement();
});

export { MenuPositioner };
