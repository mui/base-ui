import * as React from 'react';
import { Popover } from '@base-ui-components/react/Popover';
import classes from './popup-arrow.module.css';

export default function PopupArrow() {
  return (
    <Popover.Root>
      <Popover.Trigger>Trigger</Popover.Trigger>
      <Popover.Positioner sideOffset={10}>
        <Popover.Popup className={classes.popup}>Popup</Popover.Popup>
        <Popover.Arrow className={classes.arrow} />
      </Popover.Positioner>
    </Popover.Root>
  );
}
