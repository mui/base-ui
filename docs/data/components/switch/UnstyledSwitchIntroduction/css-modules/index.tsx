'use client';
import * as React from 'react';
import { Switch } from '@base-ui-components/react/switch';
import classes from './styles.module.css';

export default function UnstyledSwitchIntroduction() {
  return (
    <div>
      <Switch.Root
        className={classes.root}
        aria-label="Basic switch, on by default"
        defaultChecked
      >
        <Switch.Thumb className={classes.thumb} />
      </Switch.Root>
      <Switch.Root
        className={classes.root}
        aria-label="Basic switch, off by default"
      >
        <Switch.Thumb className={classes.thumb} />
      </Switch.Root>
      <Switch.Root
        className={classes.root}
        aria-label="Disabled switch, on by default"
        defaultChecked
        disabled
      >
        <Switch.Thumb className={classes.thumb} />
      </Switch.Root>
      <Switch.Root
        className={classes.root}
        aria-label="Disabled switch, off by default"
        disabled
      >
        <Switch.Thumb className={classes.thumb} />
      </Switch.Root>
    </div>
  );
}
