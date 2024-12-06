'use client';
import * as React from 'react';
import { Progress } from '@base-ui-components/react/progress';
import classes from '../../styles.module.css';

export default function UnstyledProgressIntroduction() {
  return (
    <Progress.Root
      className={classes.progress}
      value={50}
      aria-labelledby="ProgressLabel"
    >
      <span className={classes.label} id="ProgressLabel">
        Uploading files
      </span>
      <Progress.Value className={classes.label} />
      <Progress.Track className={classes.track}>
        <Progress.Indicator className={classes.indicator} />
      </Progress.Track>
    </Progress.Root>
  );
}
