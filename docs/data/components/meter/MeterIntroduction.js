'use client';
import * as React from 'react';
import { Meter } from '@base-ui-components/react/meter';
import classes from './styles.module.css';

export default function MeterIntroduction() {
  return (
    <div className={classes.demo}>
      <Meter.Root className={classes.meter} value={60} aria-label="Battery Life">
        <Meter.Track className={classes.track}>
          <BoltIcon className={classes.icon} />
          <Meter.Indicator className={classes.indicator} />
        </Meter.Track>
      </Meter.Root>
    </div>
  );
}

function BoltIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M10.67 21c-.35 0-.62-.31-.57-.66L11 14H7.5c-.88 0-.33-.75-.31-.78 1.26-2.23 3.15-5.53 5.65-9.93.1-.18.3-.29.5-.29.35 0 .62.31.57.66l-.9 6.34h3.51c.4 0 .62.19.4.66-3.29 5.74-5.2 9.09-5.75 10.05-.1.18-.29.29-.5.29z"
        fill="currentColor"
      />
    </svg>
  );
}
