'use client';
import * as React from 'react';
import { Progress } from '@base-ui-components/react/progress';
import classes from './styles.module.css';

export default function IndeterminateProgress() {
  return (
    <Progress.Root
      value={null}
      aria-labelledby="ProgressLabel"
      className={classes.progress}
    >
      <span className={classes.label} id="ProgressLabel">
        Uploading files
      </span>
      <Progress.Track className={classes.track}>
        <Progress.Indicator className={classes.indicator} />
      </Progress.Track>
    </Progress.Root>
  );
}
