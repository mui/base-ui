'use client';
import * as React from 'react';
import { Progress } from '@base-ui-components/react/progress';
import classes from './styles.module.css';

export default function RtlProgress() {
  return (
    <div dir="rtl">
      <Progress.Root
        value={65}
        aria-labelledby="RtlProgressLabel"
        className={classes.progress}
      >
        <span className={classes.label} id="RtlProgressLabel">
          تحميل الملفات (RTL)
        </span>
        <Progress.Track className={classes.track}>
          <Progress.Indicator className={classes.indicator} />
        </Progress.Track>
      </Progress.Root>
    </div>
  );
}
