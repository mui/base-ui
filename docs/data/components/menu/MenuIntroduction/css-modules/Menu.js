'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { Menu as BaseMenu } from '@base-ui-components/react/menu';
import classes from './Menu.module.css';

export const Menu = BaseMenu.Root;

export const MenuGroup = BaseMenu.Group;

const MenuItems = React.forwardRef(function MenuItems(props, ref) {
  return (
    <BaseMenu.Positioner className={classes.positioner} ref={ref}>
      <BaseMenu.Popup className={classes.popup}>{props.children}</BaseMenu.Popup>
    </BaseMenu.Positioner>
  );
});

MenuItems.propTypes = {
  children: PropTypes.node,
};

export { MenuItems };

export const MenuItem = React.forwardRef(function MenuItem(props, ref) {
  return <BaseMenu.Item {...props} ref={ref} className={classes.item} />;
});

export const MenuTrigger = React.forwardRef(function MenuTrigger(props, ref) {
  return <BaseMenu.Trigger {...props} ref={ref} className={classes.trigger} />;
});

export const MenuSeparator = React.forwardRef(function MenuSeparator(props, ref) {
  return <BaseMenu.Separator {...props} ref={ref} className={classes.separator} />;
});

export const MenuGroupLabel = React.forwardRef(function MenuGroupLabel(props, ref) {
  return <BaseMenu.GroupLabel {...props} ref={ref} className={classes.groupLabel} />;
});
