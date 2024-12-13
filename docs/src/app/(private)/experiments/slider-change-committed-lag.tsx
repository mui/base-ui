'use client';
// https://github.com/mui/material-ui/issues/41739
// to cross check whether this issue would still occur in the new API
import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';
import classes from './slider.module.css';

export default function App() {
  const [val1, setVal1] = React.useState(80);
  const [val2, setVal2] = React.useState<number | null>(null);

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        width: '40rem',
      }}
    >
      <Slider.Root
        className={classes.slider}
        value={val1}
        onValueChange={(newValue) => setVal1(newValue as number)}
        onValueCommitted={(newValue) => setVal2(newValue as number)}
      >
        <Slider.Value className={classes.output} />
        <Slider.Control className={classes.control}>
          <Slider.Track className={classes.track}>
            <Slider.Indicator className={classes.indicator} />
            <Slider.Thumb className={classes.thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <pre>onValueChange value: {val1}</pre>
      <pre>onValueCommitted value: {val2}</pre>
    </div>
  );
}
