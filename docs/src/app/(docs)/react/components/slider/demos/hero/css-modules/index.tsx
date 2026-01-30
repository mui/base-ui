'use client';
import * as React from 'react';
import { Slider } from '@base-ui/react/slider';
import styles from './index.module.css';

export default function ExampleSlider() {
  const id = React.useId();
  return (
    <Slider.Root defaultValue={25} className={styles.Root} aria-labelledby={id}>
      <label id={id} className={styles.Label}>
        Volume
      </label>
      <Slider.Value className={styles.Value} />
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
