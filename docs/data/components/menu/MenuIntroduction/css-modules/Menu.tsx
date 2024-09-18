'use client';
import * as React from 'react';
import * as BaseMenu from '@base_ui/react/Menu';
import classes from './Menu.module.css';

export const Menu = function Menu(props: BaseMenu.Root.Props) {
  return <BaseMenu.Root {...props} />;
};

export const MenuItems = React.forwardRef(function MenuItems(
  props: React.PropsWithChildren<{}>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <BaseMenu.Positioner className={classes.positioner} ref={ref}>
      <BaseMenu.Popup className={classes.popup}>{props.children}</BaseMenu.Popup>
    </BaseMenu.Positioner>
  );
});

export const MenuItem = React.forwardRef(function MenuItem(
  props: BaseMenu.Item.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return <BaseMenu.Item {...props} ref={ref} className={classes.item} />;
});

export const MenuTrigger = React.forwardRef(function MenuTrigger(
  props: BaseMenu.Trigger.Props,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  return <BaseMenu.Trigger {...props} ref={ref} className={classes.trigger} />;
});
