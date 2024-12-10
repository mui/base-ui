import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import classes from './anchor-side-animations.module.css';

export default function AnchorSideAnimations() {
  return (
    <div>
      <p>
        The transition should always play translating the popup toward the trigger
        with it flipping to the opposite side as the result of a collision.
      </p>
      <Popover.Root>
        <Popover.Trigger>transition</Popover.Trigger>
        <Popover.Positioner side="top">
          <Popover.Popup className={classes.Popup} data-type="transition" />
        </Popover.Positioner>
      </Popover.Root>

      <Popover.Root>
        <Popover.Trigger>animation</Popover.Trigger>
        <Popover.Positioner side="top">
          <Popover.Popup className={classes.Popup} data-type="animation" />
        </Popover.Positioner>
      </Popover.Root>
    </div>
  );
}
