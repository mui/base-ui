import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import classes from './infotip.module.css';

function Infotip() {
  return (
    <Popover.Root openOnHover delay={0}>
      <Popover.Trigger
        style={{ width: 44, height: 44, background: 'lightgray', border: 'none' }}
      >
        ?
      </Popover.Trigger>
      <Popover.Positioner side="left" alignment="start" sideOffset={10}>
        <Popover.Popup className={classes.popup}>Infotip</Popover.Popup>
      </Popover.Positioner>
    </Popover.Root>
  );
}

export default function Page() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[...Array(20)].map((_, i) => (
        <Infotip key={i} />
      ))}
    </div>
  );
}
