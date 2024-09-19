'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import * as BaseMenu from '@base_ui/react/Menu';
import classes from './Menu.module.css';

export const Menu = function Menu(props) {
  return <BaseMenu.Root {...props} />;
};

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
