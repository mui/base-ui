'use client';
import * as React from 'react';
import { Slider } from '@base-ui/react/slider';
import styles from './index.module.css';

const initialValue = 5;

function valueToPosition(value: number) {
  const position = Math.log10(value) / 2;
  return position;
}

function positionToValue(position: number) {
  const value = 10 ** (position * 2);
  return value;
}

export default function LogSlider() {
  const id = React.useId();

  return (
    <Slider.Root
      defaultValue={initialValue}
      scale={{
        valueToPosition,
        positionToValue,
      }}
      aria-labelledby={id}
      thumbAlignment="edge"
      className={styles.Slider}
    >
      <div id={id} className={styles.Label}>
        Blur radius
      </div>
      <Slider.Value className={styles.Value}>
        {(formattedValue) => `${formattedValue}px`}
      </Slider.Value>
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb initialPosition={valueToPosition(initialValue)} className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
