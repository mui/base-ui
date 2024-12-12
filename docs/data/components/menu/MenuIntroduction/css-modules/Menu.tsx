'use client';
import * as React from 'react';
import { Menu as BaseMenu } from '@base-ui-components/react/menu';
import classes from './Menu.module.css';

export const Menu = BaseMenu.Root;

export const MenuGroup = BaseMenu.Group;

export const MenuItems = React.forwardRef(function MenuItems(
  props: React.PropsWithChildren<{}>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner className={classes.positioner} ref={ref}>
        <BaseMenu.Popup className={classes.popup}>{props.children}</BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
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

export const MenuSeparator = React.forwardRef(function MenuSeparator(
  props: BaseMenu.Separator.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return <BaseMenu.Separator {...props} ref={ref} className={classes.separator} />;
});

export const MenuGroupLabel = React.forwardRef(function MenuGroupLabel(
  props: BaseMenu.GroupLabel.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return <BaseMenu.GroupLabel {...props} ref={ref} className={classes.groupLabel} />;
});
