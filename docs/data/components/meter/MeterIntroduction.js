'use client';
import * as React from 'react';
import { Meter } from '@base_ui/react/Meter';
import classes from './styles.module.css';

export default function MeterIntroduction() {
  return (
    <div className={classes.demo}>
      <Meter.Root className={classes.meter} value={67} aria-labelledby=":label:">
        <span className={classes.label} id=":label:">
          Battery Health
        </span>
        <Meter.Track className={classes.track}>
          <Meter.Indicator className={classes.indicator} />
        </Meter.Track>
      </Meter.Root>
    </div>
  );
}
